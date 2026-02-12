import { Link } from '@tanstack/react-router'
import { Calendar, Hammer, Package, Ruler } from 'lucide-react'
import { formatMetrage } from '@/lib/utils/formatMetrage'
import type { LotPretACarreler, MetrageVsInventaire } from '@/lib/utils/computeChantierIndicators'
import type { Livraison } from '@/types/database'

interface ChantierIndicatorsProps {
  chantierId: string
  lotsPretsACarreler?: LotPretACarreler[]
  metrageVsInventaire?: MetrageVsInventaire
  besoinsEnAttente: number
  livraisonsPrevues: Livraison[]
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
}: ChantierIndicatorsProps) {
  const showLots = lotsPretsACarreler && lotsPretsACarreler.length > 0
  const showMetrage =
    metrageVsInventaire &&
    (metrageVsInventaire.totalM2 > 0 ||
      metrageVsInventaire.totalML > 0 ||
      metrageVsInventaire.inventaireCount > 0)
  const showBesoins = besoinsEnAttente > 0
  const showLivraisons = livraisonsPrevues.length > 0

  if (!showLots && !showMetrage && !showBesoins && !showLivraisons) {
    return null
  }

  return (
    <div className="rounded-lg border border-border p-3 space-y-3 mb-4" data-testid="chantier-indicators">
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
