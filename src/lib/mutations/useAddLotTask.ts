import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { PieceWithTaches } from '@/lib/queries/usePieces'

export function useAddLotTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ pieceId, nom }: { pieceId: string; nom: string; lotId: string }) => {
      const { data, error } = await supabase
        .from('taches')
        .insert({ piece_id: pieceId, nom, status: 'not_started' })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onMutate: async ({ pieceId, nom, lotId }) => {
      await queryClient.cancelQueries({ queryKey: ['pieces', lotId] })
      const previous = queryClient.getQueryData<PieceWithTaches[]>(['pieces', lotId])
      queryClient.setQueryData<PieceWithTaches[]>(
        ['pieces', lotId],
        (old) =>
          (old ?? []).map((piece) =>
            piece.id === pieceId
              ? {
                  ...piece,
                  taches: [
                    ...piece.taches,
                    {
                      id: crypto.randomUUID(),
                      piece_id: pieceId,
                      nom,
                      status: 'not_started' as const,
                      created_at: new Date().toISOString(),
                    },
                  ],
                }
              : piece,
          ),
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
