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
import { useUpdateBadge } from './useUpdateBadge'

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useUpdateBadge', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates badge nom and couleur', async () => {
    const updatedBadge = { id: 'b1', chantier_id: 'ch-1', nom: 'Accessible', couleur: 'green', created_at: '2026-01-01T00:00:00Z' }
    const mockSingle = vi.fn().mockResolvedValue({ data: updatedBadge, error: null })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)

    const { result } = renderHook(() => useUpdateBadge(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ badgeId: 'b1', nom: 'Accessible', couleur: 'green', chantierId: 'ch-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(supabase.from).toHaveBeenCalledWith('lot_badges')
    expect(mockUpdate).toHaveBeenCalledWith({ nom: 'Accessible', couleur: 'green' })
    expect(mockEq).toHaveBeenCalledWith('id', 'b1')
  })
})
