import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface ChantierRow {
  id: string
  nom: string
  type: 'complet' | 'leger'
  status: string
  progress_done: number
  progress_total: number
  has_blocking_note: boolean
  created_by: string
  created_at: string
}

export function useChantier(chantierId: string) {
  return useQuery({
    queryKey: ['chantiers', chantierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chantiers')
        .select('*')
        .eq('id', chantierId)
        .single()
      if (error) throw error
      return data as unknown as ChantierRow
    },
    enabled: !!chantierId,
  })
}
