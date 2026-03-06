import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface DeleteMemoPhotoInput {
  photoId: string
  photoUrl: string
  entityType: 'chantier' | 'plot' | 'etage'
  entityId: string
}

export function useDeleteMemoPhoto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ photoId, photoUrl }: DeleteMemoPhotoInput) => {
      // Delete row from memo_photos first (reversible: orphan file is harmless)
      const { error } = await supabase
        .from('memo_photos')
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
    onSettled: (_data, _err, { entityType, entityId }) => {
      queryClient.invalidateQueries({ queryKey: ['memos', entityType, entityId] })
    },
  })
}
