import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Besoin } from '@/types/database'

export function useAllBesoinsForChantier(chantierId: string) {
  return useQuery({
    queryKey: ['all-besoins', chantierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('besoins')
        .select('*')
        .eq('chantier_id', chantierId)
        .not('livraison_id', 'is', null)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data as unknown as Besoin[]
    },
    enabled: !!chantierId,
    placeholderData: [],
  })
}

export function buildBesoinsMap(besoins: Besoin[]): Map<string, Besoin[]> {
  const map = new Map<string, Besoin[]>()
  for (const b of besoins) {
    if (b.livraison_id) {
      const list = map.get(b.livraison_id) ?? []
      list.push(b)
      map.set(b.livraison_id, list)
    }
  }
  return map
}
