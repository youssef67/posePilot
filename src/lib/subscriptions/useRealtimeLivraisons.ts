import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useRealtimeLivraisons(chantierId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel(`livraisons:chantier_id=eq.${chantierId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'livraisons', filter: `chantier_id=eq.${chantierId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['livraisons', chantierId] })
          queryClient.invalidateQueries({ queryKey: ['livraisons-count', chantierId] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [chantierId, queryClient])
}
