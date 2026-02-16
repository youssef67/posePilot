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
import { EditLivraisonSheet } from '@/components/EditLivraisonSheet'
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
            <Input
              placeholder="Fournisseur (optionnel)"
              value={actions.livraisonFournisseur}
              onChange={(e) => actions.setLivraisonFournisseur(e.target.value)}
              aria-label="Fournisseur"
              className="mt-2"
            />
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

      <EditLivraisonSheet
        open={actions.showEditSheet}
        onOpenChange={actions.setShowEditSheet}
        description={actions.editDescription}
        onDescriptionChange={actions.setEditDescription}
        fournisseur={actions.editFournisseur}
        onFournisseurChange={actions.setEditFournisseur}
        datePrevue={actions.editDatePrevue}
        onDatePrevueChange={actions.setEditDatePrevue}
        error={actions.editError}
        onErrorChange={actions.setEditError}
        onConfirm={actions.handleConfirmEdit}
        isPending={actions.updateLivraisonPending}
      />

      <Sheet open={actions.showDeleteSheet} onOpenChange={actions.setShowDeleteSheet}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>
              {actions.deleteLinkedBesoins.length > 0
                ? 'Supprimer la livraison'
                : 'Supprimer cette livraison ?'}
            </SheetTitle>
            <SheetDescription>
              {actions.livraisonToDelete?.description}
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 flex flex-col gap-3">
            {actions.deleteLinkedBesoins.length > 0 && (
              <>
                <p className="text-sm text-muted-foreground">
                  Cette livraison a {actions.deleteLinkedBesoins.length} besoin{actions.deleteLinkedBesoins.length > 1 ? 's' : ''} rattaché{actions.deleteLinkedBesoins.length > 1 ? 's' : ''} :
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 pl-4">
                  {actions.deleteLinkedBesoins.map((b) => (
                    <li key={b.id} className="truncate">{b.description}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
          <SheetFooter className="flex-col gap-2 sm:flex-col">
            {actions.deleteLinkedBesoins.length > 0 ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => actions.handleConfirmDelete('release-besoins')}
                  disabled={actions.deleteLivraisonPending}
                  className="w-full"
                >
                  Repasser en besoins
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => actions.handleConfirmDelete('delete-all')}
                  disabled={actions.deleteLivraisonPending}
                  className="w-full"
                >
                  Supprimer définitivement
                </Button>
              </>
            ) : (
              <Button
                variant="destructive"
                onClick={() => actions.handleConfirmDelete('release-besoins')}
                disabled={actions.deleteLivraisonPending}
                className="w-full"
              >
                Supprimer
              </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}
