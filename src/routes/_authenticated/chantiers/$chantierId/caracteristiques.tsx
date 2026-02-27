import { useState, useEffect } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
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
import { Fab } from '@/components/Fab'
import { useChantier } from '@/lib/queries/useChantier'
import { useCaracteristiques } from '@/lib/queries/useCaracteristiques'
import { useCreateCaracteristique } from '@/lib/mutations/useCreateCaracteristique'
import { useCreateCaracteristiquesBatch } from '@/lib/mutations/useCreateCaracteristiquesBatch'
import { useUpdateCaracteristique } from '@/lib/mutations/useUpdateCaracteristique'
import { useDeleteCaracteristique } from '@/lib/mutations/useDeleteCaracteristique'
import { useRealtimeCaracteristiques } from '@/lib/subscriptions/useRealtimeCaracteristiques'
import type { Caracteristique } from '@/types/database'

export const Route = createFileRoute(
  '/_authenticated/chantiers/$chantierId/caracteristiques',
)({
  component: CaracteristiquesPage,
})

const LABELS_PREDEFINIS = [
  'Carrelage sol',
  'Carrelage mur',
  'Colle',
  'Joint',
  'Profilé',
  "Baguette d'angle",
  "Primaire d'accrochage",
  'Croisillons',
  'Natte de désolidarisation',
  'Ragréage',
  'Étanchéité',
  'Plinthe',
  'Seuil',
]

