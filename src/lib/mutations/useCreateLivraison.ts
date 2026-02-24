import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Livraison } from '@/types/database'

export interface LivraisonLine {
  description: string
  quantite: number
  montant_unitaire: number
  chantier_id: string
}

interface CreateLivraisonInput {
  chantierId: string
  description: string
  fournisseur?: string
  montantTtc?: number | null
  lines?: LivraisonLine[]
}

export function useCreateLivraison() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ chantierId, description, fournisseur, montantTtc, lines }: CreateLivraisonInput) => {
      const { data: { user } } = await supabase.auth.getUser()

      // Calculate montant from lines if provided
      let finalChantierId: string | null = chantierId
      let finalMontantTtc = montantTtc ?? null

      if (lines && lines.length > 0) {
        finalMontantTtc = lines.reduce((sum, l) => sum + l.quantite * l.montant_unitaire, 0)
        const chantierIds = [...new Set(lines.map((l) => l.chantier_id))]
        finalChantierId = chantierIds.length === 1 ? chantierIds[0] : null
      }

      const { data, error } = await supabase
        .from('livraisons')
        .insert({
          chantier_id: finalChantierId,
          description,
          fournisseur: fournisseur || null,
          montant_ttc: finalMontantTtc,
          status: 'commande' as const,
          created_by: user?.id ?? null,
        })
        .select()
        .single()
      if (error) throw error

      const livraison = data as unknown as Livraison

      // Create implicit besoins if lines provided
      if (lines && lines.length > 0) {
        const besoinRows = lines.map((l) => ({
          chantier_id: l.chantier_id,
          description: l.description,
          quantite: l.quantite,
          montant_unitaire: l.montant_unitaire,
          livraison_id: livraison.id,
          created_by: user?.id ?? null,
        }))
        const { error: besoinsError } = await supabase
          .from('besoins')
          .insert(besoinRows)
        if (besoinsError) throw besoinsError
      }

      return livraison
    },
    onMutate: async ({ chantierId, description, fournisseur, montantTtc, lines }) => {
      const effectiveChantierId = lines && lines.length > 0
        ? ([...new Set(lines.map((l) => l.chantier_id))].length === 1 ? lines[0].chantier_id : chantierId)
        : chantierId
      await queryClient.cancelQueries({ queryKey: ['livraisons', effectiveChantierId] })
      const previous = queryClient.getQueryData(['livraisons', effectiveChantierId])
      const finalMontant = lines && lines.length > 0
        ? lines.reduce((sum, l) => sum + l.quantite * l.montant_unitaire, 0)
        : montantTtc ?? null
      queryClient.setQueryData(['livraisons', effectiveChantierId], (old: Livraison[] | undefined) => [
        {
          id: crypto.randomUUID(),
          chantier_id: effectiveChantierId,
          description,
          status: 'commande' as const,
          fournisseur: fournisseur || null,
          montant_ttc: finalMontant,
          date_prevue: null,
          bc_file_url: null,
          bc_file_name: null,
          bl_file_url: null,
          bl_file_name: null,
          created_at: new Date().toISOString(),
          created_by: null,
        },
        ...(old ?? []),
      ])
      return { previous, effectiveChantierId }
    },
    onError: (_err, _vars, context) => {
      if (context?.effectiveChantierId) {
        queryClient.setQueryData(['livraisons', context.effectiveChantierId], context.previous)
      }
    },
    onSettled: (_data, _error, { chantierId, lines }) => {
      const effectiveChantierId = lines && lines.length > 0
        ? ([...new Set(lines.map((l) => l.chantier_id))].length === 1 ? lines[0].chantier_id : chantierId)
        : chantierId
      queryClient.invalidateQueries({ queryKey: ['livraisons', effectiveChantierId] })
      queryClient.invalidateQueries({ queryKey: ['livraisons-count', effectiveChantierId] })
      queryClient.invalidateQueries({ queryKey: ['all-livraisons'] })
      queryClient.invalidateQueries({ queryKey: ['all-linked-besoins'] })
      queryClient.invalidateQueries({ queryKey: ['besoins'] })
    },
  })
}
