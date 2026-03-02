import { useState, useMemo, useCallback } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Copy, EllipsisVertical, GripVertical, Layers, Pencil, Plus, Shapes, Trash2, X, CheckSquare } from 'lucide-react'
import { SortableTaskList } from '@/components/SortableTaskList'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Hammer } from 'lucide-react'
import { usePlots } from '@/lib/queries/usePlots'
import { useLotsWithTaches } from '@/lib/queries/useLotsWithTaches'
import { findLotsPretsACarreler } from '@/lib/utils/computeChantierIndicators'
import { useUpdatePlotTasks } from '@/lib/mutations/useUpdatePlotTasks'
import { useDeletePlot } from '@/lib/mutations/useDeletePlot'
import { useDeleteLots } from '@/lib/mutations/useDeleteLots'
import { useUpdateEtage } from '@/lib/mutations/useUpdateEtage'
import { useDeleteEtage } from '@/lib/mutations/useDeleteEtage'
import { useDuplicatePlot } from '@/lib/mutations/useDuplicatePlot'
import { useVariantes } from '@/lib/queries/useVariantes'
import { useCreateVariante } from '@/lib/mutations/useCreateVariante'
import { useLots } from '@/lib/queries/useLots'
import { useEtages } from '@/lib/queries/useEtages'
import { useCreateLot } from '@/lib/mutations/useCreateLot'
import { useCreateBatchLots } from '@/lib/mutations/useCreateBatchLots'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { getBadgeColorClasses } from '@/components/BadgeSelector'
import { Checkbox } from '@/components/ui/checkbox'
import { StatusCard, STATUS_COLORS } from '@/components/StatusCard'
import { computeStatus } from '@/lib/utils/computeStatus'
import { GridFilterTabs } from '@/components/GridFilterTabs'
import { useRealtimeEtages } from '@/lib/subscriptions/useRealtimeEtages'
import { useRealtimeLots } from '@/lib/subscriptions/useRealtimeLots'
import { supabase } from '@/lib/supabase'
import { Fab } from '@/components/Fab'

const MAX_BATCH_LOTS = 8

export const Route = createFileRoute(
  '/_authenticated/chantiers/$chantierId/plots/$plotId/',
)({
  component: PlotIndexPage,
})

