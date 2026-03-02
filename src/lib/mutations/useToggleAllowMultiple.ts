import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type VarianteDocumentRow = Database['public']['Tables']['variante_documents']['Row']

export function useToggleAllowMultiple() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ docId, allowMultiple }: { docId: string; allowMultiple: boolean; varianteId: string }) => {
      const { error } = await supabase
        .from('variante_documents')
        .update({ allow_multiple: allowMultiple })
        .eq('id', docId)
      if (error) throw error
    },
    onMutate: async ({ docId, allowMultiple, varianteId }) => {
      await queryClient.cancelQueries({ queryKey: ['variante-documents', varianteId] })
      const previous = queryClient.getQueryData<VarianteDocumentRow[]>(['variante-documents', varianteId])
      queryClient.setQueryData<VarianteDocumentRow[]>(
        ['variante-documents', varianteId],
        (old) => old?.map((d) => (d.id === docId ? { ...d, allow_multiple: allowMultiple } : d)),
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
