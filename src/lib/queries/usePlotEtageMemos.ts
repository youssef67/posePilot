import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { MemoWithPhotos } from './useMemos'

export function usePlotEtageMemos(plotId: string, etageIds: string[]) {
  return useQuery({
    queryKey: ['memos', 'plot-etages', plotId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('memos')
        .select('*, memo_photos(*)')
        .in('etage_id', etageIds)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data as unknown as MemoWithPhotos[]).map((memo) => ({
        ...memo,
        memo_photos: [...memo.memo_photos].sort((a, b) => a.position - b.position),
      }))
    },
    enabled: etageIds.length > 0,
    placeholderData: [],
  })
}
