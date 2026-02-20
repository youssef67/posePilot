import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Besoin } from '@/types/database'

export interface BesoinWithChantier extends Besoin {
  chantiers: { nom: string }
}

export function useAllPendingBesoins() {
  return useQuery({
    queryKey: ['all-pending-besoins'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('besoins')
        .select('*, chantiers(nom)')
        .is('livraison_id', null)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as unknown as BesoinWithChantier[]
    },
    placeholderData: [],
  })
}
