import { useMemo, useRef, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Euro, FileText, ListChecks, Plus, X } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { Fab } from '@/components/Fab'
import { BesoinLineForm, type BesoinLineValue } from '@/components/BesoinLineForm'
import { BesoinsList } from '@/components/BesoinsList'
import { DepotFournirSheet } from '@/components/DepotFournirSheet'
import { useRealtimeBesoins } from '@/lib/subscriptions/useRealtimeBesoins'
import { useCreateBesoins } from '@/lib/mutations/useCreateBesoins'
import { useUpdateBesoin } from '@/lib/mutations/useUpdateBesoin'
import { useDeleteBesoin } from '@/lib/mutations/useDeleteBesoin'
import { useTransformBesoinToLivraison } from '@/lib/mutations/useTransformBesoinToLivraison'
import { useCreateGroupedLivraison } from '@/lib/mutations/useCreateGroupedLivraison'
import { useUploadLivraisonDocument } from '@/lib/mutations/useUploadLivraisonDocument'
import { useFournirBesoinDepuisDepot } from '@/lib/mutations/useFournirBesoinDepuisDepot'
import { useBesoins } from '@/lib/queries/useBesoins'
import { useChantier } from '@/lib/queries/useChantier'
import { useDepotArticles } from '@/lib/queries/useDepotArticles'
import type { Besoin } from '@/types/database'

export const Route = createFileRoute(
  '/_authenticated/chantiers/$chantierId/besoins',
)({
  component: BesoinsPage,
})

