import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { LotPhoto } from '@/types/database'

export function useLotPhotos(lotId: string) {
  return useQuery<LotPhoto[]>({
    queryKey: ['lot-photos', lotId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lot_photos')
        .select('*')
        .eq('lot_id', lotId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as LotPhoto[]
    },
    enabled: !!lotId,
    placeholderData: [],
  })
}
