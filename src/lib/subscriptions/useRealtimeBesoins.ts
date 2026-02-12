import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useRealtimeBesoins(chantierId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel(`besoins:chantier_id=eq.${chantierId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'besoins', filter: `chantier_id=eq.${chantierId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['besoins', chantierId] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [chantierId, queryClient])
}
