import { Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LivraisonDocumentSlot } from '@/components/LivraisonDocumentSlot'
import { formatRelativeTime } from '@/lib/utils/formatRelativeTime'
import { useAuth } from '@/lib/auth'
import type { Livraison } from '@/types/database'

const STATUS_CONFIG = {
  commande: { color: '#F59E0B', label: 'Commandé' },
  prevu: { color: '#3B82F6', label: 'Prévu' },
  livre: { color: '#10B981', label: 'Livré' },
} as const

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

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

interface DeliveryCardProps {
  livraison: Livraison
  chantierId: string
  onMarquerPrevu: (id: string) => void
  onConfirmerLivraison: (id: string) => void
  chantierNom?: string
  highlighted?: boolean
}

export function DeliveryCard({ livraison, chantierId, onMarquerPrevu, onConfirmerLivraison, chantierNom, highlighted }: DeliveryCardProps) {
  const { user } = useAuth()
  const config = STATUS_CONFIG[livraison.status]

  return (
    <Card className="relative overflow-hidden pl-2 py-4 min-h-[72px]">
      <div
        data-testid="status-bar"
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ backgroundColor: config.color }}
      />
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-card-foreground truncate">{livraison.description}</span>
          <span
            className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${config.color}20`, color: config.color }}
          >
            {config.label}
          </span>
        </div>
        {chantierNom && (
          <span className="text-xs text-muted-foreground">{chantierNom}</span>
        )}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
            <span>
              {getAuthorInitial(livraison.created_by, user?.id, user?.email ?? undefined)}
              {' · '}
              {formatRelativeTime(livraison.created_at)}
            </span>
            {livraison.date_prevue && (
              <span className="flex items-center gap-0.5 ml-2">
                <Calendar className="size-3" />
                {dateFormatter.format(new Date(livraison.date_prevue + 'T00:00:00'))}
              </span>
            )}
            {highlighted && (
              <Badge variant="secondary" className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 ml-1">Cette semaine</Badge>
            )}
            {livraison.bc_file_url && (
              <Badge variant="secondary" className="text-[10px] text-emerald-600 ml-1">BC ✓</Badge>
            )}
            {livraison.bl_file_url && (
              <Badge variant="secondary" className="text-[10px] text-emerald-600 ml-1">BL ✓</Badge>
            )}
          </div>
          {livraison.status === 'commande' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMarquerPrevu(livraison.id)}
            >
              Marquer prévu
            </Button>
          )}
          {livraison.status === 'prevu' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onConfirmerLivraison(livraison.id)}
            >
              Confirmer livraison
            </Button>
          )}
        </div>
        <div className="border-t border-border pt-2 mt-1 flex flex-col gap-1">
          <LivraisonDocumentSlot
            type="bc"
            livraison={livraison}
            chantierId={chantierId}
          />
          {livraison.status === 'livre' && (
            <LivraisonDocumentSlot
              type="bl"
              livraison={livraison}
              chantierId={chantierId}
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function DeliveryCardSkeleton() {
  return (
    <Card aria-hidden="true" className="relative overflow-hidden pl-2 py-4 min-h-[72px] animate-pulse">
      <div
        data-testid="status-bar"
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-muted"
      />
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="h-4 w-40 rounded bg-muted" />
          <div className="h-5 w-16 rounded-full bg-muted" />
        </div>
        <div className="flex items-center justify-between">
          <div className="h-3 w-24 rounded bg-muted" />
          <div className="h-8 w-28 rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  )
}
