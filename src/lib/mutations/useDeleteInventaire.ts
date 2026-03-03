import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { InventaireWithLocation } from '@/lib/queries/useInventaire'

export function useDeleteInventaire() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id }: { id: string; chantierId: string; plotId?: string | null }) => {
      const { error } = await supabase
        .from('inventaire')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, chantierId }) => {
      await queryClient.cancelQueries({ queryKey: ['inventaire', chantierId] })
      const previousEntries = queryClient.getQueriesData<InventaireWithLocation[]>({
        queryKey: ['inventaire', chantierId],
      })
      for (const [key] of previousEntries) {
        queryClient.setQueryData<InventaireWithLocation[]>(key, (old) =>
          (old ?? []).filter((item) => item.id !== id),
        )
      }
      return { previousEntries }
    },
    onError: (_err, _params, context) => {
      for (const [key, data] of context?.previousEntries ?? []) {
        queryClient.setQueryData(key, data)
      }
    },
    onSettled: (_data, _error, { chantierId, plotId }) => {
      queryClient.invalidateQueries({ queryKey: ['inventaire', chantierId] })
      if (plotId) {
        queryClient.invalidateQueries({ queryKey: ['lots', plotId] })
      }
    },
  })
}
