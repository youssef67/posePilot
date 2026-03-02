import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface EtageRow {
  id: string
  plot_id: string
  nom: string
  progress_done: number
  progress_total: number
  has_blocking_note: boolean
  has_open_reservation: boolean
  metrage_m2_total: number
  metrage_ml_total: number
  cout_materiaux_total: number
  created_at: string
}

export function useEtages(plotId: string) {
  return useQuery({
    queryKey: ['etages', plotId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('etages')
        .select('*')
        .eq('plot_id', plotId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as unknown as EtageRow[]
    },
    enabled: !!plotId,
    placeholderData: [],
  })
}
