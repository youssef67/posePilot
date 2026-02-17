import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface UpdateNoteInput {
  noteId: string
  content: string
  isBlocking: boolean
}

export function useUpdateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ noteId, content, isBlocking }: UpdateNoteInput) => {
      const { error } = await supabase
        .from('notes')
        .update({ content, is_blocking: isBlocking } as Record<string, unknown>)
        .eq('id', noteId)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Note modifiée')
    },
    onError: () => {
      toast.error('Erreur lors de la modification de la note')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['lots'] })
    },
  })
}
