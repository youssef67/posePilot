import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export function useDeleteMemo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ memoId }: { memoId: string; chantierId: string }) => {
      const { error } = await supabase
        .from('chantier_memos')
        .delete()
        .eq('id', memoId)
      if (error) throw error
    },
    onSettled: (_data, _err, { chantierId }) => {
      queryClient.invalidateQueries({ queryKey: ['chantier-memos', { chantierId }] })
      queryClient.invalidateQueries({ queryKey: ['chantiers'] })
      queryClient.invalidateQueries({ queryKey: ['chantiers', chantierId] })
      toast.success('Mémo supprimé')
    },
  })
}
