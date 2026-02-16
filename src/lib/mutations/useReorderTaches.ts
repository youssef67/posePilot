import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { PieceWithTaches } from '@/lib/queries/usePieces'

export function useReorderTaches() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ tacheIds }: { tacheIds: string[]; lotId: string; pieceId: string }) => {
      const { error } = await supabase.rpc('reorder_taches', {
        p_tache_ids: tacheIds,
      } as never)
      if (error) throw error
    },
    onMutate: async ({ tacheIds, lotId, pieceId }) => {
      await queryClient.cancelQueries({ queryKey: ['pieces', lotId] })
      const previous = queryClient.getQueryData<PieceWithTaches[]>(['pieces', lotId])
      queryClient.setQueryData<PieceWithTaches[]>(
        ['pieces', lotId],
        (old) =>
          (old ?? []).map((piece) => {
            if (piece.id !== pieceId) return piece
            const tacheMap = new Map(piece.taches.map((t) => [t.id, t]))
            const reordered = tacheIds
              .map((id, index) => {
                const tache = tacheMap.get(id)
                return tache ? { ...tache, position: index } : null
              })
              .filter((t): t is NonNullable<typeof t> => t !== null)
            return { ...piece, taches: reordered }
          }),
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
