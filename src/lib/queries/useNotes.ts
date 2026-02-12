import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Note } from '@/types/database'

export type { Note }

export function useNotes({ lotId, pieceId }: { lotId?: string; pieceId?: string }) {
  return useQuery({
    queryKey: ['notes', { lotId, pieceId }],
    queryFn: async () => {
      let query = supabase
        .from('notes')
        .select('*')

      if (lotId) {
        query = query.eq('lot_id', lotId)
      } else if (pieceId) {
        query = query.eq('piece_id', pieceId)
      }

      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) throw error
      return data as unknown as Note[]
    },
    enabled: !!(lotId || pieceId),
  })
}
