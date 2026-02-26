import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { DepotMouvement } from '@/types/database'

export interface DepotMouvementWithChantier extends DepotMouvement {
  chantiers: { nom: string } | null
}

export function useDepotMouvements(articleId: string) {
  return useQuery({
    queryKey: ['depot-mouvements', articleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('depot_mouvements')
        .select('*, chantiers(nom)')
        .eq('article_id', articleId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as unknown as DepotMouvementWithChantier[]
    },
    enabled: !!articleId,
    placeholderData: [],
  })
}
