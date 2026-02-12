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

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useReplaceLivraisonDocument } from './useReplaceLivraisonDocument'

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

function mockReplaceSuccess() {
  vi.mocked(supabase.auth.getUser).mockResolvedValue({
    data: { user: { id: 'user-1', email: 'test@test.fr' } },
  } as never)

  const mockUpload = vi.fn().mockResolvedValue({ error: null })
  const mockRemove = vi.fn().mockResolvedValue({ error: null })
  vi.mocked(supabase.storage.from).mockReturnValue({
    upload: mockUpload,
    remove: mockRemove,
  } as never)

  const mockEq = vi.fn().mockResolvedValue({ error: null })
  const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
  vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)

  return { mockUpload, mockRemove, mockUpdate, mockEq }
}

const pdfFile = new File(['pdf'], 'new-facture.pdf', { type: 'application/pdf' })
const baseInput = {
  livraisonId: 'liv-1',
  chantierId: 'ch-1',
  file: pdfFile,
  documentType: 'bc' as const,
  oldFileUrl: 'user-1/liv-1/bc_old.pdf',
}

describe('useReplaceLivraisonDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uploads new file, updates DB, and deletes old file', async () => {
    const { mockUpload, mockRemove, mockUpdate } = mockReplaceSuccess()
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useReplaceLivraisonDocument(), { wrapper })

    await act(async () => {
      result.current.mutate(baseInput)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockUpload).toHaveBeenCalledWith(
      expect.stringContaining('user-1/liv-1/bc_'),
      pdfFile,
      { contentType: 'application/pdf' },
    )
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ bc_file_url: expect.stringContaining('user-1/liv-1/bc_'), bc_file_name: 'new-facture.pdf' }),
    )
    expect(mockRemove).toHaveBeenCalledWith(['user-1/liv-1/bc_old.pdf'])
    expect(toast.success).toHaveBeenCalledWith('BC remplacé')
  })

  it('replaces BL document with image file', async () => {
    const { mockUpload, mockUpdate } = mockReplaceSuccess()
    const { wrapper } = createWrapper()
    const jpgFile = new File(['img'], 'bl-photo.jpg', { type: 'image/jpeg' })

    const { result } = renderHook(() => useReplaceLivraisonDocument(), { wrapper })

    await act(async () => {
      result.current.mutate({ ...baseInput, file: jpgFile, documentType: 'bl', oldFileUrl: 'user-1/liv-1/bl_old.jpg' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockUpload).toHaveBeenCalledWith(
      expect.stringContaining('user-1/liv-1/bl_'),
      jpgFile,
      { contentType: 'image/jpeg' },
    )
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ bl_file_url: expect.stringContaining('user-1/liv-1/bl_'), bl_file_name: 'bl-photo.jpg' }),
    )
    expect(toast.success).toHaveBeenCalledWith('BL remplacé')
  })

  it('rejects unsupported MIME types', async () => {
    const { wrapper } = createWrapper()
    const txtFile = new File(['text'], 'note.txt', { type: 'text/plain' })

    const { result } = renderHook(() => useReplaceLivraisonDocument(), { wrapper })

    await act(async () => {
      result.current.mutate({ ...baseInput, file: txtFile })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Format non supporté. Utilisez un PDF ou une image (JPEG, PNG, HEIC).')
  })

  it('rejects files exceeding 50MB', async () => {
    const { wrapper } = createWrapper()
    const bigFile = new File(['x'], 'huge.pdf', { type: 'application/pdf' })
    Object.defineProperty(bigFile, 'size', { value: 51 * 1024 * 1024 })

    const { result } = renderHook(() => useReplaceLivraisonDocument(), { wrapper })

    await act(async () => {
      result.current.mutate({ ...baseInput, file: bigFile })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Fichier trop volumineux (max 50 Mo)')
  })

  it('cleans up new file when DB update fails', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@test.fr' } },
    } as never)

    const mockUpload = vi.fn().mockResolvedValue({ error: null })
    const mockRemove = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabase.storage.from).mockReturnValue({
      upload: mockUpload,
      remove: mockRemove,
    } as never)

    const mockEq = vi.fn().mockResolvedValue({ error: new Error('DB error') })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useReplaceLivraisonDocument(), { wrapper })

    await act(async () => {
      result.current.mutate(baseInput)
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    // Should remove the NEW file (not the old one)
    expect(mockRemove).toHaveBeenCalledWith([expect.stringContaining('user-1/liv-1/bc_')])
  })

  it('calls onProgress through all 3 phases', async () => {
    mockReplaceSuccess()
    const { wrapper } = createWrapper()
    const onProgress = vi.fn()

    const { result } = renderHook(() => useReplaceLivraisonDocument(), { wrapper })

    await act(async () => {
      result.current.mutate({ ...baseInput, onProgress })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(onProgress).toHaveBeenCalledWith(0)
    expect(onProgress).toHaveBeenCalledWith(60)
    expect(onProgress).toHaveBeenCalledWith(80)
    expect(onProgress).toHaveBeenCalledWith(100)
  })

  it('succeeds even when old file deletion fails (non-blocking cleanup)', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@test.fr' } },
    } as never)

    const mockUpload = vi.fn().mockResolvedValue({ error: null })
    const mockRemove = vi.fn().mockRejectedValue(new Error('Storage delete failed'))
    vi.mocked(supabase.storage.from).mockReturnValue({
      upload: mockUpload,
      remove: mockRemove,
    } as never)

    const mockEq = vi.fn().mockResolvedValue({ error: null })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useReplaceLivraisonDocument(), { wrapper })

    await act(async () => {
      result.current.mutate(baseInput)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockRemove).toHaveBeenCalledWith(['user-1/liv-1/bc_old.pdf'])
    expect(toast.success).toHaveBeenCalledWith('BC remplacé')
  })

  it('invalidates livraisons and livraisons-count queries on settled', async () => {
    mockReplaceSuccess()
    const { wrapper, qc } = createWrapper()
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')

    const { result } = renderHook(() => useReplaceLivraisonDocument(), { wrapper })

    await act(async () => {
      result.current.mutate(baseInput)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['livraisons', 'ch-1'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['livraisons-count', 'ch-1'] })
  })
})
