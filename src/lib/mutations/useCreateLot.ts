import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useCreateLot() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      code,
      varianteId,
      etageNom,
      plotId,
    }: {
      code: string
      varianteId: string
      etageNom: string
      plotId: string
    }) => {
      const { data, error } = await supabase.rpc('create_lot_with_inheritance', {
        p_code: code,
        p_variante_id: varianteId,
        p_etage_nom: etageNom,
        p_plot_id: plotId,
      })
      if (error) throw error
      return data as string
    },
    onSettled: (_data, _err, { plotId }) => {
      queryClient.invalidateQueries({ queryKey: ['lots', plotId] })
      queryClient.invalidateQueries({ queryKey: ['etages', plotId] })
    },
  })
}
