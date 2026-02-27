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
      const previous = queryClient.getQueryData(['inventaire', params.chantierId])
      queryClient.setQueryData(
        ['inventaire', params.chantierId],
        (old: InventaireWithLocation[] | undefined) =>
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
      return { previous }
    },
    onError: (_err, { chantierId }, context) => {
      queryClient.setQueryData(['inventaire', chantierId], context?.previous)
    },
    onSettled: (_data, _error, { chantierId }) => {
      queryClient.invalidateQueries({ queryKey: ['inventaire', chantierId] })
    },
  })
}
