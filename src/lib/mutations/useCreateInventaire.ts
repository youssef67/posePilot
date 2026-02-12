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
      designation,
      quantite,
    }: {
      chantierId: string
      plotId: string
      etageId: string
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
          designation: designation.trim(),
          quantite,
          created_by: user?.id ?? null,
        })
        .select('*, plots(nom), etages(nom)')
        .single()
      if (error) throw error
      return data as unknown as InventaireWithLocation
    },
    onMutate: async ({ chantierId, plotId, etageId, designation, quantite }) => {
      await queryClient.cancelQueries({ queryKey: ['inventaire', chantierId] })
      const previous = queryClient.getQueryData(['inventaire', chantierId])
      queryClient.setQueryData(
        ['inventaire', chantierId],
        (old: InventaireWithLocation[] | undefined) => [
          ...(old ?? []),
          {
            id: crypto.randomUUID(),
            chantier_id: chantierId,
            plot_id: plotId,
            etage_id: etageId,
            designation: designation.trim(),
            quantite,
            created_at: new Date().toISOString(),
            created_by: null,
            plots: { nom: '' },
            etages: { nom: '' },
          },
        ],
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
