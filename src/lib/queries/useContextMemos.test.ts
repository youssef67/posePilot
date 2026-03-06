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
import { useContextMemos } from './useContextMemos'

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useContextMemos', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches and groups memos by level', async () => {
    const mockMemos = [
      { id: 'm1', chantier_id: 'ch-1', plot_id: null, etage_id: null, content: 'chantier memo', created_by_email: 'a@b.com', photo_url: null, created_at: '2026-02-10T00:00:00Z', updated_at: '2026-02-10T00:00:00Z' },
      { id: 'm2', chantier_id: null, plot_id: 'p-1', etage_id: null, content: 'plot memo', created_by_email: 'a@b.com', photo_url: null, created_at: '2026-02-09T00:00:00Z', updated_at: '2026-02-09T00:00:00Z' },
      { id: 'm3', chantier_id: null, plot_id: null, etage_id: 'e-1', content: 'etage memo', created_by_email: 'a@b.com', photo_url: null, created_at: '2026-02-08T00:00:00Z', updated_at: '2026-02-08T00:00:00Z' },
    ]
    const mockOrder = vi.fn().mockResolvedValue({ data: mockMemos, error: null })
    const mockOr = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ or: mockOr })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useContextMemos('ch-1', 'p-1', 'e-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data!.chantier).toHaveLength(1)
    expect(result.current.data!.plot).toHaveLength(1)
    expect(result.current.data!.etage).toHaveLength(1)
  })

  it('returns empty groups when no memos exist', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null })
    const mockOr = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ or: mockOr })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useContextMemos('ch-1', 'p-1', 'e-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.data).toBeDefined())
    expect(result.current.data!.chantier).toHaveLength(0)
    expect(result.current.data!.plot).toHaveLength(0)
    expect(result.current.data!.etage).toHaveLength(0)
  })
})
