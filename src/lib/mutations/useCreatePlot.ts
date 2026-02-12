import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type PlotRow = Database['public']['Tables']['plots']['Row']

export const DEFAULT_TASK_DEFINITIONS = [
  'Ragréage',
  'Phonique',
  'Pose',
  'Plinthes',
  'Joints',
  'Silicone',
]

export function useCreatePlot() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ chantierId, nom }: { chantierId: string; nom: string }) => {
      const { data, error } = await supabase
        .from('plots')
        .insert({
          chantier_id: chantierId,
          nom,
          task_definitions: DEFAULT_TASK_DEFINITIONS,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onMutate: async ({ chantierId, nom }) => {
      await queryClient.cancelQueries({ queryKey: ['plots', chantierId] })
      const previous = queryClient.getQueryData<PlotRow[]>(['plots', chantierId])
      queryClient.setQueryData<PlotRow[]>(
        ['plots', chantierId],
        (old) => [
          ...(old ?? []),
          {
            id: crypto.randomUUID(),
            chantier_id: chantierId,
            nom,
            task_definitions: DEFAULT_TASK_DEFINITIONS,
            created_at: new Date().toISOString(),
          },
        ],
      )
      return { previous }
    },
    onError: (_err, { chantierId }, context) => {
      queryClient.setQueryData(['plots', chantierId], context?.previous)
    },
    onSettled: (_data, _err, { chantierId }) => {
      queryClient.invalidateQueries({ queryKey: ['plots', chantierId] })
    },
  })
}
