import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { compressPhoto } from '@/lib/utils/compressImage'
import { toast } from 'sonner'
import type { Reservation } from '@/types/database'

interface CreateReservationInput {
  lotId: string
  pieceId: string
  pieceName: string
  description: string
  photo?: File
}

export function useCreateReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ lotId, pieceId, description, photo }: CreateReservationInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const reservationId = crypto.randomUUID()
      let photoUrl: string | null = null

      if (photo) {
        const compressed = await compressPhoto(photo)
        const filePath = `reservations/${lotId}/${reservationId}.jpg`
        const { error: uploadError } = await supabase.storage
          .from('note-photos')
          .upload(filePath, compressed, { contentType: 'image/jpeg' })
        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('note-photos')
          .getPublicUrl(filePath)
        photoUrl = urlData.publicUrl
      }

      const { data, error } = await supabase
        .from('reservations')
        .insert({
          id: reservationId,
          lot_id: lotId,
          piece_id: pieceId,
          description,
          photo_url: photoUrl,
          status: 'ouvert' as const,
          created_by: user.id,
          created_by_email: user.email,
        })
        .select('*, pieces(nom)')
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
          photo_url: null,
          status: 'ouvert' as const,
          resolved_at: null,
          created_by: '',
          created_by_email: 'vous',
          created_at: new Date().toISOString(),
          pieces: { nom: input.pieceName },
        } satisfies Reservation,
        ...(old ?? []),
      ])
      return { previous, queryKey }
    },
    onError: (_err, _input, context) => {
      if (context) queryClient.setQueryData(context.queryKey, context.previous)
      toast.error('Erreur lors de la création de la réserve')
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
