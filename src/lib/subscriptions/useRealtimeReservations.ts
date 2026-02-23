import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useRealtimeReservations(lotId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel(`reservations-changes-${lotId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reservations', filter: `lot_id=eq.${lotId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['reservations', { lotId }] })
          queryClient.invalidateQueries({ queryKey: ['lots'] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [lotId, queryClient])
}
