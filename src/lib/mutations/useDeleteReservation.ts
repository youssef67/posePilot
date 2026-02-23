import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Reservation } from '@/types/database'

interface DeleteReservationInput {
  reservationId: string
  lotId: string
  photoUrl: string | null
}

function extractStoragePath(photoUrl: string): string | null {
  const marker = 'note-photos/'
  const idx = photoUrl.indexOf(marker)
  if (idx === -1) return null
  return photoUrl.substring(idx + marker.length)
}

export function useDeleteReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ reservationId, photoUrl }: DeleteReservationInput) => {
      if (photoUrl) {
        const filePath = extractStoragePath(photoUrl)
        if (filePath) {
          await supabase.storage.from('note-photos').remove([filePath]).catch(() => {})
        }
      }

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
