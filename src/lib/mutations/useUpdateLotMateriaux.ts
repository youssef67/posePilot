import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export type MateriauxStatut = 'non_recu' | 'partiel' | 'recu'

interface UpdateLotMateriauxParams {
  lotId: string
  plotId: string
  materiaux_statut: MateriauxStatut
  materiaux_note: string | null
}

export function useUpdateLotMateriaux() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ lotId, materiaux_statut, materiaux_note }: UpdateLotMateriauxParams) => {
      const { data, error } = await supabase
        .from('lots')
        .update({ materiaux_statut, materiaux_note })
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
