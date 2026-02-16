import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Livraison } from '@/types/database'

interface DeleteLivraisonInput {
  livraisonId: string
  chantierId: string
  mode: 'release-besoins' | 'delete-all'
  linkedBesoinIds: string[]
  bcFileUrl: string | null
  blFileUrl: string | null
}

export function useDeleteLivraison() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ livraisonId, mode, bcFileUrl, blFileUrl }: DeleteLivraisonInput) => {
      // Étape 1 : Supprimer les besoins rattachés si mode "delete-all"
      // Filtre par livraison_id côté serveur — indépendant des données client
      if (mode === 'delete-all') {
        const { error: besoinsError } = await supabase
          .from('besoins')
          .delete()
          .eq('livraison_id', livraisonId)
        if (besoinsError) throw besoinsError
      }

      // Étape 2 : Supprimer la livraison (garde serveur : status commande/prevu)
      const { error: livraisonError } = await supabase
        .from('livraisons')
        .delete()
        .eq('id', livraisonId)
        .in('status', ['commande', 'prevu'])
      if (livraisonError) throw livraisonError

      // Étape 3 : Nettoyage fichiers storage (non-bloquant)
      const filesToDelete = [bcFileUrl, blFileUrl].filter(Boolean) as string[]
      if (filesToDelete.length > 0) {
        await supabase.storage.from('documents').remove(filesToDelete).catch(() => {})
      }
    },
    onMutate: async ({ livraisonId, chantierId }) => {
      await queryClient.cancelQueries({ queryKey: ['livraisons', chantierId] })
      const previousLivraisons = queryClient.getQueryData(['livraisons', chantierId])
      queryClient.setQueryData(
        ['livraisons', chantierId],
        (old: Livraison[] | undefined) =>
          (old ?? []).filter((l) => l.id !== livraisonId),
      )
      return { previousLivraisons }
    },
    onError: (_err, { chantierId }, context) => {
      queryClient.setQueryData(['livraisons', chantierId], context?.previousLivraisons)
    },
    onSettled: (_data, _error, { chantierId }) => {
      queryClient.invalidateQueries({ queryKey: ['livraisons', chantierId] })
      queryClient.invalidateQueries({ queryKey: ['livraisons-count', chantierId] })
      queryClient.invalidateQueries({ queryKey: ['all-livraisons'] })
      queryClient.invalidateQueries({ queryKey: ['besoins', chantierId] })
      queryClient.invalidateQueries({ queryKey: ['all-pending-besoins-count'] })
      queryClient.invalidateQueries({ queryKey: ['all-besoins', chantierId] })
      queryClient.invalidateQueries({ queryKey: ['all-linked-besoins'] })
    },
  })
}
