import { useState, useMemo, useRef, useCallback } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ClipboardList, Euro, MoreVertical, Pencil, Plus, Trash2, Warehouse } from 'lucide-react'
import { toast } from 'sonner'
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
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Fab } from '@/components/Fab'
import { BesoinLineForm, type BesoinLineValue } from '@/components/BesoinLineForm'
import { useAllPendingBesoins, type BesoinWithChantier } from '@/lib/queries/useAllPendingBesoins'
import { useBulkTransformBesoins } from '@/lib/mutations/useBulkTransformBesoins'
import { useCreateBesoins } from '@/lib/mutations/useCreateBesoins'
import { useDeleteBesoin } from '@/lib/mutations/useDeleteBesoin'
import { useUpdateBesoin } from '@/lib/mutations/useUpdateBesoin'
import { useFournirBesoinDepuisDepot } from '@/lib/mutations/useFournirBesoinDepuisDepot'
import { useChantiers } from '@/lib/queries/useChantiers'
import { useDepotArticles } from '@/lib/queries/useDepotArticles'
import { useRealtimeAllPendingBesoins } from '@/lib/subscriptions/useRealtimeAllPendingBesoins'
import { DepotFournirSheet } from '@/components/DepotFournirSheet'
import { formatRelativeTime } from '@/lib/utils/formatRelativeTime'
import { useAuth } from '@/lib/auth'

export const Route = createFileRoute('/_authenticated/besoins')({
  component: BesoinsPage,
})

interface ChantierGroup {
  chantierId: string
  chantierNom: string
  besoins: BesoinWithChantier[]
}

function groupByChantier(besoins: BesoinWithChantier[]): ChantierGroup[] {
  const map = new Map<string, ChantierGroup>()

  for (const besoin of besoins) {
    const cid = besoin.chantier_id ?? ''
    const existing = map.get(cid)
    if (existing) {
      existing.besoins.push(besoin)
    } else {
      map.set(cid, {
        chantierId: cid,
        chantierNom: besoin.chantiers.nom,
        besoins: [besoin],
      })
    }
  }

  // Sort groups: chantier with most recent besoin first
  return Array.from(map.values()).sort((a, b) => {
    const aDate = a.besoins[0]?.created_at ?? ''
    const bDate = b.besoins[0]?.created_at ?? ''
    return bDate.localeCompare(aDate)
  })
}

function getAuthorInitial(
  createdBy: string | null,
  currentUserId: string | undefined,
  currentUserEmail: string | undefined,
): string | null {
  if (createdBy && createdBy === currentUserId && currentUserEmail) {
    return currentUserEmail.charAt(0).toUpperCase()
  }
  return null
}

