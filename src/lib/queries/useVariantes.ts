import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type VarianteRow = Database['public']['Tables']['variantes']['Row']

export type VarianteWithPieceCount = VarianteRow & {
  variante_pieces: [{ count: number }]
}

export function useVariantes(plotId: string) {
  return useQuery({
    queryKey: ['variantes', plotId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('variantes')
        .select('*, variante_pieces(count)')
        .eq('plot_id', plotId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as unknown as VarianteWithPieceCount[]
    },
    enabled: !!plotId,
    placeholderData: [],
  })
}
