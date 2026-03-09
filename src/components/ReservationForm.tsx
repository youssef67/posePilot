import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Camera, X } from 'lucide-react'
import { useCreateReservation } from '@/lib/mutations/useCreateReservation'
import { useUploadReservationPhoto } from '@/lib/mutations/useUploadReservationPhoto'
import { PhotoCapture, type PhotoCaptureHandle } from './PhotoCapture'

const MAX_PHOTOS = 5

interface Piece {
  id: string
  nom: string
}

interface ReservationFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lotId: string
  pieces: Piece[]
}

export function ReservationForm({ open, onOpenChange, lotId, pieces }: ReservationFormProps) {
  const [pieceId, setPieceId] = useState('')
  const [description, setDescription] = useState('')
  const [pendingPhotos, setPendingPhotos] = useState<File[]>([])
  const photoCaptureRef = useRef<PhotoCaptureHandle>(null)
  const createReservation = useCreateReservation()
  const uploadPhoto = useUploadReservationPhoto()

  const canAddPhoto = pendingPhotos.length < MAX_PHOTOS

  const pendingPreviewUrls = useMemo(
    () => pendingPhotos.map((f) => URL.createObjectURL(f)),
    [pendingPhotos],
  )

  useEffect(() => {
    return () => {
      pendingPreviewUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [pendingPreviewUrls])

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setPieceId('')
      setDescription('')
      setPendingPhotos([])
    }
    onOpenChange(nextOpen)
  }

  function handleAddPhoto(file: File) {
    if (!canAddPhoto) return
    setPendingPhotos((prev) => [...prev, file])
  }

  function handleRemovePhoto(index: number) {
    setPendingPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const isSubmitting = createReservation.isPending || uploadPhoto.isPending

  async function handleCreate() {
    if (!pieceId || !description.trim() || isSubmitting) return
    const selectedPiece = pieces.find((p) => p.id === pieceId)

    try {
      const data = await createReservation.mutateAsync({
        lotId,
        pieceId,
        pieceName: selectedPiece?.nom ?? '',
        description: description.trim(),
      })

      if (data?.id && pendingPhotos.length > 0) {
        for (let i = 0; i < pendingPhotos.length; i++) {
          try {
            await uploadPhoto.mutateAsync({
              file: pendingPhotos[i],
              reservationId: data.id,
              lotId,
              position: i,
            })
          } catch { /* toast shown by hook */ }
        }
      }

      handleOpenChange(false)
    } catch { /* toast shown by hook */ }
  }

  const noPieces = pieces.length === 0

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="rounded-t-xl">
        <SheetHeader>
          <SheetTitle>Nouvelle réserve</SheetTitle>
          <SheetDescription className="sr-only">
            Formulaire de création de réserve SAV
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4 pb-4">
          {noPieces ? (
            <p className="text-sm text-muted-foreground">
              Ajoutez d'abord des pièces au lot
            </p>
          ) : (
            <>
              <Select value={pieceId} onValueChange={setPieceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une pièce" />
                </SelectTrigger>
                <SelectContent>
                  {pieces.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Textarea
                placeholder="Décrire le défaut..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />

              {pendingPreviewUrls.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                  {pendingPreviewUrls.map((url, i) => (
                    <div key={url} className="relative shrink-0">
                      <img
                        src={url}
                        alt="Aperçu photo"
                        className="h-20 w-20 rounded-lg object-cover"
                        data-testid="reservation-form-photo-preview"
                      />
                      <button
                        type="button"
                        className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground"
                        onClick={() => handleRemovePhoto(i)}
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
                  <Camera className="mr-2 h-4 w-4" />
                  {pendingPhotos.length === 0 ? 'Photo' : 'Ajouter une photo'}
                </Button>
              )}

              <PhotoCapture
                ref={photoCaptureRef}
                onPhotoSelected={handleAddPhoto}
              />

              <Button
                onClick={handleCreate}
                disabled={!pieceId || !description.trim() || isSubmitting}
              >
                Créer
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
