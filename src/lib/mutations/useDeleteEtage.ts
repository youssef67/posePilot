import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { EtageRow } from '@/lib/queries/useEtages'
import type { LotWithRelations } from '@/lib/queries/useLots'

interface DeleteEtageInput {
  etageId: string
  plotId: string
}

export function useDeleteEtage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ etageId }: DeleteEtageInput) => {
      const { error } = await supabase
        .from('etages')
        .delete()
        .eq('id', etageId)
      if (error) throw error
    },
    onMutate: async ({ etageId, plotId }) => {
      await queryClient.cancelQueries({ queryKey: ['etages', plotId] })
      await queryClient.cancelQueries({ queryKey: ['lots', plotId] })
      const previousEtages = queryClient.getQueryData<EtageRow[]>(['etages', plotId])
      const previousLots = queryClient.getQueryData<LotWithRelations[]>(['lots', plotId])
      queryClient.setQueryData<EtageRow[]>(
        ['etages', plotId],
        (old) => (old ?? []).filter((e) => e.id !== etageId),
      )
      queryClient.setQueryData<LotWithRelations[]>(
        ['lots', plotId],
        (old) => (old ?? []).filter((l) => l.etage_id !== etageId),
      )
      return { previousEtages, previousLots }
    },
    onError: (_err, { plotId }, context) => {
      queryClient.setQueryData(['etages', plotId], context?.previousEtages)
      queryClient.setQueryData(['lots', plotId], context?.previousLots)
    },
    onSettled: (_data, _err, { plotId }) => {
      queryClient.invalidateQueries({ queryKey: ['etages', plotId] })
      queryClient.invalidateQueries({ queryKey: ['lots', plotId] })
    },
  })
}
