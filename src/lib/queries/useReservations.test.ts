import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

import { supabase } from '@/lib/supabase'
import { useReservations } from './useReservations'

const mockReservations = [
  {
    id: 'res-1',
    lot_id: 'lot-1',
    piece_id: 'piece-1',
    description: 'Fissure au plafond',
    photo_url: null,
    status: 'ouvert',
    resolved_at: null,
    created_by: 'user-1',
    created_by_email: 'bruno@test.fr',
    created_at: '2026-02-20T10:00:00Z',
    pieces: { nom: 'Séjour' },
  },
  {
    id: 'res-2',
    lot_id: 'lot-1',
    piece_id: 'piece-2',
    description: 'Joint silicone à refaire',
    photo_url: 'https://example.com/photo.jpg',
    status: 'resolu',
    resolved_at: '2026-02-21T10:00:00Z',
    created_by: 'user-1',
    created_by_email: 'bruno@test.fr',
    created_at: '2026-02-19T08:00:00Z',
    pieces: { nom: 'SDB' },
  },
]

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useReservations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches reservations by lotId with piece join', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: mockReservations, error: null })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useReservations('lot-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.data).toEqual(mockReservations))

    expect(supabase.from).toHaveBeenCalledWith('reservations')
    expect(mockSelect).toHaveBeenCalledWith('*, pieces(nom)')
    expect(mockEq).toHaveBeenCalledWith('lot_id', 'lot-1')
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
  })

  it('is disabled when lotId is empty', () => {
    const { result } = renderHook(() => useReservations(''), { wrapper: createWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('uses correct query key', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: mockReservations, error: null })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useReservations('lot-1'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const cached = queryClient.getQueryData(['reservations', { lotId: 'lot-1' }])
    expect(cached).toEqual(mockReservations)
  })

  it('returns error on supabase failure', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useReservations('lot-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('DB error')
  })
})
