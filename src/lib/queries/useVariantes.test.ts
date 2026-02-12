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
import { useVariantes } from './useVariantes'

const mockVariantes = [
  {
    id: 'var-1',
    plot_id: 'plot-1',
    nom: 'Type A',
    created_at: '2026-01-01T00:00:00Z',
    variante_pieces: [{ count: 4 }],
  },
  {
    id: 'var-2',
    plot_id: 'plot-1',
    nom: 'Type B',
    created_at: '2026-01-02T00:00:00Z',
    variante_pieces: [{ count: 3 }],
  },
]

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useVariantes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches variantes with piece count for a plot', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: mockVariantes, error: null })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useVariantes('plot-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('variantes')
    expect(mockSelect).toHaveBeenCalledWith('*, variante_pieces(count)')
    expect(mockEq).toHaveBeenCalledWith('plot_id', 'plot-1')
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: true })
    expect(result.current.data).toEqual(mockVariantes)
  })

  it('uses query key ["variantes", plotId]', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: mockVariantes, error: null })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useVariantes('plot-1'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const cached = queryClient.getQueryData(['variantes', 'plot-1'])
    expect(cached).toEqual(mockVariantes)
  })

  it('returns error on supabase failure', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useVariantes('plot-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('DB error')
  })

  it('is disabled when plotId is empty', async () => {
    const { result } = renderHook(() => useVariantes(''), { wrapper: createWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
  })
})
