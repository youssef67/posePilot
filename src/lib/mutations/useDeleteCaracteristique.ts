import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Caracteristique } from '@/types/database'

export function useDeleteCaracteristique() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id }: { id: string; chantierId: string }) => {
      const { error } = await supabase
        .from('chantier_caracteristiques')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, chantierId }) => {
      await queryClient.cancelQueries({ queryKey: ['caracteristiques', chantierId] })
      const previous = queryClient.getQueryData(['caracteristiques', chantierId])
      queryClient.setQueryData(
        ['caracteristiques', chantierId],
        (old: Caracteristique[] | undefined) =>
          (old ?? []).filter((item) => item.id !== id),
      )
      return { previous }
    },
    onError: (_err, { chantierId }, context) => {
      queryClient.setQueryData(['caracteristiques', chantierId], context?.previous)
    },
    onSettled: (_data, _error, { chantierId }) => {
      queryClient.invalidateQueries({ queryKey: ['caracteristiques', chantierId] })
    },
  })
}
