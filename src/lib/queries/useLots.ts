import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database, LotBadge } from '@/types/database'

type LotRow = Database['public']['Tables']['lots']['Row']

export type LotBadgeAssignment = {
  badge_id: string
  lot_badges: LotBadge
}

export type LotWithRelations = LotRow & {
  etages: { nom: string } | null
  variantes: { nom: string } | null
  pieces: { count: number }[]
  has_blocking_note: boolean
  has_missing_docs: boolean
  has_inventaire: boolean
  lot_badge_assignments: LotBadgeAssignment[]
}

export function useLots(plotId: string) {
  return useQuery({
    queryKey: ['lots', plotId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lots')
        .select('*, etages(nom), variantes(nom), pieces(count), lot_badge_assignments(badge_id, lot_badges(*))')
        .eq('plot_id', plotId)
        .order('position', { ascending: true })
      if (error) throw error
      return data as unknown as LotWithRelations[]
    },
    enabled: !!plotId,
    placeholderData: [],
  })
}
