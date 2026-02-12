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
import { useDeleteVariante } from './useDeleteVariante'

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

describe('useDeleteVariante', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes variante by id', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never)

    const { result } = renderHook(() => useDeleteVariante(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ varianteId: 'var-1', plotId: 'plot-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('variantes')
    expect(mockEq).toHaveBeenCalledWith('id', 'var-1')
  })

  it('invalidates variantes query on settled', async () => {
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const mockEq = vi.fn().mockResolvedValue({ error: null })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never)

    const { result } = renderHook(() => useDeleteVariante(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ varianteId: 'var-1', plotId: 'plot-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['variantes', 'plot-1'] })
  })

  it('rolls back cache on mutation error', async () => {
    const queryClient = createQueryClient()
    const previousVariantes = [
      { id: 'var-1', plot_id: 'plot-1', nom: 'Type A', created_at: '2026-01-01T00:00:00Z' },
    ]
    queryClient.setQueryData(['variantes', 'plot-1'], previousVariantes)

    const mockEq = vi.fn().mockResolvedValue({ error: new Error('Delete failed') })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never)

    const { result } = renderHook(() => useDeleteVariante(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ varianteId: 'var-1', plotId: 'plot-1' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    const cachedData = queryClient.getQueryData(['variantes', 'plot-1'])
    expect(cachedData).toEqual(previousVariantes)
  })
})
