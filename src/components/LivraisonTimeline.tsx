import { useState } from 'react'
import { ChevronDown, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StatusHistoryEntry } from '@/types/database'

const STATUS_LABELS: Record<string, string> = {
  prevu: 'Prévu',
  commande: 'Commandé',
  livraison_prevue: 'Livraison prévue',
  a_recuperer: 'À récupérer',
  receptionne: 'Réceptionné',
  recupere: 'Récupéré',
}

const STATUS_COLORS: Record<string, string> = {
  prevu: 'bg-slate-400',
  commande: 'bg-amber-500',
  livraison_prevue: 'bg-blue-500',
  a_recuperer: 'bg-violet-500',
  receptionne: 'bg-emerald-500',
  recupere: 'bg-emerald-500',
}

const dateTimeFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

interface LivraisonTimelineProps {
  history: StatusHistoryEntry[]
}

export function LivraisonTimeline({ history }: LivraisonTimelineProps) {
  const [expanded, setExpanded] = useState(false)

  if (!history || history.length === 0) return null

  return (
    <div className="border-t border-border pt-2 mt-1">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
        aria-expanded={expanded}
      >
        <Clock className="size-3.5" />
        <span>Historique ({history.length})</span>
        <ChevronDown className={cn('size-3.5 transition-transform ml-auto', expanded && 'rotate-180')} />
      </button>
      {expanded && (
        <div className="mt-2 ml-1.5 space-y-0">
          {history.map((entry, i) => {
            const isLast = i === history.length - 1
            return (
              <div key={`${entry.status}-${entry.date}`} className="flex gap-3 relative">
                <div className="flex flex-col items-center">
                  <div className={cn('size-2.5 rounded-full shrink-0 mt-1.5', STATUS_COLORS[entry.status] ?? 'bg-muted')} />
                  {!isLast && <div className="w-px flex-1 bg-border" />}
                </div>
                <div className={cn('pb-3', isLast && 'pb-0')}>
                  <span className="text-sm font-medium text-foreground">
                    {STATUS_LABELS[entry.status] ?? entry.status}
                  </span>
                  <span className="text-xs text-muted-foreground block">
                    {dateTimeFormatter.format(new Date(entry.date))}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
