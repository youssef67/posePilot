import { useMatches } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'

export function useShareContext(): string {
  const matches = useMatches()
  const queryClient = useQueryClient()

  const parts: string[] = []
  const seenParams = new Set<string>()

  for (const match of matches) {
    const params = match.params as Record<string, string>

    if (params.chantierId && !seenParams.has('chantierId')) {
      seenParams.add('chantierId')
      const chantier = queryClient.getQueryData<{ id: string; nom: string }>(['chantiers', params.chantierId])
      if (chantier) parts.push(`Chantier ${chantier.nom}`)
    } else if (params.plotId && !seenParams.has('plotId')) {
      seenParams.add('plotId')
      const plots = queryClient.getQueryData<Array<{ id: string; nom: string }>>(['plots', params.chantierId])
      const plot = plots?.find((p) => p.id === params.plotId)
      if (plot) parts.push(plot.nom)
    } else if (params.etageId && !seenParams.has('etageId')) {
      seenParams.add('etageId')
      // Étage is skipped from share context — internal navigation level
    } else if (params.lotId && !seenParams.has('lotId')) {
      seenParams.add('lotId')
      const lots = queryClient.getQueryData<Array<{ id: string; code: string }>>(['lots', params.plotId])
      const lot = lots?.find((l) => l.id === params.lotId)
      if (lot) parts.push(`Lot ${lot.code}`)
    } else if (params.pieceId && !seenParams.has('pieceId')) {
      seenParams.add('pieceId')
      const pieces = queryClient.getQueryData<Array<{ id: string; nom: string }>>(['pieces', params.lotId])
      const piece = pieces?.find((p) => p.id === params.pieceId)
      if (piece) parts.push(piece.nom)
    }
  }

  return parts.join(' — ')
}
