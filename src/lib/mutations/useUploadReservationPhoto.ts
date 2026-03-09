import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { compressPhoto } from '@/lib/utils/compressImage'
import { toast } from 'sonner'

interface UploadReservationPhotoInput {
  file: File
  reservationId: string
  lotId: string
  position: number
  onProgress?: (percent: number) => void
}

export function useUploadReservationPhoto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ file, reservationId, position, onProgress }: UploadReservationPhotoInput): Promise<string> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Phase 1: Compression (0-70%)
      let compressed: File
      try {
        compressed = await compressPhoto(file, (p) => {
          onProgress?.(Math.round(p * 0.7))
        })
      } catch {
        throw new Error('Impossible de compresser la photo. Essayez avec une autre image.')
      }

      // Phase 2: Upload to storage (70-90%)
      onProgress?.(70)
      const filePath = `${user.id}/reservation_${reservationId}_${Date.now()}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('note-photos')
        .upload(filePath, compressed, { contentType: 'image/jpeg' })
      if (uploadError) throw uploadError

      onProgress?.(90)

      const { data: urlData } = supabase.storage
        .from('note-photos')
        .getPublicUrl(filePath)

      const publicUrl = urlData.publicUrl

      // Phase 3: Insert into reservation_photos (90-100%)
      const { error: insertError } = await supabase
        .from('reservation_photos')
        .insert({ reservation_id: reservationId, photo_url: publicUrl, position })
      if (insertError) {
        await supabase.storage.from('note-photos').remove([filePath])
        throw insertError
      }

      onProgress?.(100)
      return publicUrl
    },
    onSuccess: () => {
      toast.success('Photo ajoutée')
    },
    onError: (_err) => {
      const message = _err instanceof Error ? _err.message : "Erreur lors de l'upload de la photo"
      toast.error(message)
    },
    onSettled: (_data, _err, { lotId }) => {
      queryClient.invalidateQueries({ queryKey: ['reservations', { lotId }] })
    },
  })
}
