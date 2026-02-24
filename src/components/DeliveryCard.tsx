import { useState } from 'react'
import { Calendar, ChevronDown, ListChecks, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { LivraisonDocumentSlot } from '@/components/LivraisonDocumentSlot'
import { formatRelativeTime } from '@/lib/utils/formatRelativeTime'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'
import type { Livraison } from '@/types/database'
import type { LinkedBesoinWithChantier } from '@/lib/queries/useAllLinkedBesoins'

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  commande: { color: '#F59E0B', label: 'Commandé' },
  prevu: { color: '#3B82F6', label: 'Prévu' },
  livraison_prevue: { color: '#3B82F6', label: 'Livraison prévue' },
  a_recuperer: { color: '#8B5CF6', label: 'À récupérer' },
  receptionne: { color: '#10B981', label: 'Réceptionné' },
  recupere: { color: '#10B981', label: 'Récupéré' },
  livre: { color: '#10B981', label: 'Livré' },
}

const FALLBACK_CONFIG = { color: '#6B7280', label: 'Inconnu' }

const montantFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
})

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
  chantierId: string | null
  onMarquerPrevu: (id: string) => void
  onConfirmerLivraison: (id: string) => void
  onMarquerRecupere?: (id: string) => void
  onEdit?: (livraison: Livraison) => void
  onDelete?: (livraison: Livraison, linkedBesoins: LinkedBesoinWithChantier[]) => void
  chantierNom?: string
  highlighted?: boolean
  linkedBesoins?: LinkedBesoinWithChantier[]
}

export function DeliveryCard({ livraison, chantierId, onMarquerPrevu, onConfirmerLivraison, onMarquerRecupere, onEdit, onDelete, chantierNom, highlighted, linkedBesoins }: DeliveryCardProps) {
  const { user } = useAuth()
  const config = STATUS_CONFIG[livraison.status] ?? FALLBACK_CONFIG
  const [expanded, setExpanded] = useState(false)

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
          <div className="flex items-center gap-1 shrink-0">
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${config.color}20`, color: config.color }}
            >
              {config.label}
            </span>
            {(onEdit || onDelete) && !['livre', 'receptionne', 'recupere'].includes(livraison.status) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Actions livraison">
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(livraison)}>
                      <Pencil className="size-4 mr-2" />
                      Modifier
                    </DropdownMenuItem>
                  )}
                  {onEdit && onDelete && <DropdownMenuSeparator />}
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={() => onDelete(livraison, linkedBesoins ?? [])}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="size-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        {(livraison.fournisseur || livraison.montant_ttc != null) && (
          <span className="text-sm text-muted-foreground">
            {livraison.fournisseur}
            {livraison.fournisseur && livraison.montant_ttc != null && ' · '}
            {livraison.montant_ttc != null && montantFormatter.format(livraison.montant_ttc)}
          </span>
        )}
        {chantierNom && (
          <span className="text-xs text-muted-foreground">{chantierNom}</span>
        )}
        {linkedBesoins && linkedBesoins.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              aria-expanded={expanded}
              aria-label={`${linkedBesoins.length} besoin${linkedBesoins.length > 1 ? 's' : ''} rattaché${linkedBesoins.length > 1 ? 's' : ''}`}
            >
              <ListChecks className="h-3.5 w-3.5" />
              <span>{linkedBesoins.length} besoin{linkedBesoins.length > 1 ? 's' : ''}</span>
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', expanded && 'rotate-180')} />
            </button>
            {expanded && (
              <BesoinsList besoins={linkedBesoins} isMultiChantier={!livraison.chantier_id} />
            )}
          </>
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
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onMarquerPrevu(livraison.id)}
              >
                Marquer prévu
              </Button>
              {onMarquerRecupere && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onMarquerRecupere(livraison.id)}
                >
                  Récupéré
                </Button>
              )}
            </div>
          )}
          {(livraison.status === 'prevu' || livraison.status === 'livraison_prevue' || livraison.status === 'a_recuperer') && (
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
          {['livre', 'receptionne', 'recupere'].includes(livraison.status) && (
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

function BesoinLine({ b, showChantier }: {
  b: LinkedBesoinWithChantier
  showChantier: boolean
}) {
  const lineTotal = b.montant_unitaire != null ? (b.quantite ?? 1) * b.montant_unitaire : null
  return (
    <div className="text-sm flex items-baseline justify-between gap-2">
      <div className="min-w-0 flex-1">
        <span className="text-foreground">{b.description}</span>
        {(b.quantite ?? 1) > 1 && (
          <span className="text-muted-foreground text-xs ml-1">×{b.quantite}</span>
        )}
        {showChantier && (
          <span className="text-muted-foreground text-xs ml-1">— {b.chantiers.nom}</span>
        )}
      </div>
      {b.montant_unitaire != null && (
        <div className="shrink-0 text-xs text-muted-foreground text-right">
          {montantFormatter.format(b.montant_unitaire)}
          {lineTotal != null && (b.quantite ?? 1) > 1 && (
            <span className="font-medium text-foreground ml-1">
              = {montantFormatter.format(lineTotal)}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function BesoinsList({ besoins, isMultiChantier }: {
  besoins: LinkedBesoinWithChantier[]
  isMultiChantier: boolean
}) {
  if (!isMultiChantier) {
    return (
      <div className="space-y-1 pl-4 border-l-2 border-muted">
        {besoins.map((b) => (
          <BesoinLine key={b.id} b={b} showChantier={false}  />
        ))}
      </div>
    )
  }

  // Group by chantier for multi-chantier livraisons
  const groups = new Map<string, { nom: string; besoins: LinkedBesoinWithChantier[] }>()
  for (const b of besoins) {
    const existing = groups.get(b.chantier_id)
    if (existing) {
      existing.besoins.push(b)
    } else {
      groups.set(b.chantier_id, { nom: b.chantiers.nom, besoins: [b] })
    }
  }

  return (
    <div className="space-y-2 pl-4 border-l-2 border-muted">
      {Array.from(groups.entries()).map(([chantierId, group]) => {
        const groupTotal = group.besoins.reduce((sum, b) => {
          if (b.montant_unitaire == null) return sum
          return sum + (b.quantite ?? 1) * b.montant_unitaire
        }, 0)
        const hasTotal = group.besoins.some((b) => b.montant_unitaire != null)

        return (
          <div key={chantierId}>
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <span className="text-xs font-semibold text-muted-foreground">{group.nom}</span>
              {hasTotal && (
                <span className="text-xs font-semibold text-foreground">
                  {montantFormatter.format(groupTotal)}
                </span>
              )}
            </div>
            <div className="space-y-0.5">
              {group.besoins.map((b) => (
                <BesoinLine key={b.id} b={b} showChantier={false}  />
              ))}
            </div>
          </div>
        )
      })}
    </div>
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
