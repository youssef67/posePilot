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

interface EditLivraisonSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  description: string
  onDescriptionChange: (value: string) => void
  fournisseur: string
  onFournisseurChange: (value: string) => void
  datePrevue: string
  onDatePrevueChange: (value: string) => void
  error: string
  onErrorChange: (value: string) => void
  onConfirm: () => void
  isPending: boolean
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
  error,
  onErrorChange,
  onConfirm,
  isPending,
}: EditLivraisonSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
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
