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
import { useTransfertDepotVersChantier } from './useTransfertDepotVersChantier'

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

function setupMocks(article = mockArticle) {
  const mockUpdateEqSelectSingle = vi.fn().mockResolvedValue({ data: {}, error: null })
  const mockUpdateEqSelect = vi.fn().mockReturnValue({ single: mockUpdateEqSelectSingle })
  const mockUpdateEq = vi.fn().mockReturnValue({ select: mockUpdateEqSelect })
  const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq })

  const mockLivraisonInsertSelectSingle = vi.fn().mockResolvedValue({ data: { id: 'liv-1' }, error: null })
  const mockLivraisonInsertSelect = vi.fn().mockReturnValue({ single: mockLivraisonInsertSelectSingle })
  const mockLivraisonInsert = vi.fn().mockReturnValue({ select: mockLivraisonInsertSelect })

  const mockBesoinInsert = vi.fn().mockResolvedValue({ error: null })

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
        update: mockUpdate,
      } as never
    }
    if (table === 'depot_mouvements') {
      return { insert: mockMouvInsert } as never
    }
    if (table === 'livraisons') {
      return { insert: mockLivraisonInsert } as never
    }
    if (table === 'besoins') {
      return { insert: mockBesoinInsert } as never
    }
    return {} as never
  })

  return { mockUpdate, mockLivraisonInsert, mockMouvInsert, mockBesoinInsert }
}

describe('useTransfertDepotVersChantier', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: { id: 'user-1' } as never }, error: null })
  })

  it('updates depot_articles with decremented quantity and valeur (AC #3)', async () => {
    const { mockUpdate } = setupMocks()
    const { result } = renderHook(() => useTransfertDepotVersChantier(), { wrapper: createWrapper() })

    result.current.mutate({ articleId: 'art-1', quantite: 5, chantierId: 'ch-1' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    // CUMP = 210/20 = 10.5, new qty = 15, new valeur = 210 - 5*10.5 = 157.5
    expect(mockUpdate).toHaveBeenCalledWith({ quantite: 15, valeur_totale: 157.5 })
  })

  it('creates a depot_mouvement of type transfert_chantier (AC #3)', async () => {
    const { mockMouvInsert } = setupMocks()
    const { result } = renderHook(() => useTransfertDepotVersChantier(), { wrapper: createWrapper() })

    result.current.mutate({ articleId: 'art-1', quantite: 5, chantierId: 'ch-1' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockMouvInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        article_id: 'art-1',
        type: 'transfert_chantier',
        quantite: 5,
        prix_unitaire: 10.5,
        montant_total: 52.5,
        chantier_id: 'ch-1',
      }),
    )
  })

  it('creates a livraison with status livre and correct description (AC #3, #6)', async () => {
    const { mockLivraisonInsert } = setupMocks()
    const { result } = renderHook(() => useTransfertDepotVersChantier(), { wrapper: createWrapper() })

    result.current.mutate({ articleId: 'art-1', quantite: 5, chantierId: 'ch-1' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockLivraisonInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        chantier_id: 'ch-1',
        description: 'Transfert dépôt — Sac de colle Mapei',
        status: 'livre',
        montant_ttc: 52.5,
        destination: 'chantier',
      }),
    )
  })

  it('creates a besoin linked to the livraison (AC #3)', async () => {
    const { mockBesoinInsert } = setupMocks()
    const { result } = renderHook(() => useTransfertDepotVersChantier(), { wrapper: createWrapper() })

    result.current.mutate({ articleId: 'art-1', quantite: 5, chantierId: 'ch-1' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockBesoinInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        chantier_id: 'ch-1',
        description: 'Sac de colle Mapei',
        quantite: 5,
        montant_unitaire: 10.5,
        livraison_id: 'liv-1',
      }),
    )
  })

  it('transfers full stock leaving article at quantite=0, valeur_totale=0 (AC #5)', async () => {
    const { mockUpdate } = setupMocks()
    const { result } = renderHook(() => useTransfertDepotVersChantier(), { wrapper: createWrapper() })

    result.current.mutate({ articleId: 'art-1', quantite: 20, chantierId: 'ch-1' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockUpdate).toHaveBeenCalledWith({ quantite: 0, valeur_totale: 0 })
  })
})
