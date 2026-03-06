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
      targetLotId = null,
    }: {
      sourceId: string
      quantity: number
      targetPlotId: string | null
      targetEtageId: string | null
      targetLotId?: string | null
      chantierId: string
    }) => {
      const { error } = await supabase.rpc('transfer_inventaire', {
        p_source_id: sourceId,
        p_quantity: quantity,
        p_target_plot_id: targetPlotId,
        p_target_etage_id: targetEtageId,
        p_target_lot_id: targetLotId,
      })
      if (error) throw error
    },
    onSettled: (_data, _error, { chantierId, targetPlotId }) => {
      queryClient.invalidateQueries({ queryKey: ['inventaire', chantierId] })
      if (targetPlotId) {
        queryClient.invalidateQueries({ queryKey: ['lots', targetPlotId] })
      }
    },
  })
}
