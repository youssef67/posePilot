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
import type { useLivraisonActions } from '@/lib/hooks/useLivraisonActions'

interface LivraisonSheetsProps {
  actions: ReturnType<typeof useLivraisonActions>
}

export function LivraisonSheets({ actions }: LivraisonSheetsProps) {
  return (
    <>
      <Sheet open={actions.showLivraisonSheet} onOpenChange={actions.setShowLivraisonSheet}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Nouvelle livraison</SheetTitle>
            <SheetDescription>
              Décrivez la livraison à créer.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4">
            <Textarea
              placeholder="Ex: Colle pour faïence 20kg"
              value={actions.livraisonDescription}
              onChange={(e) => {
                actions.setLivraisonDescription(e.target.value)
              }}
              aria-label="Description de la livraison"
              aria-invalid={!!actions.livraisonError}
              rows={3}
            />
            {actions.livraisonError && (
              <p className="text-sm text-destructive mt-1">{actions.livraisonError}</p>
            )}
          </div>
          <SheetFooter>
            <Button
              onClick={actions.handleCreateLivraison}
              disabled={actions.createLivraisonPending}
              className="w-full"
            >
              Créer la livraison
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={actions.showDateSheet} onOpenChange={actions.setShowDateSheet}>
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
              value={actions.datePrevue}
              onChange={(e) => actions.setDatePrevue(e.target.value)}
              aria-label="Date prévue"
            />
          </div>
          <SheetFooter>
            <Button
              onClick={actions.handleConfirmDatePrevue}
              disabled={!actions.datePrevue || actions.updateStatusPending}
              className="w-full"
            >
              Marquer comme prévu
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}
