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
import { useAllLivraisons } from './useAllLivraisons'

const mockLivraisons = [
  {
    id: 'liv1',
    chantier_id: 'ch1',
    description: 'Colle pour faïence 20kg',
    status: 'commande',
    date_prevue: null,
    bc_file_url: null,
    bc_file_name: null,
    bl_file_url: null,
    bl_file_name: null,
    created_at: '2026-02-10T10:00:00Z',
    created_by: 'user-1',
    chantiers: { nom: 'Résidence Les Oliviers' },
  },
  {
    id: 'liv2',
    chantier_id: 'ch2',
    description: 'Croisillons 3mm',
    status: 'prevu',
    date_prevue: '2026-02-15',
    bc_file_url: null,
    bc_file_name: null,
    bl_file_url: null,
    bl_file_name: null,
    created_at: '2026-02-09T10:00:00Z',
    created_by: 'user-2',
    chantiers: { nom: 'Rénovation Duval' },
  },
]

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useAllLivraisons', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches all livraisons with chantier nom, ordered by created_at DESC', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: mockLivraisons, error: null })
    const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useAllLivraisons(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('livraisons')
    expect(mockSelect).toHaveBeenCalledWith('*, chantiers(nom)')
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(result.current.data).toEqual(mockLivraisons)
  })

  it('includes chantiers.nom in each livraison', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: mockLivraisons, error: null })
    const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useAllLivraisons(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.[0].chantiers.nom).toBe('Résidence Les Oliviers')
    expect(result.current.data?.[1].chantiers.nom).toBe('Rénovation Duval')
  })

  it('returns error on supabase failure', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') })
    const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useAllLivraisons(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('DB error')
  })
})
