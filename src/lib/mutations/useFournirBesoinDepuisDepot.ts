import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { DepotArticleWithCump } from '@/lib/queries/useDepotArticles'

interface FournirBesoinDepuisDepotInput {
  besoinId: string
  articleId: string
  quantite: number
}

export function useFournirBesoinDepuisDepot() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ besoinId, articleId, quantite }: FournirBesoinDepuisDepotInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      const createdBy = user?.id ?? null

      // 1. Fetch article for CUMP computation
      const { data: article, error: fetchError } = await supabase
        .from('depot_articles')
        .select('*')
        .eq('id', articleId)
        .single()
      if (fetchError) throw fetchError
      if (quantite > article.quantite) {
        throw new Error(`Quantité demandée (${quantite}) supérieure au stock disponible (${article.quantite})`)
      }

      const cump = article.quantite > 0 ? article.valeur_totale / article.quantite : 0
      const montantTotal = quantite * cump
      const newQuantite = article.quantite - quantite
      const newValeurTotale = article.valeur_totale - montantTotal

      // 2. Fetch besoin to get chantier_id
      const { data: besoin, error: besoinFetchError } = await supabase
        .from('besoins')
        .select('*')
        .eq('id', besoinId)
        .single()
      if (besoinFetchError) throw besoinFetchError
      const chantierId = besoin.chantier_id

      // 3. UPDATE depot_articles
      const { error: updateError } = await supabase
        .from('depot_articles')
        .update({ quantite: newQuantite, valeur_totale: newValeurTotale })
        .eq('id', articleId)
        .select()
        .single()
      if (updateError) throw updateError

      // 4. INSERT depot_mouvements
      const { error: mouvError } = await supabase
        .from('depot_mouvements')
        .insert({
          article_id: articleId,
          type: 'transfert_chantier' as const,
          quantite,
          prix_unitaire: cump,
          montant_total: montantTotal,
          chantier_id: chantierId,
          created_by: createdBy,
        })
        .select()
        .single()
      if (mouvError) throw mouvError

      // 5. INSERT livraisons
      const { data: livraison, error: livError } = await supabase
        .from('livraisons')
        .insert({
          chantier_id: chantierId,
          description: `Transfert dépôt — ${article.designation}`,
          status: 'livre' as const,
          montant_ttc: montantTotal,
          destination: 'chantier' as const,
          created_by: createdBy,
        })
        .select()
        .single()
      if (livError) throw livError

      // 6. UPDATE besoin: link to livraison + set montant_unitaire = CUMP
      const { error: besoinUpdateError } = await supabase
        .from('besoins')
        .update({
          livraison_id: livraison.id,
          montant_unitaire: cump,
        })
        .eq('id', besoinId)
      if (besoinUpdateError) throw besoinUpdateError

      return { livraison, chantierId }
    },
    onMutate: async ({ articleId, quantite: qty }) => {
      await queryClient.cancelQueries({ queryKey: ['depot-articles'] })
      const previous = queryClient.getQueryData<DepotArticleWithCump[]>(['depot-articles'])

      queryClient.setQueryData<DepotArticleWithCump[]>(['depot-articles'], (old) => {
        if (!old) return old
        return old.map((a) => {
          if (a.id !== articleId) return a
          const c = a.quantite > 0 ? a.valeur_totale / a.quantite : 0
          const newQty = a.quantite - qty
          const newVal = a.valeur_totale - qty * c
          return { ...a, quantite: newQty, valeur_totale: newVal, cump: newQty > 0 ? newVal / newQty : null }
        })
      })

      return { previous }
    },
    onSuccess: () => {
      toast('Besoin fourni depuis le dépôt')
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['depot-articles'], context.previous)
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['depot-articles'] })
      queryClient.invalidateQueries({ queryKey: ['depot-mouvements', variables.articleId] })
      const chantierId = _data?.chantierId
      if (chantierId) {
        queryClient.invalidateQueries({ queryKey: ['besoins', chantierId] })
        queryClient.invalidateQueries({ queryKey: ['livraisons', chantierId] })
      }
      queryClient.invalidateQueries({ queryKey: ['all-pending-besoins'] })
      queryClient.invalidateQueries({ queryKey: ['all-pending-besoins-count'] })
    },
  })
}
