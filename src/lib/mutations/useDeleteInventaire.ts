import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { InventaireWithLocation } from '@/lib/queries/useInventaire'

export function useDeleteInventaire() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id }: { id: string; chantierId: string }) => {
      const { error } = await supabase
        .from('inventaire')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, chantierId }) => {
      await queryClient.cancelQueries({ queryKey: ['inventaire', chantierId] })
      const previous = queryClient.getQueryData(['inventaire', chantierId])
      queryClient.setQueryData(
        ['inventaire', chantierId],
        (old: InventaireWithLocation[] | undefined) =>
          (old ?? []).filter((item) => item.id !== id),
      )
      return { previous }
    },
    onError: (_err, { chantierId }, context) => {
      queryClient.setQueryData(['inventaire', chantierId], context?.previous)
    },
    onSettled: (_data, _error, { chantierId }) => {
      queryClient.invalidateQueries({ queryKey: ['inventaire', chantierId] })
    },
  })
}
