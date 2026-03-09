import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Reservation, ReservationPhoto } from '@/types/database'

interface DeleteReservationInput {
  reservationId: string
  lotId: string
  photos: ReservationPhoto[]
}

export function useDeleteReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ reservationId, photos }: DeleteReservationInput) => {
      // Clean up storage files (best-effort)
      if (photos.length > 0) {
        const paths = photos
          .map((p) => p.photo_url.split('/note-photos/')[1])
          .filter(Boolean) as string[]
        if (paths.length > 0) {
          await supabase.storage.from('note-photos').remove(paths).catch(() => {})
        }
      }

      // Delete reservation (cascade deletes reservation_photos rows)
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', reservationId)
      if (error) throw error
    },
    onMutate: async (input) => {
      const queryKey = ['reservations', { lotId: input.lotId }]
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData(queryKey)
      queryClient.setQueryData(queryKey, (old: Reservation[] | undefined) =>
        (old ?? []).filter((r) => r.id !== input.reservationId),
      )
      return { previous, queryKey }
    },
    onError: (_err, _input, context) => {
      if (context) queryClient.setQueryData(context.queryKey, context.previous)
      toast.error('Erreur lors de la suppression de la réserve')
    },
    onSuccess: () => {
      toast.success('Réserve supprimée')
    },
    onSettled: (_data, _err, input) => {
      queryClient.invalidateQueries({ queryKey: ['reservations', { lotId: input.lotId }] })
      queryClient.invalidateQueries({ queryKey: ['lots'] })
    },
  })
}
