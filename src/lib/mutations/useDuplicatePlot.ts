import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface DuplicatePlotInput {
  sourcePlotId: string
  chantierId: string
  newPlotNom: string
}

export function useDuplicatePlot() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ sourcePlotId, newPlotNom }: DuplicatePlotInput) => {
      const { data, error } = await supabase.rpc('duplicate_plot', {
        p_source_plot_id: sourcePlotId,
        p_new_plot_nom: newPlotNom,
      })
      if (error) throw error
      return data as string
    },
    onSettled: (_data, _err, { chantierId }) => {
      queryClient.invalidateQueries({ queryKey: ['plots', chantierId] })
    },
  })
}
