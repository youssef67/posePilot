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
import { useEtages } from './useEtages'

const mockEtages = [
  {
    id: 'etage-1',
    plot_id: 'plot-1',
    nom: 'RDC',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'etage-2',
    plot_id: 'plot-1',
    nom: '1',
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

describe('useEtages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches etages for a plot ordered by created_at ASC', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: mockEtages, error: null })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useEtages('plot-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('etages')
    expect(mockSelect).toHaveBeenCalledWith('*')
    expect(mockEq).toHaveBeenCalledWith('plot_id', 'plot-1')
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: true })
    expect(result.current.data).toEqual(mockEtages)
  })

  it('uses query key ["etages", plotId]', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: mockEtages, error: null })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useEtages('plot-1'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const cached = queryClient.getQueryData(['etages', 'plot-1'])
    expect(cached).toEqual(mockEtages)
  })

  it('returns error on supabase failure', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useEtages('plot-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('DB error')
  })

  it('is disabled when plotId is empty', async () => {
    const { result } = renderHook(() => useEtages(''), { wrapper: createWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
  })
})
