import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { InventaireWithLocation } from '@/lib/queries/useInventaire'

export function useSearchInventaire(chantierId: string, searchTerm: string) {
  const trimmed = searchTerm.trim()
  const enabled = trimmed.length >= 2

  return useQuery({
    queryKey: ['inventaire', chantierId, 'search', trimmed],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventaire')
        .select('*, plots(nom), etages(nom), lots(code)')
        .eq('chantier_id', chantierId)
        .ilike('designation', `%${trimmed.replace(/[%_]/g, '\\$&')}%`)
        .order('designation', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as unknown as InventaireWithLocation[]
    },
    enabled: !!chantierId && enabled,
    placeholderData: [],
  })
}
