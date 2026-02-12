import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useRealtimeChantiers() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('chantiers-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chantiers' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['chantiers'] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])
}