function CaracteristiquesPage() {
  const { chantierId } = Route.useParams()
  const { data: chantier } = useChantier(chantierId)
  const { data: items, isLoading, isFetched } = useCaracteristiques(chantierId)
  useRealtimeCaracteristiques(chantierId)
  const createCaracteristique = useCreateCaracteristique()
  const createBatch = useCreateCaracteristiquesBatch()
  const updateCaracteristique = useUpdateCaracteristique()
  const deleteCaracteristique = useDeleteCaracteristique()

  // Seed predefined labels on first access (empty list)
  const [seeded, setSeeded] = useState(false)
  useEffect(() => {
    if (isFetched && items && items.length === 0 && !seeded && !createBatch.isPending) {
      setSeeded(true)
      createBatch.mutate({
        chantierId,
        items: LABELS_PREDEFINIS.map((label, i) => ({
          label,
          valeur: '',
          position: i,
        })),
      })
    }
  }, [isFetched, items, seeded, chantierId, createBatch])

  // Add sheet
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [addLabel, setAddLabel] = useState('')
  const [addValeur, setAddValeur] = useState('')
  const [addError, setAddError] = useState('')

  // Edit sheet
  const [showEditSheet, setShowEditSheet] = useState(false)
  const [editItem, setEditItem] = useState<Caracteristique | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editValeur, setEditValeur] = useState('')
  const [editError, setEditError] = useState('')

  // Delete dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteItem, setDeleteItem] = useState<Caracteristique | null>(null)

  function handleOpenAddSheet() {
    setAddLabel('')
    setAddValeur('')
    setAddError('')
    setShowAddSheet(true)
  }

  function handleAdd() {
    const trimmed = addLabel.trim()
    if (!trimmed) {
      setAddError('Le label est requis')
      return
    }
    const maxPosition = items ? Math.max(0, ...items.map((i) => i.position)) + 1 : 0
    createCaracteristique.mutate(
      { chantierId, label: trimmed, valeur: addValeur.trim(), position: maxPosition },
      {
        onSuccess: () => {
          setShowAddSheet(false)
          toast('Caractéristique ajoutée')
        },
        onError: () => toast.error("Erreur lors de l'ajout"),
      },
    )
  }

  function handleOpenEdit(item: Caracteristique) {
    setEditItem(item)
    setEditLabel(item.label)
    setEditValeur(item.valeur)
    setEditError('')
    setShowEditSheet(true)
  }

  function handleConfirmEdit() {
    if (!editItem) return
    const trimmedLabel = editLabel.trim()
    if (!trimmedLabel) {
      setEditError('Le label est requis')
      return
    }
    updateCaracteristique.mutate(
      { id: editItem.id, chantierId, label: trimmedLabel, valeur: editValeur.trim() },
      {
        onSuccess: () => {
          setShowEditSheet(false)
          setEditItem(null)
          toast('Caractéristique modifiée')
        },
        onError: () => toast.error('Erreur lors de la modification'),
      },
    )
  }

  function handleOpenDelete(item: Caracteristique) {
    setDeleteItem(item)
    setShowDeleteDialog(true)
  }

  function handleConfirmDelete() {
    if (!deleteItem) return
    deleteCaracteristique.mutate(
      { id: deleteItem.id, chantierId },
      {
        onSuccess: () => {
          setShowDeleteDialog(false)
          setDeleteItem(null)
          toast('Caractéristique supprimée')
        },
        onError: () => toast.error('Erreur lors de la suppression'),
      },
    )
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-56px-env(safe-area-inset-bottom))]">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <Button variant="ghost" size="icon" asChild>
          <Link
            to="/chantiers/$chantierId"
            params={{ chantierId }}
            aria-label="Retour"
          >
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <h1 className="text-lg font-semibold text-foreground truncate">
          Caractéristiques{chantier ? ` — ${chantier.nom}` : ''}
        </h1>
      </header>

      <div className="flex-1 p-4">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : items && items.length > 0 ? (
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-lg border border-border p-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.label}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {item.valeur || '—'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleOpenEdit(item)}
                  aria-label={`Modifier ${item.label}`}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleOpenDelete(item)}
                  aria-label={`Supprimer ${item.label}`}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            <p className="text-muted-foreground">Aucune caractéristique</p>
          </div>
        )}
      </div>

      <Fab onClick={handleOpenAddSheet} />

      {/* Sheet ajout */}
      <Sheet open={showAddSheet} onOpenChange={setShowAddSheet}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Nouvelle caractéristique</SheetTitle>
            <SheetDescription>
              Ajoutez une caractéristique à ce chantier.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 space-y-4">
            <div>
              <label htmlFor="add-label" className="text-sm font-medium text-foreground">
                Label
              </label>
              <Input
                id="add-label"
                placeholder="Ex: Type de colle"
                value={addLabel}
                onChange={(e) => {
                  setAddLabel(e.target.value)
                  if (addError) setAddError('')
                }}
                aria-invalid={!!addError}
              />
              {addError && (
                <p className="text-sm text-destructive mt-1">{addError}</p>
              )}
            </div>
            <div>
              <label htmlFor="add-valeur" className="text-sm font-medium text-foreground">
                Valeur
              </label>
              <Input
                id="add-valeur"
                placeholder="Ex: Mapei Keraflex Maxi S1"
                value={addValeur}
                onChange={(e) => setAddValeur(e.target.value)}
              />
            </div>
          </div>
          <SheetFooter>
            <Button
              onClick={handleAdd}
              disabled={createCaracteristique.isPending}
              className="w-full"
            >
              Ajouter
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Sheet édition */}
      <Sheet open={showEditSheet} onOpenChange={setShowEditSheet}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Modifier la caractéristique</SheetTitle>
            <SheetDescription>
              Modifiez le label et/ou la valeur.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 space-y-4">
            <div>
              <label htmlFor="edit-label" className="text-sm font-medium text-foreground">
                Label
              </label>
              <Input
                id="edit-label"
                value={editLabel}
                onChange={(e) => {
                  setEditLabel(e.target.value)
                  if (editError) setEditError('')
                }}
                aria-invalid={!!editError}
              />
              {editError && (
                <p className="text-sm text-destructive mt-1">{editError}</p>
              )}
            </div>
            <div>
              <label htmlFor="edit-valeur" className="text-sm font-medium text-foreground">
                Valeur
              </label>
              <Input
                id="edit-valeur"
                value={editValeur}
                onChange={(e) => setEditValeur(e.target.value)}
              />
            </div>
          </div>
          <SheetFooter>
            <Button
              onClick={handleConfirmEdit}
              disabled={updateCaracteristique.isPending}
              className="w-full"
            >
              Enregistrer
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Dialog suppression */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette caractéristique ?</AlertDialogTitle>
            <AlertDialogDescription>
              La caractéristique &laquo;{deleteItem?.label}&raquo; sera supprimée définitivement.
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
    </div>
  )
}
