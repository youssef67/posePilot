import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

import { supabase } from '@/lib/supabase'
import { usePlots } from './usePlots'

const mockPlots = [
  {
    id: 'plot-1',
    chantier_id: 'chantier-1',
    nom: 'Plot A',
    task_definitions: ['Ragréage', 'Pose'],
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'plot-2',
    chantier_id: 'chantier-1',
    nom: 'Plot B',
    task_definitions: ['Joints', 'Silicone'],
    created_at: '2026-01-02T00:00:00Z',
  },
]

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('usePlots', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches plots for a chantier ordered by created_at ASC', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: mockPlots, error: null })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => usePlots('chantier-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('plots')
    expect(mockSelect).toHaveBeenCalledWith('*')
    expect(mockEq).toHaveBeenCalledWith('chantier_id', 'chantier-1')
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: true })
    expect(result.current.data).toEqual(mockPlots)
  })

  it('uses query key ["plots", chantierId]', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: mockPlots, error: null })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => usePlots('chantier-1'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const cached = queryClient.getQueryData(['plots', 'chantier-1'])
    expect(cached).toEqual(mockPlots)
  })

  it('returns error on supabase failure', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => usePlots('chantier-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('DB error')
  })

  it('is disabled when chantierId is empty', async () => {
    const { result } = renderHook(() => usePlots(''), { wrapper: createWrapper() })

    // Should not fetch — stays in pending state with fetchStatus idle
    expect(result.current.fetchStatus).toBe('idle')
  })
})
