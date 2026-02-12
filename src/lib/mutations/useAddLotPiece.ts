import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useAddLotPiece() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ lotId, nom }: { lotId: string; nom: string }) => {
      const { data, error } = await supabase.rpc('add_piece_to_lot', {
        p_lot_id: lotId,
        p_piece_nom: nom,
      })
      if (error) throw error
      return data as string
    },
    onSettled: (_data, _err, { lotId }) => {
      queryClient.invalidateQueries({ queryKey: ['pieces', lotId] })
    },
  })
}
