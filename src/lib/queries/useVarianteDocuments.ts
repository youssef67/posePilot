import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useVarianteDocuments(varianteId: string) {
  return useQuery({
    queryKey: ['variante-documents', varianteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('variante_documents')
        .select('*')
        .eq('variante_id', varianteId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!varianteId,
  })
}
