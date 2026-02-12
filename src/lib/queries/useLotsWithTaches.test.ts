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
import { useLotsWithTaches } from './useLotsWithTaches'
import type { LotWithTaches } from './useLotsWithTaches'

const mockLots: LotWithTaches[] = [
  {
    id: 'lot-1',
    code: '101',
    plot_id: 'plot-1',
    etage_id: 'etage-1',
    metrage_m2_total: 12.5,
    metrage_ml_total: 8.2,
    plots: { nom: 'Plot A' },
    etages: { nom: 'RDC' },
    pieces: [
      {
        id: 'piece-1',
        nom: 'Séjour',
        taches: [
          { id: 't-1', nom: 'Ragréage', status: 'done' },
          { id: 't-2', nom: 'Phonique', status: 'done' },
          { id: 't-3', nom: 'Pose', status: 'not_started' },
        ],
      },
    ],
  },
]

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

function setupMock(data: LotWithTaches[] | null, error: Error | null = null) {
  const mockOrder = vi.fn().mockResolvedValue({ data, error })
  const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
  vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)
  return { mockSelect, mockEq, mockOrder }
}

describe('useLotsWithTaches', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches lots with pieces and taches for a chantier', async () => {
    const { mockSelect, mockEq, mockOrder } = setupMock(mockLots)

    const { result } = renderHook(() => useLotsWithTaches('chantier-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('lots')
    expect(mockSelect).toHaveBeenCalledWith(
      'id, code, plot_id, etage_id, metrage_m2_total, metrage_ml_total, plots!inner(nom), etages(nom), pieces(id, nom, taches(id, nom, status))',
    )
    expect(mockEq).toHaveBeenCalledWith('plots.chantier_id', 'chantier-1')
    expect(mockOrder).toHaveBeenCalledWith('code')
    expect(result.current.data).toEqual(mockLots)
  })

  it('returns empty array when no lots exist', async () => {
    setupMock([])

    const { result } = renderHook(() => useLotsWithTaches('chantier-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })

  it('returns error on supabase failure', async () => {
    setupMock(null, new Error('DB error'))

    const { result } = renderHook(() => useLotsWithTaches('chantier-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('DB error')
  })

  it('is disabled when chantierId is empty', () => {
    const { result } = renderHook(() => useLotsWithTaches(''), {
      wrapper: createWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
  })
})
