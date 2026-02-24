import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Besoin } from '@/types/database'

interface UpdateBesoinInput {
  id: string
  chantierId: string
  description: string
  quantite?: number
}

export function useUpdateBesoin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, description, quantite }: UpdateBesoinInput) => {
      const updates: Record<string, unknown> = { description }
      if (quantite !== undefined) updates.quantite = quantite
      const { data, error } = await supabase
        .from('besoins')
        .update(updates)
        .eq('id', id)
        .is('livraison_id', null)
        .select()
        .single()
      if (error) throw error
      return data as unknown as Besoin
    },
    onMutate: async ({ id, chantierId, description, quantite }) => {
      await queryClient.cancelQueries({ queryKey: ['besoins', chantierId] })
      const previous = queryClient.getQueryData(['besoins', chantierId])
      queryClient.setQueryData(
        ['besoins', chantierId],
        (old: Besoin[] | undefined) =>
          (old ?? []).map((b) =>
            b.id === id
              ? { ...b, description, ...(quantite !== undefined ? { quantite } : {}) }
              : b,
          ),
      )
      return { previous }
    },
    onError: (_err, { chantierId }, context) => {
      queryClient.setQueryData(['besoins', chantierId], context?.previous)
    },
    onSettled: (_data, _error, { chantierId }) => {
      queryClient.invalidateQueries({ queryKey: ['besoins', chantierId] })
      queryClient.invalidateQueries({ queryKey: ['all-pending-besoins'] })
    },
  })
}
