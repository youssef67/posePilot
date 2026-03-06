import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, StickyNote } from 'lucide-react'
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
import { Fab } from '@/components/Fab'
import { MemoCard } from '@/components/MemoCard'
import { MemoFormSheet } from '@/components/MemoFormSheet'
import { useEtages } from '@/lib/queries/useEtages'
import { useMemos, type MemoWithPhotos } from '@/lib/queries/useMemos'
import { useDeleteMemo } from '@/lib/mutations/useDeleteMemo'

export const Route = createFileRoute(
  '/_authenticated/chantiers/$chantierId/plots/$plotId/$etageId/memos',
)({
  component: EtageMemosPage,
})

function EtageMemosPage() {
  const { chantierId, plotId, etageId } = Route.useParams()
  const { data: etages } = useEtages(plotId)
  const etage = etages?.find((e) => e.id === etageId)
  const { data: memos, isLoading } = useMemos('etage', etageId)
  const deleteMemo = useDeleteMemo()

  const [showFormSheet, setShowFormSheet] = useState(false)
  const [editMemo, setEditMemo] = useState<MemoWithPhotos | null>(null)
  const [memoToDelete, setMemoToDelete] = useState<MemoWithPhotos | null>(null)

  function handleEdit(memo: MemoWithPhotos) {
    setEditMemo(memo)
    setShowFormSheet(true)
  }

  function handleDelete(memo: MemoWithPhotos) {
    setMemoToDelete(memo)
  }

  function handleConfirmDelete() {
    if (!memoToDelete) return
    deleteMemo.mutate(
      { memoId: memoToDelete.id, entityType: 'etage', entityId: etageId },
      { onSuccess: () => setMemoToDelete(null) },
    )
  }

  function handleOpenCreate() {
    setEditMemo(null)
    setShowFormSheet(true)
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-56px-env(safe-area-inset-bottom))]">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <Button variant="ghost" size="icon" asChild>
          <Link
            to="/chantiers/$chantierId/plots/$plotId/$etageId"
            params={{ chantierId, plotId, etageId }}
            aria-label="Retour"
          >
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-lg font-semibold text-foreground">Mémos</h1>
          {etage && (
            <p className="text-sm text-muted-foreground truncate">{etage.nom}</p>
          )}
        </div>
      </header>

      <div className="flex-1 p-4 pb-24">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-md bg-muted animate-pulse" />
            ))}
          </div>
        ) : memos && memos.length > 0 ? (
          <div className="flex flex-col gap-3">
            {memos.map((memo) => (
              <MemoCard
                key={memo.id}
                memo={memo}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
            <StickyNote className="size-12" />
            <p>Aucun mémo pour cet étage</p>
          </div>
        )}
      </div>

      <Fab onClick={handleOpenCreate} />

      <MemoFormSheet
        key={editMemo?.id ?? 'new'}
        open={showFormSheet}
        onOpenChange={setShowFormSheet}
        entityType="etage"
        entityId={etageId}
        editMemo={editMemo}
      />

      <AlertDialog open={!!memoToDelete} onOpenChange={(open) => { if (!open) setMemoToDelete(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce mémo ?</AlertDialogTitle>
            <AlertDialogDescription>
              Ce mémo sera supprimé définitivement.
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
