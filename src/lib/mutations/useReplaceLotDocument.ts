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

interface ReplaceLotDocumentInput {
  file: File
  documentId: string
  lotId: string
  oldFileUrl: string
  onProgress?: (percent: number) => void
}

export function useReplaceLotDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ file, documentId, lotId, oldFileUrl, onProgress }: ReplaceLotDocumentInput): Promise<string> => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        throw new Error('Format non supporté. Utilisez un PDF ou une image (JPEG, PNG, HEIC).')
      }
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('Le fichier dépasse la taille maximale de 50 Mo')
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Phase 1: Upload new file (0–60%)
      onProgress?.(0)
      const ext = file.name.split('.').pop() || (file.type.startsWith('image/') ? 'jpg' : 'pdf')
      const filePath = `${user.id}/${lotId}/${documentId}_${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, { contentType: file.type })
      if (uploadError) throw uploadError

      onProgress?.(60)

      // Phase 2: Update lot_documents with new file_url + file_name (60–80%)
      const { error: updateError } = await supabase
        .from('lot_documents')
        .update({ file_url: filePath, file_name: file.name } as Record<string, unknown>)
        .eq('id', documentId)
      if (updateError) {
        await supabase.storage.from('documents').remove([filePath])
        throw updateError
      }

      onProgress?.(80)

      // Phase 3: Delete old file (80–100%) — non-blocking
      await supabase.storage.from('documents').remove([oldFileUrl]).catch(() => {})

      onProgress?.(100)
      return filePath
    },
    onSuccess: () => {
      toast.success('Document remplacé')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erreur lors du remplacement')
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lot-documents', variables?.lotId] })
      queryClient.invalidateQueries({ queryKey: ['lots'] })
    },
  })
}
