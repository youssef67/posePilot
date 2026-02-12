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
import { useUpdatePlotTasks } from './useUpdatePlotTasks'

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

describe('useUpdatePlotTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates task_definitions for a plot', async () => {
    const newTasks = ['Ragréage', 'Pose', 'Joints']
    const mockSingle = vi.fn().mockResolvedValue({
      data: { id: 'plot-1', chantier_id: 'chantier-1', nom: 'Plot A', task_definitions: newTasks, created_at: '2026-01-01T00:00:00Z' },
      error: null,
    })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)

    const { result } = renderHook(() => useUpdatePlotTasks(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ plotId: 'plot-1', chantierId: 'chantier-1', taskDefinitions: newTasks })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('plots')
    expect(mockUpdate).toHaveBeenCalledWith({ task_definitions: newTasks })
    expect(mockEq).toHaveBeenCalledWith('id', 'plot-1')
  })

  it('invalidates plots query on settled', async () => {
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const mockSingle = vi.fn().mockResolvedValue({
      data: { id: 'plot-1', chantier_id: 'chantier-1', nom: 'Plot A', task_definitions: ['Pose'], created_at: '2026-01-01T00:00:00Z' },
      error: null,
    })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)

    const { result } = renderHook(() => useUpdatePlotTasks(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ plotId: 'plot-1', chantierId: 'chantier-1', taskDefinitions: ['Pose'] })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['plots', 'chantier-1'] })
  })

  it('rolls back cache on mutation error', async () => {
    const queryClient = createQueryClient()
    const previousPlots = [
      { id: 'plot-1', chantier_id: 'chantier-1', nom: 'Plot A', task_definitions: ['Ragréage', 'Pose'], created_at: '2026-01-01T00:00:00Z' },
    ]
    queryClient.setQueryData(['plots', 'chantier-1'], previousPlots)

    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: new Error('Update failed') })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)

    const { result } = renderHook(() => useUpdatePlotTasks(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ plotId: 'plot-1', chantierId: 'chantier-1', taskDefinitions: ['Only Pose'] })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    const cachedData = queryClient.getQueryData(['plots', 'chantier-1'])
    expect(cachedData).toEqual(previousPlots)
  })
})
