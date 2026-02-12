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
import { useCreateBatchLots } from './useCreateBatchLots'

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

describe('useCreateBatchLots', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls supabase.rpc with correct parameters', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: ['lot-id-1', 'lot-id-2', 'lot-id-3'],
      error: null,
    } as never)

    const { result } = renderHook(() => useCreateBatchLots(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({
        codes: ['101', '102', '103'],
        varianteId: 'var-1',
        etageNom: 'RDC',
        plotId: 'plot-1',
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.rpc).toHaveBeenCalledWith('create_batch_lots_with_inheritance', {
      p_codes: ['101', '102', '103'],
      p_variante_id: 'var-1',
      p_etage_nom: 'RDC',
      p_plot_id: 'plot-1',
    })
    expect(result.current.data).toEqual(['lot-id-1', 'lot-id-2', 'lot-id-3'])
  })

  it('invalidates lots and etages queries on settled', async () => {
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: ['lot-id-1'],
      error: null,
    } as never)

    const { result } = renderHook(() => useCreateBatchLots(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({
        codes: ['101'],
        varianteId: 'var-1',
        etageNom: 'RDC',
        plotId: 'plot-1',
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['lots', 'plot-1'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['etages', 'plot-1'] })
  })

  it('returns error on duplicate code (23505)', async () => {
    const pgError = {
      code: '23505',
      message: 'duplicate key value violates unique constraint "idx_lots_unique_code"',
    }
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: pgError } as never)

    const { result } = renderHook(() => useCreateBatchLots(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({
        codes: ['101', '102'],
        varianteId: 'var-1',
        etageNom: 'RDC',
        plotId: 'plot-1',
      })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toEqual(pgError)
  })

  it('returns error on RPC failure', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: new Error('RPC failed'),
    } as never)

    const { result } = renderHook(() => useCreateBatchLots(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({
        codes: ['101'],
        varianteId: 'var-1',
        etageNom: 'RDC',
        plotId: 'plot-1',
      })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('RPC failed')
  })
})
