import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface DeleteMemoInput {
  memoId: string
  entityType: 'chantier' | 'etage'
  entityId: string
}

export function useDeleteMemo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ memoId }: DeleteMemoInput) => {
      // Fetch all photos for this memo before deletion (CASCADE will delete rows)
      const { data: photos } = await supabase
        .from('memo_photos')
        .select('photo_url')
        .eq('memo_id', memoId)

      // Delete photo files from storage
      if (photos && photos.length > 0) {
        const paths = photos
          .map((p) => p.photo_url.split('/note-photos/')[1])
          .filter(Boolean) as string[]
        if (paths.length > 0) {
          await supabase.storage.from('note-photos').remove(paths)
        }
      }

      // Delete memo (CASCADE deletes memo_photos rows)
      const { error } = await supabase
        .from('memos')
        .delete()
        .eq('id', memoId)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Mémo supprimé')
    },
    onError: () => {
      toast.error('Erreur lors de la suppression du mémo')
    },
    onSettled: (_data, _err, { entityType, entityId }) => {
      queryClient.invalidateQueries({ queryKey: ['memos', entityType, entityId] })
      if (entityType === 'chantier') {
        queryClient.invalidateQueries({ queryKey: ['chantiers'] })
        queryClient.invalidateQueries({ queryKey: ['chantiers', entityId] })
      }
      if (entityType === 'etage') {
        queryClient.invalidateQueries({ queryKey: ['memos', 'plot-etages'] })
        queryClient.invalidateQueries({ queryKey: ['etages'] })
      }
    },
  })
}
