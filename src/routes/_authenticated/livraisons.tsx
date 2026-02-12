import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Truck } from 'lucide-react'
import { toast } from 'sonner'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { DeliveryCard, DeliveryCardSkeleton } from '@/components/DeliveryCard'
import { useAllLivraisons, type LivraisonWithChantier } from '@/lib/queries/useAllLivraisons'
import { useRealtimeAllLivraisons } from '@/lib/subscriptions/useRealtimeAllLivraisons'
import { useUpdateLivraisonStatus } from '@/lib/mutations/useUpdateLivraisonStatus'
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
  useRealtimeAllLivraisons()
  const updateStatus = useUpdateLivraisonStatus()

  const [activeFilter, setActiveFilter] = useState<StatusFilter>('tous')
  const [showDateSheet, setShowDateSheet] = useState(false)
  const [datePrevue, setDatePrevue] = useState('')
  const [livraisonToUpdate, setLivraisonToUpdate] = useState<LivraisonWithChantier | null>(null)

  const all = livraisons ?? []
  const displayed = filterAndSort(all, activeFilter)

  function handleMarquerPrevu(id: string) {
    const liv = all.find((l) => l.id === id) ?? null
    setLivraisonToUpdate(liv)
    setDatePrevue('')
    setShowDateSheet(true)
  }

  function handleConfirmDatePrevue() {
    if (!livraisonToUpdate || !datePrevue) return
    updateStatus.mutate(
      { livraisonId: livraisonToUpdate.id, chantierId: livraisonToUpdate.chantier_id, newStatus: 'prevu', datePrevue },
      {
        onSuccess: () => {
          setShowDateSheet(false)
          setLivraisonToUpdate(null)
          toast('Livraison marquée prévu')
        },
        onError: () => {
          toast.error('Erreur lors de la mise à jour')
        },
      },
    )
  }

  function handleConfirmerLivraison(id: string) {
    const liv = all.find((l) => l.id === id)
    if (!liv) return
    updateStatus.mutate(
      { livraisonId: id, chantierId: liv.chantier_id, newStatus: 'livre' },
      {
        onSuccess: () => toast('Livraison confirmée'),
        onError: () => toast.error('Erreur lors de la confirmation'),
      },
    )
  }

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
              onMarquerPrevu={handleMarquerPrevu}
              onConfirmerLivraison={handleConfirmerLivraison}
              chantierNom={liv.chantiers.nom}
              highlighted={isThisWeek(liv.date_prevue)}
            />
          ))}
        </div>
      )}

      <Sheet open={showDateSheet} onOpenChange={setShowDateSheet}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Date de livraison prévue</SheetTitle>
            <SheetDescription>
              Indiquez la date de livraison prévue.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4">
            <Input
              type="date"
              value={datePrevue}
              onChange={(e) => setDatePrevue(e.target.value)}
              aria-label="Date prévue"
            />
          </div>
          <SheetFooter>
            <Button
              onClick={handleConfirmDatePrevue}
              disabled={!datePrevue || updateStatus.isPending}
              className="w-full"
            >
              Marquer comme prévu
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
