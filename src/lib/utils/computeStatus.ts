import type { STATUS_COLORS } from '@/components/StatusCard'

export function computeStatus(done: number, total: number): keyof typeof STATUS_COLORS {
  if (total === 0) return 'NOT_STARTED'
  if (done === total) return 'DONE'
  if (done > 0) return 'IN_PROGRESS'
  return 'NOT_STARTED'
}
