import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useVariantePieces(varianteId: string) {
  return useQuery({
    queryKey: ['variante-pieces', varianteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('variante_pieces')
        .select('*')
        .eq('variante_id', varianteId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!varianteId,
  })
}
