import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useRealtimeInventaire(chantierId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel(`inventaire:chantier_id=eq.${chantierId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inventaire', filter: `chantier_id=eq.${chantierId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['inventaire', chantierId] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [chantierId, queryClient])
}
