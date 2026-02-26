import { Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DeliveryCard, DeliveryCardSkeleton } from '@/components/DeliveryCard'
import type { Livraison } from '@/types/database'
import type { LivraisonStatus } from '@/lib/mutations/useUpdateLivraisonStatus'
import type { LinkedBesoinWithChantier } from '@/lib/queries/useAllLinkedBesoins'

interface LivraisonsListProps {
  livraisons: Livraison[] | undefined
  isLoading: boolean
  chantierId: string
  onOpenSheet: () => void
  onMarquerPrevu: (id: string) => void
  onConfirmerLivraison: (id: string, previousStatus?: LivraisonStatus) => void
  onMarquerRecupere?: (id: string, previousStatus?: LivraisonStatus) => void
  onRevenirStatut?: (id: string, currentStatus: LivraisonStatus, targetStatus: LivraisonStatus) => void
  onEdit?: (livraison: Livraison, linkedBesoins?: LinkedBesoinWithChantier[]) => void
  onDelete?: (livraison: Livraison, linkedBesoins: LinkedBesoinWithChantier[]) => void
  besoinsMap?: Map<string, LinkedBesoinWithChantier[]>
}

export function LivraisonsList({
  livraisons,
  isLoading,
  chantierId,
  onOpenSheet,
  onMarquerPrevu,
  onConfirmerLivraison,
  onMarquerRecupere,
  onRevenirStatut,
  onEdit,
  onDelete,
  besoinsMap,
}: LivraisonsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <DeliveryCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (livraisons && livraisons.length > 0) {
    return (
      <div className="space-y-3">
        {livraisons.map((livraison) => (
          <DeliveryCard
            key={livraison.id}
            livraison={livraison}
            chantierId={chantierId}
            onMarquerPrevu={onMarquerPrevu}
            onConfirmerLivraison={onConfirmerLivraison}
            onMarquerRecupere={onMarquerRecupere}
            onRevenirStatut={onRevenirStatut}
            onEdit={onEdit ? (liv) => onEdit(liv, besoinsMap?.get(liv.id)) : undefined}
            onDelete={onDelete}
            linkedBesoins={besoinsMap?.get(livraison.id)}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <Truck className="h-10 w-10 text-muted-foreground opacity-40" />
      <p className="text-muted-foreground">Aucune livraison</p>
      <Button variant="outline" onClick={onOpenSheet}>
        Créer une livraison
      </Button>
    </div>
  )
}
