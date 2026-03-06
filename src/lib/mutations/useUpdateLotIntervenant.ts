import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { LotWithRelations } from '@/lib/queries/useLots'

interface UpdateLotIntervenantInput {
  lotId: string
  plotId: string
  intervenantId: string | null
  intervenantNom?: string | null
}

export function useUpdateLotIntervenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ lotId, intervenantId }: UpdateLotIntervenantInput) => {
      const { data, error } = await supabase
        .from('lots')
        .update({ intervenant_id: intervenantId })
        .eq('id', lotId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onMutate: async ({ lotId, plotId, intervenantId, intervenantNom }) => {
      await queryClient.cancelQueries({ queryKey: ['lots', plotId] })
      const previous = queryClient.getQueryData<LotWithRelations[]>(['lots', plotId])
      queryClient.setQueryData<LotWithRelations[]>(
        ['lots', plotId],
        (old) =>
          (old ?? []).map((lot) =>
            lot.id === lotId
              ? {
                  ...lot,
                  intervenant_id: intervenantId,
                  intervenants: intervenantNom ? { nom: intervenantNom } : null,
                }
              : lot,
          ),
      )
      return { previous }
    },
    onError: (_err, { plotId }, context) => {
      queryClient.setQueryData(['lots', plotId], context?.previous)
      toast.error("Impossible de mettre à jour l'intervenant")
    },
    onSettled: (_data, _err, { plotId }) => {
      queryClient.invalidateQueries({ queryKey: ['lots', plotId] })
    },
  })
}
