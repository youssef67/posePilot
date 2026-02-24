import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Livraison } from '@/types/database'
import type { BesoinWithChantier } from '@/lib/queries/useAllPendingBesoins'

interface BesoinMontantEntry {
  besoinId: string
  montantUnitaire: number
  quantite: number
}

interface BulkTransformInput {
  besoins: BesoinWithChantier[]
  description: string
  fournisseur?: string
  montantTtc?: number | null
  besoinMontants?: BesoinMontantEntry[]
}

export function useBulkTransformBesoins() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ besoins, description, fournisseur, montantTtc, besoinMontants }: BulkTransformInput) => {
      const { data: { user } } = await supabase.auth.getUser()

      // Determine chantier_id: common if all same, null if multi-chantier
      const chantierIds = [...new Set(besoins.map((b) => b.chantier_id))]
      const chantierId = chantierIds.length === 1 ? chantierIds[0] : null

      // Calculate montant_ttc from line items if provided
      const computedMontantTtc = besoinMontants && besoinMontants.length > 0
        ? besoinMontants.reduce((sum, bm) => sum + bm.quantite * bm.montantUnitaire, 0)
        : montantTtc ?? null

      // 1. Créer UNE seule livraison
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

      // 2. Rattacher les besoins et mettre à jour montant_unitaire en un seul update par besoin
      const montantMap = new Map(
        (besoinMontants ?? []).map((bm) => [bm.besoinId, bm.montantUnitaire]),
      )

      for (const besoin of besoins) {
        const updatePayload: Record<string, unknown> = { livraison_id: livraisonId }
        const montant = montantMap.get(besoin.id)
        if (montant !== undefined) updatePayload.montant_unitaire = montant

        const { error } = await supabase
          .from('besoins')
          .update(updatePayload)
          .eq('id', besoin.id)
          .is('livraison_id', null)
        if (error) throw error
      }

      return livraison as unknown as Livraison
    },
    onSettled: (_data, _error, { besoins }) => {
      const chantierIds = [...new Set(besoins.map((b) => b.chantier_id))]

      queryClient.invalidateQueries({ queryKey: ['all-pending-besoins'] })
      queryClient.invalidateQueries({ queryKey: ['all-pending-besoins-count'] })
      queryClient.invalidateQueries({ queryKey: ['all-livraisons'] })
      queryClient.invalidateQueries({ queryKey: ['all-linked-besoins'] })

      for (const chantierId of chantierIds) {
        queryClient.invalidateQueries({ queryKey: ['besoins', chantierId] })
        queryClient.invalidateQueries({ queryKey: ['livraisons', chantierId] })
        queryClient.invalidateQueries({ queryKey: ['livraisons-count', chantierId] })
      }
    },
  })
}
