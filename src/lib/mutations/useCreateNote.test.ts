import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: { getUser: vi.fn() },
  },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useCreateNote } from './useCreateNote'

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
}

function createWrapper(queryClient?: QueryClient) {
  const qc = queryClient ?? createQueryClient()
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children)
}

function mockSupabaseInsert(data: unknown) {
  const mockSingle = vi.fn().mockResolvedValue({ data, error: null })
  const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
  const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
  vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never)
  vi.mocked(supabase.auth.getUser).mockResolvedValue({
    data: { user: { id: 'user-1', email: 'bruno@test.fr' } },
  } as never)
  return { mockInsert, mockSelect, mockSingle }
}

describe('useCreateNote', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('inserts note with content, is_blocking, lot_id, and created_by', async () => {
    const { mockInsert } = mockSupabaseInsert({
      id: 'note-1',
      content: 'Fissure',
      is_blocking: true,
      lot_id: 'lot-1',
      piece_id: null,
      created_by: 'user-1',
      created_by_email: 'bruno@test.fr',
      created_at: '2026-02-10T10:00:00Z',
    })

    const { result } = renderHook(() => useCreateNote(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ content: 'Fissure', isBlocking: true, lotId: 'lot-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('notes')
    expect(mockInsert).toHaveBeenCalledWith({
      content: 'Fissure',
      is_blocking: true,
      lot_id: 'lot-1',
      piece_id: null,
      created_by: 'user-1',
      created_by_email: 'bruno@test.fr',
    })
  })

  it('inserts note with piece_id when pieceId provided', async () => {
    const { mockInsert } = mockSupabaseInsert({
      id: 'note-2',
      content: 'Note pièce',
      is_blocking: false,
      lot_id: null,
      piece_id: 'piece-1',
      created_by: 'user-1',
      created_by_email: 'bruno@test.fr',
      created_at: '2026-02-10T10:00:00Z',
    })

    const { result } = renderHook(() => useCreateNote(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ content: 'Note pièce', isBlocking: false, pieceId: 'piece-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockInsert).toHaveBeenCalledWith({
      content: 'Note pièce',
      is_blocking: false,
      lot_id: null,
      piece_id: 'piece-1',
      created_by: 'user-1',
      created_by_email: 'bruno@test.fr',
    })
  })

  it('shows success toast on success', async () => {
    mockSupabaseInsert({ id: 'note-1', content: 'Test' })

    const { result } = renderHook(() => useCreateNote(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ content: 'Test', isBlocking: false, lotId: 'lot-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('Note créée')
  })

  it('returns created note data with id for chaining', async () => {
    const noteData = {
      id: 'note-returned',
      content: 'Chain test',
      is_blocking: false,
      lot_id: 'lot-1',
      piece_id: null,
      created_by: 'user-1',
      created_by_email: 'bruno@test.fr',
      photo_url: null,
      created_at: '2026-02-10T10:00:00Z',
    }
    mockSupabaseInsert(noteData)

    const { result } = renderHook(() => useCreateNote(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ content: 'Chain test', isBlocking: false, lotId: 'lot-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toMatchObject({ id: 'note-returned', content: 'Chain test' })
  })

  it('shows error toast and rolls back cache on failure', async () => {
    const queryClient = createQueryClient()
    const previousNotes = [{ id: 'existing', content: 'Existing note' }]
    queryClient.setQueryData(['notes', { lotId: 'lot-1', pieceId: undefined }], previousNotes)

    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: new Error('Insert failed'),
    })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never)
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-1', email: 'bruno@test.fr' } },
    } as never)

    const { result } = renderHook(() => useCreateNote(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ content: 'Fail', isBlocking: false, lotId: 'lot-1' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(toast.error).toHaveBeenCalledWith('Erreur lors de la création de la note')
    const cachedData = queryClient.getQueryData(['notes', { lotId: 'lot-1', pieceId: undefined }])
    expect(cachedData).toEqual(previousNotes)
  })

  it('invalidates notes and lots queries on settled', async () => {
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    mockSupabaseInsert({ id: 'note-1', content: 'Test' })

    const { result } = renderHook(() => useCreateNote(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ content: 'Test', isBlocking: false, lotId: 'lot-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['notes', { lotId: 'lot-1', pieceId: undefined }] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['lots'] })
  })

  it('applies optimistic update on mutate', async () => {
    const queryClient = createQueryClient()
    queryClient.setQueryData(['notes', { lotId: 'lot-1', pieceId: undefined }], [])

    // Slow insert to capture optimistic state
    let resolveInsert: (value: unknown) => void
    const mockSingle = vi.fn(() => new Promise((resolve) => { resolveInsert = resolve }))
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never)
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-1', email: 'bruno@test.fr' } },
    } as never)

    const { result } = renderHook(() => useCreateNote(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => {
      result.current.mutate({ content: 'Optimistic', isBlocking: true, lotId: 'lot-1' })
    })

    await waitFor(() => {
      const cached = queryClient.getQueryData(['notes', { lotId: 'lot-1', pieceId: undefined }]) as unknown[]
      expect(cached).toHaveLength(1)
      expect(cached[0]).toMatchObject({
        content: 'Optimistic',
        is_blocking: true,
        lot_id: 'lot-1',
        created_by_email: 'vous',
      })
    })

    await act(async () => {
      resolveInsert!({ data: { id: 'note-1' }, error: null })
    })
  })
})
