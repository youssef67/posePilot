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
import { useCreateBesoins } from './useCreateBesoins'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useCreateBesoins', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: { id: 'user-1' } as never }, error: null })
  })

  it('batch inserts multiple besoins', async () => {
    const created = [
      { id: 'b1', chantier_id: 'ch1', description: 'Colle', quantite: 2, livraison_id: null, montant_unitaire: null, created_at: '2026-02-24T10:00:00Z', created_by: 'user-1' },
      { id: 'b2', chantier_id: 'ch2', description: 'Mortier', quantite: 5, livraison_id: null, montant_unitaire: null, created_at: '2026-02-24T10:00:00Z', created_by: 'user-1' },
    ]
    const mockSelect = vi.fn().mockResolvedValue({ data: created, error: null })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never)

    const { result } = renderHook(() => useCreateBesoins(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate([
        { chantier_id: 'ch1', description: 'Colle', quantite: 2 },
        { chantier_id: 'ch2', description: 'Mortier', quantite: 5 },
      ])
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('besoins')
    expect(mockInsert).toHaveBeenCalledWith([
      { chantier_id: 'ch1', description: 'Colle', quantite: 2, created_by: 'user-1' },
      { chantier_id: 'ch2', description: 'Mortier', quantite: 5, created_by: 'user-1' },
    ])
    expect(result.current.data).toEqual(created)
  })

  it('returns error on supabase failure', async () => {
    const mockSelect = vi.fn().mockResolvedValue({ data: null, error: new Error('Insert failed') })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never)

    const { result } = renderHook(() => useCreateBesoins(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate([
        { chantier_id: 'ch1', description: 'Test', quantite: 1 },
      ])
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Insert failed')
  })

  it('invalidates besoins and all-pending caches on settled', async () => {
    const mockSelect = vi.fn().mockResolvedValue({ data: [], error: null })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never)

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useCreateBesoins(), { wrapper })

    await act(async () => {
      result.current.mutate([{ chantier_id: 'ch1', description: 'Test', quantite: 1 }])
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const invalidatedKeys = invalidateSpy.mock.calls.map((c) => (c[0] as { queryKey: string[] }).queryKey)
    expect(invalidatedKeys).toContainEqual(['besoins'])
    expect(invalidatedKeys).toContainEqual(['all-pending-besoins'])
    expect(invalidatedKeys).toContainEqual(['all-pending-besoins-count'])
  })
})
