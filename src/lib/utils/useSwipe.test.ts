import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSwipe } from './useSwipe'

function createPointerEvent(overrides: Partial<PointerEvent> = {}): React.PointerEvent {
  return {
    clientX: 0,
    clientY: 0,
    pointerId: 1,
    ...overrides,
  } as unknown as React.PointerEvent
}

describe('useSwipe', () => {
  it('calls onSwipe("left") when swiping left past threshold', () => {
    const onSwipe = vi.fn()
    const { result } = renderHook(() => useSwipe({ onSwipe }))

    act(() => {
      result.current.onPointerDown(createPointerEvent({ clientX: 200, clientY: 300 }))
      result.current.onPointerMove(createPointerEvent({ clientX: 100, clientY: 300 }))
      result.current.onPointerUp(createPointerEvent({ clientX: 100, clientY: 300 }))
    })

    expect(onSwipe).toHaveBeenCalledWith('left')
    expect(onSwipe).toHaveBeenCalledTimes(1)
  })

  it('calls onSwipe("right") when swiping right past threshold', () => {
    const onSwipe = vi.fn()
    const { result } = renderHook(() => useSwipe({ onSwipe }))

    act(() => {
      result.current.onPointerDown(createPointerEvent({ clientX: 200, clientY: 300 }))
      result.current.onPointerMove(createPointerEvent({ clientX: 300, clientY: 300 }))
      result.current.onPointerUp(createPointerEvent({ clientX: 300, clientY: 300 }))
    })

    expect(onSwipe).toHaveBeenCalledWith('right')
    expect(onSwipe).toHaveBeenCalledTimes(1)
  })

  it('does not trigger swipe when deltaX is below threshold', () => {
    const onSwipe = vi.fn()
    const { result } = renderHook(() => useSwipe({ onSwipe }))

    act(() => {
      result.current.onPointerDown(createPointerEvent({ clientX: 200, clientY: 300 }))
      result.current.onPointerMove(createPointerEvent({ clientX: 180, clientY: 300 }))
      result.current.onPointerUp(createPointerEvent({ clientX: 180, clientY: 300 }))
    })

    expect(onSwipe).not.toHaveBeenCalled()
  })

  it('ignores primarily vertical gestures (deltaY > deltaX)', () => {
    const onSwipe = vi.fn()
    const { result } = renderHook(() => useSwipe({ onSwipe }))

    act(() => {
      result.current.onPointerDown(createPointerEvent({ clientX: 200, clientY: 200 }))
      result.current.onPointerMove(createPointerEvent({ clientX: 140, clientY: 400 }))
      result.current.onPointerUp(createPointerEvent({ clientX: 140, clientY: 400 }))
    })

    expect(onSwipe).not.toHaveBeenCalled()
  })

  it('triggers swipe via high velocity even below distance threshold', () => {
    const onSwipe = vi.fn()
    const { result } = renderHook(() => useSwipe({ onSwipe }))

    // Simulate a fast but short swipe using mocked Date.now
    const start = 1000
    vi.spyOn(Date, 'now').mockReturnValueOnce(start)

    act(() => {
      result.current.onPointerDown(createPointerEvent({ clientX: 200, clientY: 300 }))
    })

    // 30px in 30ms = 1px/ms velocity > 0.5 threshold
    vi.spyOn(Date, 'now').mockReturnValueOnce(start + 30)

    act(() => {
      result.current.onPointerMove(createPointerEvent({ clientX: 170, clientY: 300 }))
      result.current.onPointerUp(createPointerEvent({ clientX: 170, clientY: 300 }))
    })

    expect(onSwipe).toHaveBeenCalledWith('left')
  })

  it('respects custom threshold', () => {
    const onSwipe = vi.fn()
    const { result } = renderHook(() => useSwipe({ onSwipe, threshold: 100 }))

    act(() => {
      result.current.onPointerDown(createPointerEvent({ clientX: 200, clientY: 300 }))
      result.current.onPointerMove(createPointerEvent({ clientX: 120, clientY: 300 }))
      result.current.onPointerUp(createPointerEvent({ clientX: 120, clientY: 300 }))
    })

    // 80px < 100px threshold
    expect(onSwipe).not.toHaveBeenCalled()
  })

  it('does not trigger on pointer up without pointer down', () => {
    const onSwipe = vi.fn()
    const { result } = renderHook(() => useSwipe({ onSwipe }))

    act(() => {
      result.current.onPointerUp(createPointerEvent({ clientX: 100, clientY: 300 }))
    })

    expect(onSwipe).not.toHaveBeenCalled()
  })

  it('does not trigger swipe for micro-movement even with high velocity', () => {
    const onSwipe = vi.fn()
    const { result } = renderHook(() => useSwipe({ onSwipe }))

    // 2px in 1ms = 2px/ms velocity > 0.5, but distance < 10px minimum
    const start = 1000
    vi.spyOn(Date, 'now').mockReturnValueOnce(start)

    act(() => {
      result.current.onPointerDown(createPointerEvent({ clientX: 200, clientY: 300 }))
    })

    vi.spyOn(Date, 'now').mockReturnValueOnce(start + 1)

    act(() => {
      result.current.onPointerMove(createPointerEvent({ clientX: 198, clientY: 300 }))
      result.current.onPointerUp(createPointerEvent({ clientX: 198, clientY: 300 }))
    })

    expect(onSwipe).not.toHaveBeenCalled()
  })

  it('only fires onSwipe once per gesture', () => {
    const onSwipe = vi.fn()
    const { result } = renderHook(() => useSwipe({ onSwipe }))

    act(() => {
      result.current.onPointerDown(createPointerEvent({ clientX: 200, clientY: 300 }))
      result.current.onPointerMove(createPointerEvent({ clientX: 100, clientY: 300 }))
      result.current.onPointerUp(createPointerEvent({ clientX: 100, clientY: 300 }))
    })

    // Second gesture
    act(() => {
      result.current.onPointerDown(createPointerEvent({ clientX: 200, clientY: 300 }))
      result.current.onPointerMove(createPointerEvent({ clientX: 100, clientY: 300 }))
      result.current.onPointerUp(createPointerEvent({ clientX: 100, clientY: 300 }))
    })

    expect(onSwipe).toHaveBeenCalledTimes(2)
  })
})
