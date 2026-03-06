import { useEffect, useMemo, useRef, useState } from 'react'
import { Camera, X } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { PhotoCapture, type PhotoCaptureHandle } from '@/components/PhotoCapture'
import { useCreateMemo } from '@/lib/mutations/useCreateMemo'
import { useUpdateMemo } from '@/lib/mutations/useUpdateMemo'
import { useUploadMemoPhoto } from '@/lib/mutations/useUploadMemoPhoto'
import { useDeleteMemoPhoto } from '@/lib/mutations/useDeleteMemoPhoto'
import { useAuth } from '@/lib/auth'
import type { MemoEntityType, MemoWithPhotos } from '@/lib/queries/useMemos'

const MAX_PHOTOS = 5

interface MemoFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityType: MemoEntityType
  entityId: string
  editMemo?: MemoWithPhotos | null
}

export function MemoFormSheet({ open, onOpenChange, entityType, entityId, editMemo }: MemoFormSheetProps) {
  const [content, setContent] = useState(editMemo?.content ?? '')
  const [pendingPhotos, setPendingPhotos] = useState<File[]>([])
  const [deletedPhotoIds, setDeletedPhotoIds] = useState<Set<string>>(new Set())
  const photoCaptureRef = useRef<PhotoCaptureHandle>(null)

  const createMemo = useCreateMemo()
  const updateMemo = useUpdateMemo()
  const uploadPhoto = useUploadMemoPhoto()
  const deleteMemoPhoto = useDeleteMemoPhoto()
  const { user } = useAuth()

  const isEdit = !!editMemo

  const existingPhotos = useMemo(
    () => (editMemo?.memo_photos ?? []).filter((p) => !deletedPhotoIds.has(p.id)),
    [editMemo, deletedPhotoIds],
  )

  const totalPhotos = existingPhotos.length + pendingPhotos.length
  const canAddPhoto = totalPhotos < MAX_PHOTOS

  useEffect(() => {
    if (open) {
      setContent(editMemo?.content ?? '')
      setPendingPhotos([])
      setDeletedPhotoIds(new Set())
    }
  }, [open, editMemo])

  const pendingPreviewUrls = useMemo(
    () => pendingPhotos.map((f) => URL.createObjectURL(f)),
    [pendingPhotos],
  )

  useEffect(() => {
    return () => {
      pendingPreviewUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [pendingPreviewUrls])

  function handleAddPhoto(file: File) {
    if (!canAddPhoto) return
    setPendingPhotos((prev) => [...prev, file])
  }

  function handleRemovePending(index: number) {
    setPendingPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  function handleRemoveExisting(photoId: string) {
    setDeletedPhotoIds((prev) => new Set(prev).add(photoId))
  }

  const isSubmitting = createMemo.isPending || updateMemo.isPending || uploadPhoto.isPending || deleteMemoPhoto.isPending

  async function handleSubmit() {
    const trimmed = content.trim()
    if (!trimmed || isSubmitting) return

    if (isEdit && editMemo) {
      // Delete marked photos sequentially
      for (const photoId of deletedPhotoIds) {
        const photo = editMemo.memo_photos.find((p) => p.id === photoId)
        if (photo) {
          try {
            await deleteMemoPhoto.mutateAsync({ photoId: photo.id, photoUrl: photo.photo_url, entityType, entityId })
          } catch { /* toast shown by hook */ }
        }
      }

      // Upload new pending photos sequentially
      const startPosition = existingPhotos.length
      for (let i = 0; i < pendingPhotos.length; i++) {
        try {
          await uploadPhoto.mutateAsync({ file: pendingPhotos[i], memoId: editMemo.id, position: startPosition + i, entityType, entityId })
        } catch { /* toast shown by hook */ }
      }

      try {
        await updateMemo.mutateAsync({ memoId: editMemo.id, content: trimmed, entityType, entityId })
        onOpenChange(false)
      } catch { /* toast shown by hook */ }
    } else {
      try {
        const data = await createMemo.mutateAsync({
          content: trimmed,
          createdByEmail: user?.email ?? '?',
          ...(entityType === 'chantier' && { chantierId: entityId }),
          ...(entityType === 'etage' && { etageId: entityId }),
        })
        if (data?.id && pendingPhotos.length > 0) {
          for (let i = 0; i < pendingPhotos.length; i++) {
            try {
              await uploadPhoto.mutateAsync({ file: pendingPhotos[i], memoId: data.id, position: i, entityType, entityId })
            } catch { /* toast shown by hook */ }
          }
        }
        onOpenChange(false)
      } catch { /* toast shown by hook */ }
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-xl">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Modifier le mémo' : 'Nouveau mémo'}</SheetTitle>
          <SheetDescription className="sr-only">
            {isEdit ? 'Modifier le contenu du mémo' : 'Ajouter un mémo'}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4 pb-4">
          <Textarea
            placeholder="Écrire un mémo..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
          />

          {(existingPhotos.length > 0 || pendingPhotos.length > 0) && (
            <div className="flex gap-2 overflow-x-auto">
              {existingPhotos.map((photo) => (
                <div key={photo.id} className="relative shrink-0">
                  <img
                    src={photo.photo_url}
                    alt="Photo existante"
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground"
                    onClick={() => handleRemoveExisting(photo.id)}
                    aria-label="Supprimer la photo"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
              {pendingPreviewUrls.map((url, i) => (
                <div key={url} className="relative shrink-0">
                  <img
                    src={url}
                    alt="Aperçu photo"
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground"
                    onClick={() => handleRemovePending(i)}
                    aria-label="Supprimer la photo"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {canAddPhoto && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => photoCaptureRef.current?.trigger()}
            >
              <Camera className="size-4 mr-2" />
              Ajouter une photo
            </Button>
          )}

          <PhotoCapture
            ref={photoCaptureRef}
            onPhotoSelected={handleAddPhoto}
          />

          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
          >
            {isEdit ? 'Modifier' : 'Ajouter'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
