import { useMemo } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Fab } from '@/components/Fab'
import { LivraisonsList } from '@/components/LivraisonsList'
import { LivraisonSheets } from '@/components/LivraisonSheets'
import { useRealtimeLivraisons } from '@/lib/subscriptions/useRealtimeLivraisons'
import { useLivraisons } from '@/lib/queries/useLivraisons'
import { useChantier } from '@/lib/queries/useChantier'
import { useAllBesoinsForChantier, buildBesoinsMap } from '@/lib/queries/useAllBesoinsForChantier'
import { useLivraisonActions } from '@/lib/hooks/useLivraisonActions'

export const Route = createFileRoute(
  '/_authenticated/chantiers/$chantierId/livraisons',
)({
  component: LivraisonsPage,
})

function LivraisonsPage() {
  const { chantierId } = Route.useParams()
  const { data: chantier } = useChantier(chantierId)
  const { data: livraisons, isLoading } = useLivraisons(chantierId)
  const { data: linkedBesoins } = useAllBesoinsForChantier(chantierId)
  useRealtimeLivraisons(chantierId)
  const livraisonActions = useLivraisonActions(chantierId)
  const besoinsMap = useMemo(() => buildBesoinsMap(linkedBesoins ?? []), [linkedBesoins])

  return (
    <div className="flex flex-col min-h-[calc(100vh-56px-env(safe-area-inset-bottom))]">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <Button variant="ghost" size="icon" asChild>
          <Link
            to="/chantiers/$chantierId"
            params={{ chantierId }}
            aria-label="Retour"
          >
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <h1 className="text-lg font-semibold text-foreground truncate">
          Livraisons{chantier ? ` — ${chantier.nom}` : ''}
        </h1>
      </header>

      <div className="flex-1 p-4">
        <h2 className="text-base font-semibold text-foreground mb-3">
          Livraisons{livraisons && livraisons.length > 0 ? ` (${livraisons.length})` : ''}
        </h2>

        <LivraisonsList
          livraisons={livraisons}
          isLoading={isLoading}
          chantierId={chantierId}
          onOpenSheet={livraisonActions.handleOpenLivraisonSheet}
          onMarquerPrevu={livraisonActions.handleMarquerPrevu}
          onConfirmerLivraison={livraisonActions.handleConfirmerLivraison}
          onEdit={livraisonActions.handleEditLivraison}
          onDelete={livraisonActions.handleDeleteLivraison}
          besoinsMap={besoinsMap}
        />

        <Fab onClick={livraisonActions.handleOpenLivraisonSheet} />
      </div>

      <LivraisonSheets actions={livraisonActions} />
    </div>
  )
}
