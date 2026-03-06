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
import { useDeleteMemo } from './useDeleteMemo'

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return { wrapper: ({ children }: { children: React.ReactNode }) => createElement(QueryClientProvider, { client: queryClient }, children), queryClient }
}

describe('useDeleteMemo', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deletes memo from memos table', async () => {
    // Mock memo_photos fetch (no photos)
    const mockPhotosEq = vi.fn().mockResolvedValue({ data: [], error: null })
    const mockPhotosSelect = vi.fn().mockReturnValue({ eq: mockPhotosEq })

    // Mock memo delete
    const mockDeleteEq = vi.fn().mockResolvedValue({ error: null })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockDeleteEq })

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'memo_photos') return { select: mockPhotosSelect } as never
      return { delete: mockDelete } as never
    })

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useDeleteMemo(), { wrapper })

    await act(async () => {
      result.current.mutate({ memoId: 'm1', entityType: 'chantier', entityId: 'ch-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(supabase.from).toHaveBeenCalledWith('memos')
    expect(mockDeleteEq).toHaveBeenCalledWith('id', 'm1')
  })

  it('deletes all photos from storage when memo has photos', async () => {
    const photos = [
      { photo_url: 'https://storage.example.com/note-photos/u1/memo_m1_1.jpg' },
      { photo_url: 'https://storage.example.com/note-photos/u1/memo_m1_2.jpg' },
    ]
    const mockPhotosEq = vi.fn().mockResolvedValue({ data: photos, error: null })
    const mockPhotosSelect = vi.fn().mockReturnValue({ eq: mockPhotosEq })

    const mockDeleteEq = vi.fn().mockResolvedValue({ error: null })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockDeleteEq })

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'memo_photos') return { select: mockPhotosSelect } as never
      return { delete: mockDelete } as never
    })

    const mockRemove = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabase.storage.from).mockReturnValue({ remove: mockRemove } as never)

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useDeleteMemo(), { wrapper })

    await act(async () => {
      result.current.mutate({ memoId: 'm1', entityType: 'plot', entityId: 'p-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(supabase.storage.from).toHaveBeenCalledWith('note-photos')
    expect(mockRemove).toHaveBeenCalledWith(['u1/memo_m1_1.jpg', 'u1/memo_m1_2.jpg'])
  })

  it('shows success toast only on success, not on error', async () => {
    const { toast } = await import('sonner')

    // Mock memo_photos fetch (no photos)
    const mockPhotosEq = vi.fn().mockResolvedValue({ data: [], error: null })
    const mockPhotosSelect = vi.fn().mockReturnValue({ eq: mockPhotosEq })

    // Mock memo delete — fails
    const mockDeleteEq = vi.fn().mockResolvedValue({ error: { message: 'DB error' } })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockDeleteEq })

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'memo_photos') return { select: mockPhotosSelect } as never
      return { delete: mockDelete } as never
    })

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useDeleteMemo(), { wrapper })

    await act(async () => {
      result.current.mutate({ memoId: 'm1', entityType: 'chantier', entityId: 'ch-1' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.success).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith('Erreur lors de la suppression du mémo')
  })
})
