import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Inventaire } from '@/types/database'

export interface InventaireWithLocation extends Inventaire {
  plots: { nom: string }
  etages: { nom: string }
}

export function useInventaire(chantierId: string) {
  return useQuery({
    queryKey: ['inventaire', chantierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventaire')
        .select('*, plots(nom), etages(nom)')
        .eq('chantier_id', chantierId)
        .order('designation', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as unknown as InventaireWithLocation[]
    },
    enabled: !!chantierId,
    placeholderData: [],
  })
}
