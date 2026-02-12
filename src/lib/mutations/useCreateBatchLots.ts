import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useCreateBatchLots() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      codes,
      varianteId,
      etageNom,
      plotId,
    }: {
      codes: string[]
      varianteId: string
      etageNom: string
      plotId: string
    }) => {
      const { data, error } = await supabase.rpc(
        'create_batch_lots_with_inheritance',
        {
          p_codes: codes,
          p_variante_id: varianteId,
          p_etage_nom: etageNom,
          p_plot_id: plotId,
        },
      )
      if (error) throw error
      return data as string[]
    },
    onSettled: (_data, _err, { plotId }) => {
      queryClient.invalidateQueries({ queryKey: ['lots', plotId] })
      queryClient.invalidateQueries({ queryKey: ['etages', plotId] })
    },
  })
}
