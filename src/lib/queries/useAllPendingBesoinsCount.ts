import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useAllPendingBesoinsCount() {
  return useQuery({
    queryKey: ['all-pending-besoins-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('besoins')
        .select('*', { count: 'exact', head: true })
        .is('livraison_id', null)

      if (error) throw error
      return count ?? 0
    },
    placeholderData: 0,
  })
}
