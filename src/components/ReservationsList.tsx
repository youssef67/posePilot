import { useState, useMemo } from 'react'
import { useReservations } from '@/lib/queries/useReservations'
import { ReservationCard } from '@/components/ReservationCard'

type FilterTab = 'ouvertes' | 'toutes' | 'resolues'

interface ReservationsListProps {
  lotId: string
}

export function ReservationsList({ lotId }: ReservationsListProps) {
  const { data: reservations, isLoading } = useReservations(lotId)
  const [activeFilter, setActiveFilter] = useState<FilterTab>('ouvertes')

  const counts = useMemo(() => {
    if (!reservations) return { ouvertes: 0, toutes: 0, resolues: 0 }
    return {
      ouvertes: reservations.filter((r) => r.status === 'ouvert').length,
      toutes: reservations.length,
      resolues: reservations.filter((r) => r.status === 'resolu').length,
    }
  }, [reservations])

  const filtered = useMemo(() => {
    if (!reservations) return []
    if (activeFilter === 'ouvertes') return reservations.filter((r) => r.status === 'ouvert')
    if (activeFilter === 'resolues') return reservations.filter((r) => r.status === 'resolu')
    return reservations
  }, [reservations, activeFilter])

  if (isLoading) {
    return (
      <div className="space-y-3" data-testid="reservations-skeleton">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    )
  }

  if (!reservations || reservations.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucune réserve</p>
  }

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'ouvertes', label: 'Ouvertes', count: counts.ouvertes },
    { key: 'toutes', label: 'Toutes', count: counts.toutes },
    { key: 'resolues', label: 'Résolues', count: counts.resolues },
  ]

  return (
    <div className="space-y-3">
      <div className="flex gap-1 rounded-lg bg-muted p-1" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeFilter === tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
              activeFilter === tab.key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {activeFilter === 'ouvertes'
            ? 'Aucune réserve ouverte'
            : activeFilter === 'resolues'
              ? 'Aucune réserve résolue'
              : 'Aucune réserve'}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((reservation) => (
            <ReservationCard
              key={reservation.id}
              reservation={reservation}
              lotId={lotId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
