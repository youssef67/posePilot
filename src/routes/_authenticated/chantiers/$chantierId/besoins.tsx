import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, ListChecks } from 'lucide-react'
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
import { BesoinsList } from '@/components/BesoinsList'
import { useRealtimeBesoins } from '@/lib/subscriptions/useRealtimeBesoins'
import { useCreateBesoin } from '@/lib/mutations/useCreateBesoin'
import { useUpdateBesoin } from '@/lib/mutations/useUpdateBesoin'
import { useDeleteBesoin } from '@/lib/mutations/useDeleteBesoin'
import { useTransformBesoinToLivraison } from '@/lib/mutations/useTransformBesoinToLivraison'
import { useCreateGroupedLivraison } from '@/lib/mutations/useCreateGroupedLivraison'
import { useBesoins } from '@/lib/queries/useBesoins'
import { useChantier } from '@/lib/queries/useChantier'
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
  useRealtimeBesoins(chantierId)
  const createBesoin = useCreateBesoin()
  const updateBesoin = useUpdateBesoin()
  const deleteBesoin = useDeleteBesoin()
  const transformBesoin = useTransformBesoinToLivraison()
  const createGroupedLivraison = useCreateGroupedLivraison()

  const [showSheet, setShowSheet] = useState(false)
  const [description, setDescription] = useState('')
  const [descError, setDescError] = useState('')
  const [showCommanderSheet, setShowCommanderSheet] = useState(false)
  const [besoinToCommand, setBesoinToCommand] = useState<Besoin | null>(null)
  const [commanderFournisseur, setCommanderFournisseur] = useState('')

  const [besoinToEdit, setBesoinToEdit] = useState<Besoin | null>(null)
  const [showEditSheet, setShowEditSheet] = useState(false)
  const [editDescription, setEditDescription] = useState('')
  const [editDescError, setEditDescError] = useState('')

  const [besoinToDelete, setBesoinToDelete] = useState<Besoin | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Mode selection groupee
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedBesoinIds, setSelectedBesoinIds] = useState<Set<string>>(new Set())
  const [showGroupeSheet, setShowGroupeSheet] = useState(false)
  const [groupeDescription, setGroupeDescription] = useState('')
  const [groupeFournisseur, setGroupeFournisseur] = useState('')
  const [groupeError, setGroupeError] = useState('')

  function handleOpenSheet() {
    setDescription('')
    setDescError('')
    setShowSheet(true)
  }

  function handleCreate() {
    const trimmed = description.trim()
    if (!trimmed) {
      setDescError('La description est requise')
      return
    }
    createBesoin.mutate(
      { chantierId, description: trimmed },
      {
        onSuccess: () => {
          setShowSheet(false)
          toast('Besoin créé')
        },
        onError: () => toast.error('Erreur lors de la création du besoin'),
      },
    )
  }

  function handleEdit(besoin: Besoin) {
    setBesoinToEdit(besoin)
    setEditDescription(besoin.description)
    setEditDescError('')
    setShowEditSheet(true)
  }

  function handleConfirmEdit() {
    const trimmed = editDescription.trim()
    if (!trimmed) {
      setEditDescError('La description est requise')
      return
    }
    if (!besoinToEdit) return
    updateBesoin.mutate(
      { id: besoinToEdit.id, chantierId, description: trimmed },
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
    setShowCommanderSheet(true)
  }

  function handleConfirmCommander() {
    if (!besoinToCommand) return
    transformBesoin.mutate(
      { besoin: besoinToCommand, fournisseur: commanderFournisseur.trim() || undefined },
      {
        onSuccess: () => {
          setShowCommanderSheet(false)
          setBesoinToCommand(null)
          setCommanderFournisseur('')
          toast('Besoin commandé')
        },
        onError: () => toast.error('Erreur lors de la commande'),
      },
    )
  }

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
    setGroupeError('')
    setShowGroupeSheet(true)
  }

  function handleConfirmGroupe() {
    const trimmed = groupeDescription.trim()
    if (!trimmed) {
      setGroupeError("L'intitulé de la commande est requis")
      return
    }
    createGroupedLivraison.mutate(
      {
        chantierId,
        besoinIds: Array.from(selectedBesoinIds),
        description: trimmed,
        fournisseur: groupeFournisseur.trim() || undefined,
      },
      {
        onSuccess: () => {
          setShowGroupeSheet(false)
          setSelectionMode(false)
          setSelectedBesoinIds(new Set())
          toast('Commande créée')
        },
        onError: () => toast.error('Erreur lors de la commande'),
      },
    )
  }

  const showSelectButton = !selectionMode && besoins && besoins.length >= 2

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

      {/* Sheet creation besoin */}
      <Sheet open={showSheet} onOpenChange={setShowSheet}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Nouveau besoin</SheetTitle>
            <SheetDescription>
              Décrivez le matériel ou la fourniture nécessaire.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4">
            <Textarea
              placeholder="Ex: Colle pour faïence 20kg"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                if (descError) setDescError('')
              }}
              aria-label="Description du besoin"
              aria-invalid={!!descError}
              rows={3}
            />
            {descError && (
              <p className="text-sm text-destructive mt-1">{descError}</p>
            )}
          </div>
          <SheetFooter>
            <Button
              onClick={handleCreate}
              disabled={createBesoin.isPending}
              className="w-full"
            >
              Créer le besoin
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Sheet edition besoin */}
      <Sheet open={showEditSheet} onOpenChange={setShowEditSheet}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Modifier le besoin</SheetTitle>
            <SheetDescription>Modifiez la description du besoin.</SheetDescription>
          </SheetHeader>
          <div className="px-4">
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
              Le besoin &laquo;{besoinToCommand?.description}&raquo; sera transformé en livraison.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4">
            <Input
              placeholder="Fournisseur (optionnel)"
              value={commanderFournisseur}
              onChange={(e) => setCommanderFournisseur(e.target.value)}
              aria-label="Fournisseur"
            />
          </div>
          <SheetFooter>
            <Button
              onClick={handleConfirmCommander}
              disabled={transformBesoin.isPending}
              className="w-full"
            >
              Confirmer la commande
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Sheet commande groupee */}
      <Sheet open={showGroupeSheet} onOpenChange={setShowGroupeSheet}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Commander {selectedBesoinIds.size} besoin{selectedBesoinIds.size > 1 ? 's' : ''}</SheetTitle>
            <SheetDescription>
              Créer une livraison regroupant les besoins sélectionnés.
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
            <div>
              <p className="text-sm font-medium mb-1">Besoins inclus :</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {besoins?.filter((b) => selectedBesoinIds.has(b.id)).map((b) => (
                  <li key={b.id} className="truncate">• {b.description}</li>
                ))}
              </ul>
            </div>
          </div>
          <SheetFooter>
            <Button
              onClick={handleConfirmGroupe}
              disabled={createGroupedLivraison.isPending}
              className="w-full"
            >
              Confirmer la commande
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
