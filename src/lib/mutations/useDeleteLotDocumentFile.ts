import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface DeleteLotDocumentFileInput {
  fileId: string
  fileUrl: string
  lotId: string
}

export function useDeleteLotDocumentFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ fileId, fileUrl }: DeleteLotDocumentFileInput) => {
      const { error } = await supabase
        .from('lot_document_files')
        .delete()
        .eq('id', fileId)
      if (error) throw error

      // Delete from storage (non-blocking)
      await supabase.storage.from('documents').remove([fileUrl]).catch(() => {})
    },
    onSuccess: () => {
      toast.success('Fichier supprimé')
    },
    onError: () => {
      toast.error('Erreur lors de la suppression')
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lot-documents', variables?.lotId] })
      queryClient.invalidateQueries({ queryKey: ['lots'] })
    },
  })
}
