import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

import { supabase } from '@/lib/supabase'
import { useAddLotTask } from './useAddLotTask'

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

function mockSupabaseInsert(data: unknown) {
  const mockSingle = vi.fn().mockResolvedValue({ data, error: null })
  const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
  const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
  vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never)
  return { mockInsert, mockSelect, mockSingle }
}

const mockTache = {
  id: 'tache-new',
  piece_id: 'piece-1',
  nom: 'Nettoyage',
  status: 'not_started' as const,
  created_at: '2026-01-01T00:00:00Z',
}

describe('useAddLotTask', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls supabase insert with correct params', async () => {
    const { mockInsert } = mockSupabaseInsert(mockTache)

    const { result } = renderHook(() => useAddLotTask(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ pieceId: 'piece-1', nom: 'Nettoyage', lotId: 'lot-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('taches')
    expect(mockInsert).toHaveBeenCalledWith({ piece_id: 'piece-1', nom: 'Nettoyage', status: 'not_started' })
  })

  it('optimistically adds task to correct piece in cache', async () => {
    const queryClient = createQueryClient()
    const previousPieces = [
      {
        id: 'piece-1', lot_id: 'lot-1', nom: 'Séjour', created_at: '2026-01-01T00:00:00Z',
        taches: [{ id: 'tache-1', piece_id: 'piece-1', nom: 'Ragréage', status: 'not_started' as const, created_at: '2026-01-01T00:00:00Z' }],
      },
      {
        id: 'piece-2', lot_id: 'lot-1', nom: 'Chambre', created_at: '2026-01-02T00:00:00Z',
        taches: [],
      },
    ]
    queryClient.setQueryData(['pieces', 'lot-1'], previousPieces)

    // Never-resolving to keep pending
    const mockSingle = vi.fn().mockReturnValue(new Promise(() => {}))
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never)

    const { result } = renderHook(() => useAddLotTask(), { wrapper: createWrapper(queryClient) })

    await act(async () => {
      result.current.mutate({ pieceId: 'piece-1', nom: 'Nettoyage', lotId: 'lot-1' })
    })

    const cached = queryClient.getQueryData<typeof previousPieces>(['pieces', 'lot-1'])
    expect(cached?.[0].taches).toHaveLength(2)
    expect(cached?.[0].taches[1].nom).toBe('Nettoyage')
    expect(cached?.[0].taches[1].status).toBe('not_started')
    expect(cached?.[1].taches).toHaveLength(0) // untouched
  })

  it('rolls back cache on error', async () => {
    const queryClient = createQueryClient()
    const previousPieces = [
      {
        id: 'piece-1', lot_id: 'lot-1', nom: 'Séjour', created_at: '2026-01-01T00:00:00Z',
        taches: [{ id: 'tache-1', piece_id: 'piece-1', nom: 'Ragréage', status: 'not_started' as const, created_at: '2026-01-01T00:00:00Z' }],
      },
    ]
    queryClient.setQueryData(['pieces', 'lot-1'], previousPieces)

    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: new Error('fail') })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never)

    const { result } = renderHook(() => useAddLotTask(), { wrapper: createWrapper(queryClient) })

    await act(async () => {
      result.current.mutate({ pieceId: 'piece-1', nom: 'Nettoyage', lotId: 'lot-1' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    const cached = queryClient.getQueryData<typeof previousPieces>(['pieces', 'lot-1'])
    expect(cached).toEqual(previousPieces)
  })

  it('invalidates pieces query on settled', async () => {
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    mockSupabaseInsert(mockTache)

    const { result } = renderHook(() => useAddLotTask(), { wrapper: createWrapper(queryClient) })

    await act(async () => {
      result.current.mutate({ pieceId: 'piece-1', nom: 'Nettoyage', lotId: 'lot-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['pieces', 'lot-1'] })
  })
})
