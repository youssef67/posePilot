import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Memo, MemoPhoto } from '@/types/database'

export type MemoEntityType = 'chantier' | 'plot' | 'etage'

export type MemoWithPhotos = Memo & { memo_photos: MemoPhoto[] }

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
        .select('*, memo_photos(*)')
        .eq(columnMap[entityType], entityId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data as unknown as MemoWithPhotos[]).map((memo) => ({
        ...memo,
        memo_photos: [...memo.memo_photos].sort((a, b) => a.position - b.position),
      }))
    },
    enabled: !!entityId,
    placeholderData: [],
  })
}
