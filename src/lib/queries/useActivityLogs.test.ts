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
import { useActivityLogs } from './useActivityLogs'

const mockLogs = [
  {
    id: 'log-1',
    event_type: 'task_status_changed',
    actor_id: 'user-2',
    actor_email: 'bruno@test.fr',
    chantier_id: 'chantier-1',
    target_type: 'piece',
    target_id: 'piece-1',
    metadata: { piece_nom: 'Séjour', lot_code: '203', old_status: 'in_progress', new_status: 'done' },
    created_at: '2026-02-10T10:00:00Z',
  },
  {
    id: 'log-2',
    event_type: 'note_added',
    actor_id: 'user-2',
    actor_email: 'bruno@test.fr',
    chantier_id: 'chantier-1',
    target_type: 'piece',
    target_id: 'piece-2',
    metadata: { content_preview: 'Fissure au plaf...', lot_code: '205', piece_nom: 'SDB' },
    created_at: '2026-02-10T08:00:00Z',
  },
]

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useActivityLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches activity logs excluding current user', async () => {
    const mockLimit = vi.fn().mockResolvedValue({ data: mockLogs, error: null })
    const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit })
    const mockNeq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ neq: mockNeq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useActivityLogs('user-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('activity_logs')
    expect(mockSelect).toHaveBeenCalledWith('*')
    expect(mockNeq).toHaveBeenCalledWith('actor_id', 'user-1')
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(mockLimit).toHaveBeenCalledWith(100)
    expect(result.current.data).toEqual(mockLogs)
  })

  it('is disabled when userId is empty', () => {
    const { result } = renderHook(() => useActivityLogs(''), { wrapper: createWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('uses correct query key', async () => {
    const mockLimit = vi.fn().mockResolvedValue({ data: mockLogs, error: null })
    const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit })
    const mockNeq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ neq: mockNeq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useActivityLogs('user-1'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const cached = queryClient.getQueryData(['activity_logs', { userId: 'user-1' }])
    expect(cached).toEqual(mockLogs)
  })

  it('returns error on supabase failure', async () => {
    const mockLimit = vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') })
    const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit })
    const mockNeq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ neq: mockNeq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useActivityLogs('user-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('DB error')
  })
})
