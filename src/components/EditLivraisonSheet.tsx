import { useMemo } from 'react'
import { Euro } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import type { LinkedBesoinWithChantier } from '@/lib/queries/useAllLinkedBesoins'

const montantFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
})

interface EditLivraisonSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  description: string
  onDescriptionChange: (value: string) => void
  fournisseur: string
  onFournisseurChange: (value: string) => void
  datePrevue: string
  onDatePrevueChange: (value: string) => void
  montantTtc: string
  onMontantTtcChange: (value: string) => void
  error: string
  onErrorChange: (value: string) => void
  onConfirm: () => void
  isPending: boolean
  linkedBesoins?: LinkedBesoinWithChantier[]
  besoinMontants?: Record<string, string>
  onBesoinMontantChange?: (besoinId: string, value: string) => void
}

export function EditLivraisonSheet({
  open,
  onOpenChange,
  description,
  onDescriptionChange,
  fournisseur,
  onFournisseurChange,
  datePrevue,
  onDatePrevueChange,
  montantTtc,
  onMontantTtcChange,
  error,
  onErrorChange,
  onConfirm,
  isPending,
  linkedBesoins,
  besoinMontants,
  onBesoinMontantChange,
}: EditLivraisonSheetProps) {
  const hasBesoins = linkedBesoins && linkedBesoins.length > 0 && besoinMontants && onBesoinMontantChange

  const calculatedTotal = useMemo(() => {
    if (!linkedBesoins || !besoinMontants) return 0
    return linkedBesoins.reduce((sum, b) => {
      const pu = parseFloat(besoinMontants[b.id] ?? '')
      if (isNaN(pu)) return sum
      return sum + (b.quantite ?? 1) * pu
    }, 0)
  }, [linkedBesoins, besoinMontants])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Modifier la livraison</SheetTitle>
          <SheetDescription>Modifiez les informations de la livraison.</SheetDescription>
        </SheetHeader>
        <div className="px-4 flex flex-col gap-3">
          <div>
            <label htmlFor="edit-livraison-description" className="text-sm font-medium mb-1 block">Description</label>
            <Textarea
              id="edit-livraison-description"
              value={description}
              onChange={(e) => {
                onDescriptionChange(e.target.value)
                if (error) onErrorChange('')
              }}
              aria-label="Description de la livraison"
              aria-invalid={!!error}
              rows={3}
            />
            {error && (
              <p className="text-sm text-destructive mt-1">{error}</p>
            )}
          </div>
          <div>
            <label htmlFor="edit-livraison-fournisseur" className="text-sm font-medium mb-1 block">Fournisseur</label>
            <Input
              id="edit-livraison-fournisseur"
              value={fournisseur}
              onChange={(e) => onFournisseurChange(e.target.value)}
              placeholder="Optionnel"
              aria-label="Fournisseur"
            />
          </div>
          <div>
            <label htmlFor="edit-livraison-date" className="text-sm font-medium mb-1 block">Date prévue</label>
            <Input
              id="edit-livraison-date"
              type="date"
              value={datePrevue}
              onChange={(e) => onDatePrevueChange(e.target.value)}
              aria-label="Date prévue"
            />
          </div>

          {hasBesoins ? (
            <>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">Lignes de la livraison</span>
                {linkedBesoins.map((b) => {
                  const pu = parseFloat(besoinMontants[b.id] ?? '')
                  const lineTotal = !isNaN(pu) ? (b.quantite ?? 1) * pu : 0
                  return (
                    <div key={b.id} className="rounded-lg border border-border p-3 space-y-2">
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="text-sm text-foreground">{b.description}</span>
                          {(b.quantite ?? 1) > 1 && (
                            <span className="text-muted-foreground text-xs ml-1">×{b.quantite}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min="0"
                            placeholder="P.U."
                            value={besoinMontants[b.id] ?? ''}
                            onChange={(e) => onBesoinMontantChange(b.id, e.target.value)}
                            aria-label={`Montant unitaire ${b.description}`}
                            className="pr-8"
                          />
                          <Euro className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                        </div>
                        <span className="text-sm font-medium w-24 text-right">
                          {lineTotal > 0 ? montantFormatter.format(lineTotal) : '—'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
              {calculatedTotal > 0 && (
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="text-sm font-semibold">Total livraison</span>
                  <span className="text-sm font-semibold">{montantFormatter.format(calculatedTotal)}</span>
                </div>
              )}
            </>
          ) : (
            <div>
              <label htmlFor="edit-livraison-montant" className="text-sm font-medium mb-1 block">Montant TTC</label>
              <div className="relative">
                <Input
                  id="edit-livraison-montant"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={montantTtc}
                  onChange={(e) => onMontantTtcChange(e.target.value)}
                  placeholder="Optionnel"
                  aria-label="Montant TTC"
                  className="pr-8"
                />
                <Euro className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          )}
        </div>
        <SheetFooter>
          <Button
            onClick={onConfirm}
            disabled={isPending}
            className="w-full"
          >
            Enregistrer
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
