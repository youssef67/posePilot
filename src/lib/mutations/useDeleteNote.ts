import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface DeleteNoteInput {
  noteId: string
  photoUrl: string | null
}

function extractStoragePath(photoUrl: string): string {
  const marker = 'note-photos/'
  const idx = photoUrl.indexOf(marker)
  return photoUrl.substring(idx + marker.length)
}

export function useDeleteNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ noteId, photoUrl }: DeleteNoteInput) => {
      // Delete photo from storage first (non-blocking if it fails)
      if (photoUrl) {
        const filePath = extractStoragePath(photoUrl)
        await supabase.storage.from('note-photos').remove([filePath]).catch(() => {})
      }

      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Note supprimée')
    },
    onError: () => {
      toast.error('Erreur lors de la suppression de la note')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['lots'] })
    },
  })
}
