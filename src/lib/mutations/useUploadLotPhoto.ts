import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { compressPhoto } from '@/lib/utils/compressImage'
import { toast } from 'sonner'

interface UploadLotPhotoInput {
  file: File
  lotId: string
  onProgress?: (percent: number) => void
}

export function useUploadLotPhoto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ file, lotId, onProgress }: UploadLotPhotoInput): Promise<string> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Phase 1: Compression (0–70%)
      const compressed = await compressPhoto(file, (p) => {
        onProgress?.(Math.round(p * 0.7))
      })

      // Phase 2: Upload to storage (70–90%)
      onProgress?.(70)
      const photoId = crypto.randomUUID()
      const filePath = `${user.id}/lot_${photoId}_${Date.now()}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('note-photos')
        .upload(filePath, compressed, { contentType: 'image/jpeg' })
      if (uploadError) throw uploadError

      onProgress?.(90)

      const { data: urlData } = supabase.storage
        .from('note-photos')
        .getPublicUrl(filePath)

      const publicUrl = urlData.publicUrl

      // Phase 3: Insert lot_photos row (90–100%)
      const { error: insertError } = await supabase
        .from('lot_photos')
        .insert({ lot_id: lotId, photo_url: publicUrl } as Record<string, unknown>)
      if (insertError) {
        // Cleanup orphan photo from storage on DB insert failure
        await supabase.storage.from('note-photos').remove([filePath])
        throw insertError
      }

      onProgress?.(100)
      return publicUrl
    },
    onSuccess: () => {
      toast.success('Photo ajoutée')
    },
    onError: () => {
      toast.error("Erreur lors de l'upload de la photo")
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lot-photos', variables.lotId] })
    },
  })
}
