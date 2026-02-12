import { useState } from 'react'
import { Share2, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface PhotoPreviewProps {
  url: string
  alt?: string
  onRemove?: () => void
  showRemove?: boolean
  onShare?: () => void
}

export function PhotoPreview({ url, alt = 'Photo', onRemove, showRemove, onShare }: PhotoPreviewProps) {
  const [fullscreen, setFullscreen] = useState(false)
  const [loaded, setLoaded] = useState(false)

  return (
    <>
      <div className="relative inline-block">
        {!loaded && (
          <div className="h-20 w-20 animate-pulse rounded-lg bg-muted" data-testid="photo-skeleton" />
        )}
        <img
          src={url}
          alt={alt}
          loading="lazy"
          onClick={() => setFullscreen(true)}
          onLoad={() => setLoaded(true)}
          className={cn(
            'h-20 w-20 cursor-pointer rounded-lg object-cover',
            !loaded && 'hidden',
          )}
          data-testid="photo-thumbnail"
        />
        {showRemove && loaded && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRemove?.()
            }}
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow"
            aria-label="Supprimer la photo"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>

      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent className="max-w-none h-screen bg-black/95 border-none p-0 flex items-center justify-center" aria-describedby={undefined}>
          <DialogTitle className="sr-only">{alt}</DialogTitle>
          {onShare && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onShare()
              }}
              className="absolute right-14 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white"
              aria-label="Partager la photo"
            >
              <Share2 className="h-5 w-5" />
            </button>
          )}
          <img src={url} alt={alt} className="max-w-full max-h-full object-contain" />
        </DialogContent>
      </Dialog>
    </>
  )
}
