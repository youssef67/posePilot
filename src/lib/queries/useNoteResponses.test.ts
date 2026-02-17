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
import { useNoteResponses } from './useNoteResponses'

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children)
}

function mockQuery(data: unknown[], error: Error | null = null) {
  const mockOrder = vi.fn().mockResolvedValue({ data, error })
  const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
  vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)
  return { mockSelect, mockEq, mockOrder }
}

describe('useNoteResponses', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches responses by noteId ordered by created_at ASC', async () => {
    const responses = [
      { id: 'r-1', note_id: 'note-1', content: 'Fixé', created_by: 'u-1', created_by_email: 'a@t.fr', created_at: '2026-02-15T10:00:00Z' },
      { id: 'r-2', note_id: 'note-1', content: 'Vérifié', created_by: 'u-2', created_by_email: 'b@t.fr', created_at: '2026-02-15T11:00:00Z' },
    ]
    const { mockEq, mockOrder } = mockQuery(responses)

    const { result } = renderHook(() => useNoteResponses('note-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('note_responses')
    expect(mockEq).toHaveBeenCalledWith('note_id', 'note-1')
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: true })
    expect(result.current.data).toEqual(responses)
  })

  it('is disabled when noteId is null', () => {
    const { result } = renderHook(() => useNoteResponses(null), { wrapper: createWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
  })

  it('throws on supabase error', async () => {
    mockQuery([], new Error('DB error'))

    const { result } = renderHook(() => useNoteResponses('note-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
