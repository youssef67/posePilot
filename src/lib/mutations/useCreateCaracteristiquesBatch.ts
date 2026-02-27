import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Caracteristique } from '@/types/database'

export function useCreateCaracteristiquesBatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      chantierId,
      items,
    }: {
      chantierId: string
      items: { label: string; valeur: string; position: number }[]
    }) => {
      const rows = items.map((item) => ({
        chantier_id: chantierId,
        label: item.label,
        valeur: item.valeur,
        position: item.position,
      }))
      const { data, error } = await supabase
        .from('chantier_caracteristiques')
        .insert(rows)
        .select('*')
      if (error) throw error
      return data as unknown as Caracteristique[]
    },
    onSettled: (_data, _error, { chantierId }) => {
      queryClient.invalidateQueries({ queryKey: ['caracteristiques', chantierId] })
    },
  })
}
