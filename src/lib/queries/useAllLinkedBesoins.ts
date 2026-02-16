import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Besoin } from '@/types/database'
import { buildBesoinsMap } from './useAllBesoinsForChantier'

export function useAllLinkedBesoins() {
  return useQuery({
    queryKey: ['all-linked-besoins'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('besoins')
        .select('*')
        .not('livraison_id', 'is', null)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data as unknown as Besoin[]
    },
    placeholderData: [],
  })
}

export { buildBesoinsMap }
