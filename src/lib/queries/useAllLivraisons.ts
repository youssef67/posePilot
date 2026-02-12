import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Livraison } from '@/types/database'

export interface LivraisonWithChantier extends Livraison {
  chantiers: { nom: string }
}

export function useAllLivraisons() {
  return useQuery({
    queryKey: ['all-livraisons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('livraisons')
        .select('*, chantiers(nom)')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as unknown as LivraisonWithChantier[]
    },
  })
}
