import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Livraison } from '@/types/database'
import { receptionnerLivraisonDepot, annulerReceptionDepot } from './useDepotReceptionLivraison'

const TERMINAL_STATUSES = ['livre', 'recupere', 'receptionne'] as const

export type LivraisonStatus = 'commande' | 'prevu' | 'livraison_prevue' | 'a_recuperer' | 'receptionne' | 'recupere' | 'livre'

export interface UpdateStatusParams {
  livraisonId: string
  chantierId?: string | null
  newStatus: LivraisonStatus
  previousStatus?: LivraisonStatus
  datePrevue?: string
  montantTtc?: number | null
}

export async function updateLivraisonStatus({ livraisonId, newStatus, previousStatus, datePrevue, montantTtc }: UpdateStatusParams) {
  if (datePrevue && !/^\d{4}-\d{2}-\d{2}$/.test(datePrevue)) {
    throw new Error('datePrevue must be in YYYY-MM-DD format')
  }

  const updateData: Record<string, unknown> = { status: newStatus }

  if (newStatus === 'prevu' && datePrevue) {
    updateData.date_prevue = datePrevue
  }
  if (montantTtc !== undefined) {
    updateData.montant_ttc = montantTtc
  }
  if (newStatus === 'livre') {
    updateData.date_prevue = new Date().toISOString().split('T')[0]
  }

  const { data, error } = await supabase
    .from('livraisons')
    .update(updateData)
    .eq('id', livraisonId)
    .select()
    .single()

  if (error) throw error

  const livraison = data as unknown as Livraison

  const wasTerminal = previousStatus && TERMINAL_STATUSES.includes(previousStatus as typeof TERMINAL_STATUSES[number])
  const isTerminal = TERMINAL_STATUSES.includes(newStatus as typeof TERMINAL_STATUSES[number])

  if (isTerminal && !wasTerminal) {
    // Forward: entering terminal status → receive depot stock (idempotent)
    await receptionnerLivraisonDepot(livraisonId)
  } else if (!isTerminal && wasTerminal) {
    // Backward: leaving terminal status → reverse depot stock
    await annulerReceptionDepot(livraisonId)
  }
  // Terminal → terminal (e.g. recupere ↔ livre): no depot change needed

  return livraison
}

export function useUpdateLivraisonStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateLivraisonStatus,
    onMutate: async ({ livraisonId, chantierId, newStatus, datePrevue, montantTtc }) => {
      const updater = (old: Livraison[] | undefined) =>
        (old ?? []).map((l) =>
          l.id === livraisonId
            ? {
                ...l,
                status: newStatus,
                date_prevue: newStatus === 'prevu' ? (datePrevue ?? l.date_prevue) :
                             newStatus === 'livre' ? new Date().toISOString().split('T')[0] :
                             l.date_prevue,
                ...(montantTtc !== undefined ? { montant_ttc: montantTtc } : {}),
              }
            : l,
        )

      // Optimistic update for chantier-specific list
      let previousChantier: unknown
      if (chantierId) {
        await queryClient.cancelQueries({ queryKey: ['livraisons', chantierId] })
        previousChantier = queryClient.getQueryData(['livraisons', chantierId])
        queryClient.setQueryData(['livraisons', chantierId], updater)
      }

      // Optimistic update for all-livraisons list (depot + global views)
      await queryClient.cancelQueries({ queryKey: ['all-livraisons'] })
      const previousAll = queryClient.getQueryData(['all-livraisons'])
      queryClient.setQueryData(['all-livraisons'], updater)

      return { previousChantier, previousAll, chantierId }
    },
    onError: (_err, _vars, context) => {
      if (context?.chantierId && context.previousChantier !== undefined) {
        queryClient.setQueryData(['livraisons', context.chantierId], context.previousChantier)
      }
      if (context?.previousAll !== undefined) {
        queryClient.setQueryData(['all-livraisons'], context.previousAll)
      }
    },
    onSettled: (_data, _error, { chantierId }) => {
      if (chantierId) {
        queryClient.invalidateQueries({ queryKey: ['livraisons', chantierId] })
        queryClient.invalidateQueries({ queryKey: ['livraisons-count', chantierId] })
      }
      queryClient.invalidateQueries({ queryKey: ['all-livraisons'] })
      queryClient.invalidateQueries({ queryKey: ['all-linked-besoins'] })
      queryClient.invalidateQueries({ queryKey: ['besoins'] })
      // Invalidate depot queries in case of depot reception
      queryClient.invalidateQueries({ queryKey: ['depot-articles'] })
      queryClient.invalidateQueries({ queryKey: ['depot-mouvements'] })
    },
  })
}
