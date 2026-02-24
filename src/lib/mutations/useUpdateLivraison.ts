import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Livraison } from '@/types/database'

export interface BesoinMontantUpdate {
  besoinId: string
  montantUnitaire: number
  quantite: number
}

interface UpdateLivraisonInput {
  id: string
  chantierId: string | null
  description: string
  fournisseur: string | null
  datePrevue: string | null
  montantTtc: number | null
  besoinMontants?: BesoinMontantUpdate[]
}

export function useUpdateLivraison() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, description, fournisseur, datePrevue, montantTtc, besoinMontants }: UpdateLivraisonInput) => {
      // If besoinMontants provided, update each besoin and recalculate montant_ttc
      let finalMontantTtc = montantTtc
      if (besoinMontants && besoinMontants.length > 0) {
        finalMontantTtc = besoinMontants.reduce((sum, bm) => sum + bm.quantite * bm.montantUnitaire, 0)

        // Update each besoin's montant_unitaire
        for (const bm of besoinMontants) {
          const { error: besoinError } = await supabase
            .from('besoins')
            .update({ montant_unitaire: bm.montantUnitaire })
            .eq('id', bm.besoinId)
          if (besoinError) throw besoinError
        }
      }

      const { data, error } = await supabase
        .from('livraisons')
        .update({
          description,
          fournisseur: fournisseur || null,
          date_prevue: datePrevue || null,
          montant_ttc: finalMontantTtc,
        })
        .eq('id', id)
        .in('status', ['prevu', 'commande', 'livraison_prevue', 'a_recuperer'])
        .select()
        .single()
      if (error) throw error
      return data as unknown as Livraison
    },
    onMutate: async ({ id, chantierId, description, fournisseur, datePrevue, montantTtc, besoinMontants }) => {
      const finalMontantTtc = besoinMontants && besoinMontants.length > 0
        ? besoinMontants.reduce((sum, bm) => sum + bm.quantite * bm.montantUnitaire, 0)
        : montantTtc
      if (chantierId) {
        await queryClient.cancelQueries({ queryKey: ['livraisons', chantierId] })
        const previous = queryClient.getQueryData(['livraisons', chantierId])
        queryClient.setQueryData(
          ['livraisons', chantierId],
          (old: Livraison[] | undefined) =>
            (old ?? []).map((l) =>
              l.id === id
                ? { ...l, description, fournisseur: fournisseur || null, date_prevue: datePrevue || null, montant_ttc: finalMontantTtc }
                : l,
            ),
        )
        return { previous }
      }
      return { previous: undefined }
    },
    onError: (_err, { chantierId }, context) => {
      if (chantierId) {
        queryClient.setQueryData(['livraisons', chantierId], context?.previous)
      }
    },
    onSettled: (_data, _error, { chantierId }) => {
      if (chantierId) {
        queryClient.invalidateQueries({ queryKey: ['livraisons', chantierId] })
      }
      queryClient.invalidateQueries({ queryKey: ['all-livraisons'] })
      queryClient.invalidateQueries({ queryKey: ['all-linked-besoins'] })
      queryClient.invalidateQueries({ queryKey: ['all-besoins'] })
    },
  })
}
