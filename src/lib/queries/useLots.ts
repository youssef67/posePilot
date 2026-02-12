import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type LotRow = Database['public']['Tables']['lots']['Row']

export type LotWithRelations = LotRow & {
  etages: { nom: string } | null
  variantes: { nom: string } | null
  pieces: { count: number }[]
  has_blocking_note: boolean
  has_missing_docs: boolean
}

export function useLots(plotId: string) {
  return useQuery({
    queryKey: ['lots', plotId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lots')
        .select('*, etages(nom), variantes(nom), pieces(count)')
        .eq('plot_id', plotId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as unknown as LotWithRelations[]
    },
    enabled: !!plotId,
  })
}
