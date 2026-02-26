import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import type { DepotArticleWithCump } from '@/lib/queries/useDepotArticles'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

import { supabase } from '@/lib/supabase'
import { useDeleteDepotArticle } from './useDeleteDepotArticle'

function createWrapper(queryClient?: QueryClient) {
  const qc = queryClient ?? new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children)
}

const baseArticle: DepotArticleWithCump = {
  id: 'art-1',
  designation: 'Sacs ciment',
  quantite: 1,
  valeur_totale: 10,
  unite: 'sac',
  created_at: '2026-02-25T10:00:00Z',
  created_by: 'user-1',
  cump: 10,
}

describe('useDeleteDepotArticle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes depot article by id (AC #6)', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never)

    const { result } = renderHook(() => useDeleteDepotArticle(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ id: 'art-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('depot_articles')
    expect(mockDelete).toHaveBeenCalled()
    expect(mockEq).toHaveBeenCalledWith('id', 'art-1')
  })

  it('applies optimistic remove from cache', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never)

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    queryClient.setQueryData(['depot-articles'], [baseArticle])

    const { result } = renderHook(() => useDeleteDepotArticle(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ id: 'art-1' })
    })

    // Optimistic: article should be removed from cache immediately
    const cached = queryClient.getQueryData<DepotArticleWithCump[]>(['depot-articles'])
    expect(cached).toEqual([])
  })

  it('returns error on supabase failure', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: new Error('Delete failed') })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never)

    const { result } = renderHook(() => useDeleteDepotArticle(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ id: 'art-1' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Delete failed')
  })
})
