import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Memo } from '@/types/database'

export interface GroupedContextMemos {
  chantier: Memo[]
  plot: Memo[]
  etage: Memo[]
}

export function useContextMemos(chantierId: string, plotId: string, etageId: string) {
  return useQuery({
    queryKey: ['context-memos', { chantierId, plotId, etageId }],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('memos')
        .select('*')
        .or(`chantier_id.eq.${chantierId},plot_id.eq.${plotId},etage_id.eq.${etageId}`)
        .order('created_at', { ascending: false })
      if (error) throw error

      const memos = data as Memo[]
      const grouped: GroupedContextMemos = { chantier: [], plot: [], etage: [] }
      for (const memo of memos) {
        if (memo.chantier_id) grouped.chantier.push(memo)
        else if (memo.plot_id) grouped.plot.push(memo)
        else if (memo.etage_id) grouped.etage.push(memo)
      }
      return grouped
    },
    enabled: !!chantierId && !!plotId && !!etageId,
  })
}
