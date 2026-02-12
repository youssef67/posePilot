import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}))

import { supabase } from '@/lib/supabase'
import { useCreateLot } from './useCreateLot'

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

describe('useCreateLot', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls supabase.rpc with correct parameters', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: 'fake-lot-id', error: null } as never)

    const { result } = renderHook(() => useCreateLot(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({
        code: '203',
        varianteId: 'var-1',
        etageNom: 'RDC',
        plotId: 'plot-1',
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.rpc).toHaveBeenCalledWith('create_lot_with_inheritance', {
      p_code: '203',
      p_variante_id: 'var-1',
      p_etage_nom: 'RDC',
      p_plot_id: 'plot-1',
    })
    expect(result.current.data).toBe('fake-lot-id')
  })

  it('invalidates lots and etages queries on settled', async () => {
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    vi.mocked(supabase.rpc).mockResolvedValue({ data: 'fake-lot-id', error: null } as never)

    const { result } = renderHook(() => useCreateLot(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({
        code: '203',
        varianteId: 'var-1',
        etageNom: 'RDC',
        plotId: 'plot-1',
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['lots', 'plot-1'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['etages', 'plot-1'] })
  })

  it('returns error on RPC failure', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: new Error('RPC failed') } as never)

    const { result } = renderHook(() => useCreateLot(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({
        code: '203',
        varianteId: 'var-1',
        etageNom: 'RDC',
        plotId: 'plot-1',
      })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('RPC failed')
  })
})
