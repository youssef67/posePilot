import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export function useUpdateBadge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      badgeId,
      nom,
      couleur,
    }: {
      badgeId: string
      nom?: string
      couleur?: string
      chantierId: string
    }) => {
      const updates: Record<string, string> = {}
      if (nom !== undefined) updates.nom = nom
      if (couleur !== undefined) updates.couleur = couleur

      const { data, error } = await supabase
        .from('lot_badges')
        .update(updates)
        .eq('id', badgeId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSettled: (_data, _err, { chantierId }) => {
      queryClient.invalidateQueries({ queryKey: ['lot-badges', { chantierId }] })
      queryClient.invalidateQueries({ queryKey: ['lot-badge-assignments'] })
      queryClient.invalidateQueries({ queryKey: ['lots'] })
      toast.success('Badge modifié')
    },
  })
}
