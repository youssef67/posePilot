import { useCallback, useEffect, useRef } from 'react'

interface UseSwipeOptions {
  onSwipe: (direction: 'left' | 'right') => void
  threshold?: number
}

interface SwipeHandlers {
  onPointerDown: (e: React.PointerEvent) => void
  onPointerMove: (e: React.PointerEvent) => void
  onPointerUp: (e: React.PointerEvent) => void
}

export function useSwipe({ onSwipe, threshold = 50 }: UseSwipeOptions): SwipeHandlers {
  const startRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const onSwipeRef = useRef(onSwipe)
  useEffect(() => {
    onSwipeRef.current = onSwipe
  })

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    startRef.current = { x: e.clientX, y: e.clientY, time: Date.now() }
  }, [])

  const onPointerMove = useCallback(() => {
    // Tracking is done on pointer up using start vs end positions
  }, [])

  const MIN_VELOCITY_DISTANCE = 10

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!startRef.current) return

      const deltaX = e.clientX - startRef.current.x
      const deltaY = e.clientY - startRef.current.y
      const elapsed = Date.now() - startRef.current.time
      const velocity = elapsed > 0 ? Math.abs(deltaX) / elapsed : 0

      startRef.current = null

      // Ignore primarily vertical gestures
      if (Math.abs(deltaY) > Math.abs(deltaX)) return

      // Trigger if distance threshold met OR velocity threshold met (with minimum distance)
      if (Math.abs(deltaX) >= threshold || (Math.abs(deltaX) >= MIN_VELOCITY_DISTANCE && velocity > 0.5)) {
        onSwipeRef.current(deltaX < 0 ? 'left' : 'right')
      }
    },
    [threshold],
  )

  return { onPointerDown, onPointerMove, onPointerUp }
}
