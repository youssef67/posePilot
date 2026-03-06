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
import { usePlotEtageMemos } from './usePlotEtageMemos'

const mockMemos = [
  {
    id: 'm1', chantier_id: null, etage_id: 'e-1',
    content: 'Dalle fragile', created_by_email: 'a@b.com',
    created_at: '2026-02-12T00:00:00Z', updated_at: '2026-02-12T00:00:00Z',
    memo_photos: [
      { id: 'ph-2', memo_id: 'm1', photo_url: 'https://example.com/b.jpg', position: 1, created_at: '2026-02-12T00:00:00Z' },
      { id: 'ph-1', memo_id: 'm1', photo_url: 'https://example.com/a.jpg', position: 0, created_at: '2026-02-12T00:00:00Z' },
    ],
  },
  {
    id: 'm2', chantier_id: null, etage_id: 'e-2',
    content: 'Clé gardienne', created_by_email: 'b@b.com',
    created_at: '2026-02-10T00:00:00Z', updated_at: '2026-02-10T00:00:00Z',
    memo_photos: [],
  },
]

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

function mockChain(data: unknown, error: unknown = null) {
  const mockOrder = vi.fn().mockResolvedValue({ data, error })
  const mockIn = vi.fn().mockReturnValue({ order: mockOrder })
  const mockSelect = vi.fn().mockReturnValue({ in: mockIn })
  vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)
  return { mockSelect, mockIn, mockOrder }
}

describe('usePlotEtageMemos', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches memos for all etages of a plot', async () => {
    const { mockSelect, mockIn } = mockChain(mockMemos)
    const { result } = renderHook(
      () => usePlotEtageMemos('plot-1', ['e-1', 'e-2']),
      { wrapper: createWrapper() },
    )
    await waitFor(() => expect(result.current.data?.length).toBe(2))
    expect(supabase.from).toHaveBeenCalledWith('memos')
    expect(mockSelect).toHaveBeenCalledWith('*, memo_photos(*)')
    expect(mockIn).toHaveBeenCalledWith('etage_id', ['e-1', 'e-2'])
  })

  it('sorts memo_photos by position', async () => {
    mockChain(mockMemos)
    const { result } = renderHook(
      () => usePlotEtageMemos('plot-1', ['e-1', 'e-2']),
      { wrapper: createWrapper() },
    )
    await waitFor(() => expect(result.current.data?.length).toBe(2))
    const photos = result.current.data![0].memo_photos
    expect(photos[0].position).toBe(0)
    expect(photos[1].position).toBe(1)
  })

  it('returns empty array when no memos exist', async () => {
    mockChain([])
    const { result } = renderHook(
      () => usePlotEtageMemos('plot-1', ['e-1']),
      { wrapper: createWrapper() },
    )
    await waitFor(() => expect(result.current.data).toEqual([]))
  })

  it('is disabled when etageIds is empty', () => {
    const { result } = renderHook(
      () => usePlotEtageMemos('plot-1', []),
      { wrapper: createWrapper() },
    )
    expect(result.current.fetchStatus).toBe('idle')
  })
})
