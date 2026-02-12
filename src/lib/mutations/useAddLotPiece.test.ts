import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}))

import { supabase } from '@/lib/supabase'
import { useAddLotPiece } from './useAddLotPiece'

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

describe('useAddLotPiece', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls supabase rpc with correct params', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: 'piece-uuid', error: null } as never)

    const { result } = renderHook(() => useAddLotPiece(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ lotId: 'lot-1', nom: 'Cuisine' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.rpc).toHaveBeenCalledWith('add_piece_to_lot', {
      p_lot_id: 'lot-1',
      p_piece_nom: 'Cuisine',
    })
  })

  it('returns piece UUID on success', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: 'piece-uuid-123', error: null } as never)

    const { result } = renderHook(() => useAddLotPiece(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ lotId: 'lot-1', nom: 'Cuisine' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBe('piece-uuid-123')
  })

  it('invalidates pieces query on settled', async () => {
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    vi.mocked(supabase.rpc).mockResolvedValue({ data: 'piece-uuid', error: null } as never)

    const { result } = renderHook(() => useAddLotPiece(), { wrapper: createWrapper(queryClient) })

    await act(async () => {
      result.current.mutate({ lotId: 'lot-1', nom: 'Cuisine' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['pieces', 'lot-1'] })
  })

  it('throws on rpc error', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: new Error('RPC failed') } as never)

    const { result } = renderHook(() => useAddLotPiece(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ lotId: 'lot-1', nom: 'Cuisine' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
