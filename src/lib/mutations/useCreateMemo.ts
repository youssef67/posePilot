import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export function useCreateMemo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ chantierId, content, createdByEmail }: { chantierId: string; content: string; createdByEmail: string }) => {
      const { data, error } = await supabase
        .from('chantier_memos')
        .insert({ chantier_id: chantierId, content, created_by_email: createdByEmail })
        .select('*')
        .single()
      if (error) throw error
      return data
    },
    onSettled: (_data, _err, { chantierId }) => {
      queryClient.invalidateQueries({ queryKey: ['chantier-memos', { chantierId }] })
      queryClient.invalidateQueries({ queryKey: ['chantiers'] })
      queryClient.invalidateQueries({ queryKey: ['chantiers', chantierId] })
      toast.success('Mémo ajouté')
    },
  })
}
