import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ChantierMemo } from '@/types/database'

export function useChantierMemos(chantierId: string) {
  return useQuery({
    queryKey: ['chantier-memos', { chantierId }],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chantier_memos')
        .select('*')
        .eq('chantier_id', chantierId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as ChantierMemo[]
    },
    enabled: !!chantierId,
    placeholderData: [],
  })
}
