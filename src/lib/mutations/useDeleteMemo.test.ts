import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    storage: { from: vi.fn() },
  },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn() },
}))

import { supabase } from '@/lib/supabase'
import { useDeleteMemo } from './useDeleteMemo'

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return { wrapper: ({ children }: { children: React.ReactNode }) => createElement(QueryClientProvider, { client: queryClient }, children), queryClient }
}

describe('useDeleteMemo', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deletes memo from memos table', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never)

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useDeleteMemo(), { wrapper })

    await act(async () => {
      result.current.mutate({ memoId: 'm1', entityType: 'chantier', entityId: 'ch-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(supabase.from).toHaveBeenCalledWith('memos')
    expect(mockEq).toHaveBeenCalledWith('id', 'm1')
  })

  it('cleans up photo from storage when photoUrl is provided', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never)

    const mockRemove = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabase.storage.from).mockReturnValue({ remove: mockRemove } as never)

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useDeleteMemo(), { wrapper })

    await act(async () => {
      result.current.mutate({
        memoId: 'm1',
        photoUrl: 'https://storage.example.com/note-photos/u1/memo_m1_123.jpg',
        entityType: 'plot',
        entityId: 'p-1',
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(supabase.storage.from).toHaveBeenCalledWith('note-photos')
    expect(mockRemove).toHaveBeenCalledWith(['u1/memo_m1_123.jpg'])
  })
})
