import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { InventaireWithLocation } from '@/lib/queries/useInventaire'

interface UpdateInventaireParams {
  id: string
  chantierId: string
  quantite?: number
  designation?: string
  plotId?: string | null
  etageId?: string | null
  lotId?: string | null
}

export function useUpdateInventaire() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, quantite, designation, plotId, etageId, lotId }: UpdateInventaireParams) => {
      const fields: Record<string, unknown> = {}
      if (quantite !== undefined) fields.quantite = quantite
      if (designation !== undefined) fields.designation = designation
      if (plotId !== undefined) fields.plot_id = plotId
      if (etageId !== undefined) fields.etage_id = etageId
      if (lotId !== undefined) fields.lot_id = lotId

      const { data, error } = await supabase
        .from('inventaire')
        .update(fields)
        .eq('id', id)
        .select('*, plots(nom), etages(nom), lots(code)')
        .single()
      if (error) throw error
      return data
    },
    onMutate: async (params) => {
      await queryClient.cancelQueries({ queryKey: ['inventaire', params.chantierId] })
      const previousEntries = queryClient.getQueriesData<InventaireWithLocation[]>({
        queryKey: ['inventaire', params.chantierId],
      })
      for (const [key] of previousEntries) {
        queryClient.setQueryData<InventaireWithLocation[]>(key, (old) =>
          (old ?? []).map((item) => {
            if (item.id !== params.id) return item
            const updated = { ...item }
            if (params.quantite !== undefined) updated.quantite = params.quantite
            if (params.designation !== undefined) updated.designation = params.designation
            if (params.plotId !== undefined) updated.plot_id = params.plotId
            if (params.etageId !== undefined) updated.etage_id = params.etageId
            if (params.lotId !== undefined) updated.lot_id = params.lotId
            return updated
          }),
        )
      }
      return { previousEntries }
    },
    onError: (_err, _params, context) => {
      for (const [key, data] of context?.previousEntries ?? []) {
        queryClient.setQueryData(key, data)
      }
    },
    onSettled: (_data, _error, { chantierId }) => {
      queryClient.invalidateQueries({ queryKey: ['inventaire', chantierId] })
    },
  })
}
