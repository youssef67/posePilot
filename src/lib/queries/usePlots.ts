import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface PlotRow {
  id: string
  chantier_id: string
  nom: string
  task_definitions: string[]
  progress_done: number
  progress_total: number
  has_blocking_note: boolean
  metrage_m2_total: number
  metrage_ml_total: number
  created_at: string
}

export function usePlots(chantierId: string) {
  return useQuery({
    queryKey: ['plots', chantierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plots')
        .select('*')
        .eq('chantier_id', chantierId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as unknown as PlotRow[]
    },
    enabled: !!chantierId,
  })
}
