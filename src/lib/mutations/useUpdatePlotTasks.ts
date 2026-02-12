import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type PlotRow = Database['public']['Tables']['plots']['Row']

export function useUpdatePlotTasks() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      plotId,
      taskDefinitions,
    }: {
      plotId: string
      chantierId: string
      taskDefinitions: string[]
    }) => {
      const { data, error } = await supabase
        .from('plots')
        .update({ task_definitions: taskDefinitions })
        .eq('id', plotId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onMutate: async ({ plotId, chantierId, taskDefinitions }) => {
      await queryClient.cancelQueries({ queryKey: ['plots', chantierId] })
      const previous = queryClient.getQueryData<PlotRow[]>(['plots', chantierId])
      queryClient.setQueryData<PlotRow[]>(
        ['plots', chantierId],
        (old) =>
          old?.map((plot) =>
            plot.id === plotId ? { ...plot, task_definitions: taskDefinitions } : plot,
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
    },
  })
}
