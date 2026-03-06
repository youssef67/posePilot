import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Intervenant } from '@/types/database'

export function useDeleteIntervenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('intervenants')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['intervenants'] })
      const previous = queryClient.getQueryData<Intervenant[]>(['intervenants'])
      queryClient.setQueryData<Intervenant[]>(['intervenants'], (old) =>
        (old ?? []).filter((i) => i.id !== id),
      )
      return { previous }
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(['intervenants'], context?.previous)
      toast.error("Impossible de supprimer l'intervenant")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['intervenants'] })
    },
  })
}
