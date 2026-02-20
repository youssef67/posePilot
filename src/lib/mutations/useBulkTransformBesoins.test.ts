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

describe('useBulkTransformBesoins', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: { id: 'user-1' } } } as never)
  })

  it('creates one livraison per besoin and links them', async () => {
    const livraison1 = { id: 'liv-1', chantier_id: 'ch1', description: 'Colle pour faïence 20kg' }
    const livraison2 = { id: 'liv-2', chantier_id: 'ch2', description: 'Joint gris 5kg' }

    const mockEqBesoin = vi.fn().mockResolvedValue({ error: null })
    const mockUpdateBesoin = vi.fn().mockReturnValue({ eq: mockEqBesoin })

    let insertCall = 0
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'livraisons') {
        const currentLivraison = insertCall === 0 ? livraison1 : livraison2
        insertCall++
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: currentLivraison, error: null }),
            }),
          }),
        } as never
      }
      if (table === 'besoins') {
        return { update: mockUpdateBesoin } as never
      }
      return {} as never
    })

    const { result } = renderHook(() => useBulkTransformBesoins(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ besoins: mockBesoins })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.succeeded).toHaveLength(2)
    expect(result.current.data?.failedCount).toBe(0)
    expect(mockUpdateBesoin).toHaveBeenCalledWith({ livraison_id: 'liv-1' })
    expect(mockUpdateBesoin).toHaveBeenCalledWith({ livraison_id: 'liv-2' })
    expect(mockEqBesoin).toHaveBeenCalledWith('id', 'b1')
    expect(mockEqBesoin).toHaveBeenCalledWith('id', 'b2')
  })

  it('throws on livraison insert error', async () => {
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'livraisons') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: new Error('Insert failed') }),
            }),
          }),
        } as never
      }
      return {} as never
    })

    const { result } = renderHook(() => useBulkTransformBesoins(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ besoins: [mockBesoins[0]] })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toMatch(/Échec de la transformation/)
  })

  it('returns partial success when some besoins fail', async () => {
    const livraison1 = { id: 'liv-1', chantier_id: 'ch1', description: 'Colle pour faïence 20kg' }

    let insertCall = 0
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'livraisons') {
        insertCall++
        if (insertCall === 1) {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: livraison1, error: null }),
              }),
            }),
          } as never
        }
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: new Error('Insert failed') }),
            }),
          }),
        } as never
      }
      if (table === 'besoins') {
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        } as never
      }
      return {} as never
    })

    const { result } = renderHook(() => useBulkTransformBesoins(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ besoins: mockBesoins })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.succeeded).toHaveLength(1)
    expect(result.current.data?.failedCount).toBe(1)
  })

  it('throws on besoin update error', async () => {
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'livraisons') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: 'liv-1' }, error: null }),
            }),
          }),
        } as never
      }
      if (table === 'besoins') {
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: new Error('Update failed') }),
          }),
        } as never
      }
      return {} as never
    })

    const { result } = renderHook(() => useBulkTransformBesoins(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ besoins: [mockBesoins[0]] })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toMatch(/Échec de la transformation/)
  })
})
