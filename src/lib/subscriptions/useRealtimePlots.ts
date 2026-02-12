import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useRealtimePlots(chantierId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel(`plots-changes-${chantierId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'plots' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['plots', chantierId] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [chantierId, queryClient])
}
