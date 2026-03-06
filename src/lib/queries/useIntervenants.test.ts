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
import { useIntervenants } from './useIntervenants'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useIntervenants', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches intervenants ordered by nom', async () => {
    const intervenants = [
      { id: 'i1', nom: 'A2M', created_by: 'u1', created_at: '2026-03-01T00:00:00Z' },
      { id: 'i2', nom: 'Martin', created_by: 'u1', created_at: '2026-03-01T00:00:00Z' },
    ]
    const mockOrder = vi.fn().mockResolvedValue({ data: intervenants, error: null })
    const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useIntervenants(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.data).toHaveLength(2))

    expect(supabase.from).toHaveBeenCalledWith('intervenants')
    expect(mockSelect).toHaveBeenCalledWith('*')
    expect(mockOrder).toHaveBeenCalledWith('nom', { ascending: true })
    expect(result.current.data).toEqual(intervenants)
  })

  it('returns error on supabase failure', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: null, error: new Error('Fetch failed') })
    const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useIntervenants(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Fetch failed')
  })
})
