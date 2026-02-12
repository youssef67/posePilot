import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type VarianteDocumentRow = Database['public']['Tables']['variante_documents']['Row']

export function useToggleDocumentRequired() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ docId, isRequired }: { docId: string; isRequired: boolean; varianteId: string }) => {
      const { data, error } = await supabase
        .from('variante_documents')
        .update({ is_required: isRequired })
        .eq('id', docId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onMutate: async ({ docId, isRequired, varianteId }) => {
      await queryClient.cancelQueries({ queryKey: ['variante-documents', varianteId] })
      const previous = queryClient.getQueryData<VarianteDocumentRow[]>(['variante-documents', varianteId])
      queryClient.setQueryData<VarianteDocumentRow[]>(
        ['variante-documents', varianteId],
        (old) =>
          (old ?? []).map((doc) =>
            doc.id === docId ? { ...doc, is_required: isRequired } : doc,
          ),
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
