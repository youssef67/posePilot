import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useTransferInventaire() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      sourceId,
      quantity,
      targetPlotId,
      targetEtageId,
    }: {
      sourceId: string
      quantity: number
      targetPlotId: string | null
      targetEtageId: string | null
      chantierId: string
    }) => {
      const { error } = await supabase.rpc('transfer_inventaire', {
        p_source_id: sourceId,
        p_quantity: quantity,
        p_target_plot_id: targetPlotId,
        p_target_etage_id: targetEtageId,
      })
      if (error) throw error
    },
    onSettled: (_data, _error, { chantierId }) => {
      queryClient.invalidateQueries({ queryKey: ['inventaire', chantierId] })
    },
  })
}