function BesoinsPage() {
  const { chantierId } = Route.useParams()
  const { data: chantier } = useChantier(chantierId)
  const { data: besoins, isLoading } = useBesoins(chantierId)
  const { data: depotArticles } = useDepotArticles()
  useRealtimeBesoins(chantierId)
  const createBesoins = useCreateBesoins()
  const updateBesoin = useUpdateBesoin()
  const deleteBesoin = useDeleteBesoin()
  const transformBesoin = useTransformBesoinToLivraison()
  const createGroupedLivraison = useCreateGroupedLivraison()
  const uploadDocument = useUploadLivraisonDocument()
  const fournirDepot = useFournirBesoinDepuisDepot()

  const hasDepotStock = (depotArticles ?? []).some((a) => a.quantite > 0)

  const commanderBcFileRef = useRef<HTMLInputElement>(null)
  const groupeBcFileRef = useRef<HTMLInputElement>(null)

  const [showSheet, setShowSheet] = useState(false)
  const emptyLine = (): BesoinLineValue => ({ description: '', quantite: '1', chantierId: chantierId })
  const [lines, setLines] = useState<BesoinLineValue[]>([emptyLine()])
  const [createError, setCreateError] = useState('')
  const [showCommanderSheet, setShowCommanderSheet] = useState(false)
  const [besoinToCommand, setBesoinToCommand] = useState<Besoin | null>(null)
  const [commanderFournisseur, setCommanderFournisseur] = useState('')
  const [commanderMontantUnitaire, setCommanderMontantUnitaire] = useState('')
  const [commanderBcFile, setCommanderBcFile] = useState<File | null>(null)

  const [besoinToEdit, setBesoinToEdit] = useState<Besoin | null>(null)
  const [showEditSheet, setShowEditSheet] = useState(false)
  const [editDescription, setEditDescription] = useState('')
  const [editQuantite, setEditQuantite] = useState('1')
  const [editDescError, setEditDescError] = useState('')

  const [besoinToDelete, setBesoinToDelete] = useState<Besoin | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Mode selection groupee
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedBesoinIds, setSelectedBesoinIds] = useState<Set<string>>(new Set())
  const [showGroupeSheet, setShowGroupeSheet] = useState(false)
  const [groupeDescription, setGroupeDescription] = useState('')
  const [groupeFournisseur, setGroupeFournisseur] = useState('')
  const [groupeMontants, setGroupeMontants] = useState<Record<string, string>>({})
  const [groupeBcFile, setGroupeBcFile] = useState<File | null>(null)
  const [groupeError, setGroupeError] = useState('')

  // Depot fournir sheet
  const [besoinToFournir, setBesoinToFournir] = useState<Besoin | null>(null)
  const [showFournirSheet, setShowFournirSheet] = useState(false)

  function handleFournirDepot(besoin: Besoin) {
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

  function handleOpenSheet() {
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

    const batch = filled.map((l) => {
      const qty = parseFloat(l.quantite)
      return {
        chantier_id: chantierId,
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

  function handleEdit(besoin: Besoin) {
    setBesoinToEdit(besoin)
    setEditDescription(besoin.description)
    setEditQuantite(String(besoin.quantite ?? 1))
    setEditDescError('')
    setShowEditSheet(true)
  }

  function handleConfirmEdit() {
    const trimmed = editDescription.trim()
    if (!trimmed) {
      setEditDescError('La description est requise')
      return
    }
    const qty = parseFloat(editQuantite)
    if (isNaN(qty) || qty < 1) {
      setEditDescError('La quantité doit être au moins 1')
      return
    }
    if (!besoinToEdit) return
    updateBesoin.mutate(
      { id: besoinToEdit.id, chantierId, description: trimmed, quantite: qty },
      {
        onSuccess: () => {
          setShowEditSheet(false)
          setBesoinToEdit(null)
          toast('Besoin modifié')
        },
        onError: () => toast.error('Erreur lors de la modification du besoin'),
      },
    )
  }

  function handleDelete(besoin: Besoin) {
    setBesoinToDelete(besoin)
    setShowDeleteDialog(true)
  }

  function handleConfirmDelete() {
    if (!besoinToDelete) return
    deleteBesoin.mutate(
      { id: besoinToDelete.id, chantierId },
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

  function handleCommander(besoin: Besoin) {
    setBesoinToCommand(besoin)
    setCommanderFournisseur('')
    setCommanderMontantUnitaire('')
    setCommanderBcFile(null)
    setShowCommanderSheet(true)
  }

  function handleConfirmCommander() {
    if (!besoinToCommand) return
    const parsedMontant = parseFloat(commanderMontantUnitaire)
    if (isNaN(parsedMontant) || parsedMontant < 0) {
      toast.error('Montant unitaire requis')
      return
    }
    const pendingBcFile = commanderBcFile
    transformBesoin.mutate(
      { besoin: besoinToCommand, fournisseur: commanderFournisseur.trim() || undefined, montantUnitaire: parsedMontant },
      {
        onSuccess: (data) => {
          setShowCommanderSheet(false)
          setBesoinToCommand(null)
          setCommanderFournisseur('')
          setCommanderMontantUnitaire('')
          setCommanderBcFile(null)
          toast('Besoin commandé')
          if (pendingBcFile && data?.id) {
            uploadDocument.mutate({
              livraisonId: data.id,
              chantierId,
              file: pendingBcFile,
              documentType: 'bc',
            })
          }
        },
        onError: () => toast.error('Erreur lors de la commande'),
      },
    )
  }

  const commanderLineTotal = useMemo(() => {
    const pu = parseFloat(commanderMontantUnitaire)
    if (isNaN(pu) || !besoinToCommand) return 0
    return (besoinToCommand.quantite ?? 1) * pu
  }, [commanderMontantUnitaire, besoinToCommand])

  // --- Selection groupee handlers ---
  function handleLongPress(besoin: Besoin) {
    setSelectionMode(true)
    setSelectedBesoinIds(new Set([besoin.id]))
  }

  function handleToggleSelect(id: string) {
    setSelectedBesoinIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      if (next.size === 0) setSelectionMode(false)
      return next
    })
  }

  function handleEnterSelectionMode() {
    setSelectionMode(true)
    setSelectedBesoinIds(new Set())
  }

  function handleCancelSelection() {
    setSelectionMode(false)
    setSelectedBesoinIds(new Set())
  }

  function handleOpenGroupeSheet() {
    setGroupeDescription('')
    setGroupeFournisseur('')
    setGroupeMontants({})
    setGroupeBcFile(null)
    setGroupeError('')
    setShowGroupeSheet(true)
  }

  function handleConfirmGroupe() {
    const trimmed = groupeDescription.trim()
    if (!trimmed) {
      setGroupeError("L'intitulé de la commande est requis")
      return
    }

    const selectedBesoins = (besoins ?? []).filter((b) => selectedBesoinIds.has(b.id))
    // Validate all montant_unitaire
    const missingMontant = selectedBesoins.some((b) => {
      const val = parseFloat(groupeMontants[b.id] ?? '')
      return isNaN(val) || val < 0
    })
    if (missingMontant) {
      setGroupeError('Montant unitaire requis pour chaque ligne')
      return
    }

    const besoinMontants = selectedBesoins.map((b) => ({
      besoinId: b.id,
      montantUnitaire: parseFloat(groupeMontants[b.id]),
      quantite: b.quantite ?? 1,
    }))

    const pendingBcFile = groupeBcFile
    createGroupedLivraison.mutate(
      {
        chantierId,
        besoinIds: Array.from(selectedBesoinIds),
        description: trimmed,
        fournisseur: groupeFournisseur.trim() || undefined,
        besoinMontants,
      },
      {
        onSuccess: (data) => {
          setShowGroupeSheet(false)
          setSelectionMode(false)
          setSelectedBesoinIds(new Set())
          setGroupeMontants({})
          setGroupeBcFile(null)
          toast('Commande créée')
          if (pendingBcFile && data?.id) {
            uploadDocument.mutate({
              livraisonId: data.id,
              chantierId,
              file: pendingBcFile,
              documentType: 'bc',
            })
          }
        },
        onError: () => toast.error('Erreur lors de la commande'),
      },
    )
  }

  const groupeTotal = useMemo(() => {
    const selectedBesoins = (besoins ?? []).filter((b) => selectedBesoinIds.has(b.id))
    return selectedBesoins.reduce((sum, b) => {
      const pu = parseFloat(groupeMontants[b.id] ?? '')
      if (isNaN(pu)) return sum
      return sum + (b.quantite ?? 1) * pu
    }, 0)
  }, [besoins, selectedBesoinIds, groupeMontants])

  const showSelectButton = !selectionMode && besoins && besoins.length >= 1

  return (
    <div className="flex flex-col min-h-[calc(100vh-56px-env(safe-area-inset-bottom))]">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border">
        {selectionMode ? (
          <Button variant="ghost" size="icon" onClick={handleCancelSelection} aria-label="Annuler la sélection">
            <ArrowLeft className="size-5" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" asChild>
            <Link
              to="/chantiers/$chantierId"
              params={{ chantierId }}
              aria-label="Retour"
            >
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
        )}
        <h1 className="text-lg font-semibold text-foreground truncate flex-1">
          {selectionMode
            ? `${selectedBesoinIds.size} sélectionné${selectedBesoinIds.size > 1 ? 's' : ''}`
            : `Besoins${chantier ? ` — ${chantier.nom}` : ''}`}
        </h1>
        {showSelectButton && (
          <Button variant="ghost" size="icon" onClick={handleEnterSelectionMode} aria-label="Sélectionner">
            <ListChecks className="size-5" />
          </Button>
        )}
      </header>

      <div className={`flex-1 p-4 ${selectionMode ? 'pb-24' : ''}`}>
        <h2 className="text-base font-semibold text-foreground mb-3">
          Besoins en attente{besoins && besoins.length > 0 ? ` (${besoins.length})` : ''}
        </h2>

        <BesoinsList
          besoins={besoins}
          isLoading={isLoading}
          onOpenSheet={handleOpenSheet}
          onCommander={handleCommander}
          onFournirDepot={handleFournirDepot}
          hasDepotStock={hasDepotStock}
          onEdit={handleEdit}
          onDelete={handleDelete}
          selectionMode={selectionMode}
          selectedIds={selectedBesoinIds}
          onToggleSelect={handleToggleSelect}
          onLongPress={handleLongPress}
        />

        {!selectionMode && <Fab onClick={handleOpenSheet} />}
      </div>

      {/* Barre de selection en bas */}
      {selectionMode && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background p-4 flex items-center justify-between gap-2" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          <Button variant="ghost" onClick={handleCancelSelection}>
            Annuler
          </Button>
          <span className="text-sm text-muted-foreground">
            {selectedBesoinIds.size} sélectionné{selectedBesoinIds.size > 1 ? 's' : ''}
          </span>
          <Button onClick={handleOpenGroupeSheet} disabled={selectedBesoinIds.size === 0}>
            Commander ({selectedBesoinIds.size})
          </Button>
        </div>
      )}

      {/* Sheet creation besoin multi-lignes */}
      <Sheet open={showSheet} onOpenChange={setShowSheet}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Nouveau(x) besoin(s)</SheetTitle>
            <SheetDescription>
              Ajoutez un ou plusieurs besoins pour ce chantier.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              {lines.map((line, i) => (
                <BesoinLineForm
                  key={i}
                  value={line}
                  onChange={(v) => handleLineChange(i, v)}
                  onRemove={lines.length > 1 ? () => handleRemoveLine(i) : undefined}
                  showChantierSelect={false}
                  chantiers={[]}
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
                if (editDescError) setEditDescError('')
              }}
              aria-label="Description du besoin (édition)"
              aria-invalid={!!editDescError}
              rows={3}
            />
            <div className="flex items-center gap-2">
              <label htmlFor="edit-quantite" className="text-sm font-medium whitespace-nowrap">Quantité</label>
              <Input
                id="edit-quantite"
                type="number"
                inputMode="decimal"
                min={1}
                value={editQuantite}
                onChange={(e) => {
                  setEditQuantite(e.target.value)
                  if (editDescError) setEditDescError('')
                }}
                aria-label="Quantité"
                className="w-20"
              />
            </div>
            {editDescError && (
              <p className="text-sm text-destructive mt-1">{editDescError}</p>
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

      {/* Sheet commander individuel */}
      <Sheet open={showCommanderSheet} onOpenChange={setShowCommanderSheet}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Commander ce besoin</SheetTitle>
            <SheetDescription>
              {besoinToCommand?.description} — Qté: {besoinToCommand?.quantite ?? 1}
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 flex flex-col gap-3">
            <Input
              placeholder="Fournisseur (optionnel)"
              value={commanderFournisseur}
              onChange={(e) => setCommanderFournisseur(e.target.value)}
              aria-label="Fournisseur"
            />
            <div className="relative">
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="Montant unitaire"
                value={commanderMontantUnitaire}
                onChange={(e) => setCommanderMontantUnitaire(e.target.value)}
                aria-label="Montant unitaire"
                className="pr-8"
              />
              <Euro className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            </div>
            {commanderLineTotal > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total ligne</span>
                <span className="font-semibold">
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(commanderLineTotal)}
                </span>
              </div>
            )}
            <div>
              <input
                ref={commanderBcFileRef}
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/heic"
                className="hidden"
                onChange={(e) => {
                  setCommanderBcFile(e.target.files?.[0] ?? null)
                  e.target.value = ''
                }}
              />
              {commanderBcFile ? (
                <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
                  <FileText className="size-4 text-emerald-500 shrink-0" />
                  <span className="text-sm truncate flex-1">{commanderBcFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setCommanderBcFile(null)}
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                    aria-label="Retirer le fichier"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  type="button"
                  className="w-full justify-start gap-2"
                  onClick={() => commanderBcFileRef.current?.click()}
                >
                  <FileText className="size-4" />
                  Bon de commande (optionnel)
                </Button>
              )}
            </div>
          </div>
          <SheetFooter>
            <Button
              onClick={handleConfirmCommander}
              disabled={transformBesoin.isPending}
              className="w-full"
            >
              Valider la commande
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Sheet commande groupee */}
      <Sheet open={showGroupeSheet} onOpenChange={setShowGroupeSheet}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Commander {selectedBesoinIds.size} besoin{selectedBesoinIds.size > 1 ? 's' : ''}</SheetTitle>
            <SheetDescription>
              Renseignez le fournisseur et le montant unitaire pour chaque besoin.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 flex flex-col gap-3">
            <div>
              <label htmlFor="groupe-description" className="text-sm font-medium mb-1 block">
                Intitulé de la commande
              </label>
              <Textarea
                id="groupe-description"
                value={groupeDescription}
                onChange={(e) => {
                  setGroupeDescription(e.target.value)
                  if (groupeError) setGroupeError('')
                }}
                placeholder="Ex: Carrelage cuisine T2"
                aria-invalid={!!groupeError}
                rows={2}
              />
              {groupeError && (
                <p className="text-sm text-destructive mt-1">{groupeError}</p>
              )}
            </div>
            <div>
              <label htmlFor="groupe-fournisseur" className="text-sm font-medium mb-1 block">
                Fournisseur
              </label>
              <Input
                id="groupe-fournisseur"
                value={groupeFournisseur}
                onChange={(e) => setGroupeFournisseur(e.target.value)}
                placeholder="Optionnel"
              />
            </div>
            <div className="flex flex-col gap-2">
              {besoins?.filter((b) => selectedBesoinIds.has(b.id)).map((b) => {
                const pu = parseFloat(groupeMontants[b.id] ?? '')
                const lineTotal = !isNaN(pu) ? (b.quantite ?? 1) * pu : 0
                return (
                  <div key={b.id} className="rounded-lg border border-border p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate flex-1">{b.description}</p>
                      <span className="text-xs text-muted-foreground ml-2">Qté: {b.quantite ?? 1}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min="0"
                          placeholder="P.U."
                          value={groupeMontants[b.id] ?? ''}
                          onChange={(e) => setGroupeMontants((prev) => ({ ...prev, [b.id]: e.target.value }))}
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
            {groupeTotal > 0 && (
              <div className="flex items-center justify-between border-t pt-2">
                <span className="text-sm font-semibold">Total livraison</span>
                <span className="text-sm font-semibold">
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(groupeTotal)}
                </span>
              </div>
            )}
            <div>
              <input
                ref={groupeBcFileRef}
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/heic"
                className="hidden"
                onChange={(e) => {
                  setGroupeBcFile(e.target.files?.[0] ?? null)
                  e.target.value = ''
                }}
              />
              {groupeBcFile ? (
                <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
                  <FileText className="size-4 text-emerald-500 shrink-0" />
                  <span className="text-sm truncate flex-1">{groupeBcFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setGroupeBcFile(null)}
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                    aria-label="Retirer le fichier"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  type="button"
                  className="w-full justify-start gap-2"
                  onClick={() => groupeBcFileRef.current?.click()}
                >
                  <FileText className="size-4" />
                  Bon de commande (optionnel)
                </Button>
              )}
            </div>
          </div>
          <SheetFooter>
            <Button
              onClick={handleConfirmGroupe}
              disabled={createGroupedLivraison.isPending}
              className="w-full"
            >
              Valider la commande
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <DepotFournirSheet
        besoin={besoinToFournir}
        chantierNom={chantier?.nom}
        open={showFournirSheet}
        onOpenChange={setShowFournirSheet}
        onConfirm={handleConfirmFournir}
        articles={depotArticles ?? []}
        isPending={fournirDepot.isPending}
      />
    </div>
  )
}
