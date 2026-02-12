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
import { usePieces } from './usePieces'

const mockPieces = [
  {
    id: 'piece-1',
    lot_id: 'lot-1',
    nom: 'Séjour',
    created_at: '2026-01-01T00:00:00Z',
    taches: [
      { id: 'tache-1', piece_id: 'piece-1', nom: 'Ragréage', status: 'not_started', created_at: '2026-01-01T00:00:00Z' },
      { id: 'tache-2', piece_id: 'piece-1', nom: 'Pose', status: 'not_started', created_at: '2026-01-01T00:00:00Z' },
    ],
  },
  {
    id: 'piece-2',
    lot_id: 'lot-1',
    nom: 'Chambre',
    created_at: '2026-01-02T00:00:00Z',
    taches: [
      { id: 'tache-3', piece_id: 'piece-2', nom: 'Ragréage', status: 'not_started', created_at: '2026-01-02T00:00:00Z' },
    ],
  },
]

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('usePieces', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches pieces with nested taches for a lot', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: mockPieces, error: null })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => usePieces('lot-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('pieces')
    expect(mockSelect).toHaveBeenCalledWith('*, taches(*)')
    expect(mockEq).toHaveBeenCalledWith('lot_id', 'lot-1')
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: true })
    expect(result.current.data).toEqual(mockPieces)
  })

  it('uses query key ["pieces", lotId]', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: mockPieces, error: null })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => usePieces('lot-1'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const cached = queryClient.getQueryData(['pieces', 'lot-1'])
    expect(cached).toEqual(mockPieces)
  })

  it('returns error on supabase failure', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => usePieces('lot-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('DB error')
  })

  it('is disabled when lotId is empty', async () => {
    const { result } = renderHook(() => usePieces(''), { wrapper: createWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
  })
})
