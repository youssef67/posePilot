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
import { useUploadLotDocument } from './useUploadLotDocument'

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

function mockUploadSuccess() {
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

const pdfFile = new File(['pdf content'], 'plan.pdf', { type: 'application/pdf' })

describe('useUploadLotDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uploads PDF to storage and updates lot_documents', async () => {
    const { mockUpload, mockUpdate } = mockUploadSuccess()
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useUploadLotDocument(), { wrapper })

    await act(async () => {
      result.current.mutate({ file: pdfFile, documentId: 'doc-1', lotId: 'lot-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.storage.from).toHaveBeenCalledWith('documents')
    expect(mockUpload).toHaveBeenCalledWith(
      expect.stringContaining('user-1/lot-1/doc-1_'),
      pdfFile,
      { contentType: 'application/pdf' },
    )
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ file_url: expect.stringContaining('user-1/lot-1/doc-1_'), file_name: 'plan.pdf' }),
    )
  })

  it('accepts JPEG files', async () => {
    mockUploadSuccess()
    const { wrapper } = createWrapper()
    const jpgFile = new File(['img'], 'photo.jpg', { type: 'image/jpeg' })

    const { result } = renderHook(() => useUploadLotDocument(), { wrapper })

    await act(async () => {
      result.current.mutate({ file: jpgFile, documentId: 'doc-1', lotId: 'lot-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('rejects unsupported file types with error toast', async () => {
    const { wrapper } = createWrapper()
    const txtFile = new File(['text'], 'notes.txt', { type: 'text/plain' })

    const { result } = renderHook(() => useUploadLotDocument(), { wrapper })

    await act(async () => {
      result.current.mutate({ file: txtFile, documentId: 'doc-1', lotId: 'lot-1' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Format non supporté. Utilisez un PDF ou une image (JPEG, PNG, HEIC).')
  })

  it('rejects files exceeding 50MB', async () => {
    const { wrapper } = createWrapper()
    const bigFile = new File(['x'], 'huge.pdf', { type: 'application/pdf' })
    Object.defineProperty(bigFile, 'size', { value: 51 * 1024 * 1024 })

    const { result } = renderHook(() => useUploadLotDocument(), { wrapper })

    await act(async () => {
      result.current.mutate({ file: bigFile, documentId: 'doc-1', lotId: 'lot-1' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Le fichier dépasse la taille maximale de 50 Mo')
  })

  it('shows error toast on storage upload failure', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@test.fr' } },
    } as never)
    vi.mocked(supabase.storage.from).mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: new Error('Storage error') }),
    } as never)

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useUploadLotDocument(), { wrapper })

    await act(async () => {
      result.current.mutate({ file: pdfFile, documentId: 'doc-1', lotId: 'lot-1' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalled()
  })

  it('cleans up orphan file from storage when DB update fails', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@test.fr' } },
    } as never)

    const mockUpload = vi.fn().mockResolvedValue({ error: null })
    const mockRemove = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabase.storage.from).mockReturnValue({
      upload: mockUpload,
      remove: mockRemove,
    } as never)

    const mockEq = vi.fn().mockResolvedValue({ error: new Error('DB update failed') })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useUploadLotDocument(), { wrapper })

    await act(async () => {
      result.current.mutate({ file: pdfFile, documentId: 'doc-1', lotId: 'lot-1' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(mockRemove).toHaveBeenCalledWith([expect.stringContaining('user-1/lot-1/doc-1_')])
  })

  it('calls onProgress callback through upload phases', async () => {
    mockUploadSuccess()
    const { wrapper } = createWrapper()
    const onProgress = vi.fn()

    const { result } = renderHook(() => useUploadLotDocument(), { wrapper })

    await act(async () => {
      result.current.mutate({ file: pdfFile, documentId: 'doc-1', lotId: 'lot-1', onProgress })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(onProgress).toHaveBeenCalledWith(0)
    expect(onProgress).toHaveBeenCalledWith(80)
    expect(onProgress).toHaveBeenCalledWith(100)
  })

  it('shows success toast and invalidates queries on success', async () => {
    mockUploadSuccess()
    const { wrapper, qc } = createWrapper()
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')

    const { result } = renderHook(() => useUploadLotDocument(), { wrapper })

    await act(async () => {
      result.current.mutate({ file: pdfFile, documentId: 'doc-1', lotId: 'lot-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('Document uploadé')
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['lot-documents', 'lot-1'] })
  })
})
