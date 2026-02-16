import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Besoin, Livraison } from '@/types/database'

interface CreateGroupedLivraisonInput {
  chantierId: string
  besoinIds: string[]
  description: string
  fournisseur?: string
}

export function useCreateGroupedLivraison() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ chantierId, besoinIds, description, fournisseur }: CreateGroupedLivraisonInput) => {
      const { data: { user } } = await supabase.auth.getUser()

      // Etape 1 : creer la livraison
      const { data: livraison, error: livraisonError } = await supabase
        .from('livraisons')
        .insert({
          chantier_id: chantierId,
          description,
          fournisseur: fournisseur || null,
          status: 'commande' as const,
          created_by: user?.id ?? null,
        })
        .select()
        .single()
      if (livraisonError) throw livraisonError

      // Etape 2 : rattacher les besoins en batch
      const { error: besoinsError } = await supabase
        .from('besoins')
        .update({ livraison_id: (livraison as unknown as Livraison).id })
        .in('id', besoinIds)
        .is('livraison_id', null)
      if (besoinsError) throw besoinsError

      return livraison as unknown as Livraison
    },
    onMutate: async ({ chantierId, besoinIds }) => {
      await queryClient.cancelQueries({ queryKey: ['besoins', chantierId] })
      const previousBesoins = queryClient.getQueryData(['besoins', chantierId])
      queryClient.setQueryData(
        ['besoins', chantierId],
        (old: Besoin[] | undefined) =>
          (old ?? []).filter((b) => !besoinIds.includes(b.id)),
      )
      return { previousBesoins }
    },
    onError: (_err, { chantierId }, context) => {
      queryClient.setQueryData(['besoins', chantierId], context?.previousBesoins)
    },
    onSettled: (_data, _error, { chantierId }) => {
      queryClient.invalidateQueries({ queryKey: ['besoins', chantierId] })
      queryClient.invalidateQueries({ queryKey: ['livraisons', chantierId] })
      queryClient.invalidateQueries({ queryKey: ['livraisons-count', chantierId] })
      queryClient.invalidateQueries({ queryKey: ['all-pending-besoins-count'] })
      queryClient.invalidateQueries({ queryKey: ['all-livraisons'] })
      queryClient.invalidateQueries({ queryKey: ['all-besoins', chantierId] })
      queryClient.invalidateQueries({ queryKey: ['all-linked-besoins'] })
    },
  })
}
