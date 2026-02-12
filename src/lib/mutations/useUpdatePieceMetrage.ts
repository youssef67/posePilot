import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { PieceWithTaches } from '@/lib/queries/usePieces'

interface UpdatePieceMetrageParams {
  pieceId: string
  lotId: string
  plotId: string
  chantierId: string
  metrage_m2: number | null
  metrage_ml: number | null
}

export function useUpdatePieceMetrage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ pieceId, metrage_m2, metrage_ml }: UpdatePieceMetrageParams) => {
      const { data, error } = await supabase
        .from('pieces')
        .update({ metrage_m2, metrage_ml })
        .eq('id', pieceId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onMutate: async ({ pieceId, lotId, metrage_m2, metrage_ml }) => {
      await queryClient.cancelQueries({ queryKey: ['pieces', lotId] })
      const previous = queryClient.getQueryData<PieceWithTaches[]>(['pieces', lotId])
      queryClient.setQueryData<PieceWithTaches[]>(
        ['pieces', lotId],
        (old) => (old ?? []).map((p) =>
          p.id === pieceId ? { ...p, metrage_m2, metrage_ml } : p,
        ),
      )
      return { previous }
    },
    onError: (_err, { lotId }, context) => {
      queryClient.setQueryData(['pieces', lotId], context?.previous)
      toast.error('Impossible de sauvegarder les métrés')
    },
    onSettled: (_data, _err, { lotId, plotId, chantierId }) => {
      queryClient.invalidateQueries({ queryKey: ['pieces', lotId] })
      queryClient.invalidateQueries({ queryKey: ['lots', plotId] })
      queryClient.invalidateQueries({ queryKey: ['plots', chantierId] })
    },
  })
}
