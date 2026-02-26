import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import type { DepotArticleWithCump } from '@/lib/queries/useDepotArticles'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
    },
  },
}))

import { supabase } from '@/lib/supabase'
import { useUpdateDepotArticleQuantite } from './useUpdateDepotArticleQuantite'

function createWrapper(queryClient?: QueryClient) {
  const qc = queryClient ?? new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children)
}

const baseArticle: DepotArticleWithCump = {
  id: 'art-1',
  designation: 'Sacs ciment',
  quantite: 10,
  valeur_totale: 100,
  unite: 'sac',
  created_at: '2026-02-25T10:00:00Z',
  created_by: 'user-1',
  cump: 10,
}

describe('useUpdateDepotArticleQuantite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: { id: 'user-1' } as never }, error: null })
  })

  it('increments quantity by 1 at current CUMP (AC #3)', async () => {
    const mockFetchSingle = vi.fn().mockResolvedValue({
      data: { id: 'art-1', quantite: 10, valeur_totale: 100 },
      error: null,
    })
    const mockFetchEq = vi.fn().mockReturnValue({ single: mockFetchSingle })
    const mockFetchSelect = vi.fn().mockReturnValue({ eq: mockFetchEq })

    const mockUpdateSingle = vi.fn().mockResolvedValue({
      data: { id: 'art-1', quantite: 11, valeur_totale: 110 },
      error: null,
    })
    const mockUpdateSelect = vi.fn().mockReturnValue({ single: mockUpdateSingle })
    const mockUpdateEq = vi.fn().mockReturnValue({ select: mockUpdateSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq })

    const mockMouvSingle = vi.fn().mockResolvedValue({ data: { id: 'mouv-1' }, error: null })
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

    const { result } = renderHook(() => useUpdateDepotArticleQuantite(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ articleId: 'art-1', delta: 1 })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // CUMP = 100/10 = 10, new quantite = 11, new valeur = 110
    expect(mockUpdate).toHaveBeenCalledWith({ quantite: 11, valeur_totale: 110 })
    expect(mockMouvInsert).toHaveBeenCalledWith(expect.objectContaining({
      article_id: 'art-1',
      type: 'entree',
      quantite: 1,
      prix_unitaire: 10,
      montant_total: 10,
    }))
  })

  it('decrements quantity by 1 at current CUMP (AC #4)', async () => {
    const mockFetchSingle = vi.fn().mockResolvedValue({
      data: { id: 'art-1', quantite: 10, valeur_totale: 100 },
      error: null,
    })
    const mockFetchEq = vi.fn().mockReturnValue({ single: mockFetchSingle })
    const mockFetchSelect = vi.fn().mockReturnValue({ eq: mockFetchEq })

    const mockUpdateSingle = vi.fn().mockResolvedValue({
      data: { id: 'art-1', quantite: 9, valeur_totale: 90 },
      error: null,
    })
    const mockUpdateSelect = vi.fn().mockReturnValue({ single: mockUpdateSingle })
    const mockUpdateEq = vi.fn().mockReturnValue({ select: mockUpdateSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq })

    const mockMouvSingle = vi.fn().mockResolvedValue({ data: { id: 'mouv-2' }, error: null })
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

    const { result } = renderHook(() => useUpdateDepotArticleQuantite(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ articleId: 'art-1', delta: -1 })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // CUMP = 100/10 = 10, new quantite = 9, new valeur = 90
    expect(mockUpdate).toHaveBeenCalledWith({ quantite: 9, valeur_totale: 90 })
    expect(mockMouvInsert).toHaveBeenCalledWith(expect.objectContaining({
      article_id: 'art-1',
      type: 'sortie',
      quantite: 1,
      prix_unitaire: 10,
      montant_total: 10,
    }))
  })

  it('applies optimistic update on cache', async () => {
    const mockFetchSingle = vi.fn().mockResolvedValue({
      data: { id: 'art-1', quantite: 10, valeur_totale: 100 },
      error: null,
    })
    const mockFetchEq = vi.fn().mockReturnValue({ single: mockFetchSingle })
    const mockFetchSelect = vi.fn().mockReturnValue({ eq: mockFetchEq })

    const mockUpdateSingle = vi.fn().mockResolvedValue({
      data: { id: 'art-1', quantite: 11, valeur_totale: 110 },
      error: null,
    })
    const mockUpdateSelect = vi.fn().mockReturnValue({ single: mockUpdateSingle })
    const mockUpdateEq = vi.fn().mockReturnValue({ select: mockUpdateSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq })

    const mockMouvSingle = vi.fn().mockResolvedValue({ data: { id: 'mouv-1' }, error: null })
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
    queryClient.setQueryData(['depot-articles'], [baseArticle])

    const { result } = renderHook(() => useUpdateDepotArticleQuantite(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ articleId: 'art-1', delta: 1 })
    })

    // Optimistic: cache should be updated immediately
    const cached = queryClient.getQueryData<DepotArticleWithCump[]>(['depot-articles'])
    expect(cached?.[0]?.quantite).toBe(11)
    expect(cached?.[0]?.valeur_totale).toBe(110)
  })

  it('returns error on supabase failure', async () => {
    const mockFetchSingle = vi.fn().mockResolvedValue({
      data: null,
      error: new Error('Fetch failed'),
    })
    const mockFetchEq = vi.fn().mockReturnValue({ single: mockFetchSingle })
    const mockFetchSelect = vi.fn().mockReturnValue({ eq: mockFetchEq })

    vi.mocked(supabase.from).mockReturnValue({ select: mockFetchSelect } as never)

    const { result } = renderHook(() => useUpdateDepotArticleQuantite(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ articleId: 'art-1', delta: 1 })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Fetch failed')
  })
})
