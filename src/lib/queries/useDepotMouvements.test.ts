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
import { useDepotMouvements } from './useDepotMouvements'

const mockMouvements = [
  {
    id: 'm1',
    article_id: 'a1',
    type: 'entree',
    quantite: 10,
    prix_unitaire: 10,
    montant_total: 100,
    livraison_id: null,
    chantier_id: null,
    note: 'Achat initial',
    created_at: '2026-02-20T12:00:00Z',
    created_by: 'user-1',
    chantiers: null,
  },
  {
    id: 'm2',
    article_id: 'a1',
    type: 'transfert_chantier',
    quantite: 5,
    prix_unitaire: 10,
    montant_total: 50,
    livraison_id: null,
    chantier_id: 'ch1',
    note: null,
    created_at: '2026-02-20T11:00:00Z',
    created_by: 'user-1',
    chantiers: { nom: 'Chantier Alpha' },
  },
]

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useDepotMouvements', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches mouvements for an article with chantier join, sorted by created_at DESC', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: mockMouvements, error: null })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useDepotMouvements('a1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.data).toHaveLength(2))

    expect(supabase.from).toHaveBeenCalledWith('depot_mouvements')
    expect(mockSelect).toHaveBeenCalledWith('*, chantiers(nom)')
    expect(mockEq).toHaveBeenCalledWith('article_id', 'a1')
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(result.current.data![1].chantiers?.nom).toBe('Chantier Alpha')
  })

  it('is disabled when articleId is empty', () => {
    const { result } = renderHook(() => useDepotMouvements(''), { wrapper: createWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
  })

  it('returns error on supabase failure', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useDepotMouvements('a1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('DB error')
  })
})
