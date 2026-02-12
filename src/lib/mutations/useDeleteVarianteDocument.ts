import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type VarianteDocumentRow = Database['public']['Tables']['variante_documents']['Row']

export function useDeleteVarianteDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ docId }: { docId: string; varianteId: string }) => {
      const { error } = await supabase
        .from('variante_documents')
        .delete()
        .eq('id', docId)
      if (error) throw error
      return { docId }
    },
    onMutate: async ({ docId, varianteId }) => {
      await queryClient.cancelQueries({ queryKey: ['variante-documents', varianteId] })
      const previous = queryClient.getQueryData<VarianteDocumentRow[]>(['variante-documents', varianteId])
      queryClient.setQueryData<VarianteDocumentRow[]>(
        ['variante-documents', varianteId],
        (old) => (old ?? []).filter((d) => d.id !== docId),
      )
      return { previous }
    },
    onError: (_err, { varianteId }, context) => {
      queryClient.setQueryData(['variante-documents', varianteId], context?.previous)
    },
    onSettled: (_data, _err, { varianteId }) => {
      queryClient.invalidateQueries({ queryKey: ['variante-documents', varianteId] })
    },
  })
}
