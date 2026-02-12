import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useRealtimeNotes(targetId: string, type: 'lot' | 'piece') {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel(`notes-changes-${type}-${targetId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notes' },
        () => {
          const queryKey = type === 'lot'
            ? ['notes', { lotId: targetId, pieceId: undefined }]
            : ['notes', { lotId: undefined, pieceId: targetId }]
          queryClient.invalidateQueries({ queryKey })
          queryClient.invalidateQueries({ queryKey: ['lots'] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [targetId, type, queryClient])
}
