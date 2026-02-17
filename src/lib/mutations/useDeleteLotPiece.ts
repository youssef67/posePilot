import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { PieceWithTaches } from '@/lib/queries/usePieces'

export function useDeleteLotPiece() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ pieceId }: { pieceId: string; lotId: string }) => {
      const { error } = await supabase
        .from('pieces')
        .delete()
        .eq('id', pieceId)
      if (error) throw error
      return { pieceId }
    },
    onMutate: async ({ pieceId, lotId }) => {
      await queryClient.cancelQueries({ queryKey: ['pieces', lotId] })
      const previous = queryClient.getQueryData<PieceWithTaches[]>(['pieces', lotId])
      queryClient.setQueryData<PieceWithTaches[]>(
        ['pieces', lotId],
        (old) => (old ?? []).filter((p) => p.id !== pieceId),
      )
      return { previous }
    },
    onError: (_err, { lotId }, context) => {
      queryClient.setQueryData(['pieces', lotId], context?.previous)
    },
    onSettled: (_data, _err, { lotId }) => {
      queryClient.invalidateQueries({ queryKey: ['pieces', lotId] })
    },
  })
}
