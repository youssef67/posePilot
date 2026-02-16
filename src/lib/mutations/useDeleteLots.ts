import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { LotWithRelations } from '@/lib/queries/useLots'

interface DeleteLotsInput {
  lotIds: string[]
  plotId: string
}

export function useDeleteLots() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ lotIds }: DeleteLotsInput) => {
      const { error } = await supabase
        .from('lots')
        .delete()
        .in('id', lotIds)
      if (error) throw error
    },
    onMutate: async ({ lotIds, plotId }) => {
      await queryClient.cancelQueries({ queryKey: ['lots', plotId] })
      const previous = queryClient.getQueryData<LotWithRelations[]>(['lots', plotId])
      const idSet = new Set(lotIds)
      queryClient.setQueryData<LotWithRelations[]>(
        ['lots', plotId],
        (old) => (old ?? []).filter((lot) => !idSet.has(lot.id)),
      )
      return { previous }
    },
    onError: (_err, { plotId }, context) => {
      queryClient.setQueryData(['lots', plotId], context?.previous)
    },
    onSettled: (_data, _err, { plotId }) => {
      queryClient.invalidateQueries({ queryKey: ['lots', plotId] })
      queryClient.invalidateQueries({ queryKey: ['etages', plotId] })
    },
  })
}
