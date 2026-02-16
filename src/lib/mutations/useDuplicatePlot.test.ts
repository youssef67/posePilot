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
import { useDuplicatePlot } from './useDuplicatePlot'

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

describe('useDuplicatePlot', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls supabase.rpc with correct parameters', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: 'new-plot-id', error: null } as never)

    const { result } = renderHook(() => useDuplicatePlot(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({
        sourcePlotId: 'source-plot-1',
        chantierId: 'chantier-1',
        newPlotNom: 'Plot Copie',
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.rpc).toHaveBeenCalledWith('duplicate_plot', {
      p_source_plot_id: 'source-plot-1',
      p_new_plot_nom: 'Plot Copie',
    })
    expect(result.current.data).toBe('new-plot-id')
  })

  it('invalidates plots query on settled', async () => {
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    vi.mocked(supabase.rpc).mockResolvedValue({ data: 'new-plot-id', error: null } as never)

    const { result } = renderHook(() => useDuplicatePlot(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({
        sourcePlotId: 'source-plot-1',
        chantierId: 'chantier-1',
        newPlotNom: 'Plot Copie',
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['plots', 'chantier-1'] })
  })

  it('propagates supabase error', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { message: 'RPC failed', details: '', hint: '', code: '' },
    } as never)

    const { result } = renderHook(() => useDuplicatePlot(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({
        sourcePlotId: 'source-plot-1',
        chantierId: 'chantier-1',
        newPlotNom: 'Plot Copie',
      })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeTruthy()
  })
})
