import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { LotWithRelations } from '@/lib/queries/useLots'
import type { PlinthStatus } from '@/types/enums'

interface UpdatePlinthStatusParams {
  lotId: string
  plinthStatus: PlinthStatus
  plotId: string
}

export function useUpdatePlinthStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ lotId, plinthStatus }: UpdatePlinthStatusParams) => {
      const { data, error } = await supabase
        .from('lots')
        .update({ plinth_status: plinthStatus })
        .eq('id', lotId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onMutate: async ({ lotId, plinthStatus, plotId }) => {
      await queryClient.cancelQueries({ queryKey: ['lots', plotId] })
      const previous = queryClient.getQueryData<LotWithRelations[]>(['lots', plotId])
      queryClient.setQueryData<LotWithRelations[]>(
        ['lots', plotId],
        (old) =>
          (old ?? []).map((lot) =>
            lot.id === lotId ? { ...lot, plinth_status: plinthStatus } : lot,
          ),
      )
      return { previous }
    },
    onError: (_err, { plotId }, context) => {
      queryClient.setQueryData(['lots', plotId], context?.previous)
    },
    onSettled: (_data, _err, { plotId }) => {
      queryClient.invalidateQueries({ queryKey: ['lots', plotId] })
    },
  })
}
