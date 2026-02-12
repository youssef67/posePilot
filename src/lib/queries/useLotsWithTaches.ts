import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface TacheInfo {
  id: string
  nom: string
  status: string
}

export interface PieceInfo {
  id: string
  nom: string
  taches: TacheInfo[]
}

export interface LotWithTaches {
  id: string
  code: string
  plot_id: string
  etage_id: string
  metrage_m2_total: number
  metrage_ml_total: number
  plots: { nom: string }
  etages: { nom: string } | null
  pieces: PieceInfo[]
}

export function useLotsWithTaches(chantierId: string) {
  return useQuery({
    queryKey: ['lots-with-taches', chantierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lots')
        .select(
          'id, code, plot_id, etage_id, metrage_m2_total, metrage_ml_total, plots!inner(nom), etages(nom), pieces(id, nom, taches(id, nom, status))',
        )
        .eq('plots.chantier_id', chantierId)
        .order('code')
      if (error) throw error
      return data as unknown as LotWithTaches[]
    },
    enabled: !!chantierId,
    staleTime: 30 * 1000,
  })
}
