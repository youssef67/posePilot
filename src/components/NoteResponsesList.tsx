import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useNoteResponses } from '@/lib/queries/useNoteResponses'
import { useCreateNoteResponse } from '@/lib/mutations/useCreateNoteResponse'
import { useUpdateNote } from '@/lib/mutations/useUpdateNote'
import { CheckCircle } from 'lucide-react'
import type { Note } from '@/types/database'

interface NoteResponsesListProps {
  note: Note
  onResolved?: () => void
}

const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' })

function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diffSeconds = Math.round((date - now) / 1000)

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['week', 60 * 60 * 24 * 7],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
  ]

  for (const [unit, seconds] of units) {
    if (Math.abs(diffSeconds) >= seconds) {
      return rtf.format(Math.round(diffSeconds / seconds), unit)
    }
  }

  return rtf.format(diffSeconds, 'second')
}

function extractAuthorName(email: string | null): string {
  if (!email) return '?'
  return email.split('@')[0]
}

export function NoteResponsesList({ note, onResolved }: NoteResponsesListProps) {
  const noteId = note.id
  const { data: responses, isLoading } = useNoteResponses(noteId)
  const createResponse = useCreateNoteResponse()
  const updateNote = useUpdateNote()
  const [content, setContent] = useState('')

  const isPending = createResponse.isPending || updateNote.isPending

  function handleSubmit() {
    if (!content.trim()) return
    createResponse.mutate(
      { noteId, content: content.trim() },
      { onSuccess: () => setContent('') },
    )
  }

  async function handleSubmitAndResolve() {
    if (!content.trim()) return
    try {
      await createResponse.mutateAsync({ noteId, content: content.trim() })
      await updateNote.mutateAsync({
        noteId,
        content: note.content,
        isBlocking: false,
      })
      setContent('')
      onResolved?.()
    } catch {
      // errors handled by individual mutation toasts
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* List */}
      {isLoading && (
        <div className="space-y-2" data-testid="responses-skeleton">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      )}

      {!isLoading && (!responses || responses.length === 0) && (
        <p className="text-sm text-muted-foreground">Aucune réponse</p>
      )}

      {responses && responses.length > 0 && (
        <div className="space-y-2">
          {responses.map((r) => (
            <div key={r.id} className="rounded-md border bg-muted/30 p-3">
              <p className="whitespace-pre-wrap text-sm">{r.content}</p>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span>{extractAuthorName(r.created_by_email)}</span>
                <span>·</span>
                <span>{formatRelativeTime(r.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add response form */}
      <div className="flex flex-col gap-2 border-t pt-3">
        <Textarea
          placeholder="Ajouter une réponse..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          data-testid="response-input"
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSubmit}
            disabled={!content.trim() || isPending}
            className="flex-1"
          >
            Envoyer
          </Button>
          {note.is_blocking && (
            <Button
              size="sm"
              onClick={handleSubmitAndResolve}
              disabled={!content.trim() || isPending}
              className="flex-1"
              data-testid="submit-and-resolve"
            >
              <CheckCircle className="mr-1.5 h-4 w-4" />
              Envoyer et débloquer
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
