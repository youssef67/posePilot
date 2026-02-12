import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Livraison } from '@/types/database'

export function useCreateLivraison() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ chantierId, description }: { chantierId: string; description: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('livraisons')
        .insert({
          chantier_id: chantierId,
          description,
          status: 'commande' as const,
          created_by: user?.id ?? null,
        })
        .select()
        .single()
      if (error) throw error
      return data as unknown as Livraison
    },
    onMutate: async ({ chantierId, description }) => {
      await queryClient.cancelQueries({ queryKey: ['livraisons', chantierId] })
      const previous = queryClient.getQueryData(['livraisons', chantierId])
      queryClient.setQueryData(['livraisons', chantierId], (old: Livraison[] | undefined) => [
        {
          id: crypto.randomUUID(),
          chantier_id: chantierId,
          description,
          status: 'commande' as const,
          date_prevue: null,
          bc_file_url: null,
          bc_file_name: null,
          bl_file_url: null,
          bl_file_name: null,
          created_at: new Date().toISOString(),
          created_by: null,
        },
        ...(old ?? []),
      ])
      return { previous }
    },
    onError: (_err, { chantierId }, context) => {
      queryClient.setQueryData(['livraisons', chantierId], context?.previous)
    },
    onSettled: (_data, _error, { chantierId }) => {
      queryClient.invalidateQueries({ queryKey: ['livraisons', chantierId] })
      queryClient.invalidateQueries({ queryKey: ['livraisons-count', chantierId] })
    },
  })
}
