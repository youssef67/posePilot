import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type ChantierInsert = Database['public']['Tables']['chantiers']['Insert']

export function useCreateChantier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newChantier: Pick<ChantierInsert, 'nom' | 'type'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('chantiers')
        .insert({
          nom: newChantier.nom,
          type: newChantier.type,
          created_by: user?.id ?? null,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onMutate: async (newChantier) => {
      await queryClient.cancelQueries({ queryKey: ['chantiers'] })
      const previous = queryClient.getQueryData(['chantiers', { status: 'active' }])
      queryClient.setQueryData(['chantiers', { status: 'active' }], (old: unknown[] | undefined) => [
        {
          id: crypto.randomUUID(),
          nom: newChantier.nom,
          type: newChantier.type,
          status: 'active' as const,
          progress_done: 0,
          progress_total: 0,
          created_at: new Date().toISOString(),
          created_by: null,
        },
        ...(old ?? []),
      ])
      return { previous }
    },
    onError: (_err, _newChantier, context) => {
      queryClient.setQueryData(['chantiers', { status: 'active' }], context?.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['chantiers'] })
    },
  })
}
