import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type PlotRow = Database['public']['Tables']['plots']['Row']

export function useDeletePlot() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ plotId, chantierId }: { plotId: string; chantierId: string }) => {
      const { error } = await supabase
        .from('plots')
        .delete()
        .eq('id', plotId)
      if (error) throw error
      return { plotId, chantierId }
    },
    onMutate: async ({ plotId, chantierId }) => {
      await queryClient.cancelQueries({ queryKey: ['plots', chantierId] })
      const previous = queryClient.getQueryData<PlotRow[]>(['plots', chantierId])
      queryClient.setQueryData<PlotRow[]>(
        ['plots', chantierId],
        (old) => old?.filter((plot) => plot.id !== plotId),
      )
      return { previous, chantierId }
    },
    onError: (_err, _vars, context) => {
      if (context) {
        queryClient.setQueryData(['plots', context.chantierId], context.previous)
      }
    },
    onSettled: (_data, _err, { chantierId }) => {
      queryClient.invalidateQueries({ queryKey: ['plots', chantierId] })
    },
  })
}