function BesoinsPage() {
  const { data: besoins, isLoading } = useAllPendingBesoins()
  const { data: chantiers } = useChantiers()
  const { data: depotArticles } = useDepotArticles()
  const bulkTransform = useBulkTransformBesoins()
  const createBesoins = useCreateBesoins()
  const deleteBesoin = useDeleteBesoin()
  const updateBesoin = useUpdateBesoin()
  const fournirDepot = useFournirBesoinDepuisDepot()
  const { user } = useAuth()
  useRealtimeAllPendingBesoins()

  const hasDepotStock = (depotArticles ?? []).some((a) => a.quantite > 0)

  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Edit sheet
  const [besoinToEdit, setBesoinToEdit] = useState<BesoinWithChantier | null>(null)
  const [showEditSheet, setShowEditSheet] = useState(false)
  const [editDescription, setEditDescription] = useState('')
  const [editQuantite, setEditQuantite] = useState('1')
  const [editError, setEditError] = useState('')

  // Delete dialog
  const [besoinToDelete, setBesoinToDelete] = useState<BesoinWithChantier | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  function handleEdit(besoin: BesoinWithChantier) {
    setBesoinToEdit(besoin)
    setEditDescription(besoin.description)
    setEditQuantite(String(besoin.quantite ?? 1))
    setEditError('')
    setShowEditSheet(true)
  }

  function handleConfirmEdit() {
    const trimmed = editDescription.trim()
    if (!trimmed) {
      setEditError('La description est requise')
      return
    }
    const qty = parseFloat(editQuantite)
    if (isNaN(qty) || qty < 1) {
      setEditError('La quantité doit être au moins 1')
      return
    }
    if (!besoinToEdit) return
    updateBesoin.mutate(
      { id: besoinToEdit.id, chantierId: besoinToEdit.chantier_id ?? '', description: trimmed, quantite: qty },
      {
        onSuccess: () => {
          setShowEditSheet(false)
          setBesoinToEdit(null)
          toast('Besoin modifié')
        },
        onError: () => toast.error('Erreur lors de la modification'),
      },
    )
  }

  function handleDelete(besoin: BesoinWithChantier) {
    setBesoinToDelete(besoin)
    setShowDeleteDialog(true)
  }

  function handleConfirmDelete() {
    if (!besoinToDelete) return
    deleteBesoin.mutate(
      { id: besoinToDelete.id, chantierId: besoinToDelete.chantier_id ?? '' },
      {
        onSuccess: () => {
          setShowDeleteDialog(false)
          setBesoinToDelete(null)
          toast('Besoin supprimé')
        },
        onError: () => toast.error('Erreur lors de la suppression'),
      },
    )
  }

  // Depot fournir sheet
  const [besoinToFournir, setBesoinToFournir] = useState<BesoinWithChantier | null>(null)
  const [showFournirSheet, setShowFournirSheet] = useState(false)

  function handleFournirDepot(besoin: BesoinWithChantier) {
    setBesoinToFournir(besoin)
    setShowFournirSheet(true)
  }

  function handleConfirmFournir(params: { besoinId: string; articleId: string; quantite: number }) {
    fournirDepot.mutate(params, {
      onSuccess: () => {
        setShowFournirSheet(false)
        setBesoinToFournir(null)
      },
    })
  }

  // Bulk delete
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  function handleOpenBulkDelete() {
    setShowBulkDeleteDialog(true)
  }

  async function handleConfirmBulkDelete() {
    const selectedBesoins = (besoins ?? []).filter((b) => selectedIds.has(b.id))
    if (selectedBesoins.length === 0) return

    setIsBulkDeleting(true)
    let successCount = 0
    let failCount = 0

    for (const besoin of selectedBesoins) {
      try {
        await deleteBesoin.mutateAsync({ id: besoin.id, chantierId: besoin.chantier_id ?? '' })
        successCount++
      } catch {
        failCount++
      }
    }

    setIsBulkDeleting(false)
    setShowBulkDeleteDialog(false)
    setSelectionMode(false)
    setSelectedIds(new Set())

    if (failCount > 0) {
      toast(`${successCount} supprimé${successCount > 1 ? 's' : ''}, ${failCount} échec${failCount > 1 ? 's' : ''}`)
    } else {
      toast(`${successCount} besoin${successCount > 1 ? 's' : ''} supprimé${successCount > 1 ? 's' : ''}`)
    }
  }

  // Sheet bulk commande
  const [showBulkSheet, setShowBulkSheet] = useState(false)
  const [bulkDescription, setBulkDescription] = useState('')
  const [bulkDescError, setBulkDescError] = useState('')
  const [bulkFournisseur, setBulkFournisseur] = useState('')
  const [bulkMontants, setBulkMontants] = useState<Record<string, string>>({})

  // Sheet creation besoin multi-lignes
  const [showSheet, setShowSheet] = useState(false)
  const [chantierUnique, setChantierUnique] = useState(false)
  const [globalChantierId, setGlobalChantierId] = useState('')
  const emptyLine = (): BesoinLineValue => ({ description: '', quantite: '1', chantierId: '' })
  const [lines, setLines] = useState<BesoinLineValue[]>([emptyLine()])
  const [createError, setCreateError] = useState('')

  function handleOpenSheet() {
    setChantierUnique(false)
    setGlobalChantierId('')
    setLines([emptyLine()])
    setCreateError('')
    setShowSheet(true)
  }

  function handleLineChange(index: number, value: BesoinLineValue) {
    setLines((prev) => prev.map((l, i) => (i === index ? value : l)))
    if (createError) setCreateError('')
  }

  function handleRemoveLine(index: number) {
    setLines((prev) => {
      const next = prev.filter((_, i) => i !== index)
      return next.length === 0 ? [emptyLine()] : next
    })
  }

  function handleAddLine() {
    setLines((prev) => [...prev, emptyLine()])
  }

  function handleCreate() {
    const filled = lines.filter((l) => l.description.trim())
    if (filled.length === 0) {
      setCreateError('Au moins un besoin est requis')
      return
    }

    const missingChantier = filled.some((l) => {
      const cid = chantierUnique ? globalChantierId : l.chantierId
      return !cid
    })
    if (missingChantier) {
      setCreateError('Sélectionnez un chantier pour chaque ligne')
      return
    }

    const batch = filled.map((l) => {
      const qty = parseFloat(l.quantite)
      return {
        chantier_id: chantierUnique ? globalChantierId : l.chantierId,
        description: l.description.trim(),
        quantite: isNaN(qty) || qty < 1 ? 1 : qty,
      }
    })

    createBesoins.mutate(batch, {
      onSuccess: () => {
        setShowSheet(false)
        toast(batch.length > 1 ? `${batch.length} besoins créés` : 'Besoin créé')
      },
      onError: () => toast.error('Erreur lors de la création'),
    })
  }

  const groups = useMemo(() => groupByChantier(besoins ?? []), [besoins])

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  function handleLongPress(besoin: BesoinWithChantier) {
    setSelectionMode(true)
    setSelectedIds(new Set([besoin.id]))
  }

  const handlePointerDown = useCallback(
    (besoin: BesoinWithChantier) => {
      if (selectionMode) return
      longPressTimer.current = setTimeout(() => {
        handleLongPress(besoin)
        longPressTimer.current = null
      }, 500)
    },
    [selectionMode],
  )

  function handleToggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      if (next.size === 0) setSelectionMode(false)
      return next
    })
  }

  function handleSelectAllChantier(group: ChantierGroup) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      const allSelected = group.besoins.every((b) => next.has(b.id))
      if (allSelected) {
        group.besoins.forEach((b) => next.delete(b.id))
        if (next.size === 0) setSelectionMode(false)
      } else {
        group.besoins.forEach((b) => next.add(b.id))
      }
      return next
    })
  }

  function handleEnterSelectionMode() {
    setSelectionMode(true)
    setSelectedIds(new Set())
  }

  function handleCancelSelection() {
    setSelectionMode(false)
    setSelectedIds(new Set())
  }

  function handleOpenBulkSheet() {
    setBulkDescription('')
    setBulkDescError('')
    setBulkFournisseur('')
    setBulkMontants({})
    setShowBulkSheet(true)
  }

  function handleConfirmBulkTransform() {
    const trimmedDesc = bulkDescription.trim()
    if (!trimmedDesc) {
      setBulkDescError("L'intitulé est requis")
      return
    }

    const selectedBesoins = (besoins ?? []).filter((b) => selectedIds.has(b.id))
    if (selectedBesoins.length === 0) return

    // Validate all montant_unitaire are filled
    const missingMontant = selectedBesoins.some((b) => {
      const val = parseFloat(bulkMontants[b.id] ?? '')
      return isNaN(val) || val < 0
    })
    if (missingMontant) {
      setBulkDescError('Montant unitaire requis pour chaque ligne')
      return
    }

    const besoinMontants = selectedBesoins.map((b) => ({
      besoinId: b.id,
      montantUnitaire: parseFloat(bulkMontants[b.id]),
      quantite: b.quantite ?? 1,
    }))

    bulkTransform.mutate(
      {
        besoins: selectedBesoins,
        description: trimmedDesc,
        fournisseur: bulkFournisseur.trim() || undefined,
        besoinMontants,
      },
      {
        onSuccess: () => {
          setShowBulkSheet(false)
          setSelectionMode(false)
          setSelectedIds(new Set())
          toast('Commande créée')
        },
        onError: () => toast.error('Erreur lors de la création de la commande'),
      },
    )
  }

  const bulkTotal = useMemo(() => {
    const selectedBesoins = (besoins ?? []).filter((b) => selectedIds.has(b.id))
    return selectedBesoins.reduce((sum, b) => {
      const pu = parseFloat(bulkMontants[b.id] ?? '')
      if (isNaN(pu)) return sum
      return sum + (b.quantite ?? 1) * pu
    }, 0)
  }, [besoins, selectedIds, bulkMontants])

  const totalBesoins = besoins?.length ?? 0
  const showSelectButton = !selectionMode && totalBesoins >= 1

  return (
    <div className="flex flex-col gap-4 p-4 pb-24 overflow-x-hidden">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Besoins</h1>
        {showSelectButton && (
          <Button variant="outline" size="sm" onClick={handleEnterSelectionMode}>
            Sélectionner
          </Button>
        )}
        {selectionMode && (
          <Button variant="ghost" size="sm" onClick={handleCancelSelection}>
            Annuler
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-5 w-40 rounded bg-muted animate-pulse" />
              <div className="rounded-lg border border-border p-4 animate-pulse">
                <div className="h-4 w-3/4 rounded bg-muted mb-2" />
                <div className="h-3 w-1/2 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && totalBesoins === 0 && (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
          <ClipboardList className="size-12" />
          <p>Aucun besoin en attente</p>
        </div>
      )}

      {!isLoading && totalBesoins > 0 && (
        <div className="flex flex-col gap-6">
          {groups.map((group) => {
            const allGroupSelected = selectionMode && group.besoins.every((b) => selectedIds.has(b.id))
            return (
              <section key={group.chantierId}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-foreground">
                    {group.chantierNom} ({group.besoins.length})
                  </h2>
                  {selectionMode && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSelectAllChantier(group)}
                    >
                      {allGroupSelected ? 'Désélectionner' : 'Tout'}
                    </Button>
                  )}
                </div>
                <div className="space-y-3">
                  {group.besoins.map((besoin) => {
                    const isSelected = selectedIds.has(besoin.id)
                    return (
                      <div
                        key={besoin.id}
                        className="rounded-lg border border-border p-4"
                        style={!selectionMode ? { touchAction: 'manipulation' } : undefined}
                        onPointerDown={!selectionMode ? () => handlePointerDown(besoin) : undefined}
                        onPointerUp={!selectionMode ? clearTimer : undefined}
                        onPointerMove={!selectionMode ? clearTimer : undefined}
                        onPointerCancel={!selectionMode ? clearTimer : undefined}
                        onClick={selectionMode ? () => handleToggleSelect(besoin.id) : undefined}
                        role={selectionMode ? 'checkbox' : undefined}
                        aria-checked={selectionMode ? isSelected : undefined}
                      >
                        <div className="flex items-start gap-3">
                          {selectionMode && (
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleToggleSelect(besoin.id)}
                              className="mt-0.5"
                              aria-label={`Sélectionner ${besoin.description}`}
                              onClick={(e) => e.stopPropagation()}
                            />
                          )}
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground mt-0.5">
                            {besoin.quantite}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground break-words">
                              {besoin.description}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {(() => {
                                const initial = getAuthorInitial(besoin.created_by, user?.id, user?.email ?? undefined)
                                return initial ? `${initial} · ` : ''
                              })()}
                              {formatRelativeTime(besoin.created_at)}
                            </span>
                          </div>
                          {!selectionMode && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 shrink-0"
                                  aria-label="Actions"
                                  onPointerDown={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {hasDepotStock && !besoin.livraison_id && (
                                  <DropdownMenuItem onSelect={() => handleFournirDepot(besoin)}>
                                    <Warehouse className="mr-2 h-4 w-4" />
                                    Fournir depuis le dépôt
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onSelect={() => handleEdit(besoin)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onSelect={() => handleDelete(besoin)}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      )}

      {selectionMode && selectedIds.size > 0 && (
        <div
          className="fixed bottom-14 left-0 right-0 z-40 border-t bg-background p-4"
          style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
        >
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={handleOpenBulkDelete}
              className="flex-1"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer ({selectedIds.size})
            </Button>
            <Button
              onClick={handleOpenBulkSheet}
              className="flex-1"
            >
              Commander ({selectedIds.size})
            </Button>
          </div>
        </div>
      )}

      {!selectionMode && <Fab onClick={handleOpenSheet} />}

      {/* Dialog suppression en masse */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {selectedIds.size} besoin{selectedIds.size > 1 ? 's' : ''} ?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedIds.size > 1
                ? 'Les besoins sélectionnés seront supprimés définitivement.'
                : 'Le besoin sélectionné sera supprimé définitivement.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirmBulkDelete} disabled={isBulkDeleting}>
              {isBulkDeleting ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sheet bulk commande */}
      <Sheet open={showBulkSheet} onOpenChange={setShowBulkSheet}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Commander {selectedIds.size} besoin{selectedIds.size > 1 ? 's' : ''}</SheetTitle>
            <SheetDescription>
              Renseignez le fournisseur et le montant unitaire pour chaque besoin.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 flex flex-col gap-3">
            <div>
              <Input
                placeholder="Intitulé de la commande"
                value={bulkDescription}
                onChange={(e) => {
                  setBulkDescription(e.target.value)
                  if (bulkDescError) setBulkDescError('')
                }}
                aria-label="Intitulé de la commande"
                aria-invalid={!!bulkDescError}
              />
              {bulkDescError && (
                <p className="text-sm text-destructive mt-1">{bulkDescError}</p>
              )}
            </div>
            <Input
              placeholder="Fournisseur (optionnel)"
              value={bulkFournisseur}
              onChange={(e) => setBulkFournisseur(e.target.value)}
              aria-label="Fournisseur"
            />
            <div className="flex flex-col gap-2">
              {(besoins ?? []).filter((b) => selectedIds.has(b.id)).map((b) => {
                const pu = parseFloat(bulkMontants[b.id] ?? '')
                const lineTotal = !isNaN(pu) ? (b.quantite ?? 1) * pu : 0
                return (
                  <div key={b.id} className="rounded-lg border border-border p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate flex-1">{b.description}</p>
                      <span className="text-xs text-muted-foreground ml-2">Qté: {b.quantite ?? 1}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{b.chantiers.nom}</p>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min="0"
                          placeholder="P.U."
                          value={bulkMontants[b.id] ?? ''}
                          onChange={(e) => setBulkMontants((prev) => ({ ...prev, [b.id]: e.target.value }))}
                          aria-label={`Montant unitaire ${b.description}`}
                          className="pr-8"
                        />
                        <Euro className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                      </div>
                      <span className="text-sm font-medium w-24 text-right">
                        {lineTotal > 0
                          ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(lineTotal)
                          : '—'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
            {bulkTotal > 0 && (
              <div className="flex items-center justify-between border-t pt-2">
                <span className="text-sm font-semibold">Total livraison</span>
                <span className="text-sm font-semibold">
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(bulkTotal)}
                </span>
              </div>
            )}
          </div>
          <SheetFooter>
            <Button
              onClick={handleConfirmBulkTransform}
              disabled={bulkTransform.isPending}
              className="w-full"
            >
              Valider la commande
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Dialog suppression besoin */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce besoin ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le besoin &laquo;{besoinToDelete?.description}&raquo; sera supprimé définitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirmDelete}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sheet edition besoin */}
      <Sheet open={showEditSheet} onOpenChange={setShowEditSheet}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Modifier le besoin</SheetTitle>
            <SheetDescription>Modifiez la description et la quantité.</SheetDescription>
          </SheetHeader>
          <div className="px-4 flex flex-col gap-3">
            <Textarea
              value={editDescription}
              onChange={(e) => {
                setEditDescription(e.target.value)
                if (editError) setEditError('')
              }}
              aria-label="Description du besoin (édition)"
              aria-invalid={!!editError}
              rows={3}
            />
            <div className="flex items-center gap-2">
              <Label htmlFor="edit-quantite-global" className="text-sm whitespace-nowrap">Quantité</Label>
              <Input
                id="edit-quantite-global"
                type="number"
                inputMode="decimal"
                min={1}
                value={editQuantite}
                onChange={(e) => {
                  setEditQuantite(e.target.value)
                  if (editError) setEditError('')
                }}
                aria-label="Quantité"
                className="w-20"
              />
            </div>
            {editError && (
              <p className="text-sm text-destructive mt-1">{editError}</p>
            )}
          </div>
          <SheetFooter>
            <Button
              onClick={handleConfirmEdit}
              disabled={updateBesoin.isPending}
              className="w-full"
            >
              Enregistrer
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={showSheet} onOpenChange={setShowSheet}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Nouveau(x) besoin(s)</SheetTitle>
            <SheetDescription>
              Ajoutez un ou plusieurs besoins. Chaque ligne = un besoin.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="chantier-unique-toggle" className="text-sm">
                Chantier unique
              </Label>
              <Switch
                id="chantier-unique-toggle"
                checked={chantierUnique}
                onCheckedChange={setChantierUnique}
              />
            </div>
            {chantierUnique && (
              <Select value={globalChantierId} onValueChange={setGlobalChantierId}>
                <SelectTrigger aria-label="Chantier global">
                  <SelectValue placeholder="Choisir un chantier" />
                </SelectTrigger>
                <SelectContent>
                  {(chantiers ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="flex flex-col gap-2">
              {lines.map((line, i) => (
                <BesoinLineForm
                  key={i}
                  value={line}
                  onChange={(v) => handleLineChange(i, v)}
                  onRemove={lines.length > 1 ? () => handleRemoveLine(i) : undefined}
                  showChantierSelect={!chantierUnique}
                  chantiers={chantiers ?? []}
                  autoFocus={i === lines.length - 1 && i > 0}
                  index={i}
                />
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddLine}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une ligne
            </Button>
            {createError && (
              <p className="text-sm text-destructive">{createError}</p>
            )}
          </div>
          <SheetFooter>
            <Button
              onClick={handleCreate}
              disabled={createBesoins.isPending}
              className="w-full"
            >
              {createBesoins.isPending ? 'Création...' : `Créer ${lines.filter((l) => l.description.trim()).length || ''} besoin(s)`}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <DepotFournirSheet
        besoin={besoinToFournir}
        chantierNom={besoinToFournir ? groups.find((g) => g.chantierId === besoinToFournir.chantier_id)?.chantierNom : undefined}
        open={showFournirSheet}
        onOpenChange={setShowFournirSheet}
        onConfirm={handleConfirmFournir}
        articles={depotArticles ?? []}
        isPending={fournirDepot.isPending}
      />
    </div>
  )
}
