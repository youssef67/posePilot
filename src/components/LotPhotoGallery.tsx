import { useState } from 'react'
import { ImageIcon, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { PhotoPreview } from '@/components/PhotoPreview'
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
import { useDeleteLotPhoto } from '@/lib/mutations/useDeleteLotPhoto'
import { sharePhoto } from '@/lib/utils/sharePhoto'
import type { LotPhoto } from '@/types/database'

interface LotPhotoGalleryProps {
  photos: LotPhoto[]
  lotId: string
  isUploading?: boolean
  uploadProgress?: number
}

export function LotPhotoGallery({ photos, lotId, isUploading, uploadProgress }: LotPhotoGalleryProps) {
  const deletePhoto = useDeleteLotPhoto()
  const [photoToDelete, setPhotoToDelete] = useState<LotPhoto | null>(null)

  function handleShare(photo: LotPhoto) {
    sharePhoto({ photoUrl: photo.photo_url, shareText: 'Photo du lot' })
      .then((result) => {
        if (result === 'downloaded') {
          toast('Photo téléchargée')
        }
      })
      .catch(() => {
        toast.error('Erreur lors du partage')
      })
  }

  function handleConfirmDelete() {
    if (!photoToDelete) return
    deletePhoto.mutate(
      { photoId: photoToDelete.id, photoUrl: photoToDelete.photo_url, lotId },
      { onSettled: () => setPhotoToDelete(null) },
    )
  }

  if (photos.length === 0 && !isUploading) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
        <ImageIcon className="size-8" />
        <p className="text-sm">Aucune photo</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-4 gap-2">
        {isUploading && (
          <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-muted" data-testid="upload-indicator">
            <div className="flex flex-col items-center gap-1">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
              {uploadProgress != null && (
                <span className="text-[10px] text-muted-foreground">{uploadProgress}%</span>
              )}
            </div>
          </div>
        )}
        {photos.map((photo) => (
          <PhotoPreview
            key={photo.id}
            url={photo.photo_url}
            alt={`Photo du ${new Date(photo.created_at).toLocaleDateString('fr-FR')}`}
            showRemove
            onRemove={() => setPhotoToDelete(photo)}
            onShare={() => handleShare(photo)}
          />
        ))}
      </div>

      <AlertDialog open={!!photoToDelete} onOpenChange={(open) => { if (!open) setPhotoToDelete(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette photo ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette photo sera supprimée définitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deletePhoto.isPending}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
