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

interface UploadLotDocumentFileInput {
  file: File
  documentId: string
  lotId: string
}

export function useUploadLotDocumentFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ file, documentId, lotId }: UploadLotDocumentFileInput) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        throw new Error('Format non supporté. Utilisez un PDF ou une image (JPEG, PNG, HEIC).')
      }
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('Le fichier dépasse la taille maximale de 50 Mo')
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const ext = file.name.split('.').pop() || (file.type.startsWith('image/') ? 'jpg' : 'pdf')
      const filePath = `${user.id}/${lotId}/${documentId}_${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, { contentType: file.type })
      if (uploadError) throw uploadError

      const { error: insertError } = await supabase
        .from('lot_document_files')
        .insert({ lot_document_id: documentId, file_url: filePath, file_name: file.name })
      if (insertError) {
        await supabase.storage.from('documents').remove([filePath])
        throw insertError
      }

      return filePath
    },
    onSuccess: () => {
      toast.success('Fichier ajouté')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'upload")
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lot-documents', variables?.lotId] })
      queryClient.invalidateQueries({ queryKey: ['lots'] })
    },
  })
}
