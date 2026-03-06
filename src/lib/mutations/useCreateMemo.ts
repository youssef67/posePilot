import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface CreateMemoInput {
  chantierId?: string
  etageId?: string
  content: string
  createdByEmail: string
}

export function useCreateMemo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ chantierId, etageId, content, createdByEmail }: CreateMemoInput) => {
      const { data, error } = await supabase
        .from('memos')
        .insert({
          chantier_id: chantierId ?? null,
          etage_id: etageId ?? null,
          content,
          created_by_email: createdByEmail,
        })
        .select('*')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast.success('Mémo ajouté')
    },
    onError: () => {
      toast.error('Erreur lors de la création du mémo')
    },
    onSettled: (_data, _err, { chantierId, etageId }) => {
      if (chantierId) {
        queryClient.invalidateQueries({ queryKey: ['memos', 'chantier', chantierId] })
        queryClient.invalidateQueries({ queryKey: ['chantiers'] })
        queryClient.invalidateQueries({ queryKey: ['chantiers', chantierId] })
      }
      if (etageId) {
        queryClient.invalidateQueries({ queryKey: ['memos', 'etage', etageId] })
        queryClient.invalidateQueries({ queryKey: ['memos', 'plot-etages'] })
        queryClient.invalidateQueries({ queryKey: ['etages'] })
      }
      queryClient.invalidateQueries({ queryKey: ['context-memos'] })
    },
  })
}
