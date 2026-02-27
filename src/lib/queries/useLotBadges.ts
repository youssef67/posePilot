import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { LotBadge } from '@/types/database'

export function useLotBadges(chantierId: string) {
  return useQuery({
    queryKey: ['lot-badges', { chantierId }],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lot_badges')
        .select('*')
        .eq('chantier_id', chantierId)
        .order('nom', { ascending: true })
      if (error) throw error
      return data as LotBadge[]
    },
    enabled: !!chantierId,
    placeholderData: [],
  })
}
