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
import { useCreateAndAssignBadge } from './useCreateAndAssignBadge'

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useCreateAndAssignBadge', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates badge then assigns it to the lot', async () => {
    const badge = { id: 'b-new', chantier_id: 'ch-1', nom: 'PMR', couleur: 'blue', created_at: '2026-01-01T00:00:00Z' }
    // First call: create badge
    const mockSingle = vi.fn().mockResolvedValue({ data: badge, error: null })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsertBadge = vi.fn().mockReturnValue({ select: mockSelect })
    // Second call: assign badge
    const mockInsertAssignment = vi.fn().mockResolvedValue({ error: null })

    let callCount = 0
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      callCount++
      if (table === 'lot_badges' || callCount === 1) {
        return { insert: mockInsertBadge } as never
      }
      return { insert: mockInsertAssignment } as never
    })

    const { result } = renderHook(() => useCreateAndAssignBadge(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ chantierId: 'ch-1', nom: 'PMR', couleur: 'blue', lotId: 'lot-1', plotId: 'plot-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockInsertBadge).toHaveBeenCalledWith({ chantier_id: 'ch-1', nom: 'PMR', couleur: 'blue' })
    expect(mockInsertAssignment).toHaveBeenCalledWith({ lot_id: 'lot-1', badge_id: 'b-new' })
  })
})
