import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Database } from '@/types/database'

type LotDocumentRow = Database['public']['Tables']['lot_documents']['Row']

interface ToggleLotDocumentRequiredInput {
  docId: string
  isRequired: boolean
  lotId: string
}

export function useToggleLotDocumentRequired() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ docId, isRequired }: ToggleLotDocumentRequiredInput) => {
      const { data, error } = await supabase
        .from('lot_documents')
        .update({ is_required: isRequired } as Record<string, unknown>)
        .eq('id', docId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onMutate: async ({ docId, isRequired, lotId }) => {
      await queryClient.cancelQueries({ queryKey: ['lot-documents', lotId] })
      const previous = queryClient.getQueryData(['lot-documents', lotId])
      queryClient.setQueryData(['lot-documents', lotId], (old: LotDocumentRow[] | undefined) =>
        old?.map((d) =>
          d.id === docId ? { ...d, is_required: isRequired } : d,
        ),
      )
      return { previous, lotId }
    },
    onError: (error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['lot-documents', context.lotId], context.previous)
      }
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la modification')
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lot-documents', variables.lotId] })
    },
  })
}
