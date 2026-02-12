import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { LotWithRelations } from '@/lib/queries/useLots'

export function useToggleLotTma() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ lotId, isTma }: { lotId: string; isTma: boolean; plotId: string }) => {
      const { data, error } = await supabase
        .from('lots')
        .update({ is_tma: isTma })
        .eq('id', lotId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onMutate: async ({ lotId, isTma, plotId }) => {
      await queryClient.cancelQueries({ queryKey: ['lots', plotId] })
      const previous = queryClient.getQueryData<LotWithRelations[]>(['lots', plotId])
      queryClient.setQueryData<LotWithRelations[]>(
        ['lots', plotId],
        (old) =>
          (old ?? []).map((lot) =>
            lot.id === lotId ? { ...lot, is_tma: isTma } : lot,
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
