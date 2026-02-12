import { useCallback, useState } from 'react'
import { Circle, Clock, CheckCircle2 } from 'lucide-react'
import type { TaskStatus } from '@/types/enums'
import { cn } from '@/lib/utils'

const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  not_started: 'in_progress',
  in_progress: 'done',
  done: 'not_started',
}

const STATUS_ICONS = {
  not_started: Circle,
  in_progress: Clock,
  done: CheckCircle2,
} as const

const STATUS_COLOR_CLASSES: Record<TaskStatus, string> = {
  not_started: 'text-tap-not-started',
  in_progress: 'text-tap-in-progress',
  done: 'text-tap-done',
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: 'pas commencé',
  in_progress: 'en cours',
  done: 'fait',
}

const NEXT_LABELS: Record<TaskStatus, string> = {
  not_started: 'en cours',
  in_progress: 'fait',
  done: 'pas commencé',
}

interface TapCycleButtonProps {
  status: TaskStatus
  onCycle: (newStatus: TaskStatus) => void
  disabled?: boolean
}

export function TapCycleButton({ status, onCycle, disabled }: TapCycleButtonProps) {
  const [animating, setAnimating] = useState(false)
  const Icon = STATUS_ICONS[status]

  const handleCycle = useCallback(() => {
    if (disabled) return
    // Haptic feedback
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }
    // Trigger animation
    setAnimating(true)
    setTimeout(() => setAnimating(false), 200)
    onCycle(NEXT_STATUS[status])
  }, [disabled, onCycle, status])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleCycle()
      }
    },
    [handleCycle],
  )

  return (
    <button
      type="button"
      role="button"
      aria-label={`Statut : ${STATUS_LABELS[status]}. Taper pour passer à ${NEXT_LABELS[status]}`}
      aria-disabled={disabled || undefined}
      onClick={handleCycle}
      onKeyDown={handleKeyDown}
      className={cn(
        'min-h-12 min-w-12 flex items-center justify-center rounded-full',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        animating && 'motion-safe:animate-tap-cycle',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <Icon
        className={cn('size-[44px]', STATUS_COLOR_CLASSES[status])}
      />
    </button>
  )
}
