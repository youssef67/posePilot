import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useNoteResponses } from '@/lib/queries/useNoteResponses'
import { useCreateNoteResponse } from '@/lib/mutations/useCreateNoteResponse'

interface NoteResponsesListProps {
  noteId: string
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

export function NoteResponsesList({ noteId }: NoteResponsesListProps) {
  const { data: responses, isLoading } = useNoteResponses(noteId)
  const createResponse = useCreateNoteResponse()
  const [content, setContent] = useState('')

  function handleSubmit() {
    if (!content.trim()) return
    createResponse.mutate(
      { noteId, content: content.trim() },
      { onSuccess: () => setContent('') },
    )
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
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!content.trim() || createResponse.isPending}
        >
          Envoyer
        </Button>
      </div>
    </div>
  )
}
