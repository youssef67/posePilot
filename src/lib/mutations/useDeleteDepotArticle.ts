import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { DepotArticleWithCump } from '@/lib/queries/useDepotArticles'

export function useDeleteDepotArticle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase
        .from('depot_articles')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ['depot-articles'] })
      const previous = queryClient.getQueryData<DepotArticleWithCump[]>(['depot-articles'])

      queryClient.setQueryData<DepotArticleWithCump[]>(
        ['depot-articles'],
        (old) => (old ?? []).filter((item) => item.id !== id),
      )

      return { previous }
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(['depot-articles'], context?.previous)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['depot-articles'] })
    },
  })
}
