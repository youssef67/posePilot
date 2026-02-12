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
import { useRealtimeNotes } from './useRealtimeNotes'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('useRealtimeNotes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const mockSubscribe = vi.fn().mockReturnValue({ id: 'test-channel' })
    const mockOn = vi.fn().mockReturnValue({ subscribe: mockSubscribe })
    vi.mocked(supabase.channel).mockReturnValue({ on: mockOn } as never)
  })

  it('subscribes to notes-changes-lot-{targetId} channel for lot type', () => {
    renderHook(() => useRealtimeNotes('lot-1', 'lot'), { wrapper: createWrapper() })

    expect(supabase.channel).toHaveBeenCalledWith('notes-changes-lot-lot-1')
  })

  it('subscribes to notes-changes-piece-{targetId} channel for piece type', () => {
    renderHook(() => useRealtimeNotes('piece-1', 'piece'), { wrapper: createWrapper() })

    expect(supabase.channel).toHaveBeenCalledWith('notes-changes-piece-piece-1')
  })

  it('listens to postgres_changes on notes table', () => {
    renderHook(() => useRealtimeNotes('lot-1', 'lot'), { wrapper: createWrapper() })

    const channelReturn = vi.mocked(supabase.channel).mock.results[0].value
    expect(channelReturn.on).toHaveBeenCalledWith(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'notes' },
      expect.any(Function),
    )
  })

  it('calls subscribe after setting up listener', () => {
    renderHook(() => useRealtimeNotes('lot-1', 'lot'), { wrapper: createWrapper() })

    const channelReturn = vi.mocked(supabase.channel).mock.results[0].value
    const onReturn = channelReturn.on.mock.results[0].value
    expect(onReturn.subscribe).toHaveBeenCalled()
  })

  it('removes channel on unmount', () => {
    const { unmount } = renderHook(() => useRealtimeNotes('lot-1', 'lot'), {
      wrapper: createWrapper(),
    })

    unmount()

    expect(supabase.removeChannel).toHaveBeenCalled()
  })

  it('invalidates notes and lots queries when realtime callback fires for lot', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    function Wrapper({ children }: { children: React.ReactNode }) {
      return createElement(QueryClientProvider, { client: queryClient }, children)
    }

    renderHook(() => useRealtimeNotes('lot-1', 'lot'), { wrapper: Wrapper })

    const channelReturn = vi.mocked(supabase.channel).mock.results[0].value
    const onCallback = channelReturn.on.mock.calls[0][2]
    onCallback({})

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['notes', { lotId: 'lot-1', pieceId: undefined }] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['lots'] })
  })

  it('invalidates notes with pieceId when realtime callback fires for piece', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    function Wrapper({ children }: { children: React.ReactNode }) {
      return createElement(QueryClientProvider, { client: queryClient }, children)
    }

    renderHook(() => useRealtimeNotes('piece-1', 'piece'), { wrapper: Wrapper })

    const channelReturn = vi.mocked(supabase.channel).mock.results[0].value
    const onCallback = channelReturn.on.mock.calls[0][2]
    onCallback({})

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['notes', { lotId: undefined, pieceId: 'piece-1' }] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['lots'] })
  })
})
