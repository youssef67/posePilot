import { useState, useMemo, useCallback } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Boxes, CheckSquare, ChevronRight, Layers, Package, PackageCheck, Plus, StickyNote, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { getBadgeColorClasses } from '@/components/BadgeSelector'
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatusCard, STATUS_COLORS, StatusCardSkeleton } from '@/components/StatusCard'
import { computeStatus } from '@/lib/utils/computeStatus'
import { useEtages } from '@/lib/queries/useEtages'
import { useLots } from '@/lib/queries/useLots'
import { useVariantes } from '@/lib/queries/useVariantes'
import { useDeleteLots } from '@/lib/mutations/useDeleteLots'
import { useCreateLot } from '@/lib/mutations/useCreateLot'
import { useCreateBatchLots } from '@/lib/mutations/useCreateBatchLots'
import { BreadcrumbNav } from '@/components/BreadcrumbNav'
import { GridFilterTabs } from '@/components/GridFilterTabs'
import { useInventaire } from '@/lib/queries/useInventaire'
import { useRealtimeLots } from '@/lib/subscriptions/useRealtimeLots'
import { formatMetrage } from '@/lib/utils/formatMetrage'
import { formatEURCompact } from '@/lib/utils/formatEUR'
import { PlinthStatus } from '@/types/enums'
import { useUpdateLotMateriauxRecus } from '@/lib/mutations/useUpdateLotMateriauxRecus'
import { useIntervenants } from '@/lib/queries/useIntervenants'
import { Fab } from '@/components/Fab'

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
  const updateMateriauxRecus = useUpdateLotMateriauxRecus()
  const { data: variantes } = useVariantes(plotId)
  const createLot = useCreateLot()
  const createBatchLots = useCreateBatchLots()

  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedLotIds, setSelectedLotIds] = useState<Set<string>>(new Set())
  const [showDeleteLotsDialog, setShowDeleteLotsDialog] = useState(false)
  const [showCreateLotSheet, setShowCreateLotSheet] = useState(false)
  const [lotCode, setLotCode] = useState('')
  const [lotVarianteId, setLotVarianteId] = useState('')
  const [lotCodeError, setLotCodeError] = useState('')
  const [lotVarianteError, setLotVarianteError] = useState('')
  const [showBatchSheet, setShowBatchSheet] = useState(false)
  const [batchCodesInput, setBatchCodesInput] = useState('')
  const [batchVarianteMap, setBatchVarianteMap] = useState<Record<string, string>>({})
  const [batchCodeError, setBatchCodeError] = useState('')
  const [batchVarianteError, setBatchVarianteError] = useState('')

  const { data: intervenants = [] } = useIntervenants()
  const [intervenantFilter, setIntervenantFilter] = useState<string>('tous')
  const { data: inventaireItems } = useInventaire(chantierId, { type: 'etage', etageId })
  const hasInventaire = (inventaireItems?.length ?? 0) > 0

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
    (lot: (typeof etageLots)[0]) => lot.has_blocking_note === true || lot.has_missing_docs === true || lot.has_open_reservation === true,
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

  const MAX_BATCH_LOTS = 8

  function parseCodes(input: string): string[] {
    return input
      .split(/[\s,]+/)
      .map((c) => c.trim())
      .filter((c) => c.length > 0)
  }

  const batchCodes = parseCodes(batchCodesInput)

  function handleCreateLot() {
    let hasError = false
    const trimmedCode = lotCode.trim()

    if (!trimmedCode) {
      setLotCodeError('Le code du lot est requis')
      hasError = true
    } else if (lots?.some((l) => l.code.toLowerCase() === trimmedCode.toLowerCase())) {
      setLotCodeError('Un lot avec ce code existe déjà')
      hasError = true
    } else {
      setLotCodeError('')
    }

    if (!lotVarianteId) {
      setLotVarianteError('La variante est requise')
      hasError = true
    } else {
      setLotVarianteError('')
    }

    if (hasError || !etage) return

    createLot.mutate(
      {
        code: trimmedCode,
        varianteId: lotVarianteId,
        etageNom: etage.nom,
        plotId,
      },
      {
        onSuccess: (lotId) => {
          toast('Lot créé')
          setShowCreateLotSheet(false)
          setLotCode('')
          setLotVarianteId('')
          navigate({
            to: '/chantiers/$chantierId/plots/$plotId/$etageId/$lotId',
            params: { chantierId, plotId, etageId, lotId },
          })
        },
        onError: () => {
          toast.error('Erreur lors de la création du lot')
        },
      },
    )
  }

  function validateBatchCodes(codes: string[]): string | null {
    if (codes.length === 0) return 'Saisissez au moins un code de lot'
    if (codes.length > MAX_BATCH_LOTS) return `Maximum ${MAX_BATCH_LOTS} lots par batch`
    const seen = new Set<string>()
    for (const code of codes) {
      const lower = code.toLowerCase()
      if (seen.has(lower)) return `Code « ${code} » en doublon dans le batch`
      seen.add(lower)
    }
    if (lots) {
      const existingCodes = new Set(lots.map((l) => l.code.toLowerCase()))
      for (const code of codes) {
        if (existingCodes.has(code.toLowerCase())) return `Le code « ${code} » existe déjà`
      }
    }
    return null
  }

  function handleApplyVarianteToAll(varianteId: string) {
    const map: Record<string, string> = {}
    for (const code of batchCodes) {
      map[code] = varianteId
    }
    setBatchVarianteMap(map)
    if (batchVarianteError) setBatchVarianteError('')
  }

  function handleSetLotVariante(code: string, varianteId: string) {
    setBatchVarianteMap((prev) => ({ ...prev, [code]: varianteId }))
    if (batchVarianteError) setBatchVarianteError('')
  }

  function handleCreateBatchLots() {
    const codes = batchCodes
    let hasError = false

    const codesError = validateBatchCodes(codes)
    if (codesError) {
      setBatchCodeError(codesError)
      hasError = true
    } else {
      setBatchCodeError('')
    }

    const missingVariante = codes.some((code) => !batchVarianteMap[code])
    if (missingVariante) {
      setBatchVarianteError('Chaque lot doit avoir une variante')
      hasError = true
    } else {
      setBatchVarianteError('')
    }

    if (hasError || !etage) return

    const varianteIds = codes.map((code) => batchVarianteMap[code])

    createBatchLots.mutate(
      {
        codes,
        varianteIds,
        etageNom: etage.nom,
        plotId,
      },
      {
        onSuccess: (lotIds) => {
          toast(`${lotIds.length} lot${lotIds.length > 1 ? 's' : ''} créé${lotIds.length > 1 ? 's' : ''}`)
          setShowBatchSheet(false)
          setBatchCodesInput('')
          setBatchVarianteMap({})
          setBatchCodeError('')
          setBatchVarianteError('')
        },
        onError: () => {
          toast.error('Erreur lors de la création des lots — aucun lot créé')
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
        <Button variant="ghost" size="icon" asChild>
          <Link
            to="/chantiers/$chantierId/plots/$plotId/$etageId/inventaire"
            params={{ chantierId, plotId, etageId }}
            aria-label="Inventaire"
          >
            <span className="relative">
              <Boxes className="size-5" />
              {hasInventaire && (
                <span className="absolute -top-1 -right-1 size-2 rounded-full bg-orange-400" />
              )}
            </span>
          </Link>
        </Button>
      </header>

      <BreadcrumbNav />

      {etage.memo_count > 0 && (
        <div className="px-4 pt-3">
          <Link
            to="/chantiers/$chantierId/plots/$plotId/$etageId/memos"
            params={{ chantierId, plotId, etageId }}
            className="flex items-center gap-2 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/20 p-3 text-[#3B82F6]"
          >
            <StickyNote className="size-4 shrink-0" />
            <span className="text-sm font-medium flex-1">
              {etage.memo_count} mémo{etage.memo_count > 1 ? 's' : ''}
            </span>
            <ChevronRight className="size-4 shrink-0" />
          </Link>
        </div>
      )}

      <div className="p-4 pb-36">
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
            {intervenants.length > 0 && (
              <div className="mb-3">
                <Select value={intervenantFilter} onValueChange={setIntervenantFilter}>
                  <SelectTrigger className="h-8 text-sm w-full" aria-label="Filtrer par intervenant">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">Tous les intervenants</SelectItem>
                    <SelectItem value="__none__">Non assigné</SelectItem>
                    {intervenants.map((i) => (
                      <SelectItem key={i.id} value={i.id}>{i.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {(() => {
              const displayedLots = intervenantFilter === 'tous'
                ? filteredLots
                : intervenantFilter === '__none__'
                  ? filteredLots.filter((l) => !l.intervenant_id)
                  : filteredLots.filter((l) => l.intervenant_id === intervenantFilter)
              return displayedLots.length > 0 ? (
              <div className="flex flex-col gap-2">
                {displayedLots.map((lot) => {
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
                          secondaryInfo={[
                            formatMetrage(lot.metrage_m2_total ?? 0, lot.metrage_ml_total ?? 0),
                            (lot.cout_materiaux ?? 0) > 0 ? formatEURCompact(lot.cout_materiaux) : undefined,
                          ].filter(Boolean).join(' · ') || undefined}
                          statusColor={STATUS_COLORS[computeStatus(lot.progress_done, lot.progress_total)]}
                          indicator={`${lot.progress_done}/${lot.progress_total}`}
                          isBlocked={lot.has_blocking_note}
                          hasMissingDocs={lot.has_missing_docs}
                          hasOpenReservation={lot.has_open_reservation}
                          hasInventaire={lot.has_inventaire}
                          badge={
                            <>
                              {lot.lot_badge_assignments?.map((a) => (
                                <Badge
                                  key={a.badge_id}
                                  variant="outline"
                                  className={`${getBadgeColorClasses(a.lot_badges.couleur)} text-[10px]`}
                                >
                                  {a.lot_badges.nom}
                                </Badge>
                              ))}
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
                              {lot.intervenants && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] border-indigo-500 text-indigo-500"
                                  data-testid={`intervenant-badge-${lot.id}`}
                                >
                                  {lot.intervenants.nom.length <= 5
                                    ? lot.intervenants.nom
                                    : lot.intervenants.nom.split(/\s+/).map((w) => w[0]).join('').toUpperCase()}
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
                      {!selectionMode && (
                        <button
                          type="button"
                          aria-label={lot.materiaux_recus ? `Matériaux reçus lot ${lot.code}` : `Matériaux non reçus lot ${lot.code}`}
                          className="shrink-0 p-2 rounded-md active:bg-accent"
                          onClick={(e) => {
                            e.stopPropagation()
                            const next = !lot.materiaux_recus
                            updateMateriauxRecus.mutate(
                              { lotId: lot.id, plotId, materiaux_recus: next },
                              {
                                onSuccess: () => {
                                  toast(next ? 'Matériaux reçus ✓' : 'Matériaux retirés')
                                },
                                onError: () => {
                                  toast.error('Erreur lors de la mise à jour')
                                },
                              },
                            )
                          }}
                        >
                          {lot.materiaux_recus ? (
                            <PackageCheck className="size-5 text-green-600 dark:text-green-400" />
                          ) : (
                            <Package className="size-5 text-muted-foreground" />
                          )}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : null
              })()}
          </>
        ) : (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Aucun lot sur cet étage
          </p>
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

      <Sheet open={showCreateLotSheet} onOpenChange={(open) => {
        setShowCreateLotSheet(open)
        if (!open) {
          setLotCode('')
          setLotVarianteId('')
          setLotCodeError('')
          setLotVarianteError('')
        }
      }}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Nouveau lot — {etage.nom}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4 pb-6">
            <div>
              <Input
                placeholder="Code du lot"
                value={lotCode}
                onChange={(e) => {
                  setLotCode(e.target.value)
                  if (lotCodeError) setLotCodeError('')
                }}
                aria-label="Code du lot"
              />
              {lotCodeError && (
                <p className="text-sm text-destructive mt-1">{lotCodeError}</p>
              )}
            </div>
            <div>
              <Select
                value={lotVarianteId}
                onValueChange={(val) => {
                  setLotVarianteId(val)
                  if (lotVarianteError) setLotVarianteError('')
                }}
              >
                <SelectTrigger className="w-full" aria-label="Variante">
                  <SelectValue placeholder="Sélectionner une variante" />
                </SelectTrigger>
                <SelectContent>
                  {variantes?.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {lotVarianteError && (
                <p className="text-sm text-destructive mt-1">{lotVarianteError}</p>
              )}
            </div>
            <Button
              className="w-full"
              onClick={handleCreateLot}
              disabled={createLot.isPending}
            >
              Créer le lot
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={showBatchSheet} onOpenChange={(open) => {
        setShowBatchSheet(open)
        if (!open) {
          setBatchCodesInput('')
          setBatchVarianteMap({})
          setBatchCodeError('')
          setBatchVarianteError('')
        }
      }}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Lots en batch — {etage.nom}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4 pb-6">
            <div>
              <textarea
                className="border-input dark:bg-input/30 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] h-auto w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                rows={2}
                placeholder="101, 102, 103..."
                value={batchCodesInput}
                onChange={(e) => {
                  setBatchCodesInput(e.target.value)
                  if (batchCodeError) setBatchCodeError('')
                }}
                aria-label="Codes des lots"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {batchCodes.length} code{batchCodes.length !== 1 ? 's' : ''} détecté{batchCodes.length !== 1 ? 's' : ''} (max {MAX_BATCH_LOTS})
              </p>
              {batchCodeError && (
                <p className="text-sm text-destructive mt-1">{batchCodeError}</p>
              )}
            </div>

            {batchCodes.length > 0 && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-foreground">Appliquer à tous</label>
                  <Select onValueChange={handleApplyVarianteToAll}>
                    <SelectTrigger className="w-full mt-1" aria-label="Variante pour tous">
                      <SelectValue placeholder="Choisir une variante pour tous" />
                    </SelectTrigger>
                    <SelectContent>
                      {variantes?.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2">
                  {batchCodes.map((code) => (
                    <div key={code} className="flex items-center gap-2">
                      <span className="text-sm font-medium w-16 shrink-0 truncate">{code}</span>
                      <Select
                        value={batchVarianteMap[code] ?? ''}
                        onValueChange={(val) => handleSetLotVariante(code, val)}
                      >
                        <SelectTrigger className="flex-1" aria-label={`Variante lot ${code}`}>
                          <SelectValue placeholder="Variante" />
                        </SelectTrigger>
                        <SelectContent>
                          {variantes?.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.nom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>

                {batchVarianteError && (
                  <p className="text-sm text-destructive">{batchVarianteError}</p>
                )}
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleCreateBatchLots}
              disabled={createBatchLots.isPending || batchCodes.length === 0}
            >
              {batchCodes.length > 0
                ? `Créer ${batchCodes.length} lot${batchCodes.length > 1 ? 's' : ''}`
                : 'Créer les lots'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {variantes && variantes.length > 0 && (
        <Fab
          menuItems={[
            {
              icon: Layers,
              label: 'Ajouter en batch',
              onClick: () => setShowBatchSheet(true),
            },
            {
              icon: Plus,
              label: 'Ajouter un lot',
              onClick: () => setShowCreateLotSheet(true),
            },
          ]}
        />
      )}
    </div>
  )
}
