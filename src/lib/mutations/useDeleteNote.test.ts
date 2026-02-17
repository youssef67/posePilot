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
import { toast } from 'sonner'
import { useDeleteNote } from './useDeleteNote'

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

function mockSupabaseDelete(error: Error | null = null) {
  const mockEq = vi.fn().mockResolvedValue({ error })
  const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
  vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never)
  const mockRemove = vi.fn().mockResolvedValue({ error: null })
  vi.mocked(supabase.storage.from).mockReturnValue({ remove: mockRemove } as never)
  return { mockDelete, mockEq, mockRemove }
}

describe('useDeleteNote', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes note via supabase', async () => {
    const { mockDelete, mockEq } = mockSupabaseDelete()
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useDeleteNote(), { wrapper })

    await act(async () => {
      result.current.mutate({ noteId: 'note-1', photoUrl: null })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('notes')
    expect(mockDelete).toHaveBeenCalled()
    expect(mockEq).toHaveBeenCalledWith('id', 'note-1')
  })

  it('deletes photo from storage when photoUrl exists', async () => {
    const { mockRemove } = mockSupabaseDelete()
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useDeleteNote(), { wrapper })

    await act(async () => {
      result.current.mutate({
        noteId: 'note-1',
        photoUrl: 'https://project.supabase.co/storage/v1/object/public/note-photos/user-1/note-1_123.jpg',
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.storage.from).toHaveBeenCalledWith('note-photos')
    expect(mockRemove).toHaveBeenCalledWith(['user-1/note-1_123.jpg'])
  })

  it('does not call storage remove when photoUrl is null', async () => {
    mockSupabaseDelete()
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useDeleteNote(), { wrapper })

    await act(async () => {
      result.current.mutate({ noteId: 'note-1', photoUrl: null })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.storage.from).not.toHaveBeenCalled()
  })

  it('shows success toast on success', async () => {
    mockSupabaseDelete()
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useDeleteNote(), { wrapper })

    await act(async () => {
      result.current.mutate({ noteId: 'note-1', photoUrl: null })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('Note supprimée')
  })

  it('shows error toast on failure', async () => {
    mockSupabaseDelete(new Error('Delete failed'))
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useDeleteNote(), { wrapper })

    await act(async () => {
      result.current.mutate({ noteId: 'note-1', photoUrl: null })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Erreur lors de la suppression de la note')
  })

  it('invalidates notes and lots queries on settled', async () => {
    mockSupabaseDelete()
    const { qc, wrapper } = createWrapper()
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')

    const { result } = renderHook(() => useDeleteNote(), { wrapper })

    await act(async () => {
      result.current.mutate({ noteId: 'note-1', photoUrl: null })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['notes'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['lots'] })
  })
})
