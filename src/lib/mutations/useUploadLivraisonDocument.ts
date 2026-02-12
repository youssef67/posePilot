import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

const ACCEPTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/heic',
]
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

interface UploadLivraisonDocumentInput {
  livraisonId: string
  chantierId: string
  file: File
  documentType: 'bc' | 'bl'
  onProgress?: (percent: number) => void
}

export function useUploadLivraisonDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ livraisonId, file, documentType, onProgress }: UploadLivraisonDocumentInput): Promise<{ filePath: string; fileName: string }> => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        throw new Error('Format non supporté. Utilisez un PDF ou une image (JPEG, PNG, HEIC).')
      }
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('Fichier trop volumineux (max 50 Mo)')
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const ext = file.name.split('.').pop() || (file.type.startsWith('image/') ? 'jpg' : 'pdf')
      const filePath = `${user.id}/${livraisonId}/${documentType}_${Date.now()}.${ext}`

      // Phase 1: Upload to storage (0–80%)
      onProgress?.(10)
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, { contentType: file.type })
      if (uploadError) throw uploadError

      onProgress?.(80)

      // Phase 2: DB update (80–100%)
      const urlCol = `${documentType}_file_url`
      const nameCol = `${documentType}_file_name`

      const { error: updateError } = await supabase
        .from('livraisons')
        .update({ [urlCol]: filePath, [nameCol]: file.name })
        .eq('id', livraisonId)

      if (updateError) {
        // Cleanup orphan file
        await supabase.storage.from('documents').remove([filePath])
        throw updateError
      }

      onProgress?.(100)
      return { filePath, fileName: file.name }
    },
    onSuccess: (_data, variables) => {
      const label = variables.documentType === 'bc' ? 'BC' : 'BL'
      toast.success(`${label} uploadé`)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'upload")
    },
    onSettled: (_data, _error, variables) => {
      if (variables) {
        queryClient.invalidateQueries({ queryKey: ['livraisons', variables.chantierId] })
        queryClient.invalidateQueries({ queryKey: ['livraisons-count', variables.chantierId] })
      }
    },
  })
}
