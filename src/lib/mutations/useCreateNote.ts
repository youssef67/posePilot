import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Note } from '@/types/database'

interface CreateNoteInput {
  content: string
  isBlocking: boolean
  lotId?: string
  pieceId?: string
}

export function useCreateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ content, isBlocking, lotId, pieceId }: CreateNoteInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')
      const { data, error } = await supabase
        .from('notes')
        .insert({
          content,
          is_blocking: isBlocking,
          lot_id: lotId ?? null,
          piece_id: pieceId ?? null,
          created_by: user.id,
          created_by_email: user.email,
        })
        .select()
        .single()
      if (error) throw error
      return data as unknown as Note
    },
    onMutate: async (newNote) => {
      const queryKey = newNote.lotId
        ? ['notes', { lotId: newNote.lotId, pieceId: undefined }]
        : ['notes', { lotId: undefined, pieceId: newNote.pieceId }]
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData(queryKey)
      queryClient.setQueryData(queryKey, (old: Note[] | undefined) => [
        {
          id: crypto.randomUUID(),
          content: newNote.content,
          is_blocking: newNote.isBlocking,
          lot_id: newNote.lotId ?? null,
          piece_id: newNote.pieceId ?? null,
          created_by: '',
          created_by_email: 'vous',
          photo_url: null,
          created_at: new Date().toISOString(),
        } satisfies Note,
        ...(old ?? []),
      ])
      return { previous, queryKey }
    },
    onError: (_err, _newNote, context) => {
      if (context) queryClient.setQueryData(context.queryKey, context.previous)
      toast.error('Erreur lors de la création de la note')
    },
    onSuccess: () => {
      toast.success('Note créée')
    },
    onSettled: (_data, _err, newNote) => {
      const queryKey = newNote.lotId
        ? ['notes', { lotId: newNote.lotId, pieceId: undefined }]
        : ['notes', { lotId: undefined, pieceId: newNote.pieceId }]
      queryClient.invalidateQueries({ queryKey })
      queryClient.invalidateQueries({ queryKey: ['lots'] })
    },
  })
}
