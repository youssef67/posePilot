import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
    },
  },
}))

import { supabase } from '@/lib/supabase'
import { useCreateDepotEntree } from './useCreateDepotEntree'
import type { DepotArticleWithCump } from '@/lib/queries/useDepotArticles'

function createWrapper(queryClient?: QueryClient) {
  const qc = queryClient ?? new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children)
}

describe('useCreateDepotEntree', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: { id: 'user-1' } as never }, error: null })
  })

  it('creates new depot article + mouvement when no articleId (AC #1)', async () => {
    const createdArticle = {
      id: 'art-1',
      designation: 'Sacs ciment',
      quantite: 10,
      valeur_totale: 100,
      unite: 'sac',
      created_at: '2026-02-25T10:00:00Z',
      created_by: 'user-1',
    }
    const createdMouvement = {
      id: 'mouv-1',
      article_id: 'art-1',
      type: 'entree',
      quantite: 10,
      prix_unitaire: 10,
      montant_total: 100,
      created_at: '2026-02-25T10:00:00Z',
      created_by: 'user-1',
    }

    const mockSingleArticle = vi.fn().mockResolvedValue({ data: createdArticle, error: null })
    const mockSelectArticle = vi.fn().mockReturnValue({ single: mockSingleArticle })
    const mockInsertArticle = vi.fn().mockReturnValue({ select: mockSelectArticle })

    const mockSingleMouvement = vi.fn().mockResolvedValue({ data: createdMouvement, error: null })
    const mockSelectMouvement = vi.fn().mockReturnValue({ single: mockSingleMouvement })
    const mockInsertMouvement = vi.fn().mockReturnValue({ select: mockSelectMouvement })

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'depot_articles') {
        return { insert: mockInsertArticle } as never
      }
      return { insert: mockInsertMouvement } as never
    })

    const { result } = renderHook(() => useCreateDepotEntree(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({
        designation: 'Sacs ciment',
        quantite: 10,
        prixUnitaire: 10,
        unite: 'sac',
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('depot_articles')
    expect(mockInsertArticle).toHaveBeenCalledWith({
      designation: 'Sacs ciment',
      quantite: 10,
      valeur_totale: 100,
      unite: 'sac',
      created_by: 'user-1',
    })
    expect(supabase.from).toHaveBeenCalledWith('depot_mouvements')
  })

  it('updates existing article + creates mouvement when articleId provided (AC #2)', async () => {
    const existingArticle = {
      id: 'art-1',
      designation: 'Sacs ciment',
      quantite: 10,
      valeur_totale: 100,
      unite: 'sac',
      created_at: '2026-02-25T10:00:00Z',
      created_by: 'user-1',
    }
    const updatedArticle = {
      ...existingArticle,
      quantite: 20,
      valeur_totale: 210,
    }
    const createdMouvement = {
      id: 'mouv-2',
      article_id: 'art-1',
      type: 'entree',
      quantite: 10,
      prix_unitaire: 11,
      montant_total: 110,
      created_at: '2026-02-25T10:00:00Z',
      created_by: 'user-1',
    }

    // First call: from('depot_articles').select().eq().single() to fetch existing
    const mockFetchSingle = vi.fn().mockResolvedValue({ data: existingArticle, error: null })
    const mockFetchEq = vi.fn().mockReturnValue({ single: mockFetchSingle })
    const mockFetchSelect = vi.fn().mockReturnValue({ eq: mockFetchEq })

    // Second call: from('depot_articles').update().eq().select().single() to update
    const mockUpdateSingle = vi.fn().mockResolvedValue({ data: updatedArticle, error: null })
    const mockUpdateSelect = vi.fn().mockReturnValue({ single: mockUpdateSingle })
    const mockUpdateEq = vi.fn().mockReturnValue({ select: mockUpdateSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq })

    // Third call: from('depot_mouvements').insert().select().single()
    const mockMouvSingle = vi.fn().mockResolvedValue({ data: createdMouvement, error: null })
    const mockMouvSelect = vi.fn().mockReturnValue({ single: mockMouvSingle })
    const mockMouvInsert = vi.fn().mockReturnValue({ select: mockMouvSelect })

    let articleCallCount = 0
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'depot_articles') {
        articleCallCount++
        if (articleCallCount === 1) return { select: mockFetchSelect } as never
        return { update: mockUpdate } as never
      }
      return { insert: mockMouvInsert } as never
    })

    const { result } = renderHook(() => useCreateDepotEntree(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({
        articleId: 'art-1',
        quantite: 10,
        prixUnitaire: 11,
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockUpdate).toHaveBeenCalledWith({
      quantite: 20,
      valeur_totale: 210,
    })
    expect(supabase.from).toHaveBeenCalledWith('depot_mouvements')
  })

  it('returns error on supabase failure', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: new Error('Insert failed') })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never)

    const { result } = renderHook(() => useCreateDepotEntree(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({
        designation: 'Test',
        quantite: 1,
        prixUnitaire: 10,
      })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Insert failed')
  })

  it('invalidates depot-articles cache on success', async () => {
    const createdArticle = {
      id: 'art-1',
      designation: 'Test',
      quantite: 1,
      valeur_totale: 10,
      unite: null,
      created_at: '2026-02-25T10:00:00Z',
      created_by: 'user-1',
    }
    const createdMouvement = {
      id: 'mouv-1',
      article_id: 'art-1',
      type: 'entree',
      quantite: 1,
      prix_unitaire: 10,
      montant_total: 10,
    }

    const mockSingleArticle = vi.fn().mockResolvedValue({ data: createdArticle, error: null })
    const mockSelectArticle = vi.fn().mockReturnValue({ single: mockSingleArticle })
    const mockInsertArticle = vi.fn().mockReturnValue({ select: mockSelectArticle })

    const mockSingleMouvement = vi.fn().mockResolvedValue({ data: createdMouvement, error: null })
    const mockSelectMouvement = vi.fn().mockReturnValue({ single: mockSingleMouvement })
    const mockInsertMouvement = vi.fn().mockReturnValue({ select: mockSelectMouvement })

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'depot_articles') return { insert: mockInsertArticle } as never
      return { insert: mockInsertMouvement } as never
    })

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useCreateDepotEntree(), { wrapper: createWrapper(queryClient) })

    await act(async () => {
      result.current.mutate({
        designation: 'Test',
        quantite: 1,
        prixUnitaire: 10,
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['depot-articles'] })
  })

  it('rejects quantite <= 0 with validation error (M1)', async () => {
    const { result } = renderHook(() => useCreateDepotEntree(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({
        designation: 'Test',
        quantite: 0,
        prixUnitaire: 10,
      })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('La quantité doit être supérieure à 0')
  })

  it('rejects empty designation with validation error (M1)', async () => {
    const { result } = renderHook(() => useCreateDepotEntree(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({
        designation: '   ',
        quantite: 1,
        prixUnitaire: 10,
      })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('La désignation ne peut pas être vide')
  })

  it('applies optimistic update for existing article (H2/AC #7)', async () => {
    const existingArticle = {
      id: 'art-1',
      designation: 'Sacs ciment',
      quantite: 10,
      valeur_totale: 100,
      unite: 'sac',
      created_at: '2026-02-25T10:00:00Z',
      created_by: 'user-1',
    }
    const updatedArticle = { ...existingArticle, quantite: 15, valeur_totale: 155 }
    const createdMouvement = {
      id: 'mouv-1',
      article_id: 'art-1',
      type: 'entree',
      quantite: 5,
      prix_unitaire: 11,
      montant_total: 55,
    }

    const mockFetchSingle = vi.fn().mockResolvedValue({ data: existingArticle, error: null })
    const mockFetchEq = vi.fn().mockReturnValue({ single: mockFetchSingle })
    const mockFetchSelect = vi.fn().mockReturnValue({ eq: mockFetchEq })

    const mockUpdateSingle = vi.fn().mockResolvedValue({ data: updatedArticle, error: null })
    const mockUpdateSelect = vi.fn().mockReturnValue({ single: mockUpdateSingle })
    const mockUpdateEq = vi.fn().mockReturnValue({ select: mockUpdateSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq })

    const mockMouvSingle = vi.fn().mockResolvedValue({ data: createdMouvement, error: null })
    const mockMouvSelect = vi.fn().mockReturnValue({ single: mockMouvSingle })
    const mockMouvInsert = vi.fn().mockReturnValue({ select: mockMouvSelect })

    let articleCallCount = 0
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'depot_articles') {
        articleCallCount++
        if (articleCallCount === 1) return { select: mockFetchSelect } as never
        return { update: mockUpdate } as never
      }
      return { insert: mockMouvInsert } as never
    })

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const cacheEntry: DepotArticleWithCump = {
      ...existingArticle,
      cump: 10,
    }
    queryClient.setQueryData(['depot-articles'], [cacheEntry])

    const { result } = renderHook(() => useCreateDepotEntree(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ articleId: 'art-1', quantite: 5, prixUnitaire: 11 })
    })

    // Optimistic: cache should show updated quantities immediately
    const cached = queryClient.getQueryData<DepotArticleWithCump[]>(['depot-articles'])
    expect(cached?.[0]?.quantite).toBe(15)
    expect(cached?.[0]?.valeur_totale).toBe(155)
  })
})
