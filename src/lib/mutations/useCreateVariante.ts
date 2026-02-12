import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { VarianteWithPieceCount } from '@/lib/queries/useVariantes'

export function useCreateVariante() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ plotId, nom }: { plotId: string; nom: string }) => {
      const { data, error } = await supabase
        .from('variantes')
        .insert({ plot_id: plotId, nom })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onMutate: async ({ plotId, nom }) => {
      await queryClient.cancelQueries({ queryKey: ['variantes', plotId] })
      const previous = queryClient.getQueryData<VarianteWithPieceCount[]>(['variantes', plotId])
      queryClient.setQueryData<VarianteWithPieceCount[]>(
        ['variantes', plotId],
        (old) => [
          ...(old ?? []),
          {
            id: crypto.randomUUID(),
            plot_id: plotId,
            nom,
            created_at: new Date().toISOString(),
            variante_pieces: [{ count: 0 }],
          },
        ],
      )
      return { previous }
    },
    onError: (_err, { plotId }, context) => {
      queryClient.setQueryData(['variantes', plotId], context?.previous)
    },
    onSettled: (_data, _err, { plotId }) => {
      queryClient.invalidateQueries({ queryKey: ['variantes', plotId] })
    },
  })
}
