import { useState } from 'react'
import { Boxes, Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import type { InventaireWithLocation } from '@/lib/queries/useInventaire'

interface AggregatedGroup {
  designation: string
  totalQuantite: number
  items: InventaireWithLocation[]
}

function aggregateByDesignation(items: InventaireWithLocation[]): AggregatedGroup[] {
  const groups = new Map<string, InventaireWithLocation[]>()
  for (const item of items) {
    const key = item.designation.trim().toLowerCase()
    const existing = groups.get(key) ?? []
    existing.push(item)
    groups.set(key, existing)
  }
  return Array.from(groups.entries()).map(([, groupItems]) => ({
    designation: groupItems[0].designation,
    totalQuantite: groupItems.reduce((sum, i) => sum + i.quantite, 0),
    items: groupItems.sort((a, b) =>
      `${a.plots.nom} ${a.etages.nom}`.localeCompare(`${b.plots.nom} ${b.etages.nom}`),
    ),
  }))
}

interface InventaireListProps {
  items: InventaireWithLocation[] | undefined
  isLoading: boolean
  aggregated?: boolean
  onOpenSheet: () => void
  onIncrement: (item: InventaireWithLocation) => void
  onDecrement: (item: InventaireWithLocation) => void
  onDelete: (item: InventaireWithLocation) => void
}

export function InventaireList({
  items,
  isLoading,
  aggregated = false,
  onOpenSheet,
  onIncrement,
  onDecrement,
  onDelete,
}: InventaireListProps) {
  const [deleteTarget, setDeleteTarget] = useState<InventaireWithLocation | null>(null)

  function handleDecrement(item: InventaireWithLocation) {
    if (item.quantite <= 1) {
      setDeleteTarget(item)
    } else {
      onDecrement(item)
    }
  }

  function confirmDelete() {
    if (deleteTarget) {
      onDelete(deleteTarget)
      setDeleteTarget(null)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border p-4 animate-pulse">
            <div className="h-4 w-3/4 rounded bg-muted mb-2" />
            <div className="h-3 w-1/2 rounded bg-muted" />
          </div>
        ))}
      </div>
    )
  }

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <Boxes className="h-10 w-10 text-muted-foreground opacity-40" />
        <p className="text-muted-foreground">Aucun matériel enregistré</p>
        <Button variant="outline" onClick={onOpenSheet}>
          Ajouter du matériel
        </Button>
      </div>
    )
  }

  const deleteDialog = (
    <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer ce matériel ?</AlertDialogTitle>
          <AlertDialogDescription>
            {deleteTarget?.designation} ({deleteTarget?.plots.nom} — {deleteTarget?.etages.nom}) sera supprimé de l&apos;inventaire.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={confirmDelete}>Supprimer</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  function renderItemControls(item: InventaireWithLocation) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 min-w-[48px]"
          onClick={() => handleDecrement(item)}
          aria-label={`Diminuer ${item.designation}`}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-8 text-center text-sm font-medium tabular-nums">
          {item.quantite}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 min-w-[48px]"
          onClick={() => onIncrement(item)}
          aria-label={`Augmenter ${item.designation}`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  if (aggregated) {
    const groups = aggregateByDesignation(items)
    return (
      <>
        <div className="space-y-3">
          {groups.map((group) => (
            <div key={group.designation} className="rounded-lg border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-foreground">{group.designation}</p>
                <span className="text-sm font-semibold text-foreground">
                  Total: {group.totalQuantite}
                </span>
              </div>
              <div className="space-y-2">
                {group.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between pl-2">
                    <span className="text-xs text-muted-foreground">
                      {item.plots.nom} — {item.etages.nom} : {item.quantite}
                    </span>
                    {renderItemControls(item)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {deleteDialog}
      </>
    )
  }

  // Non-aggregated list mode
  return (
    <>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border border-border p-4">
            <p className="text-sm font-medium text-foreground">{item.designation}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {item.plots.nom} — {item.etages.nom}
              </span>
              {renderItemControls(item)}
            </div>
          </div>
        ))}
      </div>
      {deleteDialog}
    </>
  )
}
