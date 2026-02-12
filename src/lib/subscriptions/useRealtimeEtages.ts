import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useRealtimeEtages(plotId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel(`etages-changes-${plotId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'etages' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['etages', plotId] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [plotId, queryClient])
}
