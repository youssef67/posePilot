import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Besoin, Livraison } from '@/types/database'

interface BesoinMontant {
  besoinId: string
  montantUnitaire: number
  quantite: number
}

interface CreateGroupedLivraisonInput {
  chantierId: string
  besoinIds: string[]
  description: string
  fournisseur?: string
  montantTtc?: number | null
  besoinMontants?: BesoinMontant[]
}

export function useCreateGroupedLivraison() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ chantierId, besoinIds, description, fournisseur, montantTtc, besoinMontants }: CreateGroupedLivraisonInput) => {
      const { data: { user } } = await supabase.auth.getUser()

      // Calculate montant_ttc from line items if provided
      const computedMontantTtc = besoinMontants && besoinMontants.length > 0
        ? besoinMontants.reduce((sum, bm) => sum + bm.quantite * bm.montantUnitaire, 0)
        : montantTtc ?? null

      // Etape 1 : creer la livraison
      const { data: livraison, error: livraisonError } = await supabase
        .from('livraisons')
        .insert({
          chantier_id: chantierId,
          description,
          fournisseur: fournisseur || null,
          montant_ttc: computedMontantTtc,
          status: 'commande' as const,
          created_by: user?.id ?? null,
        })
        .select()
        .single()
      if (livraisonError) throw livraisonError

      const livraisonId = (livraison as unknown as Livraison).id

      // Etape 2 : rattacher les besoins et mettre à jour montant_unitaire en un seul update par besoin
      const montantMap = new Map(
        (besoinMontants ?? []).map((bm) => [bm.besoinId, bm.montantUnitaire]),
      )

      for (const besoinId of besoinIds) {
        const updatePayload: Record<string, unknown> = { livraison_id: livraisonId }
        const montant = montantMap.get(besoinId)
        if (montant !== undefined) updatePayload.montant_unitaire = montant

        const { error } = await supabase
          .from('besoins')
          .update(updatePayload)
          .eq('id', besoinId)
          .is('livraison_id', null)
        if (error) throw error
      }

      return livraison as unknown as Livraison
    },
    onMutate: async ({ chantierId, besoinIds }) => {
      await queryClient.cancelQueries({ queryKey: ['besoins', chantierId] })
      const previousBesoins = queryClient.getQueryData(['besoins', chantierId])
      queryClient.setQueryData(
        ['besoins', chantierId],
        (old: Besoin[] | undefined) =>
          (old ?? []).filter((b) => !besoinIds.includes(b.id)),
      )
      return { previousBesoins }
    },
    onError: (_err, { chantierId }, context) => {
      queryClient.setQueryData(['besoins', chantierId], context?.previousBesoins)
    },
    onSettled: (_data, _error, { chantierId }) => {
      queryClient.invalidateQueries({ queryKey: ['besoins', chantierId] })
      queryClient.invalidateQueries({ queryKey: ['livraisons', chantierId] })
      queryClient.invalidateQueries({ queryKey: ['livraisons-count', chantierId] })
      queryClient.invalidateQueries({ queryKey: ['all-pending-besoins-count'] })
      queryClient.invalidateQueries({ queryKey: ['all-livraisons'] })
      queryClient.invalidateQueries({ queryKey: ['all-besoins', chantierId] })
      queryClient.invalidateQueries({ queryKey: ['all-linked-besoins'] })
    },
  })
}
