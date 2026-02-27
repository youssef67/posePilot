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
import { useAssignBadge } from './useAssignBadge'

const badge = { id: 'b1', chantier_id: 'ch-1', nom: 'TMA', couleur: 'amber', created_at: '2026-01-01T00:00:00Z' }

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return { wrapper: ({ children }: { children: React.ReactNode }) => createElement(QueryClientProvider, { client: queryClient }, children), queryClient }
}

describe('useAssignBadge', () => {
  beforeEach(() => vi.clearAllMocks())

  it('inserts assignment into lot_badge_assignments', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: { lot_id: 'lot-1', badge_id: 'b1', lot_badges: badge }, error: null })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never)

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useAssignBadge(), { wrapper })

    await act(async () => {
      result.current.mutate({ lotId: 'lot-1', badge, plotId: 'plot-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(supabase.from).toHaveBeenCalledWith('lot_badge_assignments')
    expect(mockInsert).toHaveBeenCalledWith({ lot_id: 'lot-1', badge_id: 'b1' })
  })

  it('optimistically adds assignment to cache', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: { lot_id: 'lot-1', badge_id: 'b1', lot_badges: badge }, error: null })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never)

    const { wrapper, queryClient } = createWrapper()
    queryClient.setQueryData(['lot-badge-assignments', { lotId: 'lot-1' }], [])

    const { result } = renderHook(() => useAssignBadge(), { wrapper })

    await act(async () => {
      result.current.mutate({ lotId: 'lot-1', badge, plotId: 'plot-1' })
    })

    // Check optimistic update happened
    const cached = queryClient.getQueryData<unknown[]>(['lot-badge-assignments', { lotId: 'lot-1' }])
    expect(cached?.length).toBeGreaterThanOrEqual(1)
  })
})
