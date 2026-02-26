import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface UpdateFinancesParams {
  chantierId: string
  ajustement_depenses: number
  cout_sous_traitance: number
}

export function useUpdateChantierFinances() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ chantierId, ajustement_depenses, cout_sous_traitance }: UpdateFinancesParams) => {
      const { data, error } = await supabase
        .from('chantiers')
        .update({ ajustement_depenses, cout_sous_traitance })
        .eq('id', chantierId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSettled: (_data, _error, { chantierId }) => {
      queryClient.invalidateQueries({ queryKey: ['chantiers', chantierId] })
    },
  })
}
