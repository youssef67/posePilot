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
import { useChantierMemos } from './useChantierMemos'

const mockMemos = [
  { id: 'm1', chantier_id: 'ch-1', content: 'Clé gardienne', created_by_email: 'a@b.com', created_at: '2026-02-10T00:00:00Z', updated_at: '2026-02-10T00:00:00Z' },
  { id: 'm2', chantier_id: 'ch-1', content: 'Dalle fragile', created_by_email: 'c@d.com', created_at: '2026-02-08T00:00:00Z', updated_at: '2026-02-08T00:00:00Z' },
]

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useChantierMemos', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches memos for a chantier ordered by created_at desc', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: mockMemos, error: null })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useChantierMemos('ch-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.data).toEqual(mockMemos))

    expect(supabase.from).toHaveBeenCalledWith('chantier_memos')
    expect(mockSelect).toHaveBeenCalledWith('*')
    expect(mockEq).toHaveBeenCalledWith('chantier_id', 'ch-1')
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
  })

  it('is disabled when chantierId is empty', () => {
    const { result } = renderHook(() => useChantierMemos(''), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('returns error on supabase failure', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useChantierMemos('ch-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('DB error')
  })
})
