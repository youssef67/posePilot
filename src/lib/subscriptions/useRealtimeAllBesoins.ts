import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useRealtimeAllBesoins() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('besoins:global')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'besoins' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['all-pending-besoins-count'] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])
}
