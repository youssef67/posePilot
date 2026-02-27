import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Caracteristique } from '@/types/database'

export function useUpdateCaracteristique() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      label,
      valeur,
    }: {
      id: string
      chantierId: string
      label?: string
      valeur?: string
    }) => {
      const updates: Record<string, string> = {}
      if (label !== undefined) updates.label = label.trim()
      if (valeur !== undefined) updates.valeur = valeur.trim()

      const { data, error } = await supabase
        .from('chantier_caracteristiques')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single()
      if (error) throw error
      return data as unknown as Caracteristique
    },
    onMutate: async ({ id, chantierId, label, valeur }) => {
      await queryClient.cancelQueries({ queryKey: ['caracteristiques', chantierId] })
      const previous = queryClient.getQueryData(['caracteristiques', chantierId])
      queryClient.setQueryData(
        ['caracteristiques', chantierId],
        (old: Caracteristique[] | undefined) =>
          (old ?? []).map((item) =>
            item.id === id
              ? {
                  ...item,
                  ...(label !== undefined ? { label: label.trim() } : {}),
                  ...(valeur !== undefined ? { valeur: valeur.trim() } : {}),
                }
              : item,
          ),
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
