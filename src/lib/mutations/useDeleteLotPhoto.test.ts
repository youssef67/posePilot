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
  toast: Object.assign(vi.fn(), { error: vi.fn() }),
}))

import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useDeleteLotPhoto } from './useDeleteLotPhoto'

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return {
    qc,
    wrapper: ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: qc }, children),
  }
}

describe('useDeleteLotPhoto', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes the row and removes from storage', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never)

    const mockRemove = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabase.storage.from).mockReturnValue({ remove: mockRemove } as never)

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useDeleteLotPhoto(), { wrapper })

    await act(async () => {
      result.current.mutate({
        photoId: 'photo-1',
        photoUrl: 'https://storage.example.com/storage/v1/object/public/note-photos/user-1/lot_photo-1_123.jpg',
        lotId: 'lot-1',
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('lot_photos')
    expect(mockDelete).toHaveBeenCalled()
    expect(mockEq).toHaveBeenCalledWith('id', 'photo-1')
    expect(supabase.storage.from).toHaveBeenCalledWith('note-photos')
    expect(mockRemove).toHaveBeenCalledWith(['user-1/lot_photo-1_123.jpg'])
  })

  it('shows success toast on success', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never)
    vi.mocked(supabase.storage.from).mockReturnValue({ remove: vi.fn().mockResolvedValue({ error: null }) } as never)

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useDeleteLotPhoto(), { wrapper })

    await act(async () => {
      result.current.mutate({
        photoId: 'photo-1',
        photoUrl: 'https://example.com/storage/v1/object/public/note-photos/user-1/lot_1.jpg',
        lotId: 'lot-1',
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast).toHaveBeenCalledWith('Photo supprimée')
  })

  it('shows error toast on failure', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: new Error('DB error') })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never)

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useDeleteLotPhoto(), { wrapper })

    await act(async () => {
      result.current.mutate({
        photoId: 'photo-1',
        photoUrl: 'https://example.com/photo.jpg',
        lotId: 'lot-1',
      })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Erreur lors de la suppression de la photo')
  })

  it('invalidates lot-photos queries on settled', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never)
    vi.mocked(supabase.storage.from).mockReturnValue({ remove: vi.fn().mockResolvedValue({ error: null }) } as never)

    const { wrapper, qc } = createWrapper()
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')

    const { result } = renderHook(() => useDeleteLotPhoto(), { wrapper })

    await act(async () => {
      result.current.mutate({
        photoId: 'photo-1',
        photoUrl: 'https://example.com/photo.jpg',
        lotId: 'lot-1',
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['lot-photos', 'lot-1'] })
  })
})
