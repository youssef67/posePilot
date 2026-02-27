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
  toast: { success: vi.fn() },
}))

import { supabase } from '@/lib/supabase'
import { useUnassignBadge } from './useUnassignBadge'

const badge = { id: 'b1', chantier_id: 'ch-1', nom: 'TMA', couleur: 'amber', created_at: '2026-01-01T00:00:00Z' }

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return { wrapper: ({ children }: { children: React.ReactNode }) => createElement(QueryClientProvider, { client: queryClient }, children), queryClient }
}

describe('useUnassignBadge', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deletes assignment from lot_badge_assignments', async () => {
    const mockEq2 = vi.fn().mockResolvedValue({ error: null })
    const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq1 })
    vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never)

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useUnassignBadge(), { wrapper })

    await act(async () => {
      result.current.mutate({ lotId: 'lot-1', badgeId: 'b1', plotId: 'plot-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(supabase.from).toHaveBeenCalledWith('lot_badge_assignments')
    expect(mockEq1).toHaveBeenCalledWith('lot_id', 'lot-1')
    expect(mockEq2).toHaveBeenCalledWith('badge_id', 'b1')
  })

  it('optimistically removes assignment from cache', async () => {
    const mockEq2 = vi.fn().mockResolvedValue({ error: null })
    const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq1 })
    vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never)

    const { wrapper, queryClient } = createWrapper()
    queryClient.setQueryData(['lot-badge-assignments', { lotId: 'lot-1' }], [
      { lot_id: 'lot-1', badge_id: 'b1', created_at: '2026-01-01T00:00:00Z', lot_badges: badge },
      { lot_id: 'lot-1', badge_id: 'b2', created_at: '2026-01-02T00:00:00Z', lot_badges: { ...badge, id: 'b2', nom: 'PMR' } },
    ])

    const { result } = renderHook(() => useUnassignBadge(), { wrapper })

    await act(async () => {
      result.current.mutate({ lotId: 'lot-1', badgeId: 'b1', plotId: 'plot-1' })
    })

    const cached = queryClient.getQueryData<unknown[]>(['lot-badge-assignments', { lotId: 'lot-1' }])
    expect(cached?.length).toBe(1)
  })
})
