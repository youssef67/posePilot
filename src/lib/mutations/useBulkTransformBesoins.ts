import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Livraison } from '@/types/database'
import type { BesoinWithChantier } from '@/lib/queries/useAllPendingBesoins'

interface BulkTransformInput {
  besoins: BesoinWithChantier[]
  description: string
  fournisseur?: string
  montantTtc?: number | null
}

export function useBulkTransformBesoins() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ besoins, description, fournisseur, montantTtc }: BulkTransformInput) => {
      const { data: { user } } = await supabase.auth.getUser()

      // 1. Créer UNE seule livraison (chantier_id null = multi-chantier)
      const { data: livraison, error: livraisonError } = await supabase
        .from('livraisons')
        .insert({
          chantier_id: null,
          description,
          fournisseur: fournisseur || null,
          montant_ttc: montantTtc ?? null,
          status: 'commande' as const,
          created_by: user?.id ?? null,
        })
        .select()
        .single()
      if (livraisonError) throw livraisonError

      // 2. Rattacher TOUS les besoins en batch
      const besoinIds = besoins.map((b) => b.id)
      const { error: besoinsError } = await supabase
        .from('besoins')
        .update({ livraison_id: (livraison as unknown as Livraison).id })
        .in('id', besoinIds)
        .is('livraison_id', null)
      if (besoinsError) throw besoinsError

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
