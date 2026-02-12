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
import { useUploadLivraisonDocument } from './useUploadLivraisonDocument'

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

const pdfFile = new File(['pdf content'], 'facture.pdf', { type: 'application/pdf' })
const jpgFile = new File(['img content'], 'photo.jpg', { type: 'image/jpeg' })
const pngFile = new File(['img content'], 'scan.png', { type: 'image/png' })

const baseInput = {
  livraisonId: 'liv-1',
  chantierId: 'ch-1',
  file: pdfFile,
  documentType: 'bc' as const,
}

describe('useUploadLivraisonDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uploads PDF to storage and updates livraisons table with bc columns', async () => {
    const { mockUpload, mockUpdate } = mockUploadSuccess()
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useUploadLivraisonDocument(), { wrapper })

    await act(async () => {
      result.current.mutate(baseInput)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.storage.from).toHaveBeenCalledWith('documents')
    expect(mockUpload).toHaveBeenCalledWith(
      expect.stringContaining('user-1/liv-1/bc_'),
      pdfFile,
      { contentType: 'application/pdf' },
    )
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ bc_file_url: expect.stringContaining('user-1/liv-1/bc_'), bc_file_name: 'facture.pdf' }),
    )
  })

  it('uploads JPEG image for BL document type', async () => {
    const { mockUpload, mockUpdate } = mockUploadSuccess()
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useUploadLivraisonDocument(), { wrapper })

    await act(async () => {
      result.current.mutate({ ...baseInput, file: jpgFile, documentType: 'bl' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockUpload).toHaveBeenCalledWith(
      expect.stringContaining('user-1/liv-1/bl_'),
      jpgFile,
      { contentType: 'image/jpeg' },
    )
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ bl_file_url: expect.stringContaining('user-1/liv-1/bl_'), bl_file_name: 'photo.jpg' }),
    )
  })

  it('accepts PNG images', async () => {
    mockUploadSuccess()
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useUploadLivraisonDocument(), { wrapper })

    await act(async () => {
      result.current.mutate({ ...baseInput, file: pngFile })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('rejects unsupported MIME types', async () => {
    const { wrapper } = createWrapper()
    const txtFile = new File(['text'], 'note.txt', { type: 'text/plain' })

    const { result } = renderHook(() => useUploadLivraisonDocument(), { wrapper })

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

    const { result } = renderHook(() => useUploadLivraisonDocument(), { wrapper })

    await act(async () => {
      result.current.mutate({ ...baseInput, file: bigFile })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Fichier trop volumineux (max 50 Mo)')
  })

  it('shows error toast on storage upload failure', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@test.fr' } },
    } as never)
    vi.mocked(supabase.storage.from).mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: new Error('Storage error') }),
    } as never)

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useUploadLivraisonDocument(), { wrapper })

    await act(async () => {
      result.current.mutate(baseInput)
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
    const { result } = renderHook(() => useUploadLivraisonDocument(), { wrapper })

    await act(async () => {
      result.current.mutate(baseInput)
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(mockRemove).toHaveBeenCalledWith([expect.stringContaining('user-1/liv-1/bc_')])
  })

  it('calls onProgress callback through upload phases', async () => {
    mockUploadSuccess()
    const { wrapper } = createWrapper()
    const onProgress = vi.fn()

    const { result } = renderHook(() => useUploadLivraisonDocument(), { wrapper })

    await act(async () => {
      result.current.mutate({ ...baseInput, onProgress })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(onProgress).toHaveBeenCalledWith(10)
    expect(onProgress).toHaveBeenCalledWith(80)
    expect(onProgress).toHaveBeenCalledWith(100)
  })

  it('shows "BC uploadé" toast on BC success', async () => {
    mockUploadSuccess()
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useUploadLivraisonDocument(), { wrapper })

    await act(async () => {
      result.current.mutate(baseInput)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('BC uploadé')
  })

  it('shows "BL uploadé" toast on BL success', async () => {
    mockUploadSuccess()
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useUploadLivraisonDocument(), { wrapper })

    await act(async () => {
      result.current.mutate({ ...baseInput, documentType: 'bl' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('BL uploadé')
  })

  it('invalidates livraisons and livraisons-count queries on settled', async () => {
    mockUploadSuccess()
    const { wrapper, qc } = createWrapper()
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')

    const { result } = renderHook(() => useUploadLivraisonDocument(), { wrapper })

    await act(async () => {
      result.current.mutate(baseInput)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['livraisons', 'ch-1'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['livraisons-count', 'ch-1'] })
  })
})
