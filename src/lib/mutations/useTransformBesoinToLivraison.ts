import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Besoin, Livraison } from '@/types/database'

export function useTransformBesoinToLivraison() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ besoin }: { besoin: Besoin }) => {
      const { data: { user } } = await supabase.auth.getUser()

      // 1. Créer la livraison
      const { data: livraison, error: livraisonError } = await supabase
        .from('livraisons')
        .insert({
          chantier_id: besoin.chantier_id,
          description: besoin.description,
          status: 'commande' as const,
          created_by: user?.id ?? null,
        })
        .select()
        .single()
      if (livraisonError) throw livraisonError

      // 2. Lier le besoin à la livraison
      const { error: besoinError } = await supabase
        .from('besoins')
        .update({ livraison_id: (livraison as unknown as Livraison).id })
        .eq('id', besoin.id)
      if (besoinError) throw besoinError

      return livraison as unknown as Livraison
    },
    onMutate: async ({ besoin }) => {
      const chantierId = besoin.chantier_id
      await queryClient.cancelQueries({ queryKey: ['besoins', chantierId] })
      const previous = queryClient.getQueryData(['besoins', chantierId])
      queryClient.setQueryData(
        ['besoins', chantierId],
        (old: Besoin[] | undefined) =>
          (old ?? []).filter((b) => b.id !== besoin.id),
      )
      return { previous, chantierId }
    },
    onError: (_err, _vars, context) => {
      if (context?.chantierId) {
        queryClient.setQueryData(['besoins', context.chantierId], context.previous)
      }
    },
    onSettled: (_data, _error, { besoin }) => {
      queryClient.invalidateQueries({ queryKey: ['besoins', besoin.chantier_id] })
      queryClient.invalidateQueries({ queryKey: ['livraisons', besoin.chantier_id] })
      queryClient.invalidateQueries({ queryKey: ['livraisons-count', besoin.chantier_id] })
    },
  })
}
