import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Trash2 } from 'lucide-react'
import { useResolveReservation } from '@/lib/mutations/useResolveReservation'
import { useDeleteReservation } from '@/lib/mutations/useDeleteReservation'
import type { Reservation } from '@/types/database'

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

interface ReservationCardProps {
  reservation: Reservation
  lotId: string
}

export function ReservationCard({ reservation, lotId }: ReservationCardProps) {
  const [detailOpen, setDetailOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const resolveReservation = useResolveReservation()
  const deleteReservation = useDeleteReservation()

  const pieceName = reservation.pieces?.nom ?? '—'
  const isOpen = reservation.status === 'ouvert'
  const photos = reservation.reservation_photos ?? []
  const firstPhoto = photos[0] ?? null

  function handleResolve() {
    resolveReservation.mutate(
      { reservationId: reservation.id, lotId },
      { onSuccess: () => setDetailOpen(false) },
    )
  }

  function handleDelete() {
    deleteReservation.mutate(
      { reservationId: reservation.id, lotId, photos },
      { onSuccess: () => { setDeleteConfirmOpen(false); setDetailOpen(false) } },
    )
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setDetailOpen(true)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setDetailOpen(true) }}
        className="flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors active:bg-muted/50"
      >
        {firstPhoto && (
          <img
            src={firstPhoto.photo_url}
            alt="Photo réserve"
            className="h-12 w-12 shrink-0 rounded object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">{pieceName}</span>
            <Badge
              variant={isOpen ? 'destructive' : 'default'}
              className={isOpen ? '' : 'bg-green-600 hover:bg-green-700'}
            >
              {isOpen ? 'Ouvert' : 'Résolu'}
            </Badge>
          </div>
          <p className="line-clamp-1 text-sm text-muted-foreground">
            {reservation.description}
          </p>
          <div className="mt-1 text-xs text-muted-foreground">
            <span>{formatRelativeTime(reservation.created_at)}</span>
            {reservation.resolved_at && (
              <>
                <span> · Résolu {formatRelativeTime(reservation.resolved_at)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Réserve — {pieceName}</DialogTitle>
            <DialogDescription className="sr-only">
              Détail de la réserve
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {photos.length > 0 && (
              <div className="flex gap-2 overflow-x-auto">
                {photos.map((photo) => (
                  <img
                    key={photo.id}
                    src={photo.photo_url}
                    alt="Photo réserve"
                    className="h-40 w-40 shrink-0 rounded-lg object-cover"
                  />
                ))}
              </div>
            )}
            <p className="text-sm">{reservation.description}</p>
            <div className="text-xs text-muted-foreground">
              <p>Pièce : {pieceName}</p>
              <p>Créée {formatRelativeTime(reservation.created_at)}</p>
              {reservation.resolved_at && (
                <p>Résolue {formatRelativeTime(reservation.resolved_at)}</p>
              )}
            </div>

            <div className="flex items-center justify-between gap-2">
              {isOpen && (
                <Button
                  onClick={handleResolve}
                  disabled={resolveReservation.isPending}
                  className="flex-1"
                >
                  Marquer comme résolue
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setDeleteConfirmOpen(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la réserve ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La réserve sera supprimée définitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
