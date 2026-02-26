import { useState, useCallback, useMemo } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Building2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatusCard, STATUS_COLORS, StatusCardSkeleton } from '@/components/StatusCard'
import { GridFilterTabs } from '@/components/GridFilterTabs'
import { Fab } from '@/components/Fab'
import { useChantiers } from '@/lib/queries/useChantiers'
import { useAllLivraisons } from '@/lib/queries/useAllLivraisons'
import { useAllLinkedBesoins } from '@/lib/queries/useAllLinkedBesoins'
import type { ChantierRow } from '@/lib/queries/useChantier'
import { computeStatus } from '@/lib/utils/computeStatus'

const montantFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
})

export const Route = createFileRoute('/_authenticated/')({
  component: HomePage,
})

function HomePage() {
  const navigate = useNavigate()
  const { data: chantiers, isLoading } = useChantiers('active')
  const { data: allLivraisons } = useAllLivraisons()
  const { data: allLinkedBesoins } = useAllLinkedBesoins()

  const depensesParChantier = useMemo(() => {
    const map = new Map<string, number>()
    // Use besoins linked to livraisons as source of truth (covers mono and multi-chantier)
    for (const b of allLinkedBesoins ?? []) {
      if (b.montant_unitaire != null) {
        const amount = (b.quantite ?? 1) * b.montant_unitaire
        const cid = b.chantier_id ?? ''
        map.set(cid, (map.get(cid) ?? 0) + amount)
      }
    }
    // Fallback: livraisons without besoins that have montant_unitaire (legacy)
    const chantiersCoveredByBesoins = new Set<string>()
    for (const b of allLinkedBesoins ?? []) {
      if (b.livraison_id && b.montant_unitaire != null) {
        chantiersCoveredByBesoins.add(b.livraison_id)
      }
    }
    for (const l of allLivraisons ?? []) {
      if (l.montant_ttc != null && l.chantier_id && !chantiersCoveredByBesoins.has(l.id)) {
        map.set(l.chantier_id, (map.get(l.chantier_id) ?? 0) + l.montant_ttc)
      }
    }
    return map
  }, [allLivraisons, allLinkedBesoins])

  const all = (chantiers ?? []) as unknown as ChantierRow[]
  const [filtered, setFiltered] = useState<ChantierRow[]>([])

  const getProgress = useCallback(
    (c: ChantierRow) => ({ done: c.progress_done, total: c.progress_total }),
    [],
  )

  const getAlerts = useCallback(
    (c: ChantierRow) => c.has_blocking_note === true,
    [],
  )

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <h1 className="text-2xl font-semibold text-foreground">Chantiers</h1>

      {!isLoading && all.length > 0 && (
        <GridFilterTabs
          items={all}
          getProgress={getProgress}
          getAlerts={getAlerts}
          onFilteredChange={setFiltered}
          emptyMessage="Aucun chantier"
        />
      )}

      {isLoading && (
        <div className="flex flex-col gap-3">
          <StatusCardSkeleton />
          <StatusCardSkeleton />
          <StatusCardSkeleton />
        </div>
      )}

      {!isLoading && all.length === 0 && (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
          <Building2 className="size-12" />
          <p>Aucun chantier</p>
          <Button variant="outline" onClick={() => navigate({ to: '/chantiers/nouveau' })}>
            Créer un chantier
          </Button>
        </div>
      )}

      {!isLoading && all.length > 0 && (
        <div className="flex flex-col gap-3">
          {filtered.map((chantier) => {
            const isComplet = chantier.type === 'complet'
            const indicator = isComplet
              ? chantier.progress_total > 0
                ? `${Math.round((chantier.progress_done / chantier.progress_total) * 100)}%`
                : '0%'
              : undefined
            const depenses = depensesParChantier.get(chantier.id)

            return (
              <StatusCard
                key={chantier.id}
                title={chantier.nom}
                badge={
                  <Badge variant="secondary">
                    {isComplet ? 'Complet' : 'Léger'}
                  </Badge>
                }
                indicator={indicator}
                secondaryInfo={depenses ? montantFormatter.format(depenses * 1.2) : undefined}
                statusColor={STATUS_COLORS[computeStatus(chantier.progress_done, chantier.progress_total)]}
                isBlocked={chantier.has_blocking_note}
                onClick={() => navigate({ to: '/chantiers/$chantierId', params: { chantierId: chantier.id } })}
              />
            )
          })}
        </div>
      )}

      <Fab onClick={() => navigate({ to: '/chantiers/nouveau' })} />
    </div>
  )
}
