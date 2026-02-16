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
import { useReplaceLotDocument } from './useReplaceLotDocument'

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

const pdfFile = new File(['pdf'], 'new-plan.pdf', { type: 'application/pdf' })
const baseInput = { file: pdfFile, documentId: 'doc-1', lotId: 'lot-1', oldFileUrl: 'user-1/lot-1/doc-1_old.pdf' }

describe('useReplaceLotDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uploads new file, updates DB, and deletes old file', async () => {
    const { mockUpload, mockRemove, mockUpdate } = mockReplaceSuccess()
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useReplaceLotDocument(), { wrapper })

    await act(async () => {
      result.current.mutate(baseInput)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockUpload).toHaveBeenCalledWith(
      expect.stringContaining('user-1/lot-1/doc-1_'),
      pdfFile,
      { contentType: 'application/pdf' },
    )
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ file_name: 'new-plan.pdf' }),
    )
    expect(mockRemove).toHaveBeenCalledWith(['user-1/lot-1/doc-1_old.pdf'])
    expect(toast.success).toHaveBeenCalledWith('Document remplacé')
  })

  it('accepts JPEG files', async () => {
    mockReplaceSuccess()
    const { wrapper } = createWrapper()
    const jpgFile = new File(['img'], 'photo.jpg', { type: 'image/jpeg' })

    const { result } = renderHook(() => useReplaceLotDocument(), { wrapper })

    await act(async () => {
      result.current.mutate({ ...baseInput, file: jpgFile })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('rejects unsupported file types', async () => {
    const { wrapper } = createWrapper()
    const txtFile = new File(['text'], 'notes.txt', { type: 'text/plain' })

    const { result } = renderHook(() => useReplaceLotDocument(), { wrapper })

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

    const { result } = renderHook(() => useReplaceLotDocument(), { wrapper })

    await act(async () => {
      result.current.mutate({ ...baseInput, file: bigFile })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Le fichier dépasse la taille maximale de 50 Mo')
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
    const { result } = renderHook(() => useReplaceLotDocument(), { wrapper })

    await act(async () => {
      result.current.mutate(baseInput)
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    // Should remove the NEW file (not the old one)
    expect(mockRemove).toHaveBeenCalledWith([expect.stringContaining('user-1/lot-1/doc-1_')])
  })

  it('calls onProgress through all phases', async () => {
    mockReplaceSuccess()
    const { wrapper } = createWrapper()
    const onProgress = vi.fn()

    const { result } = renderHook(() => useReplaceLotDocument(), { wrapper })

    await act(async () => {
      result.current.mutate({ ...baseInput, onProgress })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(onProgress).toHaveBeenCalledWith(0)
    expect(onProgress).toHaveBeenCalledWith(60)
    expect(onProgress).toHaveBeenCalledWith(80)
    expect(onProgress).toHaveBeenCalledWith(100)
  })

  it('invalidates lot-documents queries on settled', async () => {
    mockReplaceSuccess()
    const { wrapper, qc } = createWrapper()
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')

    const { result } = renderHook(() => useReplaceLotDocument(), { wrapper })

    await act(async () => {
      result.current.mutate(baseInput)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['lot-documents', 'lot-1'] })
  })
})
