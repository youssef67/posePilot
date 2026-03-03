import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { InventaireWithLocation } from '@/lib/queries/useInventaire'

export function useCreateInventaire() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      chantierId,
      plotId,
      etageId,
      lotId,
      designation,
      quantite,
    }: {
      chantierId: string
      plotId: string | null
      etageId: string | null
      lotId: string | null
      designation: string
      quantite: number
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('inventaire')
        .insert({
          chantier_id: chantierId,
          plot_id: plotId,
          etage_id: etageId,
          lot_id: lotId,
          designation: designation.trim(),
          quantite,
          created_by: user?.id ?? null,
        })
        .select('*, plots(nom), etages(nom), lots(code)')
        .single()
      if (error) throw error
      return data as unknown as InventaireWithLocation
    },
    onMutate: async ({ chantierId, plotId, etageId, lotId, designation, quantite }) => {
      await queryClient.cancelQueries({ queryKey: ['inventaire', chantierId] })
      const previousEntries = queryClient.getQueriesData<InventaireWithLocation[]>({
        queryKey: ['inventaire', chantierId],
      })
      const newItem: InventaireWithLocation = {
        id: crypto.randomUUID(),
        chantier_id: chantierId,
        plot_id: plotId,
        etage_id: etageId,
        lot_id: lotId,
        designation: designation.trim(),
        quantite,
        created_at: new Date().toISOString(),
        created_by: null,
        plots: plotId ? { nom: '' } : null,
        etages: etageId ? { nom: '' } : null,
        lots: lotId ? { code: '' } : null,
      }
      for (const [key] of previousEntries) {
        queryClient.setQueryData<InventaireWithLocation[]>(key, (old) => [
          ...(old ?? []),
          newItem,
        ])
      }
      return { previousEntries }
    },
    onError: (_err, _params, context) => {
      for (const [key, data] of context?.previousEntries ?? []) {
        queryClient.setQueryData(key, data)
      }
    },
    onSettled: (_data, _error, { chantierId, plotId }) => {
      queryClient.invalidateQueries({ queryKey: ['inventaire', chantierId] })
      if (plotId) {
        queryClient.invalidateQueries({ queryKey: ['lots', plotId] })
      }
    },
  })
}
