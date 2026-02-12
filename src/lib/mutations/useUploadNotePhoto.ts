import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { compressPhoto } from '@/lib/utils/compressImage'
import { toast } from 'sonner'

interface UploadNotePhotoInput {
  file: File
  noteId: string
  onProgress?: (percent: number) => void
}

export function useUploadNotePhoto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ file, noteId, onProgress }: UploadNotePhotoInput): Promise<string> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Phase 1: Compression (0–70%)
      const compressed = await compressPhoto(file, (p) => {
        onProgress?.(Math.round(p * 0.7))
      })

      // Phase 2: Upload to storage (70–90%)
      onProgress?.(70)
      const filePath = `${user.id}/${noteId}_${Date.now()}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('note-photos')
        .upload(filePath, compressed, { contentType: 'image/jpeg' })
      if (uploadError) throw uploadError

      onProgress?.(90)

      const { data: urlData } = supabase.storage
        .from('note-photos')
        .getPublicUrl(filePath)

      const publicUrl = urlData.publicUrl

      // Phase 3: Update note record (90–100%)
      const { error: updateError } = await supabase
        .from('notes')
        .update({ photo_url: publicUrl } as Record<string, unknown>)
        .eq('id', noteId)
      if (updateError) {
        // Cleanup orphan photo from storage on DB update failure
        await supabase.storage.from('note-photos').remove([filePath])
        throw updateError
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
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })
}
