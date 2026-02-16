import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useLotDocuments(lotId: string) {
  return useQuery({
    queryKey: ['lot-documents', lotId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lot_documents')
        .select('*')
        .eq('lot_id', lotId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!lotId,
    placeholderData: [],
  })
}
