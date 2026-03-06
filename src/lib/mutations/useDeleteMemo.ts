import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface DeleteMemoInput {
  memoId: string
  photoUrl?: string | null
  entityType: 'chantier' | 'plot' | 'etage'
  entityId: string
}

export function useDeleteMemo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ memoId, photoUrl }: DeleteMemoInput) => {
      // Clean up photo from storage if exists
      if (photoUrl) {
        const path = photoUrl.split('/note-photos/')[1]
        if (path) {
          await supabase.storage.from('note-photos').remove([path])
        }
      }

      const { error } = await supabase
        .from('memos')
        .delete()
        .eq('id', memoId)
      if (error) throw error
    },
    onSettled: (_data, _err, { entityType, entityId }) => {
      queryClient.invalidateQueries({ queryKey: ['memos', entityType, entityId] })
      queryClient.invalidateQueries({ queryKey: ['context-memos'] })
      if (entityType === 'chantier') {
        queryClient.invalidateQueries({ queryKey: ['chantiers'] })
        queryClient.invalidateQueries({ queryKey: ['chantiers', entityId] })
      }
      if (entityType === 'plot') {
        queryClient.invalidateQueries({ queryKey: ['plots'] })
      }
      if (entityType === 'etage') {
        queryClient.invalidateQueries({ queryKey: ['etages'] })
      }
      toast.success('Mémo supprimé')
    },
  })
}
