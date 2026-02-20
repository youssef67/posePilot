import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Livraison, StatusHistoryEntry } from '@/types/database'
import type { BesoinWithChantier } from '@/lib/queries/useAllPendingBesoins'

interface BulkTransformInput {
  besoins: BesoinWithChantier[]
}

export interface BulkTransformResult {
  succeeded: Livraison[]
  failedCount: number
}

export function useBulkTransformBesoins() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ besoins }: BulkTransformInput) => {
      const { data: { user } } = await supabase.auth.getUser()

      const results = await Promise.allSettled(
        besoins.map(async (besoin) => {
          const initialHistory: StatusHistoryEntry[] = [{ status: 'prevu', date: new Date().toISOString() }]

          // 1. Créer la livraison
          const { data: livraison, error: livraisonError } = await supabase
            .from('livraisons')
            .insert({
              chantier_id: besoin.chantier_id,
              description: besoin.description,
              status: 'prevu' as const,
              retrait: false,
              status_history: initialHistory as unknown as Record<string, unknown>,
              created_by: user?.id ?? null,
            })
            .select()
            .single()
          if (livraisonError) throw livraisonError

          // 2. Lier le besoin à la livraison
          const { error: besoinError } = await supabase
            .from('besoins')
            .update({ livraison_id: (livraison as unknown as Livraison).id })
            .eq('id', besoin.id)
          if (besoinError) throw besoinError

          return livraison as unknown as Livraison
        }),
      )

      const succeeded = results
        .filter((r): r is PromiseFulfilledResult<Livraison> => r.status === 'fulfilled')
        .map((r) => r.value)
      const failedCount = results.filter((r) => r.status === 'rejected').length

      if (failedCount > 0 && succeeded.length === 0) {
        throw new Error(`Échec de la transformation des ${failedCount} besoin(s)`)
      }

      return { succeeded, failedCount } as BulkTransformResult
    },
    onSettled: (_data, _error, { besoins }) => {
      // Collect unique chantier IDs
      const chantierIds = [...new Set(besoins.map((b) => b.chantier_id))]

      queryClient.invalidateQueries({ queryKey: ['all-pending-besoins'] })
      queryClient.invalidateQueries({ queryKey: ['all-pending-besoins-count'] })
      queryClient.invalidateQueries({ queryKey: ['all-livraisons'] })

      for (const chantierId of chantierIds) {
        queryClient.invalidateQueries({ queryKey: ['besoins', chantierId] })
        queryClient.invalidateQueries({ queryKey: ['livraisons', chantierId] })
        queryClient.invalidateQueries({ queryKey: ['livraisons-count', chantierId] })
      }
    },
  })
}
