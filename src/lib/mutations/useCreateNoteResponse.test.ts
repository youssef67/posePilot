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
import { useCreateNoteResponse } from './useCreateNoteResponse'

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

function mockSupabaseInsert(error: Error | null = null) {
  const mockInsert = vi.fn().mockResolvedValue({ error })
  vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never)
  vi.mocked(supabase.auth.getUser).mockResolvedValue({
    data: { user: { id: 'user-1', email: 'youssef@test.fr' } },
  } as never)
  return { mockInsert }
}

describe('useCreateNoteResponse', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('inserts response with noteId, content, created_by', async () => {
    const { mockInsert } = mockSupabaseInsert()
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useCreateNoteResponse(), { wrapper })

    await act(async () => {
      result.current.mutate({ noteId: 'note-1', content: 'Problème résolu' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('note_responses')
    expect(mockInsert).toHaveBeenCalledWith({
      note_id: 'note-1',
      content: 'Problème résolu',
      created_by: 'user-1',
      created_by_email: 'youssef@test.fr',
    })
  })

  it('shows success toast on success', async () => {
    mockSupabaseInsert()
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useCreateNoteResponse(), { wrapper })

    await act(async () => {
      result.current.mutate({ noteId: 'note-1', content: 'Test' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('Réponse ajoutée')
  })

  it('shows error toast on failure', async () => {
    mockSupabaseInsert(new Error('Insert failed'))
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useCreateNoteResponse(), { wrapper })

    await act(async () => {
      result.current.mutate({ noteId: 'note-1', content: 'Fail' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith("Erreur lors de l'ajout de la réponse")
  })

  it('invalidates note_responses cache on success', async () => {
    mockSupabaseInsert()
    const { qc, wrapper } = createWrapper()
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')

    const { result } = renderHook(() => useCreateNoteResponse(), { wrapper })

    await act(async () => {
      result.current.mutate({ noteId: 'note-1', content: 'Test' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['note_responses', 'note-1'] })
  })
})
