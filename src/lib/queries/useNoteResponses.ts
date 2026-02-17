import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { NoteResponse } from '@/types/database'

export function useNoteResponses(noteId: string | null) {
  return useQuery({
    queryKey: ['note_responses', noteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('note_responses')
        .select('*')
        .eq('note_id', noteId!)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as unknown as NoteResponse[]
    },
    enabled: !!noteId,
  })
}
