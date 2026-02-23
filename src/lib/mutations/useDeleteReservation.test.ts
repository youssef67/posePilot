import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    storage: { from: vi.fn() },
  },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useDeleteReservation } from './useDeleteReservation'

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

function mockSupabaseDelete() {
  const mockEq = vi.fn().mockResolvedValue({ error: null })
  const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
  vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never)
  return { mockDelete, mockEq }
}

describe('useDeleteReservation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes reservation without photo', async () => {
    const { mockEq } = mockSupabaseDelete()

    const { result } = renderHook(() => useDeleteReservation(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ reservationId: 'res-1', lotId: 'lot-1', photoUrl: null })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('reservations')
    expect(mockEq).toHaveBeenCalledWith('id', 'res-1')
    expect(supabase.storage.from).not.toHaveBeenCalled()
  })

  it('deletes photo from storage before deleting reservation', async () => {
    mockSupabaseDelete()
    const mockRemove = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabase.storage.from).mockReturnValue({ remove: mockRemove } as never)

    const { result } = renderHook(() => useDeleteReservation(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({
        reservationId: 'res-1',
        lotId: 'lot-1',
        photoUrl: 'https://example.com/storage/v1/object/public/note-photos/reservations/lot-1/res-1.jpg',
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.storage.from).toHaveBeenCalledWith('note-photos')
    expect(mockRemove).toHaveBeenCalledWith(['reservations/lot-1/res-1.jpg'])
  })

  it('shows success toast', async () => {
    mockSupabaseDelete()

    const { result } = renderHook(() => useDeleteReservation(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ reservationId: 'res-1', lotId: 'lot-1', photoUrl: null })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('Réserve supprimée')
  })

  it('rolls back cache on failure', async () => {
    const queryClient = createQueryClient()
    const previous = [{ id: 'res-1' }, { id: 'res-2' }]
    queryClient.setQueryData(['reservations', { lotId: 'lot-1' }], previous)

    const mockEq = vi.fn().mockResolvedValue({ error: new Error('Delete failed') })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never)

    const { result } = renderHook(() => useDeleteReservation(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ reservationId: 'res-1', lotId: 'lot-1', photoUrl: null })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(toast.error).toHaveBeenCalledWith('Erreur lors de la suppression de la réserve')
    const cached = queryClient.getQueryData(['reservations', { lotId: 'lot-1' }])
    expect(cached).toEqual(previous)
  })

  it('invalidates reservations and lots queries on settled', async () => {
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    mockSupabaseDelete()

    const { result } = renderHook(() => useDeleteReservation(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ reservationId: 'res-1', lotId: 'lot-1', photoUrl: null })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['reservations', { lotId: 'lot-1' }] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['lots'] })
  })
})
