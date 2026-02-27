import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { LotBadge } from '@/types/database'

export type BadgeAssignment = {
  lot_id: string
  badge_id: string
  created_at: string
  lot_badges: LotBadge
}

export function useLotBadgeAssignments(lotId: string) {
  return useQuery({
    queryKey: ['lot-badge-assignments', { lotId }],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lot_badge_assignments')
        .select('*, lot_badges(*)')
        .eq('lot_id', lotId)
      if (error) throw error
      return data as unknown as BadgeAssignment[]
    },
    enabled: !!lotId,
    placeholderData: [],
  })
}
