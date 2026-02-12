import { useState, useMemo, useCallback } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusCard, STATUS_COLORS, StatusCardSkeleton } from '@/components/StatusCard'
import { computeStatus } from '@/lib/utils/computeStatus'
import { useEtages } from '@/lib/queries/useEtages'
import { useLots } from '@/lib/queries/useLots'
import { BreadcrumbNav } from '@/components/BreadcrumbNav'
import { GridFilterTabs } from '@/components/GridFilterTabs'
import { useRealtimeLots } from '@/lib/subscriptions/useRealtimeLots'
import { formatMetrage } from '@/lib/utils/formatMetrage'
import { PlinthStatus } from '@/types/enums'

export const Route = createFileRoute(
  '/_authenticated/chantiers/$chantierId/plots/$plotId/$etageId/',
)({
  component: EtageIndexPage,
})

function EtageIndexPage() {
  const { chantierId, plotId, etageId } = Route.useParams()
  const navigate = useNavigate()
  const { data: etages, isLoading: etagesLoading } = useEtages(plotId)
  const { data: lots, isLoading: lotsLoading } = useLots(plotId)
  useRealtimeLots(plotId)

  const etage = etages?.find((e) => e.id === etageId)
  const etageLots = useMemo(
    () => lots?.filter((l) => l.etage_id === etageId) ?? [],
    [lots, etageId],
  )
  const [filteredLots, setFilteredLots] = useState<typeof etageLots>([])

  const getProgress = useCallback(
    (lot: (typeof etageLots)[0]) => ({ done: lot.progress_done, total: lot.progress_total }),
    [],
  )

  const getAlerts = useCallback(
    (lot: (typeof etageLots)[0]) => lot.has_blocking_note === true || lot.has_missing_docs === true,
    [],
  )

  const isLoading = etagesLoading || lotsLoading

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <header className="flex items-center justify-between px-4 py-3 border-b border-border">
          <Button variant="ghost" size="icon" asChild>
            <Link
              to="/chantiers/$chantierId/plots/$plotId"
              params={{ chantierId, plotId }}
              aria-label="Retour"
            >
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <div className="h-5 w-32 rounded bg-muted animate-pulse" />
          <div className="size-9" />
        </header>
        <div className="p-4 flex flex-col gap-2">
          <StatusCardSkeleton />
          <StatusCardSkeleton />
        </div>
      </div>
    )
  }

  if (!etage) {
    return (
      <div className="flex flex-col">
        <header className="flex items-center justify-between px-4 py-3 border-b border-border">
          <Button variant="ghost" size="icon" asChild>
            <Link
              to="/chantiers/$chantierId/plots/$plotId"
              params={{ chantierId, plotId }}
              aria-label="Retour"
            >
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <span className="text-lg font-semibold text-foreground">Erreur</span>
          <div className="size-9" />
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16 px-4">
          <p className="text-muted-foreground">Étage introuvable</p>
          <Button
            variant="outline"
            onClick={() =>
              navigate({
                to: '/chantiers/$chantierId/plots/$plotId',
                params: { chantierId, plotId },
              })
            }
          >
            Retour au plot
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <Button variant="ghost" size="icon" asChild>
          <Link
            to="/chantiers/$chantierId/plots/$plotId"
            params={{ chantierId, plotId }}
            aria-label="Retour"
          >
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <h1 className="text-lg font-semibold text-foreground truncate mx-2">
          {etage.nom}
        </h1>
        <div className="size-9" />
      </header>

      <BreadcrumbNav />

      <div className="p-4">
        <h2 className="text-base font-semibold text-foreground mb-3">
          Lots{etageLots.length > 0 ? ` (${etageLots.length})` : ''}
        </h2>

        {etageLots.length > 0 ? (
          <>
            <GridFilterTabs
              items={etageLots}
              getProgress={getProgress}
              getAlerts={getAlerts}
              onFilteredChange={setFilteredLots}
              emptyMessage="Aucun lot"
              className="mb-3"
            />
            {filteredLots.length > 0 && (
              <div className="flex flex-col gap-2">
                {filteredLots.map((lot) => {
                  const pieceCount = lot.pieces?.[0]?.count ?? 0
                  return (
                    <StatusCard
                      key={lot.id}
                      title={`Lot ${lot.code}`}
                      subtitle={`${lot.variantes?.nom ?? 'Variante'} · ${pieceCount} pièce${pieceCount !== 1 ? 's' : ''}`}
                      secondaryInfo={formatMetrage(lot.metrage_m2_total ?? 0, lot.metrage_ml_total ?? 0)}
                      statusColor={STATUS_COLORS[computeStatus(lot.progress_done, lot.progress_total)]}
                      indicator={`${lot.progress_done}/${lot.progress_total}`}
                      isBlocked={lot.has_blocking_note}
                      hasMissingDocs={lot.has_missing_docs}
                      badge={
                        <>
                          {lot.is_tma && (
                            <Badge
                              variant="outline"
                              className="border-amber-500 text-amber-500 text-[10px]"
                            >
                              TMA
                            </Badge>
                          )}
                          {lot.metrage_ml_total > 0 && (
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                lot.plinth_status === PlinthStatus.FACONNEES
                                  ? 'border-green-500 text-green-500'
                                  : lot.plinth_status === PlinthStatus.COMMANDEES
                                    ? 'border-amber-500 text-amber-500'
                                    : 'border-red-500 text-red-500'
                              }`}
                            >
                              {lot.plinth_status === PlinthStatus.FACONNEES
                                ? 'Faç.'
                                : lot.plinth_status === PlinthStatus.COMMANDEES
                                  ? 'Cmd'
                                  : 'Non cmd'}
                            </Badge>
                          )}
                        </>
                      }
                      onClick={() =>
                        navigate({
                          to: '/chantiers/$chantierId/plots/$plotId/$etageId/$lotId',
                          params: { chantierId, plotId, etageId, lotId: lot.id },
                        })
                      }
                    />
                  )
                })}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aucun lot sur cet étage
          </p>
        )}
      </div>
    </div>
  )
}
