import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface UpdateLotCoutMateriauxParams {
  lotId: string
  plotId: string
  chantierId: string
  cout_materiaux: number
}

export function useUpdateLotCoutMateriaux() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ lotId, cout_materiaux }: UpdateLotCoutMateriauxParams) => {
      const { data, error } = await supabase
        .from('lots')
        .update({ cout_materiaux })
        .eq('id', lotId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSettled: (_data, _error, { plotId, chantierId }) => {
      queryClient.invalidateQueries({ queryKey: ['lots', plotId] })
      queryClient.invalidateQueries({ queryKey: ['etages', plotId] })
      queryClient.invalidateQueries({ queryKey: ['plots', chantierId] })
      queryClient.invalidateQueries({ queryKey: ['chantiers', chantierId] })
    },
  })
}
