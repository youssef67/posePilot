import { cn } from '@/lib/utils'

interface PaginationDotsProps {
  total: number
  current: number
}

export function PaginationDots({ total, current }: PaginationDotsProps) {
  if (total <= 0) return null

  const safeCurrent = Math.max(0, Math.min(current, total - 1))

  return (
    <div
      className="flex items-center justify-center gap-1.5 py-3"
      role="status"
      aria-label={`Pièce ${safeCurrent + 1} sur ${total}`}
    >
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn(
            'size-2 rounded-full transition-colors',
            i === safeCurrent ? 'bg-foreground' : 'bg-muted-foreground/40',
          )}
        />
      ))}
    </div>
  )
}
