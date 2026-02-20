import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue({}),
      }),
    }),
    removeChannel: vi.fn(),
  },
}))

import { supabase } from '@/lib/supabase'
import { useRealtimeAllPendingBesoins } from './useRealtimeAllPendingBesoins'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useRealtimeAllPendingBesoins', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.channel).mockReturnValue({
      on: vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue({}),
      }),
    } as never)
  })

  it('subscribes to besoins channel on mount', () => {
    renderHook(() => useRealtimeAllPendingBesoins(), { wrapper: createWrapper() })

    expect(supabase.channel).toHaveBeenCalledWith('besoins:all-pending')
    const channelMock = vi.mocked(supabase.channel).mock.results[0].value
    expect(channelMock.on).toHaveBeenCalledWith(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'besoins' },
      expect.any(Function),
    )
  })

  it('removes channel on unmount', () => {
    const { unmount } = renderHook(() => useRealtimeAllPendingBesoins(), { wrapper: createWrapper() })

    unmount()

    // subscribe() returns the channel object, which is what removeChannel receives
    expect(supabase.removeChannel).toHaveBeenCalled()
  })

  it('invalidates queries on change event', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    renderHook(() => useRealtimeAllPendingBesoins(), { wrapper })

    const channelMock = vi.mocked(supabase.channel).mock.results[0].value
    const callback = channelMock.on.mock.calls[0][2]
    callback()

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['all-pending-besoins'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['all-pending-besoins-count'] })
  })
})
