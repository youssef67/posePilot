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
import { useRealtimeEtages } from './useRealtimeEtages'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('useRealtimeEtages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const mockSubscribe = vi.fn().mockReturnValue({ id: 'test-channel' })
    const mockOn = vi.fn().mockReturnValue({ subscribe: mockSubscribe })
    vi.mocked(supabase.channel).mockReturnValue({ on: mockOn } as never)
  })

  it('subscribes to etages-changes-{plotId} channel on mount', () => {
    renderHook(() => useRealtimeEtages('plot-1'), { wrapper: createWrapper() })

    expect(supabase.channel).toHaveBeenCalledWith('etages-changes-plot-1')
  })

  it('listens to postgres_changes on etages table', () => {
    renderHook(() => useRealtimeEtages('plot-1'), { wrapper: createWrapper() })

    const channelReturn = vi.mocked(supabase.channel).mock.results[0].value
    expect(channelReturn.on).toHaveBeenCalledWith(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'etages' },
      expect.any(Function),
    )
  })

  it('calls subscribe after setting up listener', () => {
    renderHook(() => useRealtimeEtages('plot-1'), { wrapper: createWrapper() })

    const channelReturn = vi.mocked(supabase.channel).mock.results[0].value
    const onReturn = channelReturn.on.mock.results[0].value
    expect(onReturn.subscribe).toHaveBeenCalled()
  })

  it('removes channel on unmount', () => {
    const { unmount } = renderHook(() => useRealtimeEtages('plot-1'), {
      wrapper: createWrapper(),
    })

    unmount()

    expect(supabase.removeChannel).toHaveBeenCalled()
  })

  it('invalidates etages query when realtime callback fires', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    function Wrapper({ children }: { children: React.ReactNode }) {
      return createElement(QueryClientProvider, { client: queryClient }, children)
    }

    renderHook(() => useRealtimeEtages('plot-1'), { wrapper: Wrapper })

    const channelReturn = vi.mocked(supabase.channel).mock.results[0].value
    const onCallback = channelReturn.on.mock.calls[0][2]
    onCallback({})

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['etages', 'plot-1'] })
  })
})
