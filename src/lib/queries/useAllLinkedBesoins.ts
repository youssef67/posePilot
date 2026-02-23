import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Besoin } from '@/types/database'

export interface LinkedBesoinWithChantier extends Besoin {
  chantiers: { nom: string }
}

export function useAllLinkedBesoins() {
  return useQuery({
    queryKey: ['all-linked-besoins'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('besoins')
        .select('*, chantiers(nom)')
        .not('livraison_id', 'is', null)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data as unknown as LinkedBesoinWithChantier[]
    },
    placeholderData: [],
  })
}

export function buildLinkedBesoinsMap(besoins: LinkedBesoinWithChantier[]): Map<string, LinkedBesoinWithChantier[]> {
  const map = new Map<string, LinkedBesoinWithChantier[]>()
  for (const b of besoins) {
    if (!b.livraison_id) continue
    const list = map.get(b.livraison_id)
    if (list) list.push(b)
    else map.set(b.livraison_id, [b])
  }
  return map
}
