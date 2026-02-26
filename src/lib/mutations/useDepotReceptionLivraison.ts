import { supabase } from '@/lib/supabase'

/** Escape LIKE/ILIKE special characters so they match literally. */
function escapeLikePattern(value: string): string {
  return value.replace(/[%_\\]/g, '\\$&')
}

/**
 * Réceptionne une livraison destinée au dépôt.
 * Pour chaque besoin lié à la livraison :
 * - Cherche un depot_article par designation (case-insensitive trim, escaped)
 * - Si existe : UPDATE quantite += N, valeur_totale += N × montant_unitaire
 * - Sinon : INSERT nouvel article
 * - Crée un depot_mouvement type='entree' avec livraison_id
 *
 * Les mouvements sont insérés en batch pour réduire les round-trips.
 * En cas d'erreur partielle, les opérations déjà effectuées ne sont PAS annulées
 * (pas de transaction cross-table côté client). L'appelant doit gérer la retry.
 */
export async function receptionnerLivraisonDepot(livraisonId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  const createdBy = user?.id ?? null

  // Idempotence: skip if mouvements already exist for this livraison
  const { data: existingMouvements, error: mouvCheckError } = await supabase
    .from('depot_mouvements')
    .select('id')
    .eq('livraison_id', livraisonId)
    .limit(1)

  if (mouvCheckError) throw mouvCheckError
  if (existingMouvements && existingMouvements.length > 0) return

  // Fetch besoins linked to this livraison — only depot lines
  const { data: besoins, error: besoinsError } = await supabase
    .from('besoins')
    .select('id, description, quantite, montant_unitaire, is_depot')
    .eq('livraison_id', livraisonId)
    .eq('is_depot', true)

  if (besoinsError) throw besoinsError
  if (!besoins || besoins.length === 0) return

  // Process each besoin: upsert depot_article + collect mouvement rows
  const mouvementRows: Array<{
    article_id: string
    type: 'entree'
    quantite: number
    prix_unitaire: number
    montant_total: number
    livraison_id: string
    created_by: string | null
  }> = []

  for (const besoin of besoins) {
    const designation = besoin.description.trim()
    const quantite = besoin.quantite
    const prixUnitaire = besoin.montant_unitaire ?? 0
    const montantTotal = quantite * prixUnitaire

    // Look for existing article by designation (case-insensitive, escaped)
    const { data: existingArticles, error: searchError } = await supabase
      .from('depot_articles')
      .select('id, quantite, valeur_totale')
      .ilike('designation', escapeLikePattern(designation))
      .limit(1)

    if (searchError) throw searchError

    let articleId: string

    if (existingArticles && existingArticles.length > 0) {
      const existing = existingArticles[0]
      const newQuantite = existing.quantite + quantite
      const newValeurTotale = existing.valeur_totale + montantTotal

      const { error: updateError } = await supabase
        .from('depot_articles')
        .update({ quantite: newQuantite, valeur_totale: newValeurTotale })
        .eq('id', existing.id)

      if (updateError) throw updateError
      articleId = existing.id
    } else {
      const { data: newArticle, error: insertError } = await supabase
        .from('depot_articles')
        .insert({
          designation,
          quantite,
          valeur_totale: montantTotal,
          created_by: createdBy,
        })
        .select('id')
        .single()

      if (insertError) throw insertError
      articleId = newArticle.id
    }

    mouvementRows.push({
      article_id: articleId,
      type: 'entree' as const,
      quantite,
      prix_unitaire: prixUnitaire,
      montant_total: montantTotal,
      livraison_id: livraisonId,
      created_by: createdBy,
    })
  }

  // Batch insert all mouvements in a single round-trip
  if (mouvementRows.length > 0) {
    const { error: mouvError } = await supabase
      .from('depot_mouvements')
      .insert(mouvementRows)

    if (mouvError) throw mouvError
  }
}

/**
 * Annule la réception dépôt d'une livraison.
 * Pour chaque mouvement d'entrée lié à la livraison :
 * - Soustrait quantité et valeur du depot_article correspondant
 * - Supprime le depot_article si quantité tombe à 0
 * - Supprime les depot_mouvements liés à cette livraison
 */
export async function annulerReceptionDepot(livraisonId: string) {
  // Fetch mouvements for this livraison
  const { data: mouvements, error: mouvError } = await supabase
    .from('depot_mouvements')
    .select('id, article_id, quantite, montant_total')
    .eq('livraison_id', livraisonId)

  if (mouvError) throw mouvError
  if (!mouvements || mouvements.length === 0) return

  // Reverse each mouvement: subtract from depot_article
  for (const mouvement of mouvements) {
    const { data: article, error: articleError } = await supabase
      .from('depot_articles')
      .select('id, quantite, valeur_totale')
      .eq('id', mouvement.article_id)
      .single()

    if (articleError) throw articleError

    const newQuantite = article.quantite - mouvement.quantite
    const newValeurTotale = article.valeur_totale - mouvement.montant_total

    if (newQuantite <= 0) {
      const { error: deleteError } = await supabase
        .from('depot_articles')
        .delete()
        .eq('id', article.id)
      if (deleteError) throw deleteError
    } else {
      const { error: updateError } = await supabase
        .from('depot_articles')
        .update({ quantite: newQuantite, valeur_totale: Math.max(0, newValeurTotale) })
        .eq('id', article.id)
      if (updateError) throw updateError
    }
  }

  // Delete all mouvements for this livraison
  const { error: deleteMovError } = await supabase
    .from('depot_mouvements')
    .delete()
    .eq('livraison_id', livraisonId)

  if (deleteMovError) throw deleteMovError
}
