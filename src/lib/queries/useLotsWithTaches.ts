import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface TacheInfo {
  id: string
  nom: string
  status: string
  position: number
  bloquant_pose: boolean
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
  materiaux_statut: string
  materiaux_note: string | null
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
          'id, code, plot_id, etage_id, metrage_m2_total, metrage_ml_total, materiaux_statut, materiaux_note, plots!inner(nom), etages(nom), pieces(id, nom, taches(id, nom, status, position, bloquant_pose))',
        )
        .eq('plots.chantier_id', chantierId)
        .order('code')
      if (error) throw error
      // Sort taches by position client-side (PostgREST can't order 2nd-level nested)
      const lots = data as unknown as LotWithTaches[]
      for (const lot of lots) {
        for (const piece of lot.pieces) {
          piece.taches.sort((a, b) => a.position - b.position)
        }
      }
      return lots
    },
    enabled: !!chantierId,
    staleTime: 30 * 1000,
    placeholderData: [],
  })
}
