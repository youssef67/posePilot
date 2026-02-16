import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface UpdateLotInput {
  lotId: string
  plotId: string
  code?: string
  varianteId?: string
  etageId?: string
}

export function useUpdateLot() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ lotId, code, varianteId, etageId }: UpdateLotInput) => {
      const updates: Record<string, string> = {}
      if (code !== undefined) updates.code = code
      if (varianteId !== undefined) updates.variante_id = varianteId
      if (etageId !== undefined) updates.etage_id = etageId

      const { data, error } = await supabase
        .from('lots')
        .update(updates)
        .eq('id', lotId)
        .select('*, etages(nom), variantes(nom), pieces(count)')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_data, { plotId }) => {
      queryClient.invalidateQueries({ queryKey: ['lots', plotId] })
      queryClient.invalidateQueries({ queryKey: ['etages', plotId] })
    },
  })
}
