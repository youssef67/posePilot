import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Intervenant } from '@/types/database'

export function useIntervenants() {
  return useQuery({
    queryKey: ['intervenants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('intervenants')
        .select('*')
        .order('nom', { ascending: true })
      if (error) throw error
      return data as Intervenant[]
    },
    placeholderData: [],
  })
}
