import { Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatRelativeTime } from '@/lib/utils/formatRelativeTime'
import { useAuth } from '@/lib/auth'
import type { Besoin } from '@/types/database'

interface BesoinsListProps {
  besoins: Besoin[] | undefined
  isLoading: boolean
  onOpenSheet: () => void
  onCommander: (besoin: Besoin) => void
}

function getAuthorInitial(
  createdBy: string | null,
  currentUserId: string | undefined,
  currentUserEmail: string | undefined,
): string {
  if (!createdBy) return '?'
  if (createdBy === currentUserId && currentUserEmail) {
    return currentUserEmail.charAt(0).toUpperCase()
  }
  return '?'
}

export function BesoinsList({ besoins, isLoading, onOpenSheet, onCommander }: BesoinsListProps) {
  const { user } = useAuth()

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border p-4 animate-pulse">
            <div className="h-4 w-3/4 rounded bg-muted mb-2" />
            <div className="h-3 w-1/2 rounded bg-muted" />
          </div>
        ))}
      </div>
    )
  }

  if (besoins && besoins.length > 0) {
    return (
      <div className="space-y-3">
        {besoins.map((besoin) => (
          <div
            key={besoin.id}
            className="rounded-lg border border-border p-4"
          >
            <p className="text-sm font-medium text-foreground">
              {besoin.description}
            </p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {getAuthorInitial(besoin.created_by, user?.id, user?.email ?? undefined)}
                {' · '}
                {formatRelativeTime(besoin.created_at)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCommander(besoin)}
              >
                Commander
              </Button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <Package className="h-10 w-10 text-muted-foreground opacity-40" />
      <p className="text-muted-foreground">Aucun besoin en attente</p>
      <Button variant="outline" onClick={onOpenSheet}>
        Créer un besoin
      </Button>
    </div>
  )
}
