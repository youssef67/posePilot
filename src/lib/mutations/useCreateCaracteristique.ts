import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Caracteristique } from '@/types/database'

export function useCreateCaracteristique() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      chantierId,
      label,
      valeur,
      position,
    }: {
      chantierId: string
      label: string
      valeur: string
      position: number
    }) => {
      const { data, error } = await supabase
        .from('chantier_caracteristiques')
        .insert({
          chantier_id: chantierId,
          label: label.trim(),
          valeur: valeur.trim(),
          position,
        })
        .select('*')
        .single()
      if (error) throw error
      return data as unknown as Caracteristique
    },
    onMutate: async ({ chantierId, label, valeur, position }) => {
      await queryClient.cancelQueries({ queryKey: ['caracteristiques', chantierId] })
      const previous = queryClient.getQueryData(['caracteristiques', chantierId])
      queryClient.setQueryData(
        ['caracteristiques', chantierId],
        (old: Caracteristique[] | undefined) => [
          ...(old ?? []),
          {
            id: crypto.randomUUID(),
            chantier_id: chantierId,
            label: label.trim(),
            valeur: valeur.trim(),
            position,
            created_at: new Date().toISOString(),
          },
        ],
      )
      return { previous }
    },
    onError: (_err, { chantierId }, context) => {
      queryClient.setQueryData(['caracteristiques', chantierId], context?.previous)
    },
    onSettled: (_data, _error, { chantierId }) => {
      queryClient.invalidateQueries({ queryKey: ['caracteristiques', chantierId] })
    },
  })
}
