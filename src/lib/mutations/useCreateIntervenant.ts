import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Intervenant } from '@/types/database'

export function useCreateIntervenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (nom: string) => {
      const { data, error } = await supabase
        .from('intervenants')
        .insert({ nom })
        .select()
        .single()
      if (error) throw error
      return data as Intervenant
    },
    onMutate: async (nom) => {
      await queryClient.cancelQueries({ queryKey: ['intervenants'] })
      const previous = queryClient.getQueryData<Intervenant[]>(['intervenants'])
      queryClient.setQueryData<Intervenant[]>(['intervenants'], (old) => [
        ...(old ?? []),
        { id: `temp-${Date.now()}`, nom, created_by: '', created_at: new Date().toISOString() },
      ])
      return { previous }
    },
    onError: (_err, _nom, context) => {
      queryClient.setQueryData(['intervenants'], context?.previous)
      toast.error("Impossible de créer l'intervenant")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['intervenants'] })
    },
  })
}
