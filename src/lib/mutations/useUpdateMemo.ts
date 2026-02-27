import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export function useUpdateMemo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ memoId, content }: { memoId: string; content: string; chantierId: string }) => {
      const { data, error } = await supabase
        .from('chantier_memos')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', memoId)
        .select('*')
        .single()
      if (error) throw error
      return data
    },
    onSettled: (_data, _err, { chantierId }) => {
      queryClient.invalidateQueries({ queryKey: ['chantier-memos', { chantierId }] })
      toast.success('Mémo modifié')
    },
  })
}
