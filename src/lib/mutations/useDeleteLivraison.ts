import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Livraison } from '@/types/database'

interface DeleteLivraisonInput {
  livraisonId: string
  chantierId: string | null
  mode: 'release-besoins' | 'delete-all'
  linkedBesoinIds: string[]
  bcFileUrl: string | null
  blFileUrl: string | null
}

export function useDeleteLivraison() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ livraisonId, mode, bcFileUrl, blFileUrl }: DeleteLivraisonInput) => {
      // Étape 1 : Traiter les besoins rattachés
      if (mode === 'delete-all') {
        const { error: besoinsError } = await supabase
          .from('besoins')
          .delete()
          .eq('livraison_id', livraisonId)
        if (besoinsError) throw besoinsError
      } else {
        // release-besoins : détacher les besoins de la livraison
        const { error: detachError } = await supabase
          .from('besoins')
          .update({ livraison_id: null })
          .eq('livraison_id', livraisonId)
        if (detachError) throw detachError
      }

      // Étape 2 : Supprimer la livraison
      const { error: livraisonError } = await supabase
        .from('livraisons')
        .delete()
        .eq('id', livraisonId)
      if (livraisonError) throw livraisonError

      // Étape 3 : Nettoyage fichiers storage (non-bloquant)
      const filesToDelete = [bcFileUrl, blFileUrl].filter(Boolean) as string[]
      if (filesToDelete.length > 0) {
        await supabase.storage.from('documents').remove(filesToDelete).catch(() => {})
      }
    },
    onMutate: async ({ livraisonId, chantierId }) => {
      await queryClient.cancelQueries({ queryKey: ['all-livraisons'] })
      const previousAllLivraisons = queryClient.getQueryData(['all-livraisons'])
      queryClient.setQueryData(
        ['all-livraisons'],
        (old: Livraison[] | undefined) =>
          (old ?? []).filter((l) => l.id !== livraisonId),
      )

      let previousLivraisons: unknown
      if (chantierId) {
        await queryClient.cancelQueries({ queryKey: ['livraisons', chantierId] })
        previousLivraisons = queryClient.getQueryData(['livraisons', chantierId])
        queryClient.setQueryData(
          ['livraisons', chantierId],
          (old: Livraison[] | undefined) =>
            (old ?? []).filter((l) => l.id !== livraisonId),
        )
      }
      return { previousLivraisons, previousAllLivraisons }
    },
    onError: (_err, { chantierId }, context) => {
      queryClient.setQueryData(['all-livraisons'], context?.previousAllLivraisons)
      if (chantierId) {
        queryClient.setQueryData(['livraisons', chantierId], context?.previousLivraisons)
      }
    },
    onSettled: (_data, _error, { chantierId }) => {
      if (chantierId) {
        queryClient.invalidateQueries({ queryKey: ['livraisons', chantierId] })
        queryClient.invalidateQueries({ queryKey: ['livraisons-count', chantierId] })
        queryClient.invalidateQueries({ queryKey: ['besoins', chantierId] })
        queryClient.invalidateQueries({ queryKey: ['all-besoins', chantierId] })
      }
      queryClient.invalidateQueries({ queryKey: ['all-livraisons'] })
      queryClient.invalidateQueries({ queryKey: ['all-pending-besoins'] })
      queryClient.invalidateQueries({ queryKey: ['all-pending-besoins-count'] })
      queryClient.invalidateQueries({ queryKey: ['all-linked-besoins'] })
    },
  })
}
