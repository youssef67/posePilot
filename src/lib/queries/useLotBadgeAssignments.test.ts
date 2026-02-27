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
import { useLotBadgeAssignments } from './useLotBadgeAssignments'

const mockAssignments = [
  {
    lot_id: 'lot-1',
    badge_id: 'b1',
    created_at: '2026-01-01T00:00:00Z',
    lot_badges: { id: 'b1', chantier_id: 'ch-1', nom: 'TMA', couleur: 'amber', created_at: '2026-01-01T00:00:00Z' },
  },
]

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useLotBadgeAssignments', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches badge assignments for a lot', async () => {
    const mockEq = vi.fn().mockResolvedValue({ data: mockAssignments, error: null })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useLotBadgeAssignments('lot-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.data).toEqual(mockAssignments))

    expect(supabase.from).toHaveBeenCalledWith('lot_badge_assignments')
    expect(mockSelect).toHaveBeenCalledWith('*, lot_badges(*)')
    expect(mockEq).toHaveBeenCalledWith('lot_id', 'lot-1')
  })

  it('is disabled when lotId is empty', () => {
    const { result } = renderHook(() => useLotBadgeAssignments(''), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('returns error on supabase failure', async () => {
    const mockEq = vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useLotBadgeAssignments('lot-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('DB error')
  })
})
