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
import { Camera, Trash2 } from 'lucide-react'
import { useCreateReservation } from '@/lib/mutations/useCreateReservation'
import { PhotoCapture, type PhotoCaptureHandle } from './PhotoCapture'

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
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null)
  const photoCaptureRef = useRef<PhotoCaptureHandle>(null)
  const createReservation = useCreateReservation()

  const photoPreviewUrl = useMemo(() => {
    if (!pendingPhoto) return null
    return URL.createObjectURL(pendingPhoto)
  }, [pendingPhoto])

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl)
    }
  }, [photoPreviewUrl])

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setPieceId('')
      setDescription('')
      setPendingPhoto(null)
    }
    onOpenChange(nextOpen)
  }

  function handleCreate() {
    if (!pieceId || !description.trim()) return
    const selectedPiece = pieces.find((p) => p.id === pieceId)
    createReservation.mutate(
      {
        lotId,
        pieceId,
        pieceName: selectedPiece?.nom ?? '',
        description: description.trim(),
        photo: pendingPhoto ?? undefined,
      },
      {
        onSuccess: () => {
          handleOpenChange(false)
        },
      },
    )
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

              {photoPreviewUrl && (
                <div className="relative inline-block w-fit">
                  <img
                    src={photoPreviewUrl}
                    alt="Aperçu photo"
                    className="h-20 w-20 rounded-lg object-cover"
                    data-testid="reservation-form-photo-preview"
                  />
                  <button
                    type="button"
                    onClick={() => setPendingPhoto(null)}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow"
                    aria-label="Supprimer la photo"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )}

              {!pendingPhoto && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  onClick={() => photoCaptureRef.current?.trigger()}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Photo
                </Button>
              )}

              <PhotoCapture
                ref={photoCaptureRef}
                onPhotoSelected={(file) => setPendingPhoto(file)}
              />

              <Button
                onClick={handleCreate}
                disabled={!pieceId || !description.trim() || createReservation.isPending}
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
