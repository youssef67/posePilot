import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Reservation } from '@/types/database'

interface CreateReservationInput {
  lotId: string
  pieceId: string
  pieceName: string
  description: string
}

export function useCreateReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ lotId, pieceId, description }: CreateReservationInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error } = await supabase
        .from('reservations')
        .insert({
          lot_id: lotId,
          piece_id: pieceId,
          description,
          status: 'ouvert' as const,
          created_by: user.id,
          created_by_email: user.email,
        })
        .select('*, pieces(nom), reservation_photos(*)')
        .single()
      if (error) throw error
      return data as unknown as Reservation
    },
    onMutate: async (input) => {
      const queryKey = ['reservations', { lotId: input.lotId }]
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData(queryKey)
      queryClient.setQueryData(queryKey, (old: Reservation[] | undefined) => [
        {
          id: crypto.randomUUID(),
          lot_id: input.lotId,
          piece_id: input.pieceId,
          description: input.description,
          status: 'ouvert' as const,
          resolved_at: null,
          created_by: '',
          created_by_email: 'vous',
          created_at: new Date().toISOString(),
          pieces: { nom: input.pieceName },
          reservation_photos: [],
        } satisfies Reservation,
        ...(old ?? []),
      ])
      return { previous, queryKey }
    },
    onError: (_err, _input, context) => {
      if (context) queryClient.setQueryData(context.queryKey, context.previous)
      const message = _err instanceof Error ? _err.message : 'Erreur lors de la création de la réserve'
      toast.error(message)
    },
    onSuccess: () => {
      toast.success('Réserve créée')
    },
    onSettled: (_data, _err, input) => {
      queryClient.invalidateQueries({ queryKey: ['reservations', { lotId: input.lotId }] })
      queryClient.invalidateQueries({ queryKey: ['lots'] })
    },
  })
}
