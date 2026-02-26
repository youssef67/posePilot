import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { DepotArticle } from '@/types/database'

export interface DepotArticleWithCump extends DepotArticle {
  cump: number | null
}

export function useDepotArticles() {
  return useQuery({
    queryKey: ['depot-articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('depot_articles')
        .select('*')
        .order('designation', { ascending: true })

      if (error) throw error

      return (data as unknown as DepotArticle[]).map((article) => ({
        ...article,
        cump: article.quantite > 0 ? article.valeur_totale / article.quantite : null,
      })) as DepotArticleWithCump[]
    },
  })
}
