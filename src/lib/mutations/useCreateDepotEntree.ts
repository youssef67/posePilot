import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { DepotArticleWithCump } from '@/lib/queries/useDepotArticles'

type CreateDepotEntreeNewArticle = {
  designation: string
  quantite: number
  prixUnitaire: number
  unite?: string
}

type CreateDepotEntreeExistingArticle = {
  articleId: string
  quantite: number
  prixUnitaire: number
}

type CreateDepotEntreeInput = CreateDepotEntreeNewArticle | CreateDepotEntreeExistingArticle

function isExistingArticle(input: CreateDepotEntreeInput): input is CreateDepotEntreeExistingArticle {
  return 'articleId' in input
}

// TODO: Race condition — les opérations SELECT→UPDATE→INSERT ne sont pas atomiques.
// Un appel RPC PostgreSQL serait préférable pour garantir la cohérence en cas d'accès concurrent.
export function useCreateDepotEntree() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateDepotEntreeInput) => {
      if (input.quantite <= 0) throw new Error('La quantité doit être supérieure à 0')
      if (input.prixUnitaire < 0) throw new Error('Le prix unitaire ne peut pas être négatif')
      if (!isExistingArticle(input) && input.designation.trim() === '') {
        throw new Error('La désignation ne peut pas être vide')
      }

      const { data: { user } } = await supabase.auth.getUser()
      const createdBy = user?.id ?? null
      const montantTotal = input.quantite * input.prixUnitaire

      let articleId: string

      if (isExistingArticle(input)) {
        // Fetch current article state
        const { data: existing, error: fetchError } = await supabase
          .from('depot_articles')
          .select('*')
          .eq('id', input.articleId)
          .single()
        if (fetchError) throw fetchError

        const newQuantite = existing.quantite + input.quantite
        const newValeurTotale = existing.valeur_totale + montantTotal

        const { error: updateError } = await supabase
          .from('depot_articles')
          .update({ quantite: newQuantite, valeur_totale: newValeurTotale })
          .eq('id', input.articleId)
          .select()
          .single()
        if (updateError) throw updateError

        articleId = input.articleId
      } else {
        // Create new article
        const { data: newArticle, error: insertError } = await supabase
          .from('depot_articles')
          .insert({
            designation: input.designation.trim(),
            quantite: input.quantite,
            valeur_totale: montantTotal,
            unite: input.unite ?? null,
            created_by: createdBy,
          })
          .select()
          .single()
        if (insertError) throw insertError
        articleId = newArticle.id
      }

      // Create mouvement
      const { data: mouvement, error: mouvError } = await supabase
        .from('depot_mouvements')
        .insert({
          article_id: articleId,
          type: 'entree' as const,
          quantite: input.quantite,
          prix_unitaire: input.prixUnitaire,
          montant_total: montantTotal,
          created_by: createdBy,
        })
        .select()
        .single()
      if (mouvError) throw mouvError

      return mouvement
    },
    onMutate: async (input) => {
      if (!isExistingArticle(input)) return { previous: undefined }

      await queryClient.cancelQueries({ queryKey: ['depot-articles'] })
      const previous = queryClient.getQueryData<DepotArticleWithCump[]>(['depot-articles'])

      queryClient.setQueryData<DepotArticleWithCump[]>(
        ['depot-articles'],
        (old) =>
          (old ?? []).map((item) => {
            if (item.id !== input.articleId) return item
            const newQuantite = item.quantite + input.quantite
            const newValeurTotale = item.valeur_totale + input.quantite * input.prixUnitaire
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
      if (context?.previous) {
        queryClient.setQueryData(['depot-articles'], context.previous)
      }
    },
    onSettled: (_data, _error, input) => {
      queryClient.invalidateQueries({ queryKey: ['depot-articles'] })
      const articleId = isExistingArticle(input) ? input.articleId : _data?.article_id
      if (articleId) {
        queryClient.invalidateQueries({ queryKey: ['depot-mouvements', articleId] })
      }
    },
  })
}
