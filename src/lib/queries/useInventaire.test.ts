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
import { useInventaire } from './useInventaire'

const mockInventaire = [
  {
    id: 'inv1',
    chantier_id: 'ch1',
    plot_id: 'p1',
    etage_id: 'e1',
    lot_id: 'lot1',
    designation: 'Colle faïence 20kg',
    quantite: 12,
    created_at: '2026-02-10T10:00:00Z',
    created_by: 'user-1',
    plots: { nom: 'Plot A' },
    etages: { nom: 'RDC' },
    lots: { code: '101' },
  },
  {
    id: 'inv2',
    chantier_id: 'ch1',
    plot_id: 'p1',
    etage_id: 'e2',
    lot_id: null,
    designation: 'Colle faïence 20kg',
    quantite: 8,
    created_at: '2026-02-10T11:00:00Z',
    created_by: 'user-1',
    plots: { nom: 'Plot A' },
    etages: { nom: 'É1' },
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

describe('useInventaire', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches inventaire for a chantier with plot and etage joins', async () => {
    const mockOrder2 = vi.fn().mockResolvedValue({ data: mockInventaire, error: null })
    const mockOrder1 = vi.fn().mockReturnValue({ order: mockOrder2 })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder1 })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useInventaire('ch1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.data).toEqual(mockInventaire))

    expect(supabase.from).toHaveBeenCalledWith('inventaire')
    expect(mockSelect).toHaveBeenCalledWith('*, plots(nom), etages(nom), lots(code)')
    expect(mockEq).toHaveBeenCalledWith('chantier_id', 'ch1')
    expect(mockOrder1).toHaveBeenCalledWith('designation', { ascending: true })
    expect(mockOrder2).toHaveBeenCalledWith('created_at', { ascending: false })
  })

  it('is disabled when chantierId is empty', () => {
    const { result } = renderHook(() => useInventaire(''), { wrapper: createWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
  })

  it('returns error on supabase failure', async () => {
    const mockOrder2 = vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') })
    const mockOrder = vi.fn().mockReturnValue({ order: mockOrder2 })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useInventaire('ch1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('DB error')
  })

  it('applies general scope filter (plot_id IS NULL, etage_id IS NULL)', async () => {
    const mockOrder2 = vi.fn().mockResolvedValue({ data: [], error: null })
    const mockOrder1 = vi.fn().mockReturnValue({ order: mockOrder2 })
    const mockIs2 = vi.fn().mockReturnValue({ order: mockOrder1 })
    const mockIs1 = vi.fn().mockReturnValue({ is: mockIs2 })
    const mockEq = vi.fn().mockReturnValue({ is: mockIs1 })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(
      () => useInventaire('ch1', { type: 'general' }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isFetching).toBe(false))

    expect(mockIs1).toHaveBeenCalledWith('plot_id', null)
    expect(mockIs2).toHaveBeenCalledWith('etage_id', null)
  })

  it('applies etage scope filter (eq etage_id)', async () => {
    const mockOrder2 = vi.fn().mockResolvedValue({ data: [], error: null })
    const mockOrder1 = vi.fn().mockReturnValue({ order: mockOrder2 })
    const mockEqEtage = vi.fn().mockReturnValue({ order: mockOrder1 })
    const mockEqChantier = vi.fn().mockReturnValue({ eq: mockEqEtage })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEqChantier })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(
      () => useInventaire('ch1', { type: 'etage', etageId: 'e1' }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isFetching).toBe(false))

    expect(mockEqChantier).toHaveBeenCalledWith('chantier_id', 'ch1')
    expect(mockEqEtage).toHaveBeenCalledWith('etage_id', 'e1')
  })
})