function PlotIndexPage() {
  const { chantierId, plotId } = Route.useParams()
  const navigate = useNavigate()
  const { data: plots, isLoading } = usePlots(chantierId)
  const { data: lotsWithTaches } = useLotsWithTaches(chantierId)
  const lotsPretsPlot = useMemo(() => {
    if (!lotsWithTaches) return []
    return findLotsPretsACarreler(lotsWithTaches.filter(l => l.plot_id === plotId))
  }, [lotsWithTaches, plotId])
  const updateTasks = useUpdatePlotTasks()
  const deletePlot = useDeletePlot()
  const { data: variantes } = useVariantes(plotId)
  const createVariante = useCreateVariante()
  const { data: lots } = useLots(plotId)
  const { data: etages } = useEtages(plotId)
  useRealtimeEtages(plotId)
  useRealtimeLots(plotId)
  const createLot = useCreateLot()
  const createBatchLots = useCreateBatchLots()
  const deleteLots = useDeleteLots()
  const updateEtage = useUpdateEtage()
  const deleteEtage = useDeleteEtage()

  const duplicatePlot = useDuplicatePlot()
  const [showDuplicateSheet, setShowDuplicateSheet] = useState(false)
  const [duplicatePlotName, setDuplicatePlotName] = useState('')
  const [duplicateNameError, setDuplicateNameError] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [newTask, setNewTask] = useState('')
  const [showCreateVarianteSheet, setShowCreateVarianteSheet] = useState(false)
  const [newVarianteName, setNewVarianteName] = useState('')
  const [varianteNameError, setVarianteNameError] = useState('')
  const [showCreateLotSheet, setShowCreateLotSheet] = useState(false)
  const [lotCode, setLotCode] = useState('')
  const [lotVarianteId, setLotVarianteId] = useState('')
  const [lotEtageNom, setLotEtageNom] = useState('')
  const [lotEtageCustom, setLotEtageCustom] = useState(false)
  const [lotCodeError, setLotCodeError] = useState('')
  const [lotVarianteError, setLotVarianteError] = useState('')
  const [lotEtageError, setLotEtageError] = useState('')
  const [showBatchSheet, setShowBatchSheet] = useState(false)
  const [batchCodesInput, setBatchCodesInput] = useState('')
  const [batchVarianteMap, setBatchVarianteMap] = useState<Record<string, string>>({})
  const [batchEtageNom, setBatchEtageNom] = useState('')
  const [batchEtageCustom, setBatchEtageCustom] = useState(false)
  const [batchCodeError, setBatchCodeError] = useState('')
  const [batchVarianteError, setBatchVarianteError] = useState('')
  const [batchEtageError, setBatchEtageError] = useState('')
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedLotIds, setSelectedLotIds] = useState<Set<string>>(new Set())
  const [showDeleteLotsDialog, setShowDeleteLotsDialog] = useState(false)

  const [renameEtageId, setRenameEtageId] = useState<string | null>(null)
  const [renameEtageNom, setRenameEtageNom] = useState('')
  const [renameEtageError, setRenameEtageError] = useState('')
  const [deleteEtageTarget, setDeleteEtageTarget] = useState<{ id: string; nom: string; lotCount: number } | null>(null)

  const plot = plots?.find((p) => p.id === plotId)

  function handleAddTask() {
    const trimmed = newTask.trim()
    if (!trimmed || !plot) return
    if (plot.task_definitions.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      return
    }
    updateTasks.mutate({
      plotId,
      chantierId,
      taskDefinitions: [...plot.task_definitions, trimmed],
    })
    setNewTask('')
  }

  function handleRemoveTask(index: number) {
    if (!plot) return
    const updated = plot.task_definitions.filter((_, i) => i !== index)
    updateTasks.mutate({ plotId, chantierId, taskDefinitions: updated })
  }

  function handleDeletePlot() {
    deletePlot.mutate(
      { plotId, chantierId },
      {
        onSuccess: () => {
          toast('Plot supprimé')
          navigate({
            to: '/chantiers/$chantierId',
            params: { chantierId },
          })
        },
        onError: () => {
          toast.error('Erreur lors de la suppression du plot')
        },
      },
    )
  }

  function handleOpenDuplicateSheet() {
    setDuplicatePlotName('')
    setDuplicateNameError('')
    setShowDuplicateSheet(true)
  }

  function handleDuplicatePlot() {
    const trimmed = duplicatePlotName.trim()
    if (!trimmed) {
      setDuplicateNameError('Le nom du plot est requis')
      return
    }
    duplicatePlot.mutate(
      { sourcePlotId: plotId, chantierId, newPlotNom: trimmed },
      {
        onSuccess: (newPlotId) => {
          setShowDuplicateSheet(false)
          toast('Plot dupliqué')
          navigate({
            to: '/chantiers/$chantierId/plots/$plotId',
            params: { chantierId, plotId: newPlotId },
          })
        },
        onError: () => toast.error('Erreur lors de la duplication'),
      },
    )
  }

  function handleCreateVariante() {
    const trimmed = newVarianteName.trim()
    if (!trimmed) {
      setVarianteNameError('Le nom de la variante est requis')
      return
    }
    if (variantes?.some((v) => v.nom.toLowerCase() === trimmed.toLowerCase())) {
      setVarianteNameError('Une variante avec ce nom existe déjà')
      return
    }
    setVarianteNameError('')
    createVariante.mutate(
      { plotId, nom: trimmed },
      {
        onSuccess: (data) => {
          toast('Variante créée')
          setShowCreateVarianteSheet(false)
          setNewVarianteName('')
          navigate({
            to: '/chantiers/$chantierId/plots/$plotId/variantes/$varianteId',
            params: { chantierId, plotId, varianteId: data.id },
          })
        },
        onError: () => {
          toast.error('Erreur lors de la création de la variante')
        },
      },
    )
  }

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

    if (!lotEtageNom.trim()) {
      setLotEtageError("L'étage est requis")
      hasError = true
    } else {
      setLotEtageError('')
    }

    if (hasError) return

    createLot.mutate(
      {
        code: trimmedCode,
        varianteId: lotVarianteId,
        etageNom: lotEtageNom.trim(),
        plotId,
      },
      {
        onSuccess: async (lotId) => {
          toast('Lot créé')
          setShowCreateLotSheet(false)
          setLotCode('')
          setLotVarianteId('')
          setLotEtageNom('')
          setLotEtageCustom(false)
          const { data: newLot } = await supabase
            .from('lots')
            .select('etage_id')
            .eq('id', lotId)
            .single()
          if (newLot?.etage_id) {
            navigate({
              to: '/chantiers/$chantierId/plots/$plotId/$etageId/$lotId',
              params: { chantierId, plotId, etageId: newLot.etage_id, lotId },
            })
          }
        },
        onError: () => {
          toast.error('Erreur lors de la création du lot')
        },
      },
    )
  }

  function parseCodes(input: string): string[] {
    return input
      .split(/[\s,]+/)
      .map((c) => c.trim())
      .filter((c) => c.length > 0)
  }

  const batchCodes = parseCodes(batchCodesInput)

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
    if (!lots || selectedLotIds.size === 0) return false
    return lots.some(
      (lot) => selectedLotIds.has(lot.id) && ((lot.pieces?.[0]?.count ?? 0) > 0 || lot.progress_total > 0),
    )
  }, [lots, selectedLotIds])

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

  function validateBatchCodes(codes: string[]): string | null {
    if (codes.length === 0) {
      return 'Saisissez au moins un code de lot'
    }
    if (codes.length > MAX_BATCH_LOTS) {
      return `Maximum ${MAX_BATCH_LOTS} lots par batch`
    }
    const seen = new Set<string>()
    for (const code of codes) {
      const lower = code.toLowerCase()
      if (seen.has(lower)) {
        return `Code « ${code} » en doublon dans le batch`
      }
      seen.add(lower)
    }
    if (lots) {
      const existingCodes = new Set(lots.map((l) => l.code.toLowerCase()))
      for (const code of codes) {
        if (existingCodes.has(code.toLowerCase())) {
          return `Le code « ${code} » existe déjà`
        }
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

    if (!batchEtageNom.trim()) {
      setBatchEtageError("L'étage est requis")
      hasError = true
    } else {
      setBatchEtageError('')
    }

    if (hasError) return

    const varianteIds = codes.map((code) => batchVarianteMap[code])

    createBatchLots.mutate(
      {
        codes,
        varianteIds,
        etageNom: batchEtageNom.trim(),
        plotId,
      },
      {
        onSuccess: (lotIds) => {
          toast(`${lotIds.length} lot${lotIds.length > 1 ? 's' : ''} créé${lotIds.length > 1 ? 's' : ''}`)
          setShowBatchSheet(false)
          setBatchCodesInput('')
          setBatchVarianteMap({})
          setBatchEtageNom('')
          setBatchEtageCustom(false)
          setBatchCodeError('')
          setBatchVarianteError('')
          setBatchEtageError('')
        },
        onError: () => {
          toast.error('Erreur lors de la création des lots — aucun lot créé')
        },
      },
    )
  }

  function handleOpenRenameEtage(etageId: string, currentNom: string) {
    setRenameEtageId(etageId)
    setRenameEtageNom(currentNom)
    setRenameEtageError('')
  }

  function handleRenameEtage() {
    if (!renameEtageId) return
    const trimmed = renameEtageNom.trim()
    if (!trimmed) {
      setRenameEtageError("Le nom de l'étage est requis")
      return
    }
    if (etages?.some((e) => e.id !== renameEtageId && e.nom.toLowerCase() === trimmed.toLowerCase())) {
      setRenameEtageError('Un étage avec ce nom existe déjà')
      return
    }
    setRenameEtageError('')
    updateEtage.mutate(
      { etageId: renameEtageId, plotId, nom: trimmed },
      {
        onSuccess: () => {
          toast('Étage renommé')
          setRenameEtageId(null)
        },
        onError: (err) => {
          if (err.message?.includes('idx_etages_unique_nom') || err.message?.includes('duplicate') || err.message?.includes('unique')) {
            setRenameEtageError('Un étage avec ce nom existe déjà')
          } else {
            toast.error("Erreur lors du renommage de l'étage")
            setRenameEtageId(null)
          }
        },
      },
    )
  }

  function handleDeleteEtage() {
    if (!deleteEtageTarget) return
    deleteEtage.mutate(
      { etageId: deleteEtageTarget.id, plotId },
      {
        onSuccess: () => {
          toast('Étage supprimé')
          setDeleteEtageTarget(null)
        },
        onError: () => {
          toast.error("Erreur lors de la suppression de l'étage")
          setDeleteEtageTarget(null)
        },
      },
    )
  }

  const lotsGroupedByEtage = lots
    ? lots.reduce(
        (acc, lot) => {
          const etageNom = lot.etages?.nom ?? 'Sans étage'
          if (!acc[etageNom]) acc[etageNom] = []
          acc[etageNom].push(lot)
          return acc
        },
        {} as Record<string, typeof lots>,
      )
    : {}

  const etageCards = useMemo(() => {
    if (!etages || !lots) return []
    return etages.map((etage) => {
      const etageLots = lots.filter((l) => l.etage_id === etage.id)
      const lotCount = etageLots.length
      // Aggregate badge counts across lots in this étage
      const badgeCounts = new Map<string, { nom: string; couleur: string; count: number }>()
      for (const lot of etageLots) {
        for (const a of lot.lot_badge_assignments ?? []) {
          const existing = badgeCounts.get(a.badge_id)
          if (existing) {
            existing.count++
          } else {
            badgeCounts.set(a.badge_id, { nom: a.lot_badges.nom, couleur: a.lot_badges.couleur, count: 1 })
          }
        }
      }
      return {
        id: etage.id,
        nom: etage.nom,
        lotCount,
        progress_done: etage.progress_done,
        progress_total: etage.progress_total,
        has_blocking_note: etage.has_blocking_note,
        has_open_reservation: etage.has_open_reservation,
        badgeCounts: [...badgeCounts.values()],
      }
    })
  }, [etages, lots])

  const [filteredEtages, setFilteredEtages] = useState<typeof etageCards>([])

  const getEtageProgress = useCallback(
    (etage: (typeof etageCards)[0]) => ({ done: etage.progress_done, total: etage.progress_total }),
    [],
  )

  const getEtageAlerts = useCallback(
    (etage: (typeof etageCards)[0]) => etage.has_blocking_note === true || etage.has_open_reservation === true,
    [],
  )

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <header className="flex items-center justify-between px-4 py-3 border-b border-border">
          <Button variant="ghost" size="icon" asChild>
            <Link
              to="/chantiers/$chantierId"
              params={{ chantierId }}
              aria-label="Retour"
            >
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <div className="h-5 w-32 rounded bg-muted animate-pulse" />
          <div className="size-9" />
        </header>
        <div className="flex-1 flex items-center justify-center py-16">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!plot) {
    return (
      <div className="flex flex-col">
        <header className="flex items-center justify-between px-4 py-3 border-b border-border">
          <Button variant="ghost" size="icon" asChild>
            <Link
              to="/chantiers/$chantierId"
              params={{ chantierId }}
              aria-label="Retour"
            >
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <span className="text-lg font-semibold text-foreground">Erreur</span>
          <div className="size-9" />
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16 px-4">
          <p className="text-muted-foreground">Plot introuvable</p>
          <Button
            variant="outline"
            onClick={() =>
              navigate({
                to: '/chantiers/$chantierId',
                params: { chantierId },
              })
            }
          >
            Retour au chantier
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
            to="/chantiers/$chantierId"
            params={{ chantierId }}
            aria-label="Retour"
          >
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <h1 className="text-lg font-semibold text-foreground truncate mx-2">
          {plot.nom}
        </h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Options du plot">
              <EllipsisVertical className="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                handleOpenDuplicateSheet()
              }}
            >
              <Copy className="mr-2 size-4" />
              Dupliquer le plot
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onSelect={(e) => {
                e.preventDefault()
                setShowDeleteDialog(true)
              }}
            >
              <Trash2 className="mr-2 size-4" />
              Supprimer le plot
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {lotsPretsPlot.length > 0 && (
        <div className="px-4 pt-3">
          <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1.5">
            <Hammer className="size-4" />
            {lotsPretsPlot.length} lot{lotsPretsPlot.length > 1 ? 's' : ''} prêt{lotsPretsPlot.length > 1 ? 's' : ''} à carreler
          </p>
        </div>
      )}

      {etageCards.length > 0 && (
        <div className="p-4">
          <h2 className="text-base font-semibold text-foreground mb-3">
            Étages
          </h2>
          <GridFilterTabs
            items={etageCards}
            getProgress={getEtageProgress}
            getAlerts={getEtageAlerts}
            onFilteredChange={setFilteredEtages}
            emptyMessage="Aucun étage"
            className="mb-3"
          />
          {filteredEtages.length > 0 && (
            <div className="flex flex-col gap-2">
              {filteredEtages.map((etage) => {
                const pct = etage.progress_total > 0
                  ? Math.round((etage.progress_done / etage.progress_total) * 100)
                  : 0
                return (
                  <div key={etage.id} className="relative">
                    <StatusCard
                      title={etage.nom}
                      subtitle={`${etage.lotCount} lot${etage.lotCount !== 1 ? 's' : ''}`}
                      statusColor={STATUS_COLORS[computeStatus(etage.progress_done, etage.progress_total)]}
                      indicator={etage.progress_total > 0 ? `${pct} %` : undefined}
                      isBlocked={etage.has_blocking_note}
                      hasOpenReservation={etage.has_open_reservation}
                      badge={etage.badgeCounts.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {etage.badgeCounts.map((b) => (
                            <Badge
                              key={b.nom}
                              variant="outline"
                              className={`${getBadgeColorClasses(b.couleur)} text-[10px] gap-1`}
                            >
                              {b.nom}
                              <span className="font-semibold">{b.count}</span>
                            </Badge>
                          ))}
                        </div>
                      ) : undefined}
                      onClick={() =>
                        navigate({
                          to: '/chantiers/$chantierId/plots/$plotId/$etageId',
                          params: { chantierId, plotId, etageId: etage.id },
                        })
                      }
                    />
                    <div className="absolute top-1 right-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            aria-label={`Options de l'étage ${etage.nom}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <EllipsisVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={(e) => {
                              e.preventDefault()
                              handleOpenRenameEtage(etage.id, etage.nom)
                            }}
                          >
                            <Pencil className="mr-2 size-4" />
                            Renommer
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={(e) => {
                              e.preventDefault()
                              setDeleteEtageTarget({ id: etage.id, nom: etage.nom, lotCount: etage.lotCount })
                            }}
                          >
                            <Trash2 className="mr-2 size-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {etageCards.length > 0 && <div className="border-t border-border" />}

      <div className="p-4">
        <h2 className="text-base font-semibold text-foreground mb-3">
          Tâches disponibles
        </h2>

        {plot.task_definitions.length > 0 ? (
          <div className="border border-border rounded-lg divide-y divide-border mb-4">
            <SortableTaskList
              items={plot.task_definitions.map((task, index) => ({ task, index }))}
              keyExtractor={(item) => `${item.task}-${item.index}`}
              onReorder={(reordered) => {
                updateTasks.mutate({
                  plotId,
                  chantierId,
                  taskDefinitions: reordered.map((item) => item.task),
                })
              }}
              renderItem={(item, { attributes, listeners }) => (
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <button type="button" {...attributes} {...listeners} className="touch-none">
                    <GripVertical className="size-4 text-muted-foreground shrink-0 cursor-grab" />
                  </button>
                  <span className="flex-1 text-sm text-foreground">{item.task}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => handleRemoveTask(
                      plot.task_definitions.indexOf(item.task)
                    )}
                    aria-label={`Supprimer ${item.task}`}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              )}
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mb-4">
            Aucune tâche définie
          </p>
        )}

        <div className="flex gap-2">
          <Input
            placeholder="Nouvelle tâche..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddTask()
            }}
            aria-label="Nouvelle tâche"
          />
          <Button
            onClick={handleAddTask}
            disabled={!newTask.trim()}
          >
            <Plus className="mr-1 size-4" />
            Ajouter
          </Button>
        </div>
      </div>

      <div className="border-t border-border" />

      <div className="p-4">
        <h2 className="text-base font-semibold text-foreground mb-3">
          Variantes
        </h2>

        {variantes && variantes.length > 0 ? (
          <div className="space-y-2 mb-4">
            {variantes.map((variante) => {
              const count = variante.variante_pieces?.[0]?.count ?? 0
              return (
                <StatusCard
                  key={variante.id}
                  title={variante.nom}
                  subtitle={`${count} pièce${count !== 1 ? 's' : ''}`}
                  statusColor={STATUS_COLORS.NOT_STARTED}
                  onClick={() =>
                    navigate({
                      to: '/chantiers/$chantierId/plots/$plotId/variantes/$varianteId',
                      params: { chantierId, plotId, varianteId: variante.id },
                    })
                  }
                />
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Aucune variante configurée
          </p>
        )}
      </div>

      <div className="border-t border-border" />

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-foreground">
            Lots{lots && lots.length > 0 ? ` (${lots.length})` : ''}
          </h2>
          {lots && lots.length > 0 && (
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

        {lots && lots.length > 0 ? (
          <div className="space-y-4 mb-4">
            {Object.entries(lotsGroupedByEtage).map(([etageNom, etageLots]) => (
              <div key={etageNom}>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  {etageNom}
                </h3>
                <div className="space-y-2">
                  {etageLots.map((lot) => {
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
                            statusColor={STATUS_COLORS[computeStatus(lot.progress_done, lot.progress_total)]}
                            indicator={`${lot.progress_done}/${lot.progress_total}`}
                            isBlocked={lot.has_blocking_note}
                            hasOpenReservation={lot.has_open_reservation}
                            badge={lot.lot_badge_assignments?.length > 0 ? <>{lot.lot_badge_assignments.map((a) => (<Badge key={a.badge_id} variant="outline" className={`${getBadgeColorClasses(a.lot_badges.couleur)} text-[10px]`}>{a.lot_badges.nom}</Badge>))}</> : undefined}
                            onClick={selectionMode
                              ? () => toggleLotSelection(lot.id)
                              : () => navigate({
                                  to: '/chantiers/$chantierId/plots/$plotId/$etageId/$lotId',
                                  params: { chantierId, plotId, etageId: lot.etage_id, lotId: lot.id },
                                })
                            }
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mb-4">
            Aucun lot créé — Ajoutez des lots pour lancer la pose.
          </p>
        )}

      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce plot ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le plot {plot.nom} et toutes ses données seront supprimés définitivement. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeletePlot}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteLotsDialog} onOpenChange={setShowDeleteLotsDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Supprimer {selectedLotIds.size} lot{selectedLotIds.size > 1 ? 's' : ''} ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedLotsHaveContent
                ? `Attention : certains lots contiennent des pièces, tâches ou documents. Toutes ces données seront supprimées définitivement.`
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

      <Sheet open={showCreateVarianteSheet} onOpenChange={setShowCreateVarianteSheet}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Nouvelle variante</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <div>
              <Input
                placeholder="Nom de la variante"
                value={newVarianteName}
                onChange={(e) => {
                  setNewVarianteName(e.target.value)
                  if (varianteNameError) setVarianteNameError('')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateVariante()
                }}
                aria-label="Nom de la variante"
              />
              {varianteNameError && (
                <p className="text-sm text-destructive mt-1">{varianteNameError}</p>
              )}
            </div>
            <Button
              className="w-full"
              onClick={handleCreateVariante}
              disabled={createVariante.isPending}
            >
              Créer la variante
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={showCreateLotSheet} onOpenChange={(open) => {
        setShowCreateLotSheet(open)
        if (!open) {
          setLotCode('')
          setLotVarianteId('')
          setLotEtageNom('')
          setLotEtageCustom(false)
          setLotCodeError('')
          setLotVarianteError('')
          setLotEtageError('')
        }
      }}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Nouveau lot</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
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
            <div>
              <Select
                value={lotEtageCustom ? '__new__' : lotEtageNom}
                onValueChange={(val) => {
                  if (val === '__new__') {
                    setLotEtageCustom(true)
                    setLotEtageNom('')
                  } else {
                    setLotEtageCustom(false)
                    setLotEtageNom(val)
                  }
                  if (lotEtageError) setLotEtageError('')
                }}
              >
                <SelectTrigger className="w-full" aria-label="Étage">
                  <SelectValue placeholder="Sélectionner un étage" />
                </SelectTrigger>
                <SelectContent>
                  {etages?.map((e) => (
                    <SelectItem key={e.id} value={e.nom}>
                      {e.nom}
                    </SelectItem>
                  ))}
                  <SelectItem value="__new__">Autre...</SelectItem>
                </SelectContent>
              </Select>
              {lotEtageCustom && (
                <Input
                  className="mt-2"
                  placeholder="Nom de l'étage (ex: RDC, 1, Combles)"
                  value={lotEtageNom}
                  onChange={(e) => {
                    setLotEtageNom(e.target.value)
                    if (lotEtageError) setLotEtageError('')
                  }}
                  aria-label="Nom de l'étage"
                  autoFocus
                />
              )}
              {lotEtageError && (
                <p className="text-sm text-destructive mt-1">{lotEtageError}</p>
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
          setBatchEtageNom('')
          setBatchEtageCustom(false)
          setBatchCodeError('')
          setBatchVarianteError('')
          setBatchEtageError('')
        }
      }}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Ajouter des lots en batch</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <div>
              <textarea
                className="border-input dark:bg-input/30 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] h-auto w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                rows={3}
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

            <div>
              <Select
                value={batchEtageCustom ? '__new__' : batchEtageNom}
                onValueChange={(val) => {
                  if (val === '__new__') {
                    setBatchEtageCustom(true)
                    setBatchEtageNom('')
                  } else {
                    setBatchEtageCustom(false)
                    setBatchEtageNom(val)
                  }
                  if (batchEtageError) setBatchEtageError('')
                }}
              >
                <SelectTrigger className="w-full" aria-label="Étage batch">
                  <SelectValue placeholder="Sélectionner un étage" />
                </SelectTrigger>
                <SelectContent>
                  {etages?.map((e) => (
                    <SelectItem key={e.id} value={e.nom}>
                      {e.nom}
                    </SelectItem>
                  ))}
                  <SelectItem value="__new__">Autre...</SelectItem>
                </SelectContent>
              </Select>
              {batchEtageCustom && (
                <Input
                  className="mt-2"
                  placeholder="Nom de l'étage (ex: RDC, 1, Combles)"
                  value={batchEtageNom}
                  onChange={(e) => {
                    setBatchEtageNom(e.target.value)
                    if (batchEtageError) setBatchEtageError('')
                  }}
                  aria-label="Nom de l'étage batch"
                  autoFocus
                />
              )}
              {batchEtageError && (
                <p className="text-sm text-destructive mt-1">{batchEtageError}</p>
              )}
            </div>
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

      <Dialog open={renameEtageId !== null} onOpenChange={(open) => { if (!open) setRenameEtageId(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renommer l'étage</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Input
                placeholder="Nom de l'étage"
                value={renameEtageNom}
                onChange={(e) => {
                  setRenameEtageNom(e.target.value)
                  if (renameEtageError) setRenameEtageError('')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameEtage()
                }}
                aria-label="Nom de l'étage"
                autoFocus
              />
              {renameEtageError && (
                <p className="text-sm text-destructive mt-1">{renameEtageError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleRenameEtage}
              disabled={updateEtage.isPending}
            >
              Renommer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteEtageTarget !== null} onOpenChange={(open) => { if (!open) setDeleteEtageTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'étage {deleteEtageTarget?.nom} ?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteEtageTarget && deleteEtageTarget.lotCount > 0
                ? `Cet étage contient ${deleteEtageTarget.lotCount} lot${deleteEtageTarget.lotCount > 1 ? 's' : ''}. Tous les lots, pièces et tâches associés seront supprimés définitivement.`
                : 'Cet étage sera supprimé définitivement. Cette action est irréversible.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteEtage}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={showDuplicateSheet} onOpenChange={setShowDuplicateSheet}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Dupliquer le plot</SheetTitle>
            <SheetDescription>
              Toutes les données seront copiées. Les tâches seront remises à zéro.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4">
            <Input
              placeholder="Nom du nouveau plot"
              value={duplicatePlotName}
              onChange={(e) => {
                setDuplicatePlotName(e.target.value)
                if (duplicateNameError) setDuplicateNameError('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleDuplicatePlot()
              }}
              aria-label="Nom du nouveau plot"
              aria-invalid={!!duplicateNameError}
            />
            {duplicateNameError && (
              <p className="text-sm text-destructive mt-1">{duplicateNameError}</p>
            )}
          </div>
          <SheetFooter>
            <Button
              onClick={handleDuplicatePlot}
              disabled={duplicatePlot.isPending}
              className="w-full"
            >
              Dupliquer
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Fab
        menuItems={[
          ...(variantes && variantes.length > 0
            ? [
                {
                  icon: Shapes,
                  label: 'Ajouter une variante',
                  onClick: () => setShowCreateVarianteSheet(true),
                },
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
              ]
            : [
                {
                  icon: Shapes,
                  label: 'Ajouter une variante',
                  onClick: () => setShowCreateVarianteSheet(true),
                },
              ]),
        ]}
      />
    </div>
  )
}
