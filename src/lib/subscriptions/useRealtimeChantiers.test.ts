import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { createElement } from 'react'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'

vi.mock('@/lib/supabase', () => {
  const mockSubscribe = vi.fn().mockReturnValue({ id: 'test-channel' })
  const mockOn = vi.fn().mockReturnValue({ subscribe: mockSubscribe })
  const mockChannel = vi.fn().mockReturnValue({ on: mockOn })
  const mockRemoveChannel = vi.fn()

  return {
    supabase: {
      channel: mockChannel,
      removeChannel: mockRemoveChannel,
    },
  }
})

import { supabase } from '@/lib/supabase'
import { useRealtimeChantiers } from './useRealtimeChantiers'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('useRealtimeChantiers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Re-setup mocks after clear
    const mockSubscribe = vi.fn().mockReturnValue({ id: 'test-channel' })
    const mockOn = vi.fn().mockReturnValue({ subscribe: mockSubscribe })
    vi.mocked(supabase.channel).mockReturnValue({ on: mockOn } as never)
  })

  it('subscribes to chantiers-changes channel on mount', () => {
    renderHook(() => useRealtimeChantiers(), { wrapper: createWrapper() })

    expect(supabase.channel).toHaveBeenCalledWith('chantiers-changes')
  })

  it('listens to postgres_changes on chantiers table', () => {
    renderHook(() => useRealtimeChantiers(), { wrapper: createWrapper() })

    const channelReturn = vi.mocked(supabase.channel).mock.results[0].value
    expect(channelReturn.on).toHaveBeenCalledWith(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'chantiers' },
      expect.any(Function),
    )
  })

  it('calls subscribe after setting up listener', () => {
    renderHook(() => useRealtimeChantiers(), { wrapper: createWrapper() })

    const channelReturn = vi.mocked(supabase.channel).mock.results[0].value
    const onReturn = channelReturn.on.mock.results[0].value
    expect(onReturn.subscribe).toHaveBeenCalled()
  })

  it('removes channel on unmount (cleanup)', () => {
    const { unmount } = renderHook(() => useRealtimeChantiers(), {
      wrapper: createWrapper(),
    })

    unmount()

    expect(supabase.removeChannel).toHaveBeenCalled()
  })

  it('invalidates chantiers query when realtime callback fires', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    function Wrapper({ children }: { children: React.ReactNode }) {
      return createElement(QueryClientProvider, { client: queryClient }, children)
    }

    renderHook(() => useRealtimeChantiers(), { wrapper: Wrapper })

    // Extract the callback passed to .on()
    const channelReturn = vi.mocked(supabase.channel).mock.results[0].value
    const onCallback = channelReturn.on.mock.calls[0][2]

    // Simulate a realtime event
    onCallback({})

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['chantiers'] })
  })
})
