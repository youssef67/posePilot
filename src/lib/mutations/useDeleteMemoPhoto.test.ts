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
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { supabase } from '@/lib/supabase'
import { useDeleteMemoPhoto } from './useDeleteMemoPhoto'

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useDeleteMemoPhoto', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deletes memo_photos row first, then storage file', async () => {
    const callOrder: string[] = []

    const mockRemove = vi.fn().mockImplementation(() => {
      callOrder.push('storage.remove')
      return Promise.resolve({ error: null })
    })
    vi.mocked(supabase.storage.from).mockReturnValue({ remove: mockRemove } as never)

    const mockEq = vi.fn().mockImplementation(() => {
      callOrder.push('db.delete')
      return Promise.resolve({ error: null })
    })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never)

    const { result } = renderHook(() => useDeleteMemoPhoto(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({
        photoId: 'ph-1',
        photoUrl: 'https://storage.example.com/note-photos/u1/memo_m1_123.jpg',
        entityType: 'etage',
        entityId: 'e-1',
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(supabase.from).toHaveBeenCalledWith('memo_photos')
    expect(mockEq).toHaveBeenCalledWith('id', 'ph-1')
    expect(supabase.storage.from).toHaveBeenCalledWith('note-photos')
    expect(mockRemove).toHaveBeenCalledWith(['u1/memo_m1_123.jpg'])
    expect(callOrder).toEqual(['db.delete', 'storage.remove'])
  })
})
