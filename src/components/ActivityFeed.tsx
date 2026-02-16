import { Bell, CheckCircle2, Clock, Circle, MessageSquare, Camera, AlertTriangle, Package, Pencil, ShoppingCart, Trash2, Truck } from 'lucide-react'
import type { ActivityLog } from '@/types/database'
import { formatRelativeTime } from '@/lib/utils/formatRelativeTime'
import { groupByDay } from '@/lib/utils/groupByDay'

interface ActivityFeedProps {
  entries: ActivityLog[]
  lastSeenAt: string
  isLoading?: boolean
}

function getEventIcon(entry: ActivityLog) {
  switch (entry.event_type) {
    case 'task_status_changed': {
      const newStatus = entry.metadata.new_status
      if (newStatus === 'done') return <CheckCircle2 className="h-5 w-5 text-[#10B981]" />
      if (newStatus === 'in_progress') return <Clock className="h-5 w-5 text-[#F59E0B]" />
      return <Circle className="h-5 w-5 text-[#9CA3AF]" />
    }
    case 'note_added':
      return <MessageSquare className="h-5 w-5 text-[#3B82F6]" />
    case 'photo_added':
      return <Camera className="h-5 w-5 text-[#3B82F6]" />
    case 'blocking_noted':
      return <AlertTriangle className="h-5 w-5 text-[#EF4444]" />
    case 'besoin_added':
      return <Package className="h-5 w-5 text-[#9CA3AF]" />
    case 'besoin_ordered':
      return <ShoppingCart className="h-5 w-5 text-[#F59E0B]" />
    case 'besoin_updated':
      return <Pencil className="h-5 w-5 text-[#3B82F6]" />
    case 'besoin_deleted':
      return <Trash2 className="h-5 w-5 text-[#EF4444]" />
    case 'livraison_created':
      return <Truck className="h-5 w-5 text-[#F59E0B]" />
    case 'livraison_status_changed':
      return <Truck className="h-5 w-5 text-[#3B82F6]" />
    case 'livraison_updated':
      return <Pencil className="h-5 w-5 text-[#3B82F6]" />
    case 'livraison_deleted':
      return <Trash2 className="h-5 w-5 text-[#EF4444]" />
  }
}

function getAuthorName(email: string | null): string {
  if (!email) return '?'
  const local = email.split('@')[0]
  return local.charAt(0).toUpperCase() + local.slice(1)
}

function getAuthorInitial(email: string | null): string {
  if (!email) return '?'
  return email.charAt(0).toUpperCase()
}

function getActivityDescription(entry: ActivityLog): string {
  const name = getAuthorName(entry.actor_email)
  switch (entry.event_type) {
    case 'task_status_changed': {
      const piece = entry.metadata.piece_nom ?? ''
      if (entry.metadata.new_status === 'done') return `${name} a terminé ${piece}`
      if (entry.metadata.new_status === 'in_progress') return `${name} a commencé ${piece}`
      return `${name} a réinitialisé ${piece}`
    }
    case 'note_added':
      return `${name} a ajouté une note`
    case 'photo_added':
      return `${name} a ajouté une photo`
    case 'blocking_noted':
      return `${name} a signalé un blocage`
    case 'besoin_added':
      return `${name} a ajouté un besoin`
    case 'besoin_ordered':
      return `${name} a commandé un besoin`
    case 'besoin_updated':
      return `${name} a modifié un besoin`
    case 'besoin_deleted':
      return `${name} a supprimé un besoin`
    case 'livraison_created':
      return `${name} a créé une livraison`
    case 'livraison_status_changed':
      return `${name} a mis à jour une livraison`
    case 'livraison_updated':
      return `${name} a modifié une livraison`
    case 'livraison_deleted':
      return `${name} a supprimé une livraison`
  }
}

function getTargetLine(entry: ActivityLog): string {
  const parts: string[] = []
  if (entry.metadata.lot_code) parts.push(`Lot ${entry.metadata.lot_code}`)
  if (entry.metadata.description) parts.push(entry.metadata.description)
  parts.push(formatRelativeTime(entry.created_at))
  return parts.join(' · ')
}

export function ActivityFeed({ entries, lastSeenAt, isLoading }: ActivityFeedProps) {
  if (isLoading) {
    return (
      <div className="space-y-4 p-4" data-testid="activity-feed-skeleton">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 p-4 text-muted-foreground">
        <Bell className="h-10 w-10 opacity-40" />
        <p>Rien de nouveau</p>
      </div>
    )
  }

  const groups = groupByDay(entries)

  return (
    <div role="feed" aria-label="Fil d'activité">
      {groups.map((group) => (
        <div key={group.label}>
          <h2 className="sticky top-0 z-10 bg-background px-4 py-2 text-sm font-semibold text-muted-foreground">
            {group.label}
          </h2>
          {group.entries.map((entry) => {
            const isNew = entry.created_at > lastSeenAt
            const description = getActivityDescription(entry)
            const target = getTargetLine(entry)
            return (
              <article
                key={entry.id}
                aria-label={`${description} — ${target}`}
                className="flex items-start gap-3 border-b border-border px-4 py-3"
              >
                <div className="mt-0.5 flex-shrink-0">
                  {getEventIcon(entry)}
                </div>
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-foreground">
                  {getAuthorInitial(entry.actor_email)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">{description}</p>
                  <p className="text-xs text-muted-foreground">
                    {target}
                    {isNew && (
                      <span className="ml-2 inline-flex items-center rounded bg-[#3B82F6]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#3B82F6]">
                        Nouveau
                      </span>
                    )}
                  </p>
                </div>
              </article>
            )
          })}
        </div>
      ))}
    </div>
  )
}

