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
import { useMemos } from './useMemos'

const mockMemos = [
  { id: 'm1', chantier_id: 'ch-1', plot_id: null, etage_id: null, content: 'Clé gardienne', created_by_email: 'a@b.com', photo_url: null, created_at: '2026-02-10T00:00:00Z', updated_at: '2026-02-10T00:00:00Z' },
]

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

function mockChain(data: unknown, error: unknown = null) {
  const mockOrder = vi.fn().mockResolvedValue({ data, error })
  const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
  vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)
  return { mockSelect, mockEq, mockOrder }
}

describe('useMemos', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches memos for a chantier', async () => {
    const { mockEq } = mockChain(mockMemos)
    const { result } = renderHook(() => useMemos('chantier', 'ch-1'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.data).toEqual(mockMemos))
    expect(supabase.from).toHaveBeenCalledWith('memos')
    expect(mockEq).toHaveBeenCalledWith('chantier_id', 'ch-1')
  })

  it('fetches memos for a plot', async () => {
    const { mockEq } = mockChain([])
    const { result } = renderHook(() => useMemos('plot', 'p-1'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.data).toEqual([]))
    expect(mockEq).toHaveBeenCalledWith('plot_id', 'p-1')
  })

  it('fetches memos for an etage', async () => {
    const { mockEq } = mockChain([])
    const { result } = renderHook(() => useMemos('etage', 'e-1'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.data).toEqual([]))
    expect(mockEq).toHaveBeenCalledWith('etage_id', 'e-1')
  })

  it('is disabled when entityId is empty', () => {
    const { result } = renderHook(() => useMemos('chantier', ''), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })
})
