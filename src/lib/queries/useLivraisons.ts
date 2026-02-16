import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Livraison } from '@/types/database'

export function useLivraisons(chantierId: string) {
  return useQuery({
    queryKey: ['livraisons', chantierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('livraisons')
        .select('*')
        .eq('chantier_id', chantierId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as unknown as Livraison[]
    },
    enabled: !!chantierId,
    placeholderData: [],
  })
}
