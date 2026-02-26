import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type VariantePieceRow = Database['public']['Tables']['variante_pieces']['Row']

export function useUpdateVariantePieceTasks() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      pieceId,
      taskOverrides,
    }: {
      pieceId: string
      taskOverrides: string[] | null
      varianteId: string
    }) => {
      const { data, error } = await supabase
        .from('variante_pieces')
        .update({ task_overrides: taskOverrides })
        .eq('id', pieceId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onMutate: async ({ pieceId, taskOverrides, varianteId }) => {
      await queryClient.cancelQueries({ queryKey: ['variante-pieces', varianteId] })
      const previous = queryClient.getQueryData<VariantePieceRow[]>(['variante-pieces', varianteId])
      queryClient.setQueryData<VariantePieceRow[]>(
        ['variante-pieces', varianteId],
        (old) =>
          old?.map((p) =>
            p.id === pieceId ? { ...p, task_overrides: taskOverrides } : p,
          ),
      )
      return { previous }
    },
    onError: (_err, { varianteId }, context) => {
      queryClient.setQueryData(['variante-pieces', varianteId], context?.previous)
    },
    onSettled: (_data, _err, { varianteId }) => {
      queryClient.invalidateQueries({ queryKey: ['variante-pieces', varianteId] })
    },
  })
}
