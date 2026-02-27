import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { BadgeAssignment } from '@/lib/queries/useLotBadgeAssignments'
import type { LotBadge } from '@/types/database'

export function useAssignBadge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ lotId, badge }: { lotId: string; badge: LotBadge; plotId: string }) => {
      const { data, error } = await supabase
        .from('lot_badge_assignments')
        .insert({ lot_id: lotId, badge_id: badge.id })
        .select('*, lot_badges(*)')
        .single()
      if (error) throw error
      return data
    },
    onMutate: async ({ lotId, badge }) => {
      await queryClient.cancelQueries({ queryKey: ['lot-badge-assignments', { lotId }] })
      const previous = queryClient.getQueryData<BadgeAssignment[]>(['lot-badge-assignments', { lotId }])
      const optimistic: BadgeAssignment = {
        lot_id: lotId,
        badge_id: badge.id,
        created_at: new Date().toISOString(),
        lot_badges: badge,
      }
      queryClient.setQueryData<BadgeAssignment[]>(
        ['lot-badge-assignments', { lotId }],
        (old) => [...(old ?? []), optimistic],
      )
      return { previous }
    },
    onError: (_err, { lotId }, context) => {
      queryClient.setQueryData(['lot-badge-assignments', { lotId }], context?.previous)
    },
    onSettled: (_data, _err, { lotId, plotId }) => {
      queryClient.invalidateQueries({ queryKey: ['lot-badge-assignments', { lotId }] })
      queryClient.invalidateQueries({ queryKey: ['lots', plotId] })
      toast.success('Badge ajouté')
    },
  })
}
