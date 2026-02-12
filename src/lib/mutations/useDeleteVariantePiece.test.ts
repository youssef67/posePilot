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
import { useDeleteVariantePiece } from './useDeleteVariantePiece'

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

describe('useDeleteVariantePiece', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes piece by id', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never)

    const { result } = renderHook(() => useDeleteVariantePiece(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ pieceId: 'piece-1', varianteId: 'var-1', plotId: 'plot-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('variante_pieces')
    expect(mockEq).toHaveBeenCalledWith('id', 'piece-1')
  })

  it('invalidates variante-pieces and variantes queries on settled', async () => {
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const mockEq = vi.fn().mockResolvedValue({ error: null })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never)

    const { result } = renderHook(() => useDeleteVariantePiece(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ pieceId: 'piece-1', varianteId: 'var-1', plotId: 'plot-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['variante-pieces', 'var-1'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['variantes', 'plot-1'] })
  })

  it('rolls back cache on mutation error', async () => {
    const queryClient = createQueryClient()
    const previousPieces = [
      { id: 'piece-1', variante_id: 'var-1', nom: 'Séjour', created_at: '2026-01-01T00:00:00Z' },
    ]
    queryClient.setQueryData(['variante-pieces', 'var-1'], previousPieces)

    const mockEq = vi.fn().mockResolvedValue({ error: new Error('Delete failed') })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never)

    const { result } = renderHook(() => useDeleteVariantePiece(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ pieceId: 'piece-1', varianteId: 'var-1', plotId: 'plot-1' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    const cachedData = queryClient.getQueryData(['variante-pieces', 'var-1'])
    expect(cachedData).toEqual(previousPieces)
  })
})
