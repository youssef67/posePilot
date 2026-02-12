import type { ReactNode } from 'react'
import { AlertTriangle, FileWarning } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export const STATUS_COLORS = {
  NOT_STARTED: '#64748B',
  IN_PROGRESS: '#F59E0B',
  DONE: '#10B981',
  BLOCKED: '#EF4444',
} as const

interface StatusCardProps {
  title: string
  subtitle?: string
  secondaryInfo?: string
  statusColor: string
  indicator?: ReactNode
  badge?: ReactNode
  isBlocked?: boolean
  hasMissingDocs?: boolean
  onClick?: () => void
  className?: string
  role?: string
  'aria-label'?: string
}

export function StatusCard({
  title,
  subtitle,
  secondaryInfo,
  statusColor,
  indicator,
  badge,
  isBlocked,
  hasMissingDocs,
  onClick,
  className,
  role,
  'aria-label': ariaLabel,
}: StatusCardProps) {
  const effectiveColor = isBlocked ? STATUS_COLORS.BLOCKED : statusColor

  return (
    <Card
      role={role}
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        'relative overflow-hidden pl-2 py-4 min-h-[72px]',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      <div
        data-testid="status-bar"
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ backgroundColor: effectiveColor }}
      />
      <CardContent className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-card-foreground truncate">{title}</span>
            {isBlocked && (
              <AlertTriangle className="size-4 shrink-0 text-destructive" aria-label="Bloqué" />
            )}
            {hasMissingDocs && (
              <FileWarning className="size-4 shrink-0 text-amber-500" aria-label="Documents manquants" />
            )}
          </div>
          {subtitle && (
            <span className="text-sm text-muted-foreground truncate">{subtitle}</span>
          )}
          {badge && <div className="mt-0.5">{badge}</div>}
          {secondaryInfo && (
            <span className="text-xs text-muted-foreground">{secondaryInfo}</span>
          )}
        </div>
        {indicator && (
          <span className="shrink-0 text-sm font-medium text-muted-foreground">
            {indicator}
          </span>
        )}
      </CardContent>
    </Card>
  )
}

export function StatusCardSkeleton() {
  return (
    <Card aria-hidden="true" className="relative overflow-hidden pl-2 py-4 min-h-[72px] animate-pulse">
      <div
        data-testid="status-bar"
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-muted"
      />
      <CardContent className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-1.5">
          <div className="h-4 w-40 rounded bg-muted" />
          <div className="h-3 w-20 rounded bg-muted" />
        </div>
        <div className="h-4 w-8 rounded bg-muted" />
      </CardContent>
    </Card>
  )
}
