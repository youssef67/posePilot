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
    designation: 'Colle faïence 20kg',
    quantite: 12,
    created_at: '2026-02-10T10:00:00Z',
    created_by: 'user-1',
    plots: { nom: 'Plot A' },
    etages: { nom: 'RDC' },
  },
  {
    id: 'inv2',
    chantier_id: 'ch1',
    plot_id: 'p1',
    etage_id: 'e2',
    designation: 'Colle faïence 20kg',
    quantite: 8,
    created_at: '2026-02-10T11:00:00Z',
    created_by: 'user-1',
    plots: { nom: 'Plot A' },
    etages: { nom: 'É1' },
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

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('inventaire')
    expect(mockSelect).toHaveBeenCalledWith('*, plots(nom), etages(nom)')
    expect(mockEq).toHaveBeenCalledWith('chantier_id', 'ch1')
    expect(mockOrder1).toHaveBeenCalledWith('designation', { ascending: true })
    expect(mockOrder2).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(result.current.data).toEqual(mockInventaire)
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
})
