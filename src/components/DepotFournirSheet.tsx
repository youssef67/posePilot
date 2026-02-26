import { useState, useMemo } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { Besoin } from '@/types/database'
import type { DepotArticleWithCump } from '@/lib/queries/useDepotArticles'

interface DepotFournirSheetProps {
  besoin: Besoin | null
  chantierNom?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (params: { besoinId: string; articleId: string; quantite: number }) => void
  articles: DepotArticleWithCump[]
  isPending?: boolean
}

const eurFormat = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })

export function DepotFournirSheet({
  besoin,
  chantierNom,
  open,
  onOpenChange,
  onConfirm,
  articles,
  isPending = false,
}: DepotFournirSheetProps) {
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null)
  const [acceptPartial, setAcceptPartial] = useState(false)

  const availableArticles = useMemo(() => {
    const available = articles.filter((a) => a.quantite > 0)
    if (!besoin) return available

    const desc = besoin.description.toLowerCase()
    return [...available].sort((a, b) => {
      const aMatch = a.designation.toLowerCase().includes(desc) || desc.includes(a.designation.toLowerCase())
      const bMatch = b.designation.toLowerCase().includes(desc) || desc.includes(b.designation.toLowerCase())
      if (aMatch && !bMatch) return -1
      if (!aMatch && bMatch) return 1
      return 0
    })
  }, [articles, besoin])

  const selectedArticle = availableArticles.find((a) => a.id === selectedArticleId) ?? null
  const besoinQty = besoin?.quantite ?? 0
  const stockInsuffisant = selectedArticle ? selectedArticle.quantite < besoinQty : false
  const quantiteEffective = stockInsuffisant
    ? (acceptPartial ? selectedArticle!.quantite : 0)
    : besoinQty
  const montant = selectedArticle?.cump != null && quantiteEffective > 0
    ? quantiteEffective * selectedArticle.cump
    : 0
  const canConfirm = selectedArticle != null && quantiteEffective > 0 && (!stockInsuffisant || acceptPartial)

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setSelectedArticleId(null)
      setAcceptPartial(false)
    }
    onOpenChange(nextOpen)
  }

  function handleConfirm() {
    if (!besoin || !selectedArticle || !canConfirm) return
    onConfirm({
      besoinId: besoin.id,
      articleId: selectedArticle.id,
      quantite: quantiteEffective,
    })
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Fournir depuis le dépôt</SheetTitle>
          <SheetDescription>
            {besoin?.description} ({besoinQty} unité{besoinQty > 1 ? 's' : ''})
            {chantierNom ? ` — ${chantierNom}` : ''}
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 flex flex-col gap-3">
          <p className="text-sm font-medium text-foreground">
            Articles disponibles au dépôt :
          </p>
          {availableArticles.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun article disponible au dépôt.</p>
          )}
          <div className="flex flex-col gap-2">
            {availableArticles.map((article) => {
              const isSelected = article.id === selectedArticleId
              const isMatch = besoin
                ? (article.designation.toLowerCase().includes(besoin.description.toLowerCase()) ||
                   besoin.description.toLowerCase().includes(article.designation.toLowerCase()))
                : false
              return (
                <button
                  key={article.id}
                  type="button"
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                  onClick={() => {
                    setSelectedArticleId(article.id)
                    setAcceptPartial(false)
                  }}
                  aria-pressed={isSelected}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {article.designation}
                      {isMatch && (
                        <span className="ml-2 text-xs text-primary font-normal">correspondance</span>
                      )}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {article.quantite} {article.unite ?? 'unité(s)'} · CUMP: {article.cump != null ? eurFormat.format(article.cump) : '—'}
                  </span>
                </button>
              )
            })}
          </div>

          {selectedArticle && stockInsuffisant && (
            <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-950">
              <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Stock insuffisant ({selectedArticle.quantite} disponible sur {besoinQty})
                </p>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-amber-700 dark:text-amber-300"
                  onClick={() => setAcceptPartial(true)}
                >
                  Fournir partiellement ({selectedArticle.quantite} unité{selectedArticle.quantite > 1 ? 's' : ''})
                </Button>
              </div>
            </div>
          )}

          {selectedArticle && montant > 0 && (
            <div className="flex items-center justify-between border-t pt-2">
              <span className="text-sm font-semibold">Montant</span>
              <span className="text-sm font-semibold" data-testid="montant-total">
                {quantiteEffective} × {eurFormat.format(selectedArticle.cump ?? 0)} = {eurFormat.format(montant)}
              </span>
            </div>
          )}
        </div>
        <SheetFooter>
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm || isPending}
            className="w-full"
          >
            {isPending ? 'Transfert...' : 'Fournir'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
