import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useRealtimeLots(plotId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel(`lots-changes-${plotId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lots' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['lots', plotId] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [plotId, queryClient])
}
