import { ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface ChantierLivraisonCardProps {
  chantierNom: string
  compteurs: {
    a_traiter: number
    en_cours: number
    termine: number
    total: number
  }
  onClick: () => void
}

const COMPTEUR_CONFIG = [
  { key: 'a_traiter' as const, label: 'à traiter', color: '#F59E0B' },
  { key: 'en_cours' as const, label: 'en cours', color: '#3B82F6' },
  { key: 'termine' as const, label: 'terminé', color: '#10B981', plural: 'terminés' },
]

export function ChantierLivraisonCard({ chantierNom, compteurs, onClick }: ChantierLivraisonCardProps) {
  return (
    <Card className="py-3 cursor-pointer active:bg-accent/50 transition-colors" role="button" tabIndex={0} onClick={onClick} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-card-foreground truncate">{chantierNom}</span>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-sm font-medium text-muted-foreground">{compteurs.total}</span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {COMPTEUR_CONFIG.map(({ key, label, color, plural }) => {
            const count = compteurs[key]
            if (count === 0) return null
            const text = count > 1 && plural ? `${count} ${plural}` : `${count} ${label}`
            return (
              <span
                key={key}
                className="text-sm font-medium"
                style={{ color }}
              >
                {text}
              </span>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export function ChantierLivraisonCardSkeleton() {
  return (
    <Card aria-hidden="true" className="py-3 animate-pulse">
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="h-4 w-40 rounded bg-muted" />
          <div className="h-4 w-6 rounded bg-muted" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-3.5 w-20 rounded bg-muted" />
          <div className="h-3.5 w-16 rounded bg-muted" />
          <div className="h-3.5 w-18 rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  )
}
