import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export function useCreateAndAssignBadge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      chantierId,
      nom,
      couleur,
      lotId,
    }: {
      chantierId: string
      nom: string
      couleur: string
      lotId: string
      plotId: string
    }) => {
      // 1. Create the badge
      const { data: badge, error: badgeError } = await supabase
        .from('lot_badges')
        .insert({ chantier_id: chantierId, nom, couleur })
        .select()
        .single()
      if (badgeError) throw badgeError

      // 2. Assign it to the lot
      const { error: assignError } = await supabase
        .from('lot_badge_assignments')
        .insert({ lot_id: lotId, badge_id: badge.id })
      if (assignError) throw assignError

      return badge
    },
    onSettled: (_data, _err, { chantierId, lotId, plotId }) => {
      queryClient.invalidateQueries({ queryKey: ['lot-badges', { chantierId }] })
      queryClient.invalidateQueries({ queryKey: ['lot-badge-assignments', { lotId }] })
      queryClient.invalidateQueries({ queryKey: ['lots', plotId] })
      toast.success('Badge créé et ajouté')
    },
  })
}
