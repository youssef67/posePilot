import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type VarianteDocumentRow = Database['public']['Tables']['variante_documents']['Row']

export function useAddVarianteDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ varianteId, nom }: { varianteId: string; nom: string }) => {
      const { data, error } = await supabase
        .from('variante_documents')
        .insert({ variante_id: varianteId, nom })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onMutate: async ({ varianteId, nom }) => {
      await queryClient.cancelQueries({ queryKey: ['variante-documents', varianteId] })
      const previous = queryClient.getQueryData<VarianteDocumentRow[]>(['variante-documents', varianteId])
      queryClient.setQueryData<VarianteDocumentRow[]>(
        ['variante-documents', varianteId],
        (old) => [
          ...(old ?? []),
          {
            id: crypto.randomUUID(),
            variante_id: varianteId,
            nom,
            is_required: false,
            created_at: new Date().toISOString(),
          },
        ],
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
