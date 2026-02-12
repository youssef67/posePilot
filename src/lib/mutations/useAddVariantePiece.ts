import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type VariantePieceRow = Database['public']['Tables']['variante_pieces']['Row']

export function useAddVariantePiece() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ varianteId, nom }: { varianteId: string; nom: string; plotId: string }) => {
      const { data, error } = await supabase
        .from('variante_pieces')
        .insert({ variante_id: varianteId, nom })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onMutate: async ({ varianteId, nom }) => {
      await queryClient.cancelQueries({ queryKey: ['variante-pieces', varianteId] })
      const previous = queryClient.getQueryData<VariantePieceRow[]>(['variante-pieces', varianteId])
      queryClient.setQueryData<VariantePieceRow[]>(
        ['variante-pieces', varianteId],
        (old) => [
          ...(old ?? []),
          {
            id: crypto.randomUUID(),
            variante_id: varianteId,
            nom,
            created_at: new Date().toISOString(),
          },
        ],
      )
      return { previous }
    },
    onError: (_err, { varianteId }, context) => {
      queryClient.setQueryData(['variante-pieces', varianteId], context?.previous)
    },
    onSettled: (_data, _err, { varianteId, plotId }) => {
      queryClient.invalidateQueries({ queryKey: ['variante-pieces', varianteId] })
      queryClient.invalidateQueries({ queryKey: ['variantes', plotId] })
    },
  })
}
