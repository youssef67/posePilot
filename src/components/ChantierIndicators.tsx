import { Link } from '@tanstack/react-router'
import { Banknote, Calendar, Hammer, HardHat, Package, Pencil, Ruler } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatMetrage } from '@/lib/utils/formatMetrage'
import type { LotPretACarreler, MetrageVsInventaire } from '@/lib/utils/computeChantierIndicators'
import type { Livraison } from '@/types/database'

const formatEUR = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })

interface ChantierIndicatorsProps {
  chantierId: string
  lotsPretsACarreler?: LotPretACarreler[]
  metrageVsInventaire?: MetrageVsInventaire
  besoinsEnAttente: number
  livraisonsPrevues: Livraison[]
  totalDepenses?: number | null
  ajustementDepenses?: number
  coutSousTraitance?: number
  onEditFinances?: () => void
}

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
})

export function ChantierIndicators({
  chantierId,
  lotsPretsACarreler,
  metrageVsInventaire,
  besoinsEnAttente,
  livraisonsPrevues,
  totalDepenses,
  ajustementDepenses = 0,
  coutSousTraitance = 0,
  onEditFinances,
}: ChantierIndicatorsProps) {
  const totalAvecAjustement = (totalDepenses ?? 0) + ajustementDepenses
  const showDepenses = totalAvecAjustement > 0 || ajustementDepenses !== 0
  const showSousTraitance = coutSousTraitance > 0
  const showLots = lotsPretsACarreler && lotsPretsACarreler.length > 0
  const showMetrage =
    metrageVsInventaire &&
    (metrageVsInventaire.totalM2 > 0 ||
      metrageVsInventaire.totalML > 0 ||
      metrageVsInventaire.inventaireCount > 0)
  const showBesoins = besoinsEnAttente > 0
  const showLivraisons = livraisonsPrevues.length > 0

  const showFinanceEditButton = onEditFinances != null

  if (!showDepenses && !showSousTraitance && !showLots && !showMetrage && !showBesoins && !showLivraisons && !showFinanceEditButton) {
    return null
  }

  return (
    <div className="rounded-lg border border-border p-3 space-y-3 mb-4" data-testid="chantier-indicators">
      {(showDepenses || showSousTraitance || showFinanceEditButton) && (
        <div>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              {showDepenses && (
                <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Banknote className="size-4" />
                  {formatEUR.format(totalAvecAjustement)} dépensés
                  {ajustementDepenses !== 0 && (
                    <span className="text-xs text-muted-foreground">
                      (ajust. {ajustementDepenses > 0 ? '+' : ''}{formatEUR.format(ajustementDepenses)})
                    </span>
                  )}
                </p>
              )}
              {showSousTraitance && (
                <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <HardHat className="size-4" />
                  {formatEUR.format(coutSousTraitance)} sous-traitance
                </p>
              )}
            </div>
            {showFinanceEditButton && (
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={onEditFinances}
                aria-label="Modifier les finances"
              >
                <Pencil className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
      )}

      {showLots && (
        <div>
          <p className="text-sm font-medium text-foreground flex items-center gap-1.5 text-green-600 dark:text-green-400">
            <Hammer className="size-4" />
            {lotsPretsACarreler.length} lot{lotsPretsACarreler.length > 1 ? 's' : ''} prêt{lotsPretsACarreler.length > 1 ? 's' : ''} à carreler
          </p>
          <div className="pl-4 mt-1 space-y-0.5">
            {lotsPretsACarreler.map((lot) => (
              <Link
                key={lot.id}
                to="/chantiers/$chantierId/plots/$plotId/$etageId/$lotId"
                params={{ chantierId, plotId: lot.plotId, etageId: lot.etageId, lotId: lot.id }}
                className="block text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Lot {lot.code} — {lot.plotNom}{lot.etageNom ? ` › ${lot.etageNom}` : ''}
              </Link>
            ))}
          </div>
        </div>
      )}

      {showMetrage && (
        <div>
          <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
            <Ruler className="size-4" />
            Métrés & Inventaire
          </p>
          <div className="pl-4 mt-1 space-y-0.5">
            {(metrageVsInventaire.totalM2 > 0 || metrageVsInventaire.totalML > 0) && (
              <p className="text-xs text-muted-foreground">
                Total : {formatMetrage(metrageVsInventaire.totalM2, metrageVsInventaire.totalML)}
              </p>
            )}
            {metrageVsInventaire.inventaireCount > 0 && (
              <p className="text-xs text-muted-foreground">
                Matériel : {metrageVsInventaire.inventaireCount} article{metrageVsInventaire.inventaireCount > 1 ? 's' : ''} en stock
              </p>
            )}
          </div>
        </div>
      )}

      {showBesoins && (
        <div>
          <p className="text-sm font-medium text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
            <Package className="size-4" />
            {besoinsEnAttente} besoin{besoinsEnAttente > 1 ? 's' : ''} en attente non commandé{besoinsEnAttente > 1 ? 's' : ''}
          </p>
        </div>
      )}

      {showLivraisons && (
        <div>
          <p className="text-sm font-medium text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
            <Calendar className="size-4" />
            Livraisons prévues
          </p>
          <div className="pl-4 mt-1 space-y-0.5">
            {[...livraisonsPrevues]
              .filter((l): l is typeof l & { date_prevue: string } => l.date_prevue != null)
              .sort((a, b) => new Date(a.date_prevue).getTime() - new Date(b.date_prevue).getTime())
              .map((l) => (
                <p key={l.id} className="text-xs text-muted-foreground">
                  {l.description} — {dateFormatter.format(new Date(l.date_prevue))}
                </p>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
