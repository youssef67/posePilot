import { useState } from 'react'
import { Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { useNotes } from '@/lib/queries/useNotes'
import { Badge } from '@/components/ui/badge'
import { PhotoPreview } from '@/components/PhotoPreview'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useShareContext } from '@/lib/utils/useShareContext'
import { sharePhoto } from '@/lib/utils/sharePhoto'

interface NotesListProps {
  lotId?: string
  pieceId?: string
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

export function NotesList({ lotId, pieceId }: NotesListProps) {
  const { data: notes, isLoading } = useNotes({ lotId, pieceId })
  const contextString = useShareContext()
  const [isSharing, setIsSharing] = useState(false)

  const handleShare = async (note: { photo_url: string | null; content: string }) => {
    if (!note.photo_url || isSharing) return
    setIsSharing(true)
    try {
      const shareText = contextString ? contextString + ' : ' + note.content : note.content
      const result = await sharePhoto({ photoUrl: note.photo_url, shareText })
      if (result === 'shared') toast('Photo partagée')
      if (result === 'downloaded') toast('Photo téléchargée — texte copié dans le presse-papiers')
    } catch {
      toast.error('Erreur lors du partage de la photo')
    } finally {
      setIsSharing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3" data-testid="notes-skeleton">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    )
  }

  if (!notes || notes.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucune note</p>
  }

  return (
    <div className="space-y-2">
      {notes.map((note) => (
        <div
          key={note.id}
          className={cn(
            'rounded-md border p-3',
            note.is_blocking && 'border-l-4 border-l-destructive',
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm">{note.content}</p>
            {note.is_blocking && (
              <Badge variant="destructive" className="shrink-0">
                Bloquant
              </Badge>
            )}
          </div>
          {note.photo_url && (
            <div className="mt-2">
              <PhotoPreview url={note.photo_url} onShare={() => handleShare(note)} />
            </div>
          )}
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{extractAuthorName(note.created_by_email)}</span>
            <span>·</span>
            <span>{formatRelativeTime(note.created_at)}</span>
            {note.photo_url && (
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto h-8 w-8 text-muted-foreground"
                onClick={() => handleShare(note)}
                disabled={isSharing}
                aria-label="Partager la photo"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
