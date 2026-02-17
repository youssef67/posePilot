import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface CreateNoteResponseInput {
  noteId: string
  content: string
}

export function useCreateNoteResponse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ noteId, content }: CreateNoteResponseInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { error } = await supabase
        .from('note_responses')
        .insert({
          note_id: noteId,
          content,
          created_by: user.id,
          created_by_email: user.email,
        })
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      toast.success('Réponse ajoutée')
      queryClient.invalidateQueries({ queryKey: ['note_responses', variables.noteId] })
    },
    onError: () => {
      toast.error("Erreur lors de l'ajout de la réponse")
    },
  })
}
