import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface DeleteReservationPhotoInput {
  photoId: string
  photoUrl: string
  lotId: string
}

export function useDeleteReservationPhoto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ photoId, photoUrl }: DeleteReservationPhotoInput) => {
      // Delete row first (reversible: orphan file is harmless)
      const { error } = await supabase
        .from('reservation_photos')
        .delete()
        .eq('id', photoId)
      if (error) throw error

      // Then clean up storage file (best-effort)
      const path = photoUrl.split('/note-photos/')[1]
      if (path) {
        await supabase.storage.from('note-photos').remove([path])
      }
    },
    onSuccess: () => {
      toast.success('Photo supprimée')
    },
    onError: () => {
      toast.error('Erreur lors de la suppression de la photo')
    },
    onSettled: (_data, _err, { lotId }) => {
      queryClient.invalidateQueries({ queryKey: ['reservations', { lotId }] })
    },
  })
}
