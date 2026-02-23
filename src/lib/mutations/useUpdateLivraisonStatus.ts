import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Livraison } from '@/types/database'

export interface UpdateStatusParams {
  livraisonId: string
  chantierId?: string | null
  newStatus: 'commande' | 'prevu' | 'livraison_prevue' | 'a_recuperer' | 'receptionne' | 'recupere' | 'livre'
  datePrevue?: string
  montantTtc?: number | null
}

export async function updateLivraisonStatus({ livraisonId, newStatus, datePrevue, montantTtc }: UpdateStatusParams) {
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
  return data as unknown as Livraison
}

export function useUpdateLivraisonStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateLivraisonStatus,
    onMutate: async ({ livraisonId, chantierId, newStatus, datePrevue, montantTtc }) => {
      if (chantierId) {
        await queryClient.cancelQueries({ queryKey: ['livraisons', chantierId] })
        const previous = queryClient.getQueryData(['livraisons', chantierId])
        queryClient.setQueryData(
          ['livraisons', chantierId],
          (old: Livraison[] | undefined) =>
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
            ),
        )
        return { previous, chantierId }
      }
      return { previous: undefined, chantierId }
    },
    onError: (_err, _vars, context) => {
      if (context?.chantierId) {
        queryClient.setQueryData(['livraisons', context.chantierId], context.previous)
      }
    },
    onSettled: (_data, _error, { chantierId }) => {
      if (chantierId) {
        queryClient.invalidateQueries({ queryKey: ['livraisons', chantierId] })
        queryClient.invalidateQueries({ queryKey: ['livraisons-count', chantierId] })
      }
      queryClient.invalidateQueries({ queryKey: ['all-livraisons'] })
    },
  })
}
