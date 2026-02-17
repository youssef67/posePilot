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
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useUpdateNote } from './useUpdateNote'

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

function mockSupabaseUpdate(error: Error | null = null) {
  const mockEq = vi.fn().mockResolvedValue({ error })
  const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
  vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)
  return { mockUpdate, mockEq }
}

describe('useUpdateNote', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates note content and is_blocking via supabase', async () => {
    const { mockUpdate, mockEq } = mockSupabaseUpdate()
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useUpdateNote(), { wrapper })

    await act(async () => {
      result.current.mutate({ noteId: 'note-1', content: 'Updated', isBlocking: true })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('notes')
    expect(mockUpdate).toHaveBeenCalledWith({ content: 'Updated', is_blocking: true })
    expect(mockEq).toHaveBeenCalledWith('id', 'note-1')
  })

  it('shows success toast on success', async () => {
    mockSupabaseUpdate()
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useUpdateNote(), { wrapper })

    await act(async () => {
      result.current.mutate({ noteId: 'note-1', content: 'Test', isBlocking: false })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('Note modifiée')
  })

  it('shows error toast on failure', async () => {
    mockSupabaseUpdate(new Error('Update failed'))
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useUpdateNote(), { wrapper })

    await act(async () => {
      result.current.mutate({ noteId: 'note-1', content: 'Fail', isBlocking: false })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith('Erreur lors de la modification de la note')
  })

  it('invalidates notes and lots queries on settled', async () => {
    mockSupabaseUpdate()
    const { qc, wrapper } = createWrapper()
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateNote(), { wrapper })

    await act(async () => {
      result.current.mutate({ noteId: 'note-1', content: 'Test', isBlocking: false })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['notes'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['lots'] })
  })
})
