import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type LotDocumentRow = Database['public']['Tables']['lot_documents']['Row']

export function useAddLotDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ lotId, nom }: { lotId: string; nom: string }) => {
      const { data, error } = await supabase
        .from('lot_documents')
        .insert({ lot_id: lotId, nom, is_required: false })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onMutate: async ({ lotId, nom }) => {
      await queryClient.cancelQueries({ queryKey: ['lot-documents', lotId] })
      const previous = queryClient.getQueryData<LotDocumentRow[]>(['lot-documents', lotId])
      queryClient.setQueryData<LotDocumentRow[]>(
        ['lot-documents', lotId],
        (old) => [
          ...(old ?? []),
          {
            id: crypto.randomUUID(),
            lot_id: lotId,
            nom,
            is_required: false,
            file_url: null,
            file_name: null,
            created_at: new Date().toISOString(),
          },
        ],
      )
      return { previous }
    },
    onError: (_err, { lotId }, context) => {
      queryClient.setQueryData(['lot-documents', lotId], context?.previous)
    },
    onSettled: (_data, _err, { lotId }) => {
      queryClient.invalidateQueries({ queryKey: ['lot-documents', lotId] })
    },
  })
}
