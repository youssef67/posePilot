import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Besoin } from '@/types/database'

export function useBesoinsForLivraison(livraisonId: string | null) {
  return useQuery({
    queryKey: ['besoins-for-livraison', livraisonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('besoins')
        .select('*')
        .eq('livraison_id', livraisonId!)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data as unknown as Besoin[]
    },
    enabled: !!livraisonId,
    placeholderData: [],
  })
}
