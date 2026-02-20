import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
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
import { useMergeLivraisons } from './useMergeLivraisons'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

const parentLivraison = {
  id: 'parent-1',
  chantier_id: 'ch1',
  description: 'Commande groupée',
  status: 'commande',
  parent_id: null,
  retrait: false,
  fournisseur: null,
  date_prevue: null,
  bc_file_url: null,
  bc_file_name: null,
  bl_file_url: null,
  bl_file_name: null,
  status_history: [{ status: 'commande', date: '2026-02-19T10:00:00Z' }],
  created_at: '2026-02-19T10:00:00Z',
  created_by: 'user-1',
}

describe('useMergeLivraisons', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: { id: 'user-1' } } } as never)
  })

  it('creates parent livraison and attaches children', async () => {
    const mockIn = vi.fn().mockResolvedValue({ error: null })
    const mockUpdate = vi.fn().mockReturnValue({ in: mockIn })

    const mockSingle = vi.fn().mockResolvedValue({ data: parentLivraison, error: null })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'livraisons') {
        // First call = insert, second call = update
        const callCount = vi.mocked(supabase.from).mock.calls.filter((c) => c[0] === 'livraisons').length
        if (callCount === 1) {
          return { insert: mockInsert } as never
        }
        return { update: mockUpdate } as never
      }
      return {} as never
    })

    const { result } = renderHook(() => useMergeLivraisons(), { wrapper: createWrapper() })

    result.current.mutate({
      childIds: ['child-1', 'child-2'],
      chantierId: 'ch1',
      description: 'Commande groupée',
      newStatus: 'commande',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        chantier_id: 'ch1',
        description: 'Commande groupée',
        status: 'commande',
        date_prevue: null,
        created_by: 'user-1',
      }),
    )
    expect(mockUpdate).toHaveBeenCalledWith({ parent_id: 'parent-1' })
    expect(mockIn).toHaveBeenCalledWith('id', ['child-1', 'child-2'])
  })

  it('passes date_prevue when provided', async () => {
    const mockIn = vi.fn().mockResolvedValue({ error: null })
    const mockUpdate = vi.fn().mockReturnValue({ in: mockIn })

    const mockSingle = vi.fn().mockResolvedValue({ data: { ...parentLivraison, date_prevue: '2026-03-01' }, error: null })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'livraisons') {
        const callCount = vi.mocked(supabase.from).mock.calls.filter((c) => c[0] === 'livraisons').length
        if (callCount === 1) {
          return { insert: mockInsert } as never
        }
        return { update: mockUpdate } as never
      }
      return {} as never
    })

    const { result } = renderHook(() => useMergeLivraisons(), { wrapper: createWrapper() })

    result.current.mutate({
      childIds: ['child-1'],
      chantierId: 'ch1',
      description: 'Livraison prévue groupée',
      newStatus: 'livraison_prevue',
      datePrevue: '2026-03-01',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        date_prevue: '2026-03-01',
        status: 'livraison_prevue',
      }),
    )
  })

  it('throws on insert error', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: new Error('Insert failed') })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })

    vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never)

    const { result } = renderHook(() => useMergeLivraisons(), { wrapper: createWrapper() })

    result.current.mutate({
      childIds: ['child-1'],
      chantierId: 'ch1',
      description: 'Test',
      newStatus: 'commande',
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Insert failed')
  })

  it('throws on update error', async () => {
    const mockIn = vi.fn().mockResolvedValue({ error: new Error('Update failed') })
    const mockUpdate = vi.fn().mockReturnValue({ in: mockIn })

    const mockSingle = vi.fn().mockResolvedValue({ data: parentLivraison, error: null })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'livraisons') {
        const callCount = vi.mocked(supabase.from).mock.calls.filter((c) => c[0] === 'livraisons').length
        if (callCount === 1) {
          return { insert: mockInsert } as never
        }
        return { update: mockUpdate } as never
      }
      return {} as never
    })

    const { result } = renderHook(() => useMergeLivraisons(), { wrapper: createWrapper() })

    result.current.mutate({
      childIds: ['child-1'],
      chantierId: 'ch1',
      description: 'Test',
      newStatus: 'commande',
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Update failed')
  })
})
