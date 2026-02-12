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
import { useChantierLots } from './useChantierLots'
import type { ChantierLot } from './useChantierLots'

const mockLots: ChantierLot[] = [
  {
    id: 'lot-1',
    code: '101',
    plot_id: 'plot-1',
    etage_id: 'etage-1',
    plots: { nom: 'Plot A' },
    etages: { nom: 'RDC' },
  },
  {
    id: 'lot-2',
    code: '102',
    plot_id: 'plot-1',
    etage_id: 'etage-1',
    plots: { nom: 'Plot A' },
    etages: { nom: 'RDC' },
  },
  {
    id: 'lot-3',
    code: '203',
    plot_id: 'plot-1',
    etage_id: 'etage-2',
    plots: { nom: 'Plot A' },
    etages: { nom: 'É1' },
  },
  {
    id: 'lot-4',
    code: '301',
    plot_id: 'plot-2',
    etage_id: 'etage-3',
    plots: { nom: 'Plot B' },
    etages: { nom: 'RDC' },
  },
]

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

function setupMock(data: ChantierLot[] | null, error: Error | null = null) {
  const mockOrder = vi.fn().mockResolvedValue({ data, error })
  const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
  vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)
  return { mockSelect, mockEq, mockOrder }
}

describe('useChantierLots', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches all lots for a chantier with plot and etage joins', async () => {
    const { mockSelect, mockEq, mockOrder } = setupMock(mockLots)

    const { result } = renderHook(() => useChantierLots('chantier-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('lots')
    expect(mockSelect).toHaveBeenCalledWith(
      'id, code, plot_id, etage_id, plots!inner(nom), etages(nom)',
    )
    expect(mockEq).toHaveBeenCalledWith('plots.chantier_id', 'chantier-1')
    expect(mockOrder).toHaveBeenCalledWith('code')
    expect(result.current.data).toEqual(mockLots)
  })

  it('uses query key ["chantier-lots", chantierId]', async () => {
    setupMock(mockLots)

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useChantierLots('chantier-1'), {
      wrapper,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const cached = queryClient.getQueryData(['chantier-lots', 'chantier-1'])
    expect(cached).toEqual(mockLots)
  })

  it('returns error on supabase failure', async () => {
    setupMock(null, new Error('DB error'))

    const { result } = renderHook(() => useChantierLots('chantier-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('DB error')
  })

  it('is disabled when chantierId is empty', () => {
    const { result } = renderHook(() => useChantierLots(''), {
      wrapper: createWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
  })

  it('returns ChantierLot type with correct shape', async () => {
    setupMock(mockLots)

    const { result } = renderHook(() => useChantierLots('chantier-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const lot = result.current.data![0]
    expect(lot).toHaveProperty('id')
    expect(lot).toHaveProperty('code')
    expect(lot).toHaveProperty('plot_id')
    expect(lot).toHaveProperty('etage_id')
    expect(lot).toHaveProperty('plots.nom')
    expect(lot).toHaveProperty('etages.nom')
  })
})
