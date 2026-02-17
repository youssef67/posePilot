import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
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
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { PhotoPreview } from '@/components/PhotoPreview'
import { NoteResponsesList } from '@/components/NoteResponsesList'
import { Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUpdateNote } from '@/lib/mutations/useUpdateNote'
import { useDeleteNote } from '@/lib/mutations/useDeleteNote'
import { useNoteResponses } from '@/lib/queries/useNoteResponses'
import type { Note } from '@/types/database'

interface NoteDetailDialogProps {
  note: Note | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(dateStr))
}

export function NoteDetailDialog({ note, open, onOpenChange }: NoteDetailDialogProps) {
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [editBlocking, setEditBlocking] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const updateNote = useUpdateNote()
  const deleteNote = useDeleteNote()
  const { data: responses } = useNoteResponses(note?.id ?? null)
  const hasResponses = !!responses && responses.length > 0
  const showResponses = note?.is_blocking || hasResponses

  function handleStartEdit() {
    if (!note) return
    setEditContent(note.content)
    setEditBlocking(note.is_blocking)
    setEditing(true)
  }

  function handleCancelEdit() {
    setEditing(false)
  }

  function handleSave() {
    if (!note) return
    updateNote.mutate(
      { noteId: note.id, content: editContent.trim(), isBlocking: editBlocking },
      {
        onSuccess: () => {
          setEditing(false)
          onOpenChange(false)
        },
      },
    )
  }

  function handleDelete() {
    if (!note) return
    deleteNote.mutate(
      { noteId: note.id, photoUrl: note.photo_url },
      {
        onSuccess: () => {
          setConfirmDelete(false)
          onOpenChange(false)
        },
      },
    )
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setEditing(false)
      setConfirmDelete(false)
    }
    onOpenChange(nextOpen)
  }

  if (!note) return null

  const noteContentSection = (
    <>
      {editing ? (
        <>
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={4}
            data-testid="edit-content"
          />
          <div className="flex items-center gap-2">
            <Switch
              id="edit-blocking"
              checked={editBlocking}
              onCheckedChange={setEditBlocking}
              data-testid="edit-blocking"
            />
            <Label
              htmlFor="edit-blocking"
              className={cn(editBlocking && 'text-destructive font-medium')}
            >
              Bloquant
            </Label>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCancelEdit}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={!editContent.trim() || updateNote.isPending}
              className="flex-1"
            >
              Enregistrer
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="whitespace-pre-wrap text-sm" data-testid="note-content">
            {note.content}
          </p>

          {note.photo_url && (
            <div className="mt-1">
              <PhotoPreview url={note.photo_url} />
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleStartEdit}
              className="flex-1"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Modifier
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              className="flex-1"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </Button>
          </div>
        </>
      )}
    </>
  )

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" className="rounded-t-xl max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              Détail de la note
              {note.is_blocking && !editing && (
                <Badge variant="destructive">Bloquant</Badge>
              )}
            </SheetTitle>
            <SheetDescription className="sr-only">
              Détail complet de la note
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4 px-4 pb-4">
            <p className="text-xs text-muted-foreground" data-testid="note-date">
              {formatDate(note.created_at)}
            </p>

            {noteContentSection}

            {showResponses && (
              <NoteResponsesList
                note={note}
                onResolved={() => onOpenChange(false)}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette note ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La note{note.photo_url ? ' et sa photo' : ''} sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteNote.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
