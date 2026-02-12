import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type VariantePieceRow = Database['public']['Tables']['variante_pieces']['Row']

export function useDeleteVariantePiece() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ pieceId, varianteId }: { pieceId: string; varianteId: string; plotId: string }) => {
      const { error } = await supabase
        .from('variante_pieces')
        .delete()
        .eq('id', pieceId)
      if (error) throw error
      return { pieceId, varianteId }
    },
    onMutate: async ({ pieceId, varianteId }) => {
      await queryClient.cancelQueries({ queryKey: ['variante-pieces', varianteId] })
      const previous = queryClient.getQueryData<VariantePieceRow[]>(['variante-pieces', varianteId])
      queryClient.setQueryData<VariantePieceRow[]>(
        ['variante-pieces', varianteId],
        (old) => (old ?? []).filter((p) => p.id !== pieceId),
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
