import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Livraison } from '@/types/database'

export interface LivraisonLine {
  description: string
  quantite: number
  montant_unitaire: number
  chantier_id: string
  isDepot?: boolean
}

interface CreateLivraisonInput {
  chantierId: string
  description: string
  fournisseur?: string
  montantTtc?: number | null
  lines?: LivraisonLine[]
  destination?: 'chantier' | 'depot'
}

export function useCreateLivraison() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ chantierId, description, fournisseur, montantTtc, lines, destination }: CreateLivraisonInput) => {
      const { data: { user } } = await supabase.auth.getUser()

      // Calculate montant from lines if provided
      let finalChantierId: string | null = chantierId
      let finalMontantTtc = montantTtc ?? null
      const finalDestination = destination ?? 'chantier'

      if (lines && lines.length > 0) {
        finalMontantTtc = lines.reduce((sum, l) => sum + l.quantite * l.montant_unitaire, 0)
        const chantierIds = [...new Set(lines.map((l) => l.chantier_id).filter(Boolean))]
        finalChantierId = chantierIds.length === 1 ? chantierIds[0] : null
      }

      // Depot livraisons have no chantier
      if (finalDestination === 'depot') {
        finalChantierId = null
      }

      const { data, error } = await supabase
        .from('livraisons')
        .insert({
          chantier_id: finalChantierId,
          description,
          destination: finalDestination,
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
          chantier_id: l.chantier_id || null,
          description: l.description,
          quantite: Math.max(1, Math.round(l.quantite)),
          montant_unitaire: l.montant_unitaire,
          is_depot: l.isDepot ?? false,
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
    onMutate: async ({ chantierId, description, fournisseur, montantTtc, lines, destination }) => {
      const isDepot = destination === 'depot'
      const effectiveChantierId = isDepot
        ? null
        : lines && lines.length > 0
          ? ([...new Set(lines.map((l) => l.chantier_id).filter(Boolean))].length === 1 ? lines[0].chantier_id : chantierId)
          : chantierId

      // For depot, optimistic update targets 'all-livraisons' list
      const queryKey = isDepot ? ['all-livraisons'] : ['livraisons', effectiveChantierId]
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData(queryKey)
      const finalMontant = lines && lines.length > 0
        ? lines.reduce((sum, l) => sum + l.quantite * l.montant_unitaire, 0)
        : montantTtc ?? null
      queryClient.setQueryData(queryKey, (old: Livraison[] | undefined) => [
        {
          id: crypto.randomUUID(),
          chantier_id: effectiveChantierId,
          description,
          status: 'commande' as const,
          destination: destination ?? 'chantier',
          fournisseur: fournisseur || null,
          montant_ttc: finalMontant,
          date_prevue: null,
          bc_file_url: null,
          bc_file_name: null,
          bl_file_url: null,
          bl_file_name: null,
          parent_id: null,
          status_history: null,
          created_at: new Date().toISOString(),
          created_by: null,
        },
        ...(old ?? []),
      ])
      return { previous, effectiveChantierId, queryKey }
    },
    onError: (_err, _vars, context) => {
      if (context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previous)
      }
    },
    onSettled: (_data, _error, { chantierId, lines, destination }) => {
      const isDepot = destination === 'depot'
      const effectiveChantierId = isDepot
        ? null
        : lines && lines.length > 0
          ? ([...new Set(lines.map((l) => l.chantier_id).filter(Boolean))].length === 1 ? lines[0].chantier_id : chantierId)
          : chantierId

      if (effectiveChantierId) {
        queryClient.invalidateQueries({ queryKey: ['livraisons', effectiveChantierId] })
        queryClient.invalidateQueries({ queryKey: ['livraisons-count', effectiveChantierId] })
        queryClient.invalidateQueries({ queryKey: ['all-besoins', effectiveChantierId] })
      }
      queryClient.invalidateQueries({ queryKey: ['all-livraisons'] })
      queryClient.invalidateQueries({ queryKey: ['all-linked-besoins'] })
      queryClient.invalidateQueries({ queryKey: ['besoins'] })
    },
  })
}
