import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Camera, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCreateNote } from '@/lib/mutations/useCreateNote'
import { useUploadNotePhoto } from '@/lib/mutations/useUploadNotePhoto'
import { PhotoCapture, type PhotoCaptureHandle } from './PhotoCapture'

interface NoteFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lotId?: string
  pieceId?: string
  initialPhoto?: File
}

export function NoteForm({ open, onOpenChange, lotId, pieceId, initialPhoto }: NoteFormProps) {
  // initialPhoto is set as initial state; parent must key this component
  // so it remounts when initialPhoto changes
  const [content, setContent] = useState('')
  const [isBlocking, setIsBlocking] = useState(false)
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(initialPhoto ?? null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const photoCaptureRef = useRef<PhotoCaptureHandle>(null)
  const createNote = useCreateNote()
  const uploadPhoto = useUploadNotePhoto()
  const handleUploadProgress = useCallback((percent: number) => setUploadProgress(percent), [])

  // Derive preview URL from pendingPhoto
  const photoPreviewUrl = useMemo(() => {
    if (!pendingPhoto) return null
    return URL.createObjectURL(pendingPhoto)
  }, [pendingPhoto])

  // Cleanup object URL
  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl)
    }
  }, [photoPreviewUrl])

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setContent('')
      setIsBlocking(false)
      setPendingPhoto(null)
    }
    onOpenChange(nextOpen)
  }

  function handlePhotoSelected(file: File) {
    setPendingPhoto(file)
  }

  function handleRemovePhoto() {
    setPendingPhoto(null)
  }

  function handleCreate() {
    if (!content.trim() && !pendingPhoto) return
    createNote.mutate(
      { content: content.trim() || '📷', isBlocking, lotId, pieceId },
      {
        onSuccess: (data) => {
          if (pendingPhoto && data?.id) {
            setUploadProgress(0)
            uploadPhoto.mutate({ file: pendingPhoto, noteId: data.id, onProgress: handleUploadProgress })
          }
          handleOpenChange(false)
        },
      },
    )
  }

  const isUploading = uploadPhoto.isPending

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="rounded-t-xl">
        <SheetHeader>
          <SheetTitle>Nouvelle note</SheetTitle>
          <SheetDescription className="sr-only">
            Formulaire de création de note
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4 pb-4">
          <Textarea
            placeholder="Écrire une note..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
          />

          {/* Photo preview */}
          {photoPreviewUrl && (
            <div className="relative inline-block w-fit">
              <img
                src={photoPreviewUrl}
                alt="Aperçu photo"
                className="h-20 w-20 rounded-lg object-cover"
                data-testid="note-form-photo-preview"
              />
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow"
                aria-label="Supprimer la photo"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Add photo button */}
          {!pendingPhoto && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => photoCaptureRef.current?.trigger()}
            >
              <Camera className="mr-2 h-4 w-4" />
              Ajouter une photo
            </Button>
          )}

          <PhotoCapture
            ref={photoCaptureRef}
            onPhotoSelected={handlePhotoSelected}
          />

          {/* Upload progress */}
          {isUploading && (
            <div className="space-y-1" data-testid="upload-progress">
              <p className="text-xs text-muted-foreground">
                {uploadProgress < 70 ? 'Compression...' : 'Upload en cours...'}
                {' '}{uploadProgress}%
              </p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-300"
                  style={{ width: `${uploadProgress}%` }}
                  role="progressbar"
                  aria-valuenow={uploadProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Switch
              id="is-blocking"
              checked={isBlocking}
              onCheckedChange={setIsBlocking}
            />
            <Label
              htmlFor="is-blocking"
              className={cn(isBlocking && 'text-destructive font-medium')}
            >
              Bloquant
            </Label>
          </div>
          <Button
            onClick={handleCreate}
            disabled={(!content.trim() && !pendingPhoto) || createNote.isPending}
          >
            Créer
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
