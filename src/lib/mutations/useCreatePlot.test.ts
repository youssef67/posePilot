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
import { useCreatePlot, DEFAULT_TASK_DEFINITIONS } from './useCreatePlot'

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

function mockSupabaseInsert(data: unknown) {
  const mockSingle = vi.fn().mockResolvedValue({ data, error: null })
  const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
  const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
  vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never)
  return { mockInsert, mockSelect, mockSingle }
}

describe('useCreatePlot', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('inserts plot with nom and default task_definitions', async () => {
    const { mockInsert } = mockSupabaseInsert({
      id: 'plot-1',
      chantier_id: 'chantier-1',
      nom: 'Plot A',
      task_definitions: DEFAULT_TASK_DEFINITIONS,
      created_at: '2026-01-01T00:00:00Z',
    })

    const { result } = renderHook(() => useCreatePlot(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ chantierId: 'chantier-1', nom: 'Plot A' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('plots')
    expect(mockInsert).toHaveBeenCalledWith({
      chantier_id: 'chantier-1',
      nom: 'Plot A',
      task_definitions: DEFAULT_TASK_DEFINITIONS,
    })
  })

  it('invalidates plots query on settled', async () => {
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    mockSupabaseInsert({
      id: 'plot-2',
      chantier_id: 'chantier-1',
      nom: 'Plot B',
      task_definitions: DEFAULT_TASK_DEFINITIONS,
      created_at: '2026-01-01T00:00:00Z',
    })

    const { result } = renderHook(() => useCreatePlot(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ chantierId: 'chantier-1', nom: 'Plot B' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['plots', 'chantier-1'] })
  })

  it('rolls back cache on mutation error', async () => {
    const queryClient = createQueryClient()
    const previousPlots = [
      { id: 'existing-1', chantier_id: 'chantier-1', nom: 'Existing', task_definitions: [], created_at: '2026-01-01T00:00:00Z' },
    ]
    queryClient.setQueryData(['plots', 'chantier-1'], previousPlots)

    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: new Error('Insert failed') })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never)

    const { result } = renderHook(() => useCreatePlot(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ chantierId: 'chantier-1', nom: 'Fail' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    const cachedData = queryClient.getQueryData(['plots', 'chantier-1'])
    expect(cachedData).toEqual(previousPlots)
  })

  it('exports DEFAULT_TASK_DEFINITIONS with expected values', () => {
    expect(DEFAULT_TASK_DEFINITIONS).toEqual([
      'Ragréage',
      'Phonique',
      'Pose',
      'Plinthes',
      'Joints',
      'Silicone',
    ])
  })
})
