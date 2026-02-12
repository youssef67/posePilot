import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Besoin } from '@/types/database'

export function useBesoins(chantierId: string) {
  return useQuery({
    queryKey: ['besoins', chantierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('besoins')
        .select('*')
        .eq('chantier_id', chantierId)
        .is('livraison_id', null)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as unknown as Besoin[]
    },
    enabled: !!chantierId,
  })
}
