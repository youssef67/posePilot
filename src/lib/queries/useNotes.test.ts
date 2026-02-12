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
import { useNotes } from './useNotes'

const mockNotes = [
  {
    id: 'note-1',
    lot_id: 'lot-1',
    piece_id: null,
    content: 'Fissure au plafond',
    is_blocking: true,
    created_by: 'user-1',
    created_by_email: 'bruno@test.fr',
    created_at: '2026-02-10T10:00:00Z',
  },
  {
    id: 'note-2',
    lot_id: 'lot-1',
    piece_id: null,
    content: 'RAS sur peinture',
    is_blocking: false,
    created_by: 'user-1',
    created_by_email: 'bruno@test.fr',
    created_at: '2026-02-10T08:00:00Z',
  },
]

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useNotes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches notes by lotId', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: mockNotes, error: null })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useNotes({ lotId: 'lot-1' }), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('notes')
    expect(mockSelect).toHaveBeenCalledWith('*')
    expect(mockEq).toHaveBeenCalledWith('lot_id', 'lot-1')
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(result.current.data).toEqual(mockNotes)
  })

  it('fetches notes by pieceId', async () => {
    const pieceNotes = [{ ...mockNotes[0], lot_id: null, piece_id: 'piece-1' }]
    const mockOrder = vi.fn().mockResolvedValue({ data: pieceNotes, error: null })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useNotes({ pieceId: 'piece-1' }), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockEq).toHaveBeenCalledWith('piece_id', 'piece-1')
    expect(result.current.data).toEqual(pieceNotes)
  })

  it('is disabled when neither lotId nor pieceId provided', () => {
    const { result } = renderHook(() => useNotes({}), { wrapper: createWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('uses correct query key', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: mockNotes, error: null })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useNotes({ lotId: 'lot-1' }), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const cached = queryClient.getQueryData(['notes', { lotId: 'lot-1', pieceId: undefined }])
    expect(cached).toEqual(mockNotes)
  })

  it('returns error on supabase failure', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useNotes({ lotId: 'lot-1' }), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('DB error')
  })

  it('orders notes by created_at descending', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: mockNotes, error: null })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useNotes({ lotId: 'lot-1' }), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
  })
})
