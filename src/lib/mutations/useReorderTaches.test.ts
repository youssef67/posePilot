import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}))

import { supabase } from '@/lib/supabase'
import { useReorderTaches } from './useReorderTaches'

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
}

function createWrapper(queryClient?: QueryClient) {
  const qc = queryClient ?? createQueryClient()
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children)
}

const mockPieces = [
  {
    id: 'piece-1',
    lot_id: 'lot-1',
    nom: 'Séjour',
    created_at: '2026-01-01T00:00:00Z',
    progress_done: 0,
    progress_total: 3,
    metrage_m2: null,
    metrage_ml: null,
    taches: [
      { id: 'tache-1', piece_id: 'piece-1', nom: 'Ragréage', status: 'not_started', position: 0, created_at: '2026-01-01T00:00:00Z' },
      { id: 'tache-2', piece_id: 'piece-1', nom: 'Pose', status: 'done', position: 1, created_at: '2026-01-01T00:00:00Z' },
      { id: 'tache-3', piece_id: 'piece-1', nom: 'Joints', status: 'not_started', position: 2, created_at: '2026-01-01T00:00:00Z' },
    ],
  },
  {
    id: 'piece-2',
    lot_id: 'lot-1',
    nom: 'Chambre',
    created_at: '2026-01-02T00:00:00Z',
    progress_done: 0,
    progress_total: 0,
    metrage_m2: null,
    metrage_ml: null,
    taches: [],
  },
]

describe('useReorderTaches', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls supabase.rpc with correct params', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: undefined, error: null } as never)

    const { result } = renderHook(() => useReorderTaches(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ tacheIds: ['tache-3', 'tache-1', 'tache-2'], lotId: 'lot-1', pieceId: 'piece-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.rpc).toHaveBeenCalledWith('reorder_taches', {
      p_tache_ids: ['tache-3', 'tache-1', 'tache-2'],
    })
  })

  it('optimistically reorders taches in cache', async () => {
    const queryClient = createQueryClient()
    queryClient.setQueryData(['pieces', 'lot-1'], structuredClone(mockPieces))

    // Never-resolving to keep pending
    vi.mocked(supabase.rpc).mockReturnValue(new Promise(() => {}) as never)

    const { result } = renderHook(() => useReorderTaches(), { wrapper: createWrapper(queryClient) })

    await act(async () => {
      result.current.mutate({ tacheIds: ['tache-3', 'tache-1', 'tache-2'], lotId: 'lot-1', pieceId: 'piece-1' })
    })

    const cached = queryClient.getQueryData<typeof mockPieces>(['pieces', 'lot-1'])
    expect(cached?.[0].taches.map((t) => t.id)).toEqual(['tache-3', 'tache-1', 'tache-2'])
    expect(cached?.[0].taches[0].position).toBe(0)
    expect(cached?.[0].taches[1].position).toBe(1)
    expect(cached?.[0].taches[2].position).toBe(2)
    // Other piece untouched
    expect(cached?.[1].taches).toHaveLength(0)
  })

  it('rolls back cache on error', async () => {
    const queryClient = createQueryClient()
    queryClient.setQueryData(['pieces', 'lot-1'], structuredClone(mockPieces))

    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'fail' } } as never)

    const { result } = renderHook(() => useReorderTaches(), { wrapper: createWrapper(queryClient) })

    await act(async () => {
      result.current.mutate({ tacheIds: ['tache-3', 'tache-1', 'tache-2'], lotId: 'lot-1', pieceId: 'piece-1' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    const cached = queryClient.getQueryData<typeof mockPieces>(['pieces', 'lot-1'])
    // Rolled back to original order
    expect(cached?.[0].taches.map((t) => t.id)).toEqual(['tache-1', 'tache-2', 'tache-3'])
  })
})
