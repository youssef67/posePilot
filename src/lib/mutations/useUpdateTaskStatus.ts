import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { TaskStatus } from '@/types/enums'
import type { PieceWithTaches } from '@/lib/queries/usePieces'

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ tacheId, status }: { tacheId: string; status: TaskStatus; lotId: string }) => {
      const { data, error } = await supabase
        .from('taches')
        .update({ status })
        .eq('id', tacheId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onMutate: async ({ tacheId, status, lotId }) => {
      await queryClient.cancelQueries({ queryKey: ['pieces', lotId] })
      const previous = queryClient.getQueryData<PieceWithTaches[]>(['pieces', lotId])
      queryClient.setQueryData<PieceWithTaches[]>(
        ['pieces', lotId],
        (old) =>
          (old ?? []).map((piece) => ({
            ...piece,
            taches: piece.taches.map((t) =>
              t.id === tacheId ? { ...t, status } : t,
            ),
          })),
      )
      return { previous }
    },
    onError: (_err, { lotId }, context) => {
      queryClient.setQueryData(['pieces', lotId], context?.previous)
      toast.error('Impossible de mettre à jour le statut')
    },
    onSettled: (_data, _err, { lotId }) => {
      queryClient.invalidateQueries({ queryKey: ['pieces', lotId] })
    },
  })
}
