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

interface ReplaceLivraisonDocumentInput {
  livraisonId: string
  chantierId: string
  file: File
  documentType: 'bc' | 'bl'
  oldFileUrl: string
  onProgress?: (percent: number) => void
}

export function useReplaceLivraisonDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ livraisonId, file, documentType, oldFileUrl, onProgress }: ReplaceLivraisonDocumentInput): Promise<{ filePath: string; fileName: string }> => {
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

      // Phase 1: Upload new file (0–60%)
      onProgress?.(0)
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, { contentType: file.type })
      if (uploadError) throw uploadError

      onProgress?.(60)

      // Phase 2: DB update with new path + name (60–80%)
      const urlCol = `${documentType}_file_url`
      const nameCol = `${documentType}_file_name`

      const { error: updateError } = await supabase
        .from('livraisons')
        .update({ [urlCol]: filePath, [nameCol]: file.name })
        .eq('id', livraisonId)

      if (updateError) {
        await supabase.storage.from('documents').remove([filePath])
        throw updateError
      }

      onProgress?.(80)

      // Phase 3: Delete old file (80–100%) — non-blocking
      await supabase.storage.from('documents').remove([oldFileUrl]).catch(() => {})

      onProgress?.(100)
      return { filePath, fileName: file.name }
    },
    onSuccess: (_data, variables) => {
      const label = variables.documentType === 'bc' ? 'BC' : 'BL'
      toast.success(`${label} remplacé`)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erreur lors du remplacement')
    },
    onSettled: (_data, _error, variables) => {
      if (variables) {
        queryClient.invalidateQueries({ queryKey: ['livraisons', variables.chantierId] })
        queryClient.invalidateQueries({ queryKey: ['livraisons-count', variables.chantierId] })
      }
    },
  })
}
