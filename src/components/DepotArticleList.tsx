import { Warehouse, Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { DepotArticleWithCump } from '@/lib/queries/useDepotArticles'

const formatEUR = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })

interface DepotArticleListProps {
  articles: DepotArticleWithCump[] | undefined
  isLoading: boolean
  onOpenSheet: () => void
  onIncrement: (article: DepotArticleWithCump) => void
  onDecrement: (article: DepotArticleWithCump) => void
  onArticleClick?: (article: DepotArticleWithCump) => void
}

export function DepotArticleList({
  articles,
  isLoading,
  onOpenSheet,
  onIncrement,
  onDecrement,
  onArticleClick,
}: DepotArticleListProps) {
  function handleDecrement(article: DepotArticleWithCump) {
    if (article.quantite <= 0) return
    onDecrement(article)
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border p-4 animate-pulse">
            <div className="h-4 w-3/4 rounded bg-muted mb-2" />
            <div className="h-3 w-1/2 rounded bg-muted mb-2" />
            <div className="h-3 w-1/3 rounded bg-muted" />
          </div>
        ))}
      </div>
    )
  }

  if (!articles || articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <Warehouse className="h-10 w-10 text-muted-foreground opacity-40" />
        <p className="text-muted-foreground">Aucun article au dépôt</p>
        <Button variant="outline" onClick={onOpenSheet}>
          Ajouter un article
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {articles.map((article) => (
          <div
            key={article.id}
            role="button"
            tabIndex={0}
            className="rounded-lg border border-border p-4 cursor-pointer active:bg-muted/50 transition-colors"
            onClick={() => onArticleClick?.(article)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onArticleClick?.(article) } }}
            aria-label={`Détail ${article.designation}`}
          >
            <p className="text-sm font-medium text-foreground">{article.designation}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {article.quantite} {article.unite ?? ''}{article.unite ? ' · ' : ''}CUMP : {article.cump != null ? formatEUR.format(article.cump) : '—'}
            </p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">
                Valeur : {formatEUR.format(article.valeur_totale)}
              </span>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 min-w-[48px]"
                  onClick={() => handleDecrement(article)}
                  disabled={article.quantite <= 0}
                  aria-label={`Diminuer ${article.designation}`}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center text-sm font-medium tabular-nums">
                  {article.quantite}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 min-w-[48px]"
                  onClick={() => onIncrement(article)}
                  aria-label={`Augmenter ${article.designation}`}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

    </>
  )
}
