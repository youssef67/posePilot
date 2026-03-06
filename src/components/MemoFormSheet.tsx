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
import { useAuth } from '@/lib/auth'
import type { Memo } from '@/types/database'
import type { MemoEntityType } from '@/lib/queries/useMemos'

interface MemoFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityType: MemoEntityType
  entityId: string
  editMemo?: Memo | null
}

export function MemoFormSheet({ open, onOpenChange, entityType, entityId, editMemo }: MemoFormSheetProps) {
  const [content, setContent] = useState(editMemo?.content ?? '')
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null)
  const photoCaptureRef = useRef<PhotoCaptureHandle>(null)

  const createMemo = useCreateMemo()
  const updateMemo = useUpdateMemo()
  const uploadPhoto = useUploadMemoPhoto()
  const { user } = useAuth()

  const isEdit = !!editMemo

  useEffect(() => {
    if (open) {
      setContent(editMemo?.content ?? '')
      setPendingPhoto(null)
    }
  }, [open, editMemo])

  function handleSubmit() {
    const trimmed = content.trim()
    if (!trimmed) return

    if (isEdit && editMemo) {
      updateMemo.mutate(
        { memoId: editMemo.id, content: trimmed, entityType, entityId },
        { onSuccess: () => onOpenChange(false) },
      )
    } else {
      createMemo.mutate({
        content: trimmed,
        createdByEmail: user?.email ?? '?',
        ...(entityType === 'chantier' && { chantierId: entityId }),
        ...(entityType === 'plot' && { plotId: entityId }),
        ...(entityType === 'etage' && { etageId: entityId }),
      }, {
        onSuccess: (data) => {
          if (pendingPhoto && data?.id) {
            uploadPhoto.mutate({ file: pendingPhoto, memoId: data.id, entityType, entityId })
          }
          onOpenChange(false)
        },
      })
    }
  }

  const photoPreviewUrl = useMemo(
    () => (pendingPhoto ? URL.createObjectURL(pendingPhoto) : null),
    [pendingPhoto],
  )

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl)
    }
  }, [photoPreviewUrl])

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

          {!isEdit && (
            <>
              {photoPreviewUrl ? (
                <div className="relative w-fit">
                  <img
                    src={photoPreviewUrl}
                    alt="Aperçu photo"
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground"
                    onClick={() => setPendingPhoto(null)}
                    aria-label="Supprimer la photo"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ) : (
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
                onPhotoSelected={(file) => setPendingPhoto(file)}
              />
            </>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || createMemo.isPending || updateMemo.isPending}
          >
            {isEdit ? 'Modifier' : 'Ajouter'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
