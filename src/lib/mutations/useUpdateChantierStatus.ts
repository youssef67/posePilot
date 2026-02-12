import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type ChantierStatus = Database['public']['Enums']['chantier_status']

interface UpdateStatusParams {
  chantierId: string
  status: ChantierStatus
}

export function useUpdateChantierStatus() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async ({ chantierId, status }: UpdateStatusParams) => {
      const { data, error } = await supabase
        .from('chantiers')
        .update({ status })
        .eq('id', chantierId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onMutate: async ({ chantierId }) => {
      await queryClient.cancelQueries({ queryKey: ['chantiers'] })
      const previousQueries = queryClient.getQueriesData({ queryKey: ['chantiers'] })
      queryClient.setQueriesData(
        { queryKey: ['chantiers'] },
        (old: unknown[] | undefined) =>
          old?.filter((c: unknown) => (c as { id: string }).id !== chantierId) ?? []
      )
      return { previousQueries }
    },
    onError: (_err, _vars, context) => {
      context?.previousQueries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })
    },
    onSuccess: () => {
      navigate({ to: '/' })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['chantiers'] })
    },
  })
}
