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
import { useUpdateMemo } from './useUpdateMemo'

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return { wrapper: ({ children }: { children: React.ReactNode }) => createElement(QueryClientProvider, { client: queryClient }, children), queryClient }
}

describe('useUpdateMemo', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates memo content', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'm1', content: 'Updated' }, error: null })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useUpdateMemo(), { wrapper })

    await act(async () => {
      result.current.mutate({ memoId: 'm1', content: 'Updated', entityType: 'chantier', entityId: 'ch-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(supabase.from).toHaveBeenCalledWith('memos')
  })
})
