import { Link, useMatches } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbSegment {
  label: string
  to: string
}

export function BreadcrumbNav() {
  const matches = useMatches()
  const queryClient = useQueryClient()

  const segments: BreadcrumbSegment[] = []
  const seenParams = new Set<string>()

  for (const match of matches) {
    if (!match.staticData?.breadcrumb) continue

    const params = match.params as Record<string, string>
    let label = match.staticData.breadcrumb as string

    // Check from shallowest to deepest — TanStack Router merges all child
    // params into every match, so we must resolve the shallowest unseen param first.
    if (params.chantierId && !seenParams.has('chantierId')) {
      seenParams.add('chantierId')
      const chantier = queryClient.getQueryData<{ id: string; nom: string }>(['chantiers', params.chantierId])
      if (chantier) label = chantier.nom
    } else if (params.plotId && !seenParams.has('plotId')) {
      seenParams.add('plotId')
      const plots = queryClient.getQueryData<Array<{ id: string; nom: string }>>(['plots', params.chantierId])
      const plot = plots?.find((p) => p.id === params.plotId)
      if (plot) label = plot.nom
    } else if (params.etageId && !seenParams.has('etageId')) {
      seenParams.add('etageId')
      const etages = queryClient.getQueryData<Array<{ id: string; nom: string }>>(['etages', params.plotId])
      const etage = etages?.find((e) => e.id === params.etageId)
      if (etage) label = etage.nom
    } else if (params.lotId && !seenParams.has('lotId')) {
      seenParams.add('lotId')
      const lots = queryClient.getQueryData<Array<{ id: string; code: string }>>(['lots', params.plotId])
      const lot = lots?.find((l) => l.id === params.lotId)
      if (lot) label = `Lot ${lot.code}`
    } else if (params.pieceId && !seenParams.has('pieceId')) {
      seenParams.add('pieceId')
      const pieces = queryClient.getQueryData<Array<{ id: string; nom: string }>>(['pieces', params.lotId])
      const piece = pieces?.find((p) => p.id === params.pieceId)
      if (piece) label = piece.nom
    }

    segments.push({ label, to: match.pathname })
  }

  if (segments.length <= 1) return null

  return (
    <nav aria-label="Fil d'Ariane" className="px-4 py-2 border-b border-border">
      <ol className="flex items-center gap-1 text-sm">
        {segments.length > 3 && (
          <li className="flex items-center gap-1 sm:hidden" aria-hidden="true">
            <span className="text-muted-foreground">…</span>
            <ChevronRight className="size-3 text-muted-foreground shrink-0" />
          </li>
        )}
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1
          const isHiddenOnSmall = segments.length > 3 && index < segments.length - 3

          return (
            <li
              key={segment.to}
              className={cn(
                'flex items-center gap-1 min-w-0',
                isHiddenOnSmall && 'hidden sm:flex',
              )}
            >
              {index > 0 && (
                <ChevronRight
                  className={cn(
                    'size-3 text-muted-foreground shrink-0',
                    segments.length > 3 && index === segments.length - 3 && 'hidden sm:block',
                  )}
                />
              )}
              {isLast ? (
                <span className="font-medium text-foreground truncate">
                  {segment.label}
                </span>
              ) : (
                <Link
                  to={segment.to as '/'}
                  className="text-muted-foreground truncate hover:text-foreground transition-colors"
                >
                  {segment.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
