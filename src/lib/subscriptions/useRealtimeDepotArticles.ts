import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useRealtimeDepotArticles() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('depot_articles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'depot_articles' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['depot-articles'] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])
}
