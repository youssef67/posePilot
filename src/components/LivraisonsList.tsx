import { Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DeliveryCard, DeliveryCardSkeleton } from '@/components/DeliveryCard'
import type { Besoin, Livraison } from '@/types/database'

interface LivraisonsListProps {
  livraisons: Livraison[] | undefined
  isLoading: boolean
  chantierId: string
  onOpenSheet: () => void
  onMarquerPrevu: (id: string) => void
  onConfirmerLivraison: (id: string) => void
  onEdit?: (livraison: Livraison) => void
  onDelete?: (livraison: Livraison, linkedBesoins: Besoin[]) => void
  besoinsMap?: Map<string, Besoin[]>
}

export function LivraisonsList({
  livraisons,
  isLoading,
  chantierId,
  onOpenSheet,
  onMarquerPrevu,
  onConfirmerLivraison,
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
            onEdit={onEdit}
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
