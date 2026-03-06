import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Memo } from '@/types/database'

export type MemoEntityType = 'chantier' | 'plot' | 'etage'

const columnMap: Record<MemoEntityType, string> = {
  chantier: 'chantier_id',
  plot: 'plot_id',
  etage: 'etage_id',
}

export function useMemos(entityType: MemoEntityType, entityId: string) {
  return useQuery({
    queryKey: ['memos', entityType, entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('memos')
        .select('*')
        .eq(columnMap[entityType], entityId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Memo[]
    },
    enabled: !!entityId,
    placeholderData: [],
  })
}
