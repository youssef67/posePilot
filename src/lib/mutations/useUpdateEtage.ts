import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { EtageRow } from '@/lib/queries/useEtages'

interface UpdateEtageInput {
  etageId: string
  plotId: string
  nom: string
}

export function useUpdateEtage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ etageId, nom }: UpdateEtageInput) => {
      const { data, error } = await supabase
        .from('etages')
        .update({ nom })
        .eq('id', etageId)
        .select('*')
        .single()
      if (error) throw error
      return data
    },
    onMutate: async ({ etageId, plotId, nom }) => {
      await queryClient.cancelQueries({ queryKey: ['etages', plotId] })
      const previous = queryClient.getQueryData<EtageRow[]>(['etages', plotId])
      queryClient.setQueryData<EtageRow[]>(
        ['etages', plotId],
        (old) => (old ?? []).map((e) => (e.id === etageId ? { ...e, nom } : e)),
      )
      return { previous }
    },
    onError: (_err, { plotId }, context) => {
      queryClient.setQueryData(['etages', plotId], context?.previous)
    },
    onSettled: (_data, _err, { plotId }) => {
      queryClient.invalidateQueries({ queryKey: ['etages', plotId] })
      queryClient.invalidateQueries({ queryKey: ['lots', plotId] })
    },
  })
}
