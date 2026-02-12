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
import { useUnreadActivityCount, getLastSeenAt, setLastSeenAt } from './useUnreadActivityCount'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useUnreadActivityCount', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('fetches unread count excluding current user', async () => {
    localStorage.setItem('posePilot_lastActivitySeenAt', '2026-02-10T08:00:00Z')

    const mockNeq = vi.fn().mockResolvedValue({ count: 5, error: null })
    const mockGt = vi.fn().mockReturnValue({ neq: mockNeq })
    const mockSelect = vi.fn().mockReturnValue({ gt: mockGt })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useUnreadActivityCount('user-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('activity_logs')
    expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact', head: true })
    expect(mockGt).toHaveBeenCalledWith('created_at', '2026-02-10T08:00:00Z')
    expect(mockNeq).toHaveBeenCalledWith('actor_id', 'user-1')
    expect(result.current.data).toBe(5)
  })

  it('returns 0 when count is null', async () => {
    const mockNeq = vi.fn().mockResolvedValue({ count: null, error: null })
    const mockGt = vi.fn().mockReturnValue({ neq: mockNeq })
    const mockSelect = vi.fn().mockReturnValue({ gt: mockGt })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useUnreadActivityCount('user-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBe(0)
  })

  it('uses fallback lastSeenAt when no localStorage value', async () => {
    const mockNeq = vi.fn().mockResolvedValue({ count: 10, error: null })
    const mockGt = vi.fn().mockReturnValue({ neq: mockNeq })
    const mockSelect = vi.fn().mockReturnValue({ gt: mockGt })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useUnreadActivityCount('user-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGt).toHaveBeenCalledWith('created_at', '1970-01-01T00:00:00.000Z')
  })

  it('is disabled when userId is empty', () => {
    const { result } = renderHook(() => useUnreadActivityCount(''), { wrapper: createWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('returns error on supabase failure', async () => {
    const mockNeq = vi.fn().mockResolvedValue({ count: null, error: new Error('DB error') })
    const mockGt = vi.fn().mockReturnValue({ neq: mockNeq })
    const mockSelect = vi.fn().mockReturnValue({ gt: mockGt })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useUnreadActivityCount('user-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('DB error')
  })
})

describe('getLastSeenAt', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns stored value from localStorage', () => {
    localStorage.setItem('posePilot_lastActivitySeenAt', '2026-02-10T10:00:00Z')
    expect(getLastSeenAt()).toBe('2026-02-10T10:00:00Z')
  })

  it('returns fallback when no stored value', () => {
    expect(getLastSeenAt()).toBe('1970-01-01T00:00:00.000Z')
  })
})

describe('setLastSeenAt', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('stores value in localStorage', () => {
    setLastSeenAt('2026-02-10T12:00:00Z')
    expect(localStorage.getItem('posePilot_lastActivitySeenAt')).toBe('2026-02-10T12:00:00Z')
  })
})
