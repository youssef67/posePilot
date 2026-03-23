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
import { useSearchInventaire } from './useSearchInventaire'

const mockResults = [
  {
    id: 'inv1',
    chantier_id: 'ch1',
    plot_id: 'p1',
    etage_id: 'e1',
    lot_id: null,
    designation: 'Tubes PER 16mm',
    quantite: 20,
    source: null,
    created_at: '2026-03-10T10:00:00Z',
    created_by: 'user-1',
    plots: { nom: 'Bât. A' },
    etages: { nom: 'RDC' },
    lots: null,
  },
  {
    id: 'inv2',
    chantier_id: 'ch1',
    plot_id: null,
    etage_id: null,
    lot_id: null,
    designation: 'Tubes PER 20mm',
    quantite: 15,
    source: null,
    created_at: '2026-03-10T11:00:00Z',
    created_by: 'user-1',
    plots: null,
    etages: null,
    lots: null,
  },
]

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useSearchInventaire', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('is disabled when search term has fewer than 2 characters', () => {
    const { result } = renderHook(
      () => useSearchInventaire('ch1', 'a'),
      { wrapper: createWrapper() },
    )

    expect(result.current.fetchStatus).toBe('idle')
  })

  it('is disabled when search term is empty', () => {
    const { result } = renderHook(
      () => useSearchInventaire('ch1', ''),
      { wrapper: createWrapper() },
    )

    expect(result.current.fetchStatus).toBe('idle')
  })

  it('is disabled when search term is only spaces', () => {
    const { result } = renderHook(
      () => useSearchInventaire('ch1', '   '),
      { wrapper: createWrapper() },
    )

    expect(result.current.fetchStatus).toBe('idle')
  })

  it('queries with ilike when search term >= 2 characters', async () => {
    const mockOrder2 = vi.fn().mockResolvedValue({ data: mockResults, error: null })
    const mockOrder1 = vi.fn().mockReturnValue({ order: mockOrder2 })
    const mockIlike = vi.fn().mockReturnValue({ order: mockOrder1 })
    const mockEq = vi.fn().mockReturnValue({ ilike: mockIlike })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(
      () => useSearchInventaire('ch1', 'tube'),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.data).toEqual(mockResults))

    expect(supabase.from).toHaveBeenCalledWith('inventaire')
    expect(mockSelect).toHaveBeenCalledWith('*, plots(nom), etages(nom), lots(code)')
    expect(mockEq).toHaveBeenCalledWith('chantier_id', 'ch1')
    expect(mockIlike).toHaveBeenCalledWith('designation', '%tube%')
    expect(mockOrder1).toHaveBeenCalledWith('designation', { ascending: true })
    expect(mockOrder2).toHaveBeenCalledWith('created_at', { ascending: false })
  })

  it('escapes LIKE wildcards % and _ in search term', async () => {
    const mockOrder2 = vi.fn().mockResolvedValue({ data: [], error: null })
    const mockOrder1 = vi.fn().mockReturnValue({ order: mockOrder2 })
    const mockIlike = vi.fn().mockReturnValue({ order: mockOrder1 })
    const mockEq = vi.fn().mockReturnValue({ ilike: mockIlike })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(
      () => useSearchInventaire('ch1', '50%_ok'),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.fetchStatus).not.toBe('idle'))

    expect(mockIlike).toHaveBeenCalledWith('designation', '%50\\%\\_ok%')
  })

  it('returns InventaireWithLocation[]', async () => {
    const mockOrder2 = vi.fn().mockResolvedValue({ data: mockResults, error: null })
    const mockOrder1 = vi.fn().mockReturnValue({ order: mockOrder2 })
    const mockIlike = vi.fn().mockReturnValue({ order: mockOrder1 })
    const mockEq = vi.fn().mockReturnValue({ ilike: mockIlike })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(
      () => useSearchInventaire('ch1', 'tube'),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.data).toHaveLength(2))

    expect(result.current.data![0].plots).toEqual({ nom: 'Bât. A' })
    expect(result.current.data![1].plots).toBeNull()
  })
})
