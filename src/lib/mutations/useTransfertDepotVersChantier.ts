import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { DepotArticleWithCump } from '@/lib/queries/useDepotArticles'

interface TransfertDepotVersChantierInput {
  articleId: string
  quantite: number
  chantierId: string
}

export function useTransfertDepotVersChantier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ articleId, quantite, chantierId }: TransfertDepotVersChantierInput) => {
      const { data: { user } } = await supabase.auth.getUser()
      const createdBy = user?.id ?? null

      // 1. Fetch current article to compute CUMP
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

      // 2. UPDATE depot_articles
      const { error: updateError } = await supabase
        .from('depot_articles')
        .update({ quantite: newQuantite, valeur_totale: newValeurTotale })
        .eq('id', articleId)
        .select()
        .single()
      if (updateError) throw updateError

      // 3. INSERT depot_mouvements
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

      // 4. INSERT livraisons
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

      // 5. INSERT besoins
      const { error: besoinError } = await supabase
        .from('besoins')
        .insert({
          chantier_id: chantierId,
          description: article.designation,
          quantite,
          montant_unitaire: cump,
          livraison_id: livraison.id,
          created_by: createdBy,
        })
      if (besoinError) throw besoinError

      return livraison
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
      toast('Transfert effectué')
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['depot-articles'], context.previous)
      }
    },
    onSettled: (_data, _error, { articleId, chantierId }) => {
      queryClient.invalidateQueries({ queryKey: ['depot-articles'] })
      queryClient.invalidateQueries({ queryKey: ['depot-mouvements', articleId] })
      queryClient.invalidateQueries({ queryKey: ['livraisons', chantierId] })
      queryClient.invalidateQueries({ queryKey: ['all-livraisons'] })
    },
  })
}
