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
import { useLots } from './useLots'

const mockLots = [
  {
    id: 'lot-1',
    etage_id: 'etage-1',
    variante_id: 'var-1',
    plot_id: 'plot-1',
    code: '001',
    is_tma: false,
    created_at: '2026-01-01T00:00:00Z',
    etages: { nom: 'RDC' },
    variantes: { nom: 'Type A' },
    pieces: [{ count: 4 }],
  },
  {
    id: 'lot-2',
    etage_id: 'etage-2',
    variante_id: 'var-2',
    plot_id: 'plot-1',
    code: '101',
    is_tma: false,
    created_at: '2026-01-02T00:00:00Z',
    etages: { nom: '1' },
    variantes: { nom: 'Type B' },
    pieces: [{ count: 3 }],
  },
]

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useLots', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches lots with relations for a plot', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: mockLots, error: null })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useLots('plot-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('lots')
    expect(mockSelect).toHaveBeenCalledWith('*, etages(nom), variantes(nom), pieces(count)')
    expect(mockEq).toHaveBeenCalledWith('plot_id', 'plot-1')
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: true })
    expect(result.current.data).toEqual(mockLots)
  })

  it('uses query key ["lots", plotId]', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: mockLots, error: null })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useLots('plot-1'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const cached = queryClient.getQueryData(['lots', 'plot-1'])
    expect(cached).toEqual(mockLots)
  })

  it('returns error on supabase failure', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useLots('plot-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('DB error')
  })

  it('is disabled when plotId is empty', async () => {
    const { result } = renderHook(() => useLots(''), { wrapper: createWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
  })
})
