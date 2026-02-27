import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { BadgeAssignment } from '@/lib/queries/useLotBadgeAssignments'

export function useUnassignBadge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ lotId, badgeId }: { lotId: string; badgeId: string; plotId: string }) => {
      const { error } = await supabase
        .from('lot_badge_assignments')
        .delete()
        .eq('lot_id', lotId)
        .eq('badge_id', badgeId)
      if (error) throw error
    },
    onMutate: async ({ lotId, badgeId }) => {
      await queryClient.cancelQueries({ queryKey: ['lot-badge-assignments', { lotId }] })
      const previous = queryClient.getQueryData<BadgeAssignment[]>(['lot-badge-assignments', { lotId }])
      queryClient.setQueryData<BadgeAssignment[]>(
        ['lot-badge-assignments', { lotId }],
        (old) => (old ?? []).filter((a) => a.badge_id !== badgeId),
      )
      return { previous }
    },
    onError: (_err, { lotId }, context) => {
      queryClient.setQueryData(['lot-badge-assignments', { lotId }], context?.previous)
    },
    onSettled: (_data, _err, { lotId, plotId }) => {
      queryClient.invalidateQueries({ queryKey: ['lot-badge-assignments', { lotId }] })
      queryClient.invalidateQueries({ queryKey: ['lots', plotId] })
      toast.success('Badge retiré')
    },
  })
}
