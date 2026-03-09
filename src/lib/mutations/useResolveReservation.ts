import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Reservation } from '@/types/database'

interface ResolveReservationInput {
  reservationId: string
  lotId: string
}

export function useResolveReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ reservationId }: ResolveReservationInput) => {
      const { data, error } = await supabase
        .from('reservations')
        .update({
          status: 'resolu' as const,
          resolved_at: new Date().toISOString(), // Client-side for now; trigger sets server-side
        })
        .eq('id', reservationId)
        .select('*, pieces(nom), reservation_photos(*)')
        .single()
      if (error) throw error
      return data as unknown as Reservation
    },
    onMutate: async (input) => {
      const queryKey = ['reservations', { lotId: input.lotId }]
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData(queryKey)
      queryClient.setQueryData(queryKey, (old: Reservation[] | undefined) =>
        (old ?? []).map((r) =>
          r.id === input.reservationId
            ? { ...r, status: 'resolu' as const, resolved_at: new Date().toISOString() }
            : r,
        ),
      )
      return { previous, queryKey }
    },
    onError: (_err, _input, context) => {
      if (context) queryClient.setQueryData(context.queryKey, context.previous)
      toast.error('Erreur lors de la résolution de la réserve')
    },
    onSuccess: () => {
      toast.success('Réserve résolue')
    },
    onSettled: (_data, _err, input) => {
      queryClient.invalidateQueries({ queryKey: ['reservations', { lotId: input.lotId }] })
      queryClient.invalidateQueries({ queryKey: ['lots'] })
    },
  })
}
