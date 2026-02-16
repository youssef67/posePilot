import { useState, useMemo, useCallback } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, CheckSquare, Plus, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { StatusCard, STATUS_COLORS, StatusCardSkeleton } from '@/components/StatusCard'
import { computeStatus } from '@/lib/utils/computeStatus'
import { useEtages } from '@/lib/queries/useEtages'
import { useLots } from '@/lib/queries/useLots'
import { useDeleteLots } from '@/lib/mutations/useDeleteLots'
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
  const deleteLots = useDeleteLots()

  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedLotIds, setSelectedLotIds] = useState<Set<string>>(new Set())
  const [showDeleteLotsDialog, setShowDeleteLotsDialog] = useState(false)

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

  function toggleLotSelection(lotId: string) {
    setSelectedLotIds((prev) => {
      const next = new Set(prev)
      if (next.has(lotId)) next.delete(lotId)
      else next.add(lotId)
      return next
    })
  }

  function exitSelectionMode() {
    setSelectionMode(false)
    setSelectedLotIds(new Set())
  }

  const selectedLotsHaveContent = useMemo(() => {
    if (selectedLotIds.size === 0) return false
    return etageLots.some(
      (lot) => selectedLotIds.has(lot.id) && ((lot.pieces?.[0]?.count ?? 0) > 0 || lot.progress_total > 0),
    )
  }, [etageLots, selectedLotIds])

  function handleDeleteSelectedLots() {
    if (selectedLotIds.size === 0) return
    deleteLots.mutate(
      { lotIds: Array.from(selectedLotIds), plotId },
      {
        onSuccess: () => {
          toast(`${selectedLotIds.size} lot${selectedLotIds.size > 1 ? 's' : ''} supprimé${selectedLotIds.size > 1 ? 's' : ''}`)
          exitSelectionMode()
          setShowDeleteLotsDialog(false)
        },
        onError: () => {
          toast.error('Erreur lors de la suppression des lots')
          setShowDeleteLotsDialog(false)
        },
      },
    )
  }

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
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-foreground">
            Lots{etageLots.length > 0 ? ` (${etageLots.length})` : ''}
          </h2>
          {etageLots.length > 0 && (
            selectionMode ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedLotIds.size} sélectionné{selectedLotIds.size > 1 ? 's' : ''}
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={selectedLotIds.size === 0}
                  onClick={() => setShowDeleteLotsDialog(true)}
                >
                  <Trash2 className="mr-1 size-4" />
                  Supprimer
                </Button>
                <Button variant="ghost" size="sm" onClick={exitSelectionMode}>
                  <X className="mr-1 size-4" />
                  Annuler
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setSelectionMode(true)}>
                <CheckSquare className="mr-1 size-4" />
                Sélectionner
              </Button>
            )
          )}
        </div>

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
                    <div key={lot.id} className="flex items-center gap-2">
                      {selectionMode && (
                        <Checkbox
                          checked={selectedLotIds.has(lot.id)}
                          onCheckedChange={() => toggleLotSelection(lot.id)}
                          aria-label={`Sélectionner lot ${lot.code}`}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <StatusCard
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
                          onClick={selectionMode
                            ? () => toggleLotSelection(lot.id)
                            : () => navigate({
                                to: '/chantiers/$chantierId/plots/$plotId/$etageId/$lotId',
                                params: { chantierId, plotId, etageId, lotId: lot.id },
                              })
                          }
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-3">
              Aucun lot sur cet étage
            </p>
            <Button
              variant="outline"
              onClick={() => navigate({
                to: '/chantiers/$chantierId/plots/$plotId',
                params: { chantierId, plotId },
              })}
            >
              <Plus className="mr-1 size-4" />
              Créer un lot
            </Button>
          </div>
        )}
      </div>

      <AlertDialog open={showDeleteLotsDialog} onOpenChange={setShowDeleteLotsDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Supprimer {selectedLotIds.size} lot{selectedLotIds.size > 1 ? 's' : ''} ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedLotsHaveContent
                ? 'Attention : certains lots contiennent des pièces, tâches ou documents. Toutes ces données seront supprimées définitivement.'
                : `${selectedLotIds.size > 1 ? 'Les lots sélectionnés seront supprimés' : 'Ce lot sera supprimé'} définitivement. Cette action est irréversible.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteSelectedLots}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
