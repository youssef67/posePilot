import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Besoin } from '@/types/database'

export function useCreateBesoin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ chantierId, description }: { chantierId: string; description: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('besoins')
        .insert({
          chantier_id: chantierId,
          description,
          created_by: user?.id ?? null,
        })
        .select()
        .single()
      if (error) throw error
      return data as unknown as Besoin
    },
    onMutate: async ({ chantierId, description }) => {
      await queryClient.cancelQueries({ queryKey: ['besoins', chantierId] })
      const previous = queryClient.getQueryData(['besoins', chantierId])
      queryClient.setQueryData(['besoins', chantierId], (old: Besoin[] | undefined) => [
        {
          id: crypto.randomUUID(),
          chantier_id: chantierId,
          description,
          livraison_id: null,
          created_at: new Date().toISOString(),
          created_by: null,
        },
        ...(old ?? []),
      ])
      return { previous }
    },
    onError: (_err, { chantierId }, context) => {
      queryClient.setQueryData(['besoins', chantierId], context?.previous)
    },
    onSettled: (_data, _error, { chantierId }) => {
      queryClient.invalidateQueries({ queryKey: ['besoins', chantierId] })
      queryClient.invalidateQueries({ queryKey: ['all-pending-besoins'] })
      queryClient.invalidateQueries({ queryKey: ['all-pending-besoins-count'] })
    },
  })
}
