import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type PieceRow = Database['public']['Tables']['pieces']['Row']
type TacheRow = Database['public']['Tables']['taches']['Row']

export type PieceWithTaches = PieceRow & {
  taches: TacheRow[]
}

export function usePieces(lotId: string) {
  return useQuery({
    queryKey: ['pieces', lotId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pieces')
        .select('*, taches(*)')
        .eq('lot_id', lotId)
        .order('created_at', { ascending: true })
        .order('position', { ascending: true, referencedTable: 'taches' })
      if (error) throw error
      return data as unknown as PieceWithTaches[]
    },
    enabled: !!lotId,
    placeholderData: [],
  })
}
