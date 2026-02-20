import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Livraison, StatusHistoryEntry } from '@/types/database'

interface MergeLivraisonsParams {
  childIds: string[]
  chantierId: string
  description: string
  newStatus: 'commande' | 'livraison_prevue' | 'a_recuperer' | 'receptionne' | 'recupere'
  datePrevue?: string
}

export function useMergeLivraisons() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ childIds, chantierId, description, newStatus, datePrevue }: MergeLivraisonsParams) => {
      const { data: { user } } = await supabase.auth.getUser()
      const initialHistory: StatusHistoryEntry[] = [{ status: newStatus, date: new Date().toISOString() }]

      // Step 1: Create parent livraison
      const { data: parent, error: insertError } = await supabase
        .from('livraisons')
        .insert({
          chantier_id: chantierId,
          description,
          status: newStatus,
          status_history: initialHistory as unknown as Record<string, unknown>,
          date_prevue: datePrevue ?? null,
          created_by: user?.id ?? null,
        })
        .select()
        .single()
      if (insertError) throw insertError

      // Step 2: Attach children to parent
      const { error: updateError } = await supabase
        .from('livraisons')
        .update({ parent_id: (parent as unknown as Livraison).id })
        .in('id', childIds)
      if (updateError) throw updateError

      return parent as unknown as Livraison
    },
    onSettled: (_data, _error, { chantierId }) => {
      queryClient.invalidateQueries({ queryKey: ['livraisons', chantierId] })
      queryClient.invalidateQueries({ queryKey: ['livraisons-count', chantierId] })
      queryClient.invalidateQueries({ queryKey: ['all-livraisons'] })
    },
  })
}
