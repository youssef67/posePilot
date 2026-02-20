import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Livraison } from '@/types/database'

interface UpdateStatusParams {
  livraisonId: string
  chantierId: string
  newStatus: 'prevu' | 'livre'
  datePrevue?: string
  montantTtc?: number | null
}

export function useUpdateLivraisonStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ livraisonId, newStatus, datePrevue, montantTtc }: UpdateStatusParams) => {
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
        // MVP shortcut: date_prevue stores the delivery confirmation date.
        // The original planned date is overwritten. A future migration could
        // add a dedicated date_livree column to preserve both dates.
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
    },
    onMutate: async ({ livraisonId, chantierId, newStatus, datePrevue, montantTtc }) => {
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
    },
    onError: (_err, _vars, context) => {
      if (context?.chantierId) {
        queryClient.setQueryData(['livraisons', context.chantierId], context.previous)
      }
    },
    onSettled: (_data, _error, { chantierId }) => {
      queryClient.invalidateQueries({ queryKey: ['livraisons', chantierId] })
      queryClient.invalidateQueries({ queryKey: ['livraisons-count', chantierId] })
      queryClient.invalidateQueries({ queryKey: ['all-livraisons'] })
    },
  })
}
