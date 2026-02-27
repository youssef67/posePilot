import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Caracteristique } from '@/types/database'

export function useCaracteristiques(chantierId: string) {
  return useQuery({
    queryKey: ['caracteristiques', chantierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chantier_caracteristiques')
        .select('*')
        .eq('chantier_id', chantierId)
        .order('position', { ascending: true })
        .order('created_at', { ascending: true })

      if (error) throw error
      return data as unknown as Caracteristique[]
    },
    enabled: !!chantierId,
    placeholderData: [],
  })
}
