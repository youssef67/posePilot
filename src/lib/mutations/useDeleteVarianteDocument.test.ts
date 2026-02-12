import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

import { supabase } from '@/lib/supabase'
import { useDeleteVarianteDocument } from './useDeleteVarianteDocument'

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
}

function createWrapper(queryClient?: QueryClient) {
  const qc = queryClient ?? createQueryClient()
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children)
}

describe('useDeleteVarianteDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes document by id', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never)

    const { result } = renderHook(() => useDeleteVarianteDocument(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ docId: 'doc-1', varianteId: 'var-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('variante_documents')
    expect(mockEq).toHaveBeenCalledWith('id', 'doc-1')
  })

  it('invalidates variante-documents query on settled', async () => {
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const mockEq = vi.fn().mockResolvedValue({ error: null })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never)

    const { result } = renderHook(() => useDeleteVarianteDocument(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ docId: 'doc-1', varianteId: 'var-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['variante-documents', 'var-1'] })
  })

  it('rolls back cache on mutation error', async () => {
    const queryClient = createQueryClient()
    const previousDocs = [
      { id: 'doc-1', variante_id: 'var-1', nom: 'Plan', is_required: true, created_at: '2026-01-01T00:00:00Z' },
      { id: 'doc-2', variante_id: 'var-1', nom: 'Fiche', is_required: false, created_at: '2026-01-02T00:00:00Z' },
    ]
    queryClient.setQueryData(['variante-documents', 'var-1'], previousDocs)

    const mockEq = vi.fn().mockResolvedValue({ error: new Error('Delete failed') })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never)

    const { result } = renderHook(() => useDeleteVarianteDocument(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ docId: 'doc-1', varianteId: 'var-1' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    const cachedData = queryClient.getQueryData(['variante-documents', 'var-1'])
    expect(cachedData).toEqual(previousDocs)
  })
})
