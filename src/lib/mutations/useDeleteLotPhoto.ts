import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface DeleteLotPhotoInput {
  photoId: string
  photoUrl: string
  lotId: string
}

/** Extract storage path from a public Supabase URL */
function extractStoragePath(publicUrl: string): string | null {
  const marker = '/object/public/note-photos/'
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return null
  return publicUrl.slice(idx + marker.length)
}

export function useDeleteLotPhoto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ photoId, photoUrl }: DeleteLotPhotoInput) => {
      // Delete row first
      const { error: deleteError } = await supabase
        .from('lot_photos')
        .delete()
        .eq('id', photoId)
      if (deleteError) throw deleteError

      // Delete from storage (fire-and-forget, non-blocking)
      const storagePath = extractStoragePath(photoUrl)
      if (storagePath) {
        supabase.storage.from('note-photos').remove([storagePath])
      }
    },
    onSuccess: () => {
      toast('Photo supprimée')
    },
    onError: () => {
      toast.error('Erreur lors de la suppression de la photo')
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lot-photos', variables.lotId] })
    },
  })
}
