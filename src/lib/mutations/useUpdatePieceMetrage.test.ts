import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

vi.mock('sonner', () => {
  const toast = vi.fn() as ReturnType<typeof vi.fn> & { error: ReturnType<typeof vi.fn> }
  toast.error = vi.fn()
  return { toast }
})

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useUpdatePieceMetrage } from './useUpdatePieceMetrage'

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

function mockSupabaseUpdate(data: unknown) {
  const mockSingle = vi.fn().mockResolvedValue({ data, error: null })
  const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
  const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
  const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
  vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)
  return { mockUpdate, mockEq, mockSelect, mockSingle }
}

const mockPieces = [
  {
    id: 'piece-1',
    lot_id: 'lot-1',
    nom: 'Séjour',
    created_at: '2026-01-01T00:00:00Z',
    progress_done: 1,
    progress_total: 2,
    metrage_m2: null as number | null,
    metrage_ml: null as number | null,
    taches: [
      { id: 'tache-1', piece_id: 'piece-1', nom: 'Ragréage', status: 'not_started' as const, created_at: '2026-01-01T00:00:00Z' },
    ],
  },
  {
    id: 'piece-2',
    lot_id: 'lot-1',
    nom: 'Chambre',
    created_at: '2026-01-02T00:00:00Z',
    progress_done: 0,
    progress_total: 1,
    metrage_m2: 10.5,
    metrage_ml: 6.3,
    taches: [],
  },
]

describe('useUpdatePieceMetrage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls supabase update with correct params', async () => {
    const { mockUpdate, mockEq } = mockSupabaseUpdate({
      id: 'piece-1', lot_id: 'lot-1', nom: 'Séjour', metrage_m2: 12.5, metrage_ml: 8.2,
    })

    const { result } = renderHook(() => useUpdatePieceMetrage(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ pieceId: 'piece-1', lotId: 'lot-1', plotId: 'plot-1', metrage_m2: 12.5, metrage_ml: 8.2, chantierId: 'chantier-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('pieces')
    expect(mockUpdate).toHaveBeenCalledWith({ metrage_m2: 12.5, metrage_ml: 8.2 })
    expect(mockEq).toHaveBeenCalledWith('id', 'piece-1')
  })

  it('optimistically updates metrage values in cache', async () => {
    const queryClient = createQueryClient()
    queryClient.setQueryData(['pieces', 'lot-1'], structuredClone(mockPieces))

    // Never-resolving to keep pending
    const mockSingle = vi.fn().mockReturnValue(new Promise(() => {}))
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)

    const { result } = renderHook(() => useUpdatePieceMetrage(), { wrapper: createWrapper(queryClient) })

    await act(async () => {
      result.current.mutate({ pieceId: 'piece-1', lotId: 'lot-1', plotId: 'plot-1', chantierId: 'chantier-1', metrage_m2: 15.0, metrage_ml: 9.5 })
    })

    const cached = queryClient.getQueryData<typeof mockPieces>(['pieces', 'lot-1'])
    expect(cached?.[0].metrage_m2).toBe(15.0)
    expect(cached?.[0].metrage_ml).toBe(9.5)
    expect(cached?.[1].metrage_m2).toBe(10.5) // untouched
    expect(cached?.[1].metrage_ml).toBe(6.3) // untouched
  })

  it('handles null values (clearing metrage)', async () => {
    const queryClient = createQueryClient()
    queryClient.setQueryData(['pieces', 'lot-1'], structuredClone(mockPieces))

    const mockSingle = vi.fn().mockReturnValue(new Promise(() => {}))
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)

    const { result } = renderHook(() => useUpdatePieceMetrage(), { wrapper: createWrapper(queryClient) })

    await act(async () => {
      result.current.mutate({ pieceId: 'piece-2', lotId: 'lot-1', plotId: 'plot-1', chantierId: 'chantier-1', metrage_m2: null, metrage_ml: null })
    })

    const cached = queryClient.getQueryData<typeof mockPieces>(['pieces', 'lot-1'])
    expect(cached?.[1].metrage_m2).toBeNull()
    expect(cached?.[1].metrage_ml).toBeNull()
  })

  it('rolls back cache on error and shows toast', async () => {
    const queryClient = createQueryClient()
    queryClient.setQueryData(['pieces', 'lot-1'], structuredClone(mockPieces))

    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: new Error('fail') })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)

    const { result } = renderHook(() => useUpdatePieceMetrage(), { wrapper: createWrapper(queryClient) })

    await act(async () => {
      result.current.mutate({ pieceId: 'piece-1', lotId: 'lot-1', plotId: 'plot-1', chantierId: 'chantier-1', metrage_m2: 20, metrage_ml: 10 })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    const cached = queryClient.getQueryData<typeof mockPieces>(['pieces', 'lot-1'])
    expect(cached?.[0].metrage_m2).toBeNull() // rolled back
    expect(cached?.[0].metrage_ml).toBeNull() // rolled back
    expect(toast.error).toHaveBeenCalledWith('Impossible de sauvegarder les métrés')
  })

  it('invalidates pieces and lots queries on settled', async () => {
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    mockSupabaseUpdate({
      id: 'piece-1', lot_id: 'lot-1', nom: 'Séjour', metrage_m2: 12.5, metrage_ml: 8.2,
    })

    const { result } = renderHook(() => useUpdatePieceMetrage(), { wrapper: createWrapper(queryClient) })

    await act(async () => {
      result.current.mutate({ pieceId: 'piece-1', lotId: 'lot-1', plotId: 'plot-1', chantierId: 'chantier-1', metrage_m2: 12.5, metrage_ml: 8.2 })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['pieces', 'lot-1'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['lots', 'plot-1'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['plots', 'chantier-1'] })
  })
})
