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
import { useLotBadges } from './useLotBadges'

const mockBadges = [
  { id: 'b1', chantier_id: 'ch-1', nom: 'PMR', couleur: 'blue', created_at: '2026-01-01T00:00:00Z' },
  { id: 'b2', chantier_id: 'ch-1', nom: 'TMA', couleur: 'amber', created_at: '2026-01-02T00:00:00Z' },
]

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useLotBadges', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches badges for a chantier', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: mockBadges, error: null })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useLotBadges('ch-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.data).toEqual(mockBadges))

    expect(supabase.from).toHaveBeenCalledWith('lot_badges')
    expect(mockSelect).toHaveBeenCalledWith('*')
    expect(mockEq).toHaveBeenCalledWith('chantier_id', 'ch-1')
    expect(mockOrder).toHaveBeenCalledWith('nom', { ascending: true })
  })

  it('is disabled when chantierId is empty', () => {
    const { result } = renderHook(() => useLotBadges(''), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('returns error on supabase failure', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useLotBadges('ch-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('DB error')
  })
})
