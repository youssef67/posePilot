import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type PlotRow = Database['public']['Tables']['plots']['Row']
type TaskConfig = PlotRow['task_config']

export function useUpdatePlotTaskConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      plotId,
      taskConfig,
    }: {
      plotId: string
      /** Used for cache invalidation only — not sent to Supabase */
      chantierId: string
      taskConfig: TaskConfig
    }) => {
      const { data, error } = await supabase
        .from('plots')
        .update({ task_config: taskConfig })
        .eq('id', plotId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onMutate: async ({ plotId, chantierId, taskConfig }) => {
      await queryClient.cancelQueries({ queryKey: ['plots', chantierId] })
      const previous = queryClient.getQueryData<PlotRow[]>(['plots', chantierId])
      queryClient.setQueryData<PlotRow[]>(
        ['plots', chantierId],
        (old) =>
          old?.map((plot) =>
            plot.id === plotId ? { ...plot, task_config: taskConfig } : plot,
          ),
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
      queryClient.invalidateQueries({ queryKey: ['lots-with-taches', chantierId] })
    },
  })
}
