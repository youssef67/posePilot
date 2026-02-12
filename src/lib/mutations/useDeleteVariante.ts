import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { VarianteWithPieceCount } from '@/lib/queries/useVariantes'

export function useDeleteVariante() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ varianteId, plotId }: { varianteId: string; plotId: string }) => {
      const { error } = await supabase
        .from('variantes')
        .delete()
        .eq('id', varianteId)
      if (error) throw error
      return { varianteId, plotId }
    },
    onMutate: async ({ varianteId, plotId }) => {
      await queryClient.cancelQueries({ queryKey: ['variantes', plotId] })
      const previous = queryClient.getQueryData<VarianteWithPieceCount[]>(['variantes', plotId])
      queryClient.setQueryData<VarianteWithPieceCount[]>(
        ['variantes', plotId],
        (old) => (old ?? []).filter((v) => v.id !== varianteId),
      )
      return { previous, plotId }
    },
    onError: (err, _vars, context) => {
      if (context) {
        queryClient.setQueryData(['variantes', context.plotId], context.previous)
      }
      const pgError = err as { code?: string }
      if (pgError.code === '23503') {
        toast.error('Impossible de supprimer cette variante — des lots l\'utilisent.')
      }
    },
    onSettled: (_data, _err, { varianteId, plotId }) => {
      queryClient.invalidateQueries({ queryKey: ['variantes', plotId] })
      queryClient.removeQueries({ queryKey: ['variante-pieces', varianteId] })
    },
  })
}
