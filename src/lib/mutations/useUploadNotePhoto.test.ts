import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: { getUser: vi.fn() },
    storage: { from: vi.fn() },
  },
}))

vi.mock('@/lib/utils/compressImage', () => ({
  compressPhoto: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { supabase } from '@/lib/supabase'
import { compressPhoto } from '@/lib/utils/compressImage'
import { toast } from 'sonner'
import { useUploadNotePhoto } from './useUploadNotePhoto'

const mockCompressPhoto = vi.mocked(compressPhoto)

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return {
    qc,
    wrapper: ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: qc }, children),
  }
}

function mockSupabaseUploadSuccess() {
  const compressedFile = new File(['compressed'], 'compressed.jpg', { type: 'image/jpeg' })
  mockCompressPhoto.mockResolvedValue(compressedFile)

  vi.mocked(supabase.auth.getUser).mockResolvedValue({
    data: { user: { id: 'user-1', email: 'test@test.fr' } },
  } as never)

  const mockUpload = vi.fn().mockResolvedValue({ error: null })
  const mockGetPublicUrl = vi.fn().mockReturnValue({
    data: { publicUrl: 'https://storage.example.com/note-photos/user-1/note-1_123.jpg' },
  })
  vi.mocked(supabase.storage.from).mockReturnValue({
    upload: mockUpload,
    getPublicUrl: mockGetPublicUrl,
  } as never)

  const mockEq = vi.fn().mockResolvedValue({ error: null })
  const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
  vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)

  return { compressedFile, mockUpload, mockGetPublicUrl, mockUpdate, mockEq }
}

describe('useUploadNotePhoto', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('compresses, uploads, and updates note with photo_url', async () => {
    const { mockUpload, mockUpdate } = mockSupabaseUploadSuccess()
    const { wrapper } = createWrapper()

    const inputFile = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' })
    const { result } = renderHook(() => useUploadNotePhoto(), { wrapper })

    await act(async () => {
      result.current.mutate({ file: inputFile, noteId: 'note-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockCompressPhoto).toHaveBeenCalledWith(inputFile, expect.any(Function))
    expect(supabase.storage.from).toHaveBeenCalledWith('note-photos')
    expect(mockUpload).toHaveBeenCalled()
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ photo_url: expect.stringContaining('note-photos') }),
    )
  })

  it('calls onProgress callback during upload phases', async () => {
    mockSupabaseUploadSuccess()
    const { wrapper } = createWrapper()
    const onProgress = vi.fn()

    const { result } = renderHook(() => useUploadNotePhoto(), { wrapper })

    await act(async () => {
      result.current.mutate({ file: new File(['p'], 'p.jpg'), noteId: 'n-1', onProgress })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    // Should have been called with progress values (70 after compression, 90 after upload, 100 after DB update)
    expect(onProgress).toHaveBeenCalledWith(70)
    expect(onProgress).toHaveBeenCalledWith(90)
    expect(onProgress).toHaveBeenCalledWith(100)
  })

  it('shows success toast on success', async () => {
    mockSupabaseUploadSuccess()
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useUploadNotePhoto(), { wrapper })

    await act(async () => {
      result.current.mutate({ file: new File(['p'], 'p.jpg'), noteId: 'n-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('Photo ajoutée')
  })

  it('shows error toast on upload failure', async () => {
    mockCompressPhoto.mockResolvedValue(new File(['c'], 'c.jpg'))
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@test.fr' } },
    } as never)
    vi.mocked(supabase.storage.from).mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: new Error('Upload failed') }),
    } as never)

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useUploadNotePhoto(), { wrapper })

    await act(async () => {
      result.current.mutate({ file: new File(['p'], 'p.jpg'), noteId: 'n-1' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith("Erreur lors de l'upload de la photo")
  })

  it('cleans up orphan photo from storage when DB update fails', async () => {
    mockCompressPhoto.mockResolvedValue(new File(['c'], 'c.jpg'))
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@test.fr' } },
    } as never)

    const mockUpload = vi.fn().mockResolvedValue({ error: null })
    const mockGetPublicUrl = vi.fn().mockReturnValue({
      data: { publicUrl: 'https://storage.example.com/note-photos/user-1/n-1_123.jpg' },
    })
    const mockRemove = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabase.storage.from).mockReturnValue({
      upload: mockUpload,
      getPublicUrl: mockGetPublicUrl,
      remove: mockRemove,
    } as never)

    const mockEq = vi.fn().mockResolvedValue({ error: new Error('DB update failed') })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useUploadNotePhoto(), { wrapper })

    await act(async () => {
      result.current.mutate({ file: new File(['p'], 'p.jpg'), noteId: 'n-1' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    // Should have attempted to remove the orphan file from storage
    expect(mockRemove).toHaveBeenCalledWith([expect.stringContaining('user-1/n-1_')])
  })

  it('invalidates notes queries on settled', async () => {
    mockSupabaseUploadSuccess()
    const { wrapper, qc } = createWrapper()
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')

    const { result } = renderHook(() => useUploadNotePhoto(), { wrapper })

    await act(async () => {
      result.current.mutate({ file: new File(['p'], 'p.jpg'), noteId: 'n-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['notes'] })
  })
})
