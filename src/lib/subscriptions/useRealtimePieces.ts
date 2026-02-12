import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useRealtimePieces(lotId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel(`pieces-changes-${lotId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pieces' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['pieces', lotId] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [lotId, queryClient])
}
