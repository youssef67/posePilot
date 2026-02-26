import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { DepotArticleWithCump } from '@/lib/queries/useDepotArticles'

// TODO: Race condition — les opérations SELECT→UPDATE→INSERT ne sont pas atomiques.
// Un appel RPC PostgreSQL serait préférable pour garantir la cohérence en cas d'accès concurrent.
export function useUpdateDepotArticleQuantite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ articleId, delta }: { articleId: string; delta: 1 | -1 }) => {
      const { data: { user } } = await supabase.auth.getUser()
      const createdBy = user?.id ?? null

      // Fetch current article
      const { data: article, error: fetchError } = await supabase
        .from('depot_articles')
        .select('*')
        .eq('id', articleId)
        .single()
      if (fetchError) throw fetchError

      const cump = article.quantite > 0 ? article.valeur_totale / article.quantite : 0
      const newQuantite = article.quantite + delta
      const newValeurTotale = article.valeur_totale + delta * cump

      // Update article
      const { error: updateError } = await supabase
        .from('depot_articles')
        .update({ quantite: newQuantite, valeur_totale: newValeurTotale })
        .eq('id', articleId)
        .select()
        .single()
      if (updateError) throw updateError

      // Create mouvement
      const { data: mouvement, error: mouvError } = await supabase
        .from('depot_mouvements')
        .insert({
          article_id: articleId,
          type: delta > 0 ? ('entree' as const) : ('sortie' as const),
          quantite: Math.abs(delta),
          prix_unitaire: cump,
          montant_total: Math.abs(delta) * cump,
          created_by: createdBy,
        })
        .select()
        .single()
      if (mouvError) throw mouvError

      return mouvement
    },
    onMutate: async ({ articleId, delta }) => {
      await queryClient.cancelQueries({ queryKey: ['depot-articles'] })
      const previous = queryClient.getQueryData<DepotArticleWithCump[]>(['depot-articles'])

      queryClient.setQueryData<DepotArticleWithCump[]>(
        ['depot-articles'],
        (old) =>
          (old ?? []).map((item) => {
            if (item.id !== articleId) return item
            const cump = item.quantite > 0 ? item.valeur_totale / item.quantite : 0
            const newQuantite = item.quantite + delta
            const newValeurTotale = item.valeur_totale + delta * cump
            return {
              ...item,
              quantite: newQuantite,
              valeur_totale: newValeurTotale,
              cump: newQuantite > 0 ? newValeurTotale / newQuantite : null,
            }
          }),
      )

      return { previous }
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(['depot-articles'], context?.previous)
    },
    onSettled: (_data, _error, { articleId }) => {
      queryClient.invalidateQueries({ queryKey: ['depot-articles'] })
      queryClient.invalidateQueries({ queryKey: ['depot-mouvements', articleId] })
    },
  })
}
