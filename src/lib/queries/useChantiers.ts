import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type ChantierStatus = Database['public']['Enums']['chantier_status']

export function useChantiers(status: ChantierStatus = 'active') {
  return useQuery({
    queryKey: ['chantiers', { status }],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chantiers')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}
