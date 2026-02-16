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
import { useCreateGroupedLivraison } from './useCreateGroupedLivraison'

const mockBesoins = [
  { id: 'b1', chantier_id: 'ch1', description: 'Colle faience 20kg', livraison_id: null, created_at: '2026-02-10T10:00:00Z', created_by: 'user-1' },
  { id: 'b2', chantier_id: 'ch1', description: 'Joint gris 5kg', livraison_id: null, created_at: '2026-02-10T11:00:00Z', created_by: 'user-1' },
  { id: 'b3', chantier_id: 'ch1', description: 'Carrelage 60x60', livraison_id: null, created_at: '2026-02-10T12:00:00Z', created_by: 'user-1' },
]

const mockLivraison = {
  id: 'liv1',
  chantier_id: 'ch1',
  description: 'Commande carrelage T2',
  status: 'commande' as const,
  fournisseur: null,
  date_prevue: null,
  bc_file_url: null,
  bc_file_name: null,
  bl_file_url: null,
  bl_file_name: null,
  created_at: '2026-02-10T13:00:00Z',
  created_by: 'user-1',
}

function setupMocks(livraisonOverrides?: Partial<typeof mockLivraison>, besoinsError?: Error | null) {
  const livraisonData = { ...mockLivraison, ...livraisonOverrides }
  const mockSingle = vi.fn().mockResolvedValue({ data: livraisonData, error: null })
  const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
  const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })

  const mockIs = vi.fn().mockResolvedValue({ error: besoinsError ?? null })
  const mockIn = vi.fn().mockReturnValue({ is: mockIs })
  const mockUpdate = vi.fn().mockReturnValue({ in: mockIn })

  let callCount = 0
  vi.mocked(supabase.from).mockImplementation((table: string) => {
    if (table === 'livraisons' && callCount === 0) {
      callCount++
      return { insert: mockInsert } as never
    }
    return { update: mockUpdate } as never
  })

  return { mockInsert, mockUpdate, mockIn, mockIs }
}

function createWrapper(queryClient?: QueryClient) {
  const qc = queryClient ?? new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children)
}

describe('useCreateGroupedLivraison', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: { id: 'user-1' } as never }, error: null })
  })

  it('creates livraison and batch-updates besoins', async () => {
    const { mockInsert, mockUpdate, mockIn, mockIs } = setupMocks()
    const { result } = renderHook(() => useCreateGroupedLivraison(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({
        chantierId: 'ch1',
        besoinIds: ['b1', 'b2'],
        description: 'Commande carrelage T2',
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockInsert).toHaveBeenCalledWith({
      chantier_id: 'ch1',
      description: 'Commande carrelage T2',
      fournisseur: null,
      status: 'commande',
      created_by: 'user-1',
    })
    expect(mockUpdate).toHaveBeenCalledWith({ livraison_id: 'liv1' })
    expect(mockIn).toHaveBeenCalledWith('id', ['b1', 'b2'])
    expect(mockIs).toHaveBeenCalledWith('livraison_id', null)
    expect(result.current.data).toEqual(expect.objectContaining({ id: 'liv1' }))
  })

  it('passes fournisseur when provided', async () => {
    const { mockInsert } = setupMocks({ fournisseur: 'Point P' })
    const { result } = renderHook(() => useCreateGroupedLivraison(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({
        chantierId: 'ch1',
        besoinIds: ['b1'],
        description: 'Commande Point P',
        fournisseur: 'Point P',
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ fournisseur: 'Point P' }),
    )
  })

  it('returns error and rolls back optimistic update on failure', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: new Error('Insert failed') })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never)

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    queryClient.setQueryData(['besoins', 'ch1'], [...mockBesoins])

    const { result } = renderHook(() => useCreateGroupedLivraison(), { wrapper: createWrapper(queryClient) })

    await act(async () => {
      result.current.mutate({
        chantierId: 'ch1',
        besoinIds: ['b1', 'b2'],
        description: 'Commande erreur',
      })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Insert failed')
    // Rollback: besoins cache restored
    const besoinsCache = queryClient.getQueryData(['besoins', 'ch1']) as typeof mockBesoins
    expect(besoinsCache).toHaveLength(3)
  })

  it('invalidates all required query keys on settled', async () => {
    setupMocks()
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useCreateGroupedLivraison(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        createElement(QueryClientProvider, { client: queryClient }, children),
    })

    await act(async () => {
      result.current.mutate({
        chantierId: 'ch1',
        besoinIds: ['b1'],
        description: 'Commande test',
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const invalidatedKeys = invalidateSpy.mock.calls.map((c) => (c[0] as { queryKey: string[] }).queryKey)
    expect(invalidatedKeys).toContainEqual(['besoins', 'ch1'])
    expect(invalidatedKeys).toContainEqual(['livraisons', 'ch1'])
    expect(invalidatedKeys).toContainEqual(['livraisons-count', 'ch1'])
    expect(invalidatedKeys).toContainEqual(['all-pending-besoins-count'])
    expect(invalidatedKeys).toContainEqual(['all-livraisons'])
    expect(invalidatedKeys).toContainEqual(['all-besoins', 'ch1'])
    expect(invalidatedKeys).toContainEqual(['all-linked-besoins'])
  })
})
