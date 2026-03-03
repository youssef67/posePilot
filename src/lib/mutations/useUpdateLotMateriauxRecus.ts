import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface UpdateLotMateriauxRecusParams {
  lotId: string
  plotId: string
  materiaux_recus: boolean
}

export function useUpdateLotMateriauxRecus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ lotId, materiaux_recus }: UpdateLotMateriauxRecusParams) => {
      const { data, error } = await supabase
        .from('lots')
        .update({ materiaux_recus })
        .eq('id', lotId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSettled: (_data, _error, { plotId }) => {
      queryClient.invalidateQueries({ queryKey: ['lots', plotId] })
    },
  })
}
