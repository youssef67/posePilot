import { useState, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Truck } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DeliveryCard, DeliveryCardSkeleton } from '@/components/DeliveryCard'
import { LivraisonSheets } from '@/components/LivraisonSheets'
import { Fab } from '@/components/Fab'
import { useAllLivraisons, type LivraisonWithChantier } from '@/lib/queries/useAllLivraisons'
import { useAllLinkedBesoins, buildLinkedBesoinsMap } from '@/lib/queries/useAllLinkedBesoins'
import { useChantiers } from '@/lib/queries/useChantiers'
import { useRealtimeAllLivraisons } from '@/lib/subscriptions/useRealtimeAllLivraisons'
import { useLivraisonActions } from '@/lib/hooks/useLivraisonActions'
import { isThisWeek } from '@/lib/utils/isThisWeek'

export const Route = createFileRoute('/_authenticated/livraisons')({
  component: LivraisonsPage,
})

type StatusFilter = 'tous' | 'commande' | 'prevu' | 'livre'

function filterAndSort(livraisons: LivraisonWithChantier[], filter: StatusFilter): LivraisonWithChantier[] {
  let filtered = livraisons
  if (filter !== 'tous') {
    filtered = livraisons.filter((l) => l.status === filter)
  }

  return [...filtered].sort((a, b) => {
    if (filter === 'prevu') {
      const dateA = a.date_prevue ?? ''
      const dateB = b.date_prevue ?? ''
      return dateA.localeCompare(dateB)
    }
    if (filter === 'livre') {
      const dateA = a.date_prevue ?? ''
      const dateB = b.date_prevue ?? ''
      return dateB.localeCompare(dateA)
    }
    return b.created_at.localeCompare(a.created_at)
  })
}

function countByStatus(livraisons: LivraisonWithChantier[], status: StatusFilter): number {
  if (status === 'tous') return livraisons.length
  return livraisons.filter((l) => l.status === status).length
}

function LivraisonsPage() {
  const { data: livraisons, isLoading } = useAllLivraisons()
  const { data: linkedBesoins } = useAllLinkedBesoins()
  const { data: chantiers } = useChantiers('active')
  useRealtimeAllLivraisons()
  const besoinsMap = useMemo(() => buildLinkedBesoinsMap(linkedBesoins ?? []), [linkedBesoins])
  const livraisonActions = useLivraisonActions()

  const [activeFilter, setActiveFilter] = useState<StatusFilter>('tous')

  const all = livraisons ?? []
  const displayed = filterAndSort(all, activeFilter)

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <h1 className="text-2xl font-semibold text-foreground">Livraisons</h1>

      <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as StatusFilter)}>
        <TabsList variant="line" className="w-full">
          <TabsTrigger value="tous">Tous ({countByStatus(all, 'tous')})</TabsTrigger>
          <TabsTrigger value="commande">Commandé ({countByStatus(all, 'commande')})</TabsTrigger>
          <TabsTrigger value="prevu">Prévu ({countByStatus(all, 'prevu')})</TabsTrigger>
          <TabsTrigger value="livre">Livré ({countByStatus(all, 'livre')})</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading && (
        <div className="flex flex-col gap-3">
          <DeliveryCardSkeleton />
          <DeliveryCardSkeleton />
          <DeliveryCardSkeleton />
        </div>
      )}

      {!isLoading && displayed.length === 0 && (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
          <Truck className="size-12" />
          <p>Aucune livraison</p>
        </div>
      )}

      {!isLoading && displayed.length > 0 && (
        <div className="flex flex-col gap-3">
          {displayed.map((liv) => (
            <DeliveryCard
              key={liv.id}
              livraison={liv}
              chantierId={liv.chantier_id}
              onMarquerPrevu={livraisonActions.handleMarquerPrevu}
              onConfirmerLivraison={livraisonActions.handleConfirmerLivraison}
              onEdit={(l) => livraisonActions.handleEditLivraison(l, besoinsMap.get(l.id))}
              onDelete={livraisonActions.handleDeleteLivraison}
              chantierNom={liv.chantiers?.nom}
              highlighted={isThisWeek(liv.date_prevue)}
              linkedBesoins={besoinsMap.get(liv.id)}
            />
          ))}
        </div>
      )}

      <Fab onClick={livraisonActions.handleOpenLivraisonSheet} />

      <LivraisonSheets actions={livraisonActions} chantiers={(chantiers ?? []) as { id: string; nom: string }[]} />
    </div>
  )
}
