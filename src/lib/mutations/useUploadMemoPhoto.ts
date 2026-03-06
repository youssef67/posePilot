import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { compressPhoto } from '@/lib/utils/compressImage'
import { toast } from 'sonner'

interface UploadMemoPhotoInput {
  file: File
  memoId: string
  position: number
  entityType: 'chantier' | 'plot' | 'etage'
  entityId: string
  onProgress?: (percent: number) => void
}

export function useUploadMemoPhoto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ file, memoId, position, onProgress }: UploadMemoPhotoInput): Promise<string> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Phase 1: Compression (0-70%)
      const compressed = await compressPhoto(file, (p) => {
        onProgress?.(Math.round(p * 0.7))
      })

      // Phase 2: Upload to storage (70-90%)
      onProgress?.(70)
      const filePath = `${user.id}/memo_${memoId}_${Date.now()}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('note-photos')
        .upload(filePath, compressed, { contentType: 'image/jpeg' })
      if (uploadError) throw uploadError

      onProgress?.(90)

      const { data: urlData } = supabase.storage
        .from('note-photos')
        .getPublicUrl(filePath)

      const publicUrl = urlData.publicUrl

      // Phase 3: Insert into memo_photos (90-100%)
      const { error: insertError } = await supabase
        .from('memo_photos')
        .insert({ memo_id: memoId, photo_url: publicUrl, position })
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
    onError: () => {
      toast.error("Erreur lors de l'upload de la photo")
    },
    onSettled: (_data, _err, { entityType, entityId }) => {
      queryClient.invalidateQueries({ queryKey: ['memos', entityType, entityId] })
    },
  })
}
