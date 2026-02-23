import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useResolveReservation } from './useResolveReservation'

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
  return { mockUpdate, mockEq }
}

describe('useResolveReservation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates reservation status to resolu', async () => {
    const { mockUpdate } = mockSupabaseUpdate({
      id: 'res-1',
      status: 'resolu',
      resolved_at: '2026-02-21T10:00:00Z',
    })

    const { result } = renderHook(() => useResolveReservation(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ reservationId: 'res-1', lotId: 'lot-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('reservations')
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'resolu' }),
    )
  })

  it('shows success toast', async () => {
    mockSupabaseUpdate({ id: 'res-1', status: 'resolu' })

    const { result } = renderHook(() => useResolveReservation(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ reservationId: 'res-1', lotId: 'lot-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('Réserve résolue')
  })

  it('rolls back cache on failure', async () => {
    const queryClient = createQueryClient()
    const previous = [{ id: 'res-1', status: 'ouvert', resolved_at: null }]
    queryClient.setQueryData(['reservations', { lotId: 'lot-1' }], previous)

    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: new Error('Update failed') })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)

    const { result } = renderHook(() => useResolveReservation(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ reservationId: 'res-1', lotId: 'lot-1' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(toast.error).toHaveBeenCalledWith('Erreur lors de la résolution de la réserve')
    const cached = queryClient.getQueryData(['reservations', { lotId: 'lot-1' }])
    expect(cached).toEqual(previous)
  })

  it('invalidates reservations and lots queries on settled', async () => {
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    mockSupabaseUpdate({ id: 'res-1', status: 'resolu' })

    const { result } = renderHook(() => useResolveReservation(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ reservationId: 'res-1', lotId: 'lot-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['reservations', { lotId: 'lot-1' }] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['lots'] })
  })
})
