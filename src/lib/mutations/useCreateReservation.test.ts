import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: { getUser: vi.fn() },
    storage: { from: vi.fn() },
  },
}))

vi.mock('@/lib/utils/compressImage', () => ({
  compressPhoto: vi.fn().mockResolvedValue(new Blob(['photo'], { type: 'image/jpeg' })),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useCreateReservation } from './useCreateReservation'

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
  vi.mocked(supabase.auth.getUser).mockResolvedValue({
    data: { user: { id: 'user-1', email: 'bruno@test.fr' } },
  } as never)
  return { mockInsert, mockSelect, mockSingle }
}

describe('useCreateReservation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('inserts reservation with lot_id, piece_id, description', async () => {
    const { mockInsert } = mockSupabaseInsert({
      id: 'res-1',
      lot_id: 'lot-1',
      piece_id: 'piece-1',
      description: 'Fissure',
      status: 'ouvert',
      photo_url: null,
      pieces: { nom: 'Séjour' },
    })

    const { result } = renderHook(() => useCreateReservation(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({
        lotId: 'lot-1',
        pieceId: 'piece-1',
        pieceName: 'Séjour',
        description: 'Fissure',
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('reservations')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        lot_id: 'lot-1',
        piece_id: 'piece-1',
        description: 'Fissure',
        status: 'ouvert',
        created_by: 'user-1',
        created_by_email: 'bruno@test.fr',
      }),
    )
  })

  it('shows success toast on success', async () => {
    mockSupabaseInsert({ id: 'res-1', pieces: { nom: 'Séjour' } })

    const { result } = renderHook(() => useCreateReservation(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({
        lotId: 'lot-1',
        pieceId: 'piece-1',
        pieceName: 'Séjour',
        description: 'Test',
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('Réserve créée')
  })

  it('shows error toast and rolls back cache on failure', async () => {
    const queryClient = createQueryClient()
    const previous = [{ id: 'existing' }]
    queryClient.setQueryData(['reservations', { lotId: 'lot-1' }], previous)

    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: new Error('Insert failed') })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never)
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-1', email: 'bruno@test.fr' } },
    } as never)

    const { result } = renderHook(() => useCreateReservation(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({
        lotId: 'lot-1',
        pieceId: 'piece-1',
        pieceName: 'Séjour',
        description: 'Fail',
      })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(toast.error).toHaveBeenCalledWith('Erreur lors de la création de la réserve')
    const cached = queryClient.getQueryData(['reservations', { lotId: 'lot-1' }])
    expect(cached).toEqual(previous)
  })

  it('invalidates reservations and lots queries on settled', async () => {
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    mockSupabaseInsert({ id: 'res-1', pieces: { nom: 'Séjour' } })

    const { result } = renderHook(() => useCreateReservation(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({
        lotId: 'lot-1',
        pieceId: 'piece-1',
        pieceName: 'Séjour',
        description: 'Test',
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['reservations', { lotId: 'lot-1' }] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['lots'] })
  })

  it('applies optimistic update on mutate', async () => {
    const queryClient = createQueryClient()
    queryClient.setQueryData(['reservations', { lotId: 'lot-1' }], [])

    let resolveInsert: (value: unknown) => void
    const mockSingle = vi.fn(() => new Promise((resolve) => { resolveInsert = resolve }))
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never)
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-1', email: 'bruno@test.fr' } },
    } as never)

    const { result } = renderHook(() => useCreateReservation(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => {
      result.current.mutate({
        lotId: 'lot-1',
        pieceId: 'piece-1',
        pieceName: 'Séjour',
        description: 'Optimistic',
      })
    })

    await waitFor(() => {
      const cached = queryClient.getQueryData(['reservations', { lotId: 'lot-1' }]) as unknown[]
      expect(cached).toHaveLength(1)
      expect(cached[0]).toMatchObject({
        description: 'Optimistic',
        lot_id: 'lot-1',
        piece_id: 'piece-1',
        status: 'ouvert',
        created_by_email: 'vous',
        pieces: { nom: 'Séjour' },
      })
    })

    await act(async () => {
      resolveInsert!({ data: { id: 'res-1' }, error: null })
    })
  })
})
