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
  has_open_reservation: boolean
  metrage_m2_total: number
  metrage_ml_total: number
  cout_materiaux_total: number
  created_at: string
  lots_count: number
}

export function usePlots(chantierId: string) {
  return useQuery({
    queryKey: ['plots', chantierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plots')
        .select('*, lots(count)')
        .eq('chantier_id', chantierId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []).map((row: Record<string, unknown>) => ({
        ...row,
        lots_count: (row.lots as { count: number }[])?.[0]?.count ?? 0,
      })) as unknown as PlotRow[]
    },
    enabled: !!chantierId,
    placeholderData: [],
  })
}
