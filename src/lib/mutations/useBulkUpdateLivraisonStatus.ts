import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateLivraisonStatus } from '@/lib/mutations/useUpdateLivraisonStatus'

type NewStatus = 'commande' | 'livraison_prevue' | 'a_recuperer' | 'receptionne' | 'recupere'

interface BulkUpdateParams {
  livraisons: { id: string }[]
  chantierId: string
  newStatus: NewStatus
  datePrevue?: string
}

export interface BulkUpdateResult {
  succeeded: unknown[]
  failed: { id: string; error: Error }[]
}

export function useBulkUpdateLivraisonStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ livraisons, newStatus, datePrevue }: BulkUpdateParams): Promise<BulkUpdateResult> => {
      if (datePrevue && !/^\d{4}-\d{2}-\d{2}$/.test(datePrevue)) {
        throw new Error('datePrevue must be in YYYY-MM-DD format')
      }

      const settled = await Promise.allSettled(
        livraisons.map(({ id }) =>
          updateLivraisonStatus({ livraisonId: id, newStatus, datePrevue }),
        ),
      )

      const succeeded: unknown[] = []
      const failed: { id: string; error: Error }[] = []

      settled.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          succeeded.push(result.value)
        } else {
          failed.push({ id: livraisons[i].id, error: result.reason as Error })
        }
      })

      if (failed.length === livraisons.length) {
        throw new Error('Toutes les mises à jour ont échoué')
      }

      return { succeeded, failed }
    },
    onSettled: (_data, _error, { chantierId }) => {
      queryClient.invalidateQueries({ queryKey: ['livraisons', chantierId] })
      queryClient.invalidateQueries({ queryKey: ['livraisons-count', chantierId] })
      queryClient.invalidateQueries({ queryKey: ['all-livraisons'] })
    },
  })
}
