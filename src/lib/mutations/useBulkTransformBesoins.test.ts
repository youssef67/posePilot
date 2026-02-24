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
import { useBulkTransformBesoins } from './useBulkTransformBesoins'
import type { BesoinWithChantier } from '@/lib/queries/useAllPendingBesoins'

const mockBesoins: BesoinWithChantier[] = [
  {
    id: 'b1',
    chantier_id: 'ch1',
    description: 'Colle pour faïence 20kg',
    livraison_id: null,
    created_at: '2026-02-10T10:00:00Z',
    created_by: 'user-1',
    chantiers: { nom: 'Résidence Les Oliviers' },
  },
  {
    id: 'b2',
    chantier_id: 'ch2',
    description: 'Joint gris 5kg',
    livraison_id: null,
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

function setupMocks(opts?: { besoinUpdateError?: Error }) {
  const livraison = { id: 'liv-1', chantier_id: null, description: 'Commande groupée' }

  const mockIs = vi.fn().mockResolvedValue({ error: opts?.besoinUpdateError ?? null })
  const mockEq = vi.fn().mockReturnValue({ is: mockIs })
  const mockBesoinUpdate = vi.fn().mockReturnValue({ eq: mockEq })

  let callCount = 0
  vi.mocked(supabase.from).mockImplementation((table: string) => {
    if (table === 'livraisons' && callCount === 0) {
      callCount++
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: livraison, error: null }),
          }),
        }),
      } as never
    }
    return { update: mockBesoinUpdate } as never
  })

  return { mockBesoinUpdate, mockEq, mockIs }
}

describe('useBulkTransformBesoins', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: { id: 'user-1' } } } as never)
  })

  it('creates one livraison and links all besoins individually', async () => {
    const { mockBesoinUpdate, mockEq } = setupMocks()

    const { result } = renderHook(() => useBulkTransformBesoins(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ besoins: mockBesoins, description: 'Commande groupée' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(expect.objectContaining({ id: 'liv-1' }))
    // Each besoin updated individually
    expect(mockBesoinUpdate).toHaveBeenCalledTimes(2)
    expect(mockBesoinUpdate).toHaveBeenCalledWith({ livraison_id: 'liv-1' })
    expect(mockEq).toHaveBeenCalledWith('id', 'b1')
    expect(mockEq).toHaveBeenCalledWith('id', 'b2')
  })

  it('includes montant_unitaire in update when besoinMontants provided', async () => {
    const { mockBesoinUpdate, mockEq } = setupMocks()

    const { result } = renderHook(() => useBulkTransformBesoins(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({
        besoins: mockBesoins,
        description: 'Commande',
        besoinMontants: [
          { besoinId: 'b1', montantUnitaire: 10, quantite: 2 },
          { besoinId: 'b2', montantUnitaire: 5, quantite: 3 },
        ],
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockBesoinUpdate).toHaveBeenCalledWith({ livraison_id: 'liv-1', montant_unitaire: 10 })
    expect(mockBesoinUpdate).toHaveBeenCalledWith({ livraison_id: 'liv-1', montant_unitaire: 5 })
    expect(mockEq).toHaveBeenCalledWith('id', 'b1')
    expect(mockEq).toHaveBeenCalledWith('id', 'b2')
  })

  it('throws on livraison insert error', async () => {
    vi.mocked(supabase.from).mockImplementation(() => {
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: new Error('Insert failed') }),
          }),
        }),
      } as never
    })

    const { result } = renderHook(() => useBulkTransformBesoins(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ besoins: [mockBesoins[0]], description: 'Test' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Insert failed')
  })

  it('computes chantier_id as null for multi-chantier besoins', async () => {
    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: 'liv-1', chantier_id: null }, error: null }),
      }),
    })

    const mockIs = vi.fn().mockResolvedValue({ error: null })
    const mockEq = vi.fn().mockReturnValue({ is: mockIs })
    const mockBesoinUpdate = vi.fn().mockReturnValue({ eq: mockEq })

    let callCount = 0
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'livraisons' && callCount === 0) {
        callCount++
        return { insert: mockInsert } as never
      }
      return { update: mockBesoinUpdate } as never
    })

    const { result } = renderHook(() => useBulkTransformBesoins(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ besoins: mockBesoins, description: 'Multi-chantier' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ chantier_id: null }),
    )
  })

  it('throws on besoin update error', async () => {
    setupMocks({ besoinUpdateError: new Error('Update failed') })

    const { result } = renderHook(() => useBulkTransformBesoins(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ besoins: [mockBesoins[0]], description: 'Test' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Update failed')
  })
})
