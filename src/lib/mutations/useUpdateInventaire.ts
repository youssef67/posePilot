import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { InventaireWithLocation } from '@/lib/queries/useInventaire'

export function useUpdateInventaire() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      quantite,
    }: {
      id: string
      quantite: number
      chantierId: string
    }) => {
      const { data, error } = await supabase
        .from('inventaire')
        .update({ quantite })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onMutate: async ({ id, quantite, chantierId }) => {
      await queryClient.cancelQueries({ queryKey: ['inventaire', chantierId] })
      const previous = queryClient.getQueryData(['inventaire', chantierId])
      queryClient.setQueryData(
        ['inventaire', chantierId],
        (old: InventaireWithLocation[] | undefined) =>
          (old ?? []).map((item) =>
            item.id === id ? { ...item, quantite } : item,
          ),
      )
      return { previous }
    },
    onError: (_err, { chantierId }, context) => {
      queryClient.setQueryData(['inventaire', chantierId], context?.previous)
    },
    onSettled: (_data, _error, { chantierId }) => {
      queryClient.invalidateQueries({ queryKey: ['inventaire', chantierId] })
    },
  })
}
