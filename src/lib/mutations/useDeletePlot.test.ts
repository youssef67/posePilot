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
import { useDeletePlot } from './useDeletePlot'

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

describe('useDeletePlot', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes a plot by id', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never)

    const { result } = renderHook(() => useDeletePlot(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ plotId: 'plot-1', chantierId: 'chantier-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('plots')
    expect(mockDelete).toHaveBeenCalled()
    expect(mockEq).toHaveBeenCalledWith('id', 'plot-1')
  })

  it('invalidates plots query on settled', async () => {
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const mockEq = vi.fn().mockResolvedValue({ error: null })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never)

    const { result } = renderHook(() => useDeletePlot(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ plotId: 'plot-1', chantierId: 'chantier-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['plots', 'chantier-1'] })
  })

  it('removes plot from cache optimistically', async () => {
    const queryClient = createQueryClient()
    const previousPlots = [
      { id: 'plot-1', chantier_id: 'chantier-1', nom: 'Plot A', task_definitions: ['Pose'], created_at: '2026-01-01T00:00:00Z' },
      { id: 'plot-2', chantier_id: 'chantier-1', nom: 'Plot B', task_definitions: ['Joints'], created_at: '2026-01-02T00:00:00Z' },
    ]
    queryClient.setQueryData(['plots', 'chantier-1'], previousPlots)

    // Use a delayed mock to check optimistic update
    let resolveDelete: (value: unknown) => void
    const mockEq = vi.fn().mockReturnValue(
      new Promise((resolve) => { resolveDelete = resolve }),
    )
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never)

    const { result } = renderHook(() => useDeletePlot(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => {
      result.current.mutate({ plotId: 'plot-1', chantierId: 'chantier-1' })
    })

    // Cache should optimistically remove plot-1
    await waitFor(() => {
      const cached = queryClient.getQueryData<unknown[]>(['plots', 'chantier-1'])
      expect(cached).toHaveLength(1)
      expect(cached).toEqual([previousPlots[1]])
    })

    // Resolve the delete
    await act(async () => {
      resolveDelete!({ error: null })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('rolls back cache on mutation error', async () => {
    const queryClient = createQueryClient()
    const previousPlots = [
      { id: 'plot-1', chantier_id: 'chantier-1', nom: 'Plot A', task_definitions: ['Pose'], created_at: '2026-01-01T00:00:00Z' },
    ]
    queryClient.setQueryData(['plots', 'chantier-1'], previousPlots)

    const mockEq = vi.fn().mockResolvedValue({ error: new Error('Delete failed') })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never)

    const { result } = renderHook(() => useDeletePlot(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ plotId: 'plot-1', chantierId: 'chantier-1' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    const cachedData = queryClient.getQueryData(['plots', 'chantier-1'])
    expect(cachedData).toEqual(previousPlots)
  })
})
