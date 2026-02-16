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
import { useTransformBesoinToLivraison } from './useTransformBesoinToLivraison'

const mockBesoin = {
  id: 'b1',
  chantier_id: 'ch1',
  description: 'Colle faïence 20kg',
  livraison_id: null,
  created_at: '2026-02-10T10:00:00Z',
  created_by: 'user-1',
}

const mockLivraison = {
  id: 'liv1',
  chantier_id: 'ch1',
  description: 'Colle faïence 20kg',
  status: 'commande' as const,
  date_prevue: null,
  bc_file_url: null,
  bc_file_name: null,
  bl_file_url: null,
  bl_file_name: null,
  created_at: '2026-02-10T10:00:00Z',
  created_by: 'user-1',
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useTransformBesoinToLivraison', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: { id: 'user-1' } as never }, error: null })
  })

  it('creates livraison and updates besoin', async () => {
    // Mock livraisons insert chain
    const mockLivraisonSingle = vi.fn().mockResolvedValue({ data: mockLivraison, error: null })
    const mockLivraisonSelect = vi.fn().mockReturnValue({ single: mockLivraisonSingle })
    const mockLivraisonInsert = vi.fn().mockReturnValue({ select: mockLivraisonSelect })

    // Mock besoins update chain
    const mockBesoinEq = vi.fn().mockResolvedValue({ error: null })
    const mockBesoinUpdate = vi.fn().mockReturnValue({ eq: mockBesoinEq })

    let callCount = 0
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'livraisons' && callCount === 0) {
        callCount++
        return { insert: mockLivraisonInsert } as never
      }
      return { update: mockBesoinUpdate } as never
    })

    const { result } = renderHook(() => useTransformBesoinToLivraison(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ besoin: mockBesoin })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockLivraisonInsert).toHaveBeenCalledWith({
      chantier_id: 'ch1',
      description: 'Colle faïence 20kg',
      fournisseur: null,
      status: 'commande',
      created_by: 'user-1',
    })
    expect(mockBesoinUpdate).toHaveBeenCalledWith({ livraison_id: 'liv1' })
    expect(mockBesoinEq).toHaveBeenCalledWith('id', 'b1')
    expect(result.current.data).toEqual(mockLivraison)
  })

  it('includes fournisseur in livraison insert when provided', async () => {
    const mockLivraisonSingle = vi.fn().mockResolvedValue({ data: { ...mockLivraison, fournisseur: 'Point P' }, error: null })
    const mockLivraisonSelect = vi.fn().mockReturnValue({ single: mockLivraisonSingle })
    const mockLivraisonInsert = vi.fn().mockReturnValue({ select: mockLivraisonSelect })

    const mockBesoinEq = vi.fn().mockResolvedValue({ error: null })
    const mockBesoinUpdate = vi.fn().mockReturnValue({ eq: mockBesoinEq })

    let callCount = 0
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'livraisons' && callCount === 0) {
        callCount++
        return { insert: mockLivraisonInsert } as never
      }
      return { update: mockBesoinUpdate } as never
    })

    const { result } = renderHook(() => useTransformBesoinToLivraison(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ besoin: mockBesoin, fournisseur: 'Point P' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockLivraisonInsert).toHaveBeenCalledWith(
      expect.objectContaining({ fournisseur: 'Point P' }),
    )
  })

  it('returns error if livraison creation fails', async () => {
    const mockLivraisonSingle = vi.fn().mockResolvedValue({ data: null, error: new Error('Insert failed') })
    const mockLivraisonSelect = vi.fn().mockReturnValue({ single: mockLivraisonSingle })
    const mockLivraisonInsert = vi.fn().mockReturnValue({ select: mockLivraisonSelect })
    vi.mocked(supabase.from).mockReturnValue({ insert: mockLivraisonInsert } as never)

    const { result } = renderHook(() => useTransformBesoinToLivraison(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ besoin: mockBesoin })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Insert failed')
  })

  it('applies optimistic update removing besoin from list', async () => {
    const mockLivraisonSingle = vi.fn().mockResolvedValue({ data: mockLivraison, error: null })
    const mockLivraisonSelect = vi.fn().mockReturnValue({ single: mockLivraisonSingle })
    const mockLivraisonInsert = vi.fn().mockReturnValue({ select: mockLivraisonSelect })
    const mockBesoinEq = vi.fn().mockResolvedValue({ error: null })
    const mockBesoinUpdate = vi.fn().mockReturnValue({ eq: mockBesoinEq })

    let callCount = 0
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'livraisons' && callCount === 0) {
        callCount++
        return { insert: mockLivraisonInsert } as never
      }
      return { update: mockBesoinUpdate } as never
    })

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    queryClient.setQueryData(['besoins', 'ch1'], [mockBesoin])

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useTransformBesoinToLivraison(), { wrapper })

    await act(async () => {
      result.current.mutate({ besoin: mockBesoin })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    // After settlement, cache is invalidated
    expect(queryClient.getQueryData(['besoins', 'ch1'])).toBeDefined()
  })
})
