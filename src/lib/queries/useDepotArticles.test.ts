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
import { useDepotArticles } from './useDepotArticles'

const mockArticles = [
  {
    id: 'a1',
    designation: 'Carrelage 30x30',
    quantite: 20,
    valeur_totale: 200,
    unite: 'm²',
    created_at: '2026-02-20T10:00:00Z',
    created_by: 'user-1',
  },
  {
    id: 'a2',
    designation: 'Sac de colle Mapei',
    quantite: 0,
    valeur_totale: 0,
    unite: 'sac',
    created_at: '2026-02-20T11:00:00Z',
    created_by: 'user-1',
  },
]

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useDepotArticles', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches all depot articles sorted by designation with CUMP calculated', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: mockArticles, error: null })
    const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useDepotArticles(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.data).toHaveLength(2))

    expect(supabase.from).toHaveBeenCalledWith('depot_articles')
    expect(mockSelect).toHaveBeenCalledWith('*')
    expect(mockOrder).toHaveBeenCalledWith('designation', { ascending: true })
    expect(result.current.data![0].cump).toBe(10) // 200/20
    expect(result.current.data![1].cump).toBeNull() // quantite=0
  })

  it('returns CUMP null when quantite is 0', async () => {
    const zeroArticle = [{ ...mockArticles[1] }]
    const mockOrder = vi.fn().mockResolvedValue({ data: zeroArticle, error: null })
    const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useDepotArticles(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.data).toHaveLength(1))

    expect(result.current.data![0].cump).toBeNull()
  })

  it('returns error on supabase failure', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') })
    const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useDepotArticles(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('DB error')
  })
})
