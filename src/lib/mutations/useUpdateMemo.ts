import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface UpdateMemoInput {
  memoId: string
  content: string
  entityType: 'chantier' | 'etage'
  entityId: string
}

export function useUpdateMemo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ memoId, content }: UpdateMemoInput) => {
      const { data, error } = await supabase
        .from('memos')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', memoId)
        .select('*')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast.success('Mémo modifié')
    },
    onError: () => {
      toast.error('Erreur lors de la modification du mémo')
    },
    onSettled: (_data, _err, { entityType, entityId }) => {
      queryClient.invalidateQueries({ queryKey: ['memos', entityType, entityId] })
      if (entityType === 'etage') {
        queryClient.invalidateQueries({ queryKey: ['memos', 'plot-etages'] })
      }
      queryClient.invalidateQueries({ queryKey: ['context-memos'] })
    },
  })
}
