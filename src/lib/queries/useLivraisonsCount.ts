import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useLivraisonsCount(chantierId: string) {
  return useQuery({
    queryKey: ['livraisons-count', chantierId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('livraisons')
        .select('*', { count: 'exact', head: true })
        .eq('chantier_id', chantierId)

      if (error) throw error
      return count ?? 0
    },
    enabled: !!chantierId,
  })
}
