import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface ClearLotDocumentInput {
  documentId: string
  fileUrl: string
  lotId: string
}

export function useClearLotDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ documentId, fileUrl }: ClearLotDocumentInput) => {
      const { error } = await supabase
        .from('lot_documents')
        .update({ file_url: null, file_name: null } as Record<string, unknown>)
        .eq('id', documentId)
      if (error) throw error

      // Delete from storage (non-blocking)
      await supabase.storage.from('documents').remove([fileUrl]).catch(() => {})
    },
    onSuccess: () => {
      toast.success('Document supprimé')
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
