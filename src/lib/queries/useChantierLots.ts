import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface ChantierLot {
  id: string
  code: string
  plot_id: string
  etage_id: string
  plots: { nom: string }
  etages: { nom: string } | null
}

export function useChantierLots(chantierId: string) {
  return useQuery({
    queryKey: ['chantier-lots', chantierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lots')
        .select('id, code, plot_id, etage_id, plots!inner(nom), etages(nom)')
        .eq('plots.chantier_id', chantierId)
        .order('code')
      if (error) throw error
      return data as unknown as ChantierLot[]
    },
    enabled: !!chantierId,
    staleTime: 5 * 60 * 1000,
  })
}
