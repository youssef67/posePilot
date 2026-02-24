import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface CreateBesoinLine {
  chantier_id: string
  description: string
  quantite: number
}

export function useCreateBesoins() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (lines: CreateBesoinLine[]) => {
      const { data: { user } } = await supabase.auth.getUser()
      const rows = lines.map((line) => ({
        chantier_id: line.chantier_id,
        description: line.description,
        quantite: line.quantite,
        created_by: user?.id ?? null,
      }))
      const { data, error } = await supabase
        .from('besoins')
        .insert(rows)
        .select()
      if (error) throw error
      return data
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['besoins'] })
      queryClient.invalidateQueries({ queryKey: ['all-pending-besoins'] })
      queryClient.invalidateQueries({ queryKey: ['all-pending-besoins-count'] })
    },
  })
}
