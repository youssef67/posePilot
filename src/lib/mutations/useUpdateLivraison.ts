import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Livraison } from '@/types/database'

interface UpdateLivraisonInput {
  id: string
  chantierId: string
  description: string
  fournisseur: string | null
  datePrevue: string | null
  montantTtc: number | null
}

export function useUpdateLivraison() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, description, fournisseur, datePrevue, montantTtc }: UpdateLivraisonInput) => {
      const { data, error } = await supabase
        .from('livraisons')
        .update({
          description,
          fournisseur: fournisseur || null,
          date_prevue: datePrevue || null,
          montant_ttc: montantTtc,
        })
        .eq('id', id)
        .in('status', ['prevu', 'commande', 'livraison_prevue', 'a_recuperer'])
        .select()
        .single()
      if (error) throw error
      return data as unknown as Livraison
    },
    onMutate: async ({ id, chantierId, description, fournisseur, datePrevue, montantTtc }) => {
      await queryClient.cancelQueries({ queryKey: ['livraisons', chantierId] })
      const previous = queryClient.getQueryData(['livraisons', chantierId])
      queryClient.setQueryData(
        ['livraisons', chantierId],
        (old: Livraison[] | undefined) =>
          (old ?? []).map((l) =>
            l.id === id
              ? { ...l, description, fournisseur: fournisseur || null, date_prevue: datePrevue || null, montant_ttc: montantTtc }
              : l,
          ),
      )
      return { previous }
    },
    onError: (_err, { chantierId }, context) => {
      queryClient.setQueryData(['livraisons', chantierId], context?.previous)
    },
    onSettled: (_data, _error, { chantierId }) => {
      queryClient.invalidateQueries({ queryKey: ['livraisons', chantierId] })
      queryClient.invalidateQueries({ queryKey: ['all-livraisons'] })
    },
  })
}
