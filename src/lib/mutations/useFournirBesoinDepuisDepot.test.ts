import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
    },
  },
}))

import { supabase } from '@/lib/supabase'
import { useFournirBesoinDepuisDepot } from './useFournirBesoinDepuisDepot'

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children)
}

const mockArticle = {
  id: 'art-1',
  designation: 'Sac de colle Mapei',
  quantite: 20,
  valeur_totale: 210,
  unite: 'sacs',
  created_at: '2026-02-20T10:00:00Z',
  created_by: 'user-1',
}

const mockBesoin = {
  id: 'b1',
  chantier_id: 'ch-1',
  description: 'Sac de colle faïence',
  quantite: 10,
  montant_unitaire: null,
  is_depot: false,
  livraison_id: null,
  created_at: '2026-02-20T10:00:00Z',
  created_by: 'user-1',
}

function setupMocks(article = mockArticle, besoin = mockBesoin) {
  const mockUpdateEqSelectSingle = vi.fn().mockResolvedValue({ data: {}, error: null })
  const mockUpdateEqSelect = vi.fn().mockReturnValue({ single: mockUpdateEqSelectSingle })
  const mockArticleUpdateEq = vi.fn().mockReturnValue({ select: mockUpdateEqSelect })
  const mockArticleUpdate = vi.fn().mockReturnValue({ eq: mockArticleUpdateEq })

  const mockLivraisonInsertSelectSingle = vi.fn().mockResolvedValue({ data: { id: 'liv-1' }, error: null })
  const mockLivraisonInsertSelect = vi.fn().mockReturnValue({ single: mockLivraisonInsertSelectSingle })
  const mockLivraisonInsert = vi.fn().mockReturnValue({ select: mockLivraisonInsertSelect })

  const mockBesoinUpdateEq = vi.fn().mockResolvedValue({ error: null })
  const mockBesoinUpdate = vi.fn().mockReturnValue({ eq: mockBesoinUpdateEq })

  const mockMouvInsertSelectSingle = vi.fn().mockResolvedValue({ data: { id: 'mouv-1' }, error: null })
  const mockMouvInsertSelect = vi.fn().mockReturnValue({ single: mockMouvInsertSelectSingle })
  const mockMouvInsert = vi.fn().mockReturnValue({ select: mockMouvInsertSelect })

  vi.mocked(supabase.from).mockImplementation((table: string) => {
    if (table === 'depot_articles') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: article, error: null }),
          }),
        }),
        update: mockArticleUpdate,
      } as never
    }
    if (table === 'besoins') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: besoin, error: null }),
          }),
        }),
        update: mockBesoinUpdate,
      } as never
    }
    if (table === 'depot_mouvements') {
      return { insert: mockMouvInsert } as never
    }
    if (table === 'livraisons') {
      return { insert: mockLivraisonInsert } as never
    }
    return {} as never
  })

  return { mockArticleUpdate, mockLivraisonInsert, mockMouvInsert, mockBesoinUpdate }
}

describe('useFournirBesoinDepuisDepot', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: { id: 'user-1' } as never }, error: null })
  })

  it('decrements depot_articles quantity and valeur_totale (AC #3)', async () => {
    const { mockArticleUpdate } = setupMocks()
    const { result } = renderHook(() => useFournirBesoinDepuisDepot(), { wrapper: createWrapper() })

    result.current.mutate({ besoinId: 'b1', articleId: 'art-1', quantite: 10 })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    // CUMP = 210/20 = 10.5, new qty = 10, new valeur = 210 - 10*10.5 = 105
    expect(mockArticleUpdate).toHaveBeenCalledWith({ quantite: 10, valeur_totale: 105 })
  })

  it('creates a livraison with "Transfert dépôt — {designation}" (AC #3, #6)', async () => {
    const { mockLivraisonInsert } = setupMocks()
    const { result } = renderHook(() => useFournirBesoinDepuisDepot(), { wrapper: createWrapper() })

    result.current.mutate({ besoinId: 'b1', articleId: 'art-1', quantite: 10 })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockLivraisonInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        chantier_id: 'ch-1',
        description: 'Transfert dépôt — Sac de colle Mapei',
        status: 'livre',
        montant_ttc: 105,
        destination: 'chantier',
      }),
    )
  })

  it('updates the besoin with livraison_id and montant_unitaire = CUMP (AC #3)', async () => {
    const { mockBesoinUpdate } = setupMocks()
    const { result } = renderHook(() => useFournirBesoinDepuisDepot(), { wrapper: createWrapper() })

    result.current.mutate({ besoinId: 'b1', articleId: 'art-1', quantite: 10 })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockBesoinUpdate).toHaveBeenCalledWith({
      livraison_id: 'liv-1',
      montant_unitaire: 10.5,
    })
  })

  it('creates a depot_mouvement of type transfert_chantier (AC #3)', async () => {
    const { mockMouvInsert } = setupMocks()
    const { result } = renderHook(() => useFournirBesoinDepuisDepot(), { wrapper: createWrapper() })

    result.current.mutate({ besoinId: 'b1', articleId: 'art-1', quantite: 10 })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockMouvInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        article_id: 'art-1',
        type: 'transfert_chantier',
        quantite: 10,
        prix_unitaire: 10.5,
        montant_total: 105,
        chantier_id: 'ch-1',
      }),
    )
  })

  it('handles partial supply with reduced quantity (AC #5)', async () => {
    const { mockArticleUpdate, mockLivraisonInsert } = setupMocks()
    const { result } = renderHook(() => useFournirBesoinDepuisDepot(), { wrapper: createWrapper() })

    // Supply only 5 out of 10
    result.current.mutate({ besoinId: 'b1', articleId: 'art-1', quantite: 5 })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    // CUMP = 10.5, new qty = 15, new valeur = 210 - 5*10.5 = 157.5
    expect(mockArticleUpdate).toHaveBeenCalledWith({ quantite: 15, valeur_totale: 157.5 })
    expect(mockLivraisonInsert).toHaveBeenCalledWith(
      expect.objectContaining({ montant_ttc: 52.5 }),
    )
  })
})
