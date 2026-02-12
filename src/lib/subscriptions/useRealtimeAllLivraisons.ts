import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useRealtimeAllLivraisons() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('livraisons:global')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'livraisons' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['all-livraisons'] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])
}
