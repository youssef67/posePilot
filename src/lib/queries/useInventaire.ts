import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Inventaire } from '@/types/database'

export interface InventaireWithLocation extends Inventaire {
  plots: { nom: string } | null
  etages: { nom: string } | null
  lots: { code: string } | null
}

export type InventaireScope =
  | { type: 'general' }
  | { type: 'etage'; etageId: string }

export function useInventaire(chantierId: string, scope?: InventaireScope) {
  return useQuery({
    queryKey: ['inventaire', chantierId, scope ?? 'all'],
    queryFn: async () => {
      let query = supabase
        .from('inventaire')
        .select('*, plots(nom), etages(nom), lots(code)')
        .eq('chantier_id', chantierId)

      if (scope?.type === 'general') {
        query = query.is('plot_id', null).is('etage_id', null)
      } else if (scope?.type === 'etage') {
        query = query.eq('etage_id', scope.etageId)
      }

      const { data, error } = await query
        .order('designation', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as unknown as InventaireWithLocation[]
    },
    enabled: !!chantierId,
    placeholderData: [],
  })
}
