import { useRef } from 'react'
import { Euro, FileText, Plus, Trash2, Warehouse, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { EditLivraisonSheet } from '@/components/EditLivraisonSheet'
import type { useLivraisonActions } from '@/lib/hooks/useLivraisonActions'

interface ChantierOption {
  id: string
  nom: string
}

interface LivraisonSheetsProps {
  actions: ReturnType<typeof useLivraisonActions>
  chantiers: ChantierOption[]
}

export function LivraisonSheets({ actions, chantiers }: LivraisonSheetsProps) {
  const bcFileInputRef = useRef<HTMLInputElement>(null)
  return (
    <>
      <Sheet open={actions.showLivraisonSheet} onOpenChange={actions.setShowLivraisonSheet}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Nouvelle livraison</SheetTitle>
            <SheetDescription>
              Ajoutez les items de la livraison avec leur montant unitaire.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 flex flex-col gap-3">
            <Input
              placeholder="Intitulé de la livraison (optionnel)"
              value={actions.livraisonDescription}
              onChange={(e) => {
                actions.setLivraisonDescription(e.target.value)
                if (actions.livraisonError) actions.setLivraisonError('')
              }}
              aria-label="Description de la livraison"
            />
            <Input
              placeholder="Fournisseur (optionnel)"
              value={actions.livraisonFournisseur}
              onChange={(e) => actions.setLivraisonFournisseur(e.target.value)}
              aria-label="Fournisseur"
            />

            <div className="flex items-center justify-between">
              <Label htmlFor="livraison-chantier-unique-toggle" className="text-sm">
                Chantier unique
              </Label>
              <Switch
                id="livraison-chantier-unique-toggle"
                checked={actions.livraisonChantierUnique}
                onCheckedChange={actions.setLivraisonChantierUnique}
              />
            </div>
            {actions.livraisonChantierUnique && (
              <Select value={actions.livraisonGlobalChantierId} onValueChange={actions.setLivraisonGlobalChantierId}>
                <SelectTrigger aria-label="Chantier global">
                  <SelectValue placeholder="Choisir un chantier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__depot__">
                    <span className="flex items-center gap-2">
                      <Warehouse className="h-4 w-4" />
                      Dépôt entreprise
                    </span>
                  </SelectItem>
                  {chantiers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="flex flex-col gap-2">
              {actions.livraisonLines.map((line, i) => {
                const pu = parseFloat(line.montantUnitaire)
                const qty = parseFloat(line.quantite)
                const rem = parseFloat(line.remise) || 0
                const lineTotal = !isNaN(pu) && !isNaN(qty) ? qty * pu * (1 - rem / 100) : 0
                return (
                  <div key={i} className="rounded-lg border border-border p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground w-5">{i + 1}</span>
                      <Input
                        placeholder="Description"
                        value={line.description}
                        onChange={(e) => {
                          actions.setLivraisonLines((prev) =>
                            prev.map((l, idx) => idx === i ? { ...l, description: e.target.value } : l),
                          )
                          if (actions.livraisonError) actions.setLivraisonError('')
                        }}
                        aria-label={`Description item ${i + 1}`}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={1}
                        value={line.quantite}
                        onChange={(e) => {
                          actions.setLivraisonLines((prev) =>
                            prev.map((l, idx) => idx === i ? { ...l, quantite: e.target.value } : l),
                          )
                        }}
                        aria-label={`Quantité item ${i + 1}`}
                        className="w-20"
                      />
                      {actions.livraisonLines.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-muted-foreground"
                          onClick={() => actions.setLivraisonLines((prev) => prev.filter((_, idx) => idx !== i))}
                          aria-label={`Supprimer item ${i + 1}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 pl-7">
                      <div className="relative flex-1">
                        <Input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min="0"
                          placeholder="P.U."
                          value={line.montantUnitaire}
                          onChange={(e) =>
                            actions.setLivraisonLines((prev) =>
                              prev.map((l, idx) => idx === i ? { ...l, montantUnitaire: e.target.value } : l),
                            )
                          }
                          aria-label={`Montant unitaire item ${i + 1}`}
                          className="pr-8"
                        />
                        <Euro className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                      </div>
                      <div className="relative w-16">
                        <Input
                          type="number"
                          inputMode="decimal"
                          min="0"
                          max="100"
                          placeholder="0"
                          value={line.remise}
                          onChange={(e) =>
                            actions.setLivraisonLines((prev) =>
                              prev.map((l, idx) => idx === i ? { ...l, remise: e.target.value } : l),
                            )
                          }
                          aria-label={`Remise item ${i + 1}`}
                          className="pr-6"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">%</span>
                      </div>
                      <span className="text-sm font-medium w-24 text-right">
                        {lineTotal > 0
                          ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(lineTotal)
                          : '—'}
                      </span>
                    </div>
                    {!actions.livraisonChantierUnique ? (
                      <div className="pl-7 flex items-center gap-2">
                        <Select
                          value={line.chantierId}
                          onValueChange={(v) =>
                            actions.setLivraisonLines((prev) =>
                              prev.map((l, idx) => idx === i ? { ...l, chantierId: v } : l),
                            )
                          }
                        >
                          <SelectTrigger aria-label={`Chantier item ${i + 1}`}>
                            <SelectValue placeholder="Choisir un chantier" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__depot__">
                              <span className="flex items-center gap-2">
                                <Warehouse className="h-4 w-4" />
                                Dépôt entreprise
                              </span>
                            </SelectItem>
                            {chantiers.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.nom}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {line.chantierId === '__depot__' && (
                          <Badge variant="secondary" className="shrink-0 gap-1">
                            <Warehouse className="h-3 w-3" />
                            Dépôt
                          </Badge>
                        )}
                      </div>
                    ) : actions.livraisonGlobalChantierId === '__depot__' ? (
                      <div className="pl-7">
                        <Badge variant="secondary" className="gap-1">
                          <Warehouse className="h-3 w-3" />
                          Dépôt
                        </Badge>
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => actions.setLivraisonLines((prev) => [...prev, {
                description: '',
                quantite: '1',
                montantUnitaire: '',
                remise: '',
                chantierId: actions.livraisonChantierUnique ? actions.livraisonGlobalChantierId : '',
              }])}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un item
            </Button>

            {actions.livraisonTotal > 0 && (
              <div className="flex items-center justify-between border-t pt-2">
                <span className="text-sm font-semibold">Total livraison</span>
                <span className="text-sm font-semibold">
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(actions.livraisonTotal)}
                </span>
              </div>
            )}

            {actions.livraisonError && (
              <p className="text-sm text-destructive">{actions.livraisonError}</p>
            )}

            <div>
              <input
                ref={bcFileInputRef}
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/heic"
                className="hidden"
                onChange={(e) => {
                  actions.setLivraisonBcFile(e.target.files?.[0] ?? null)
                  e.target.value = ''
                }}
              />
              {actions.livraisonBcFile ? (
                <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
                  <FileText className="size-4 text-emerald-500 shrink-0" />
                  <span className="text-sm truncate flex-1">{actions.livraisonBcFile.name}</span>
                  <button
                    type="button"
                    onClick={() => actions.setLivraisonBcFile(null)}
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                    aria-label="Retirer le fichier"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  type="button"
                  className="w-full justify-start gap-2"
                  onClick={() => bcFileInputRef.current?.click()}
                >
                  <FileText className="size-4" />
                  Bon de commande (optionnel)
                </Button>
              )}
            </div>
          </div>
          <SheetFooter>
            <Button
              onClick={actions.handleCreateLivraison}
              disabled={actions.createLivraisonPending}
              className="w-full"
            >
              {actions.createLivraisonPending ? 'Création...' : 'Créer la livraison'}
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
          <div className="px-4 flex flex-col gap-3">
            <Input
              type="date"
              value={actions.datePrevue}
              onChange={(e) => actions.setDatePrevue(e.target.value)}
              aria-label="Date prévue"
            />
            <div className="relative">
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="Montant TTC (optionnel)"
                value={actions.commandeMontant}
                onChange={(e) => actions.setCommandeMontant(e.target.value)}
                aria-label="Montant TTC"
                className="pr-8"
              />
              <Euro className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            </div>
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
        montantTtc={actions.editMontantTtc}
        onMontantTtcChange={actions.setEditMontantTtc}
        error={actions.editError}
        onErrorChange={actions.setEditError}
        onConfirm={actions.handleConfirmEdit}
        isPending={actions.updateLivraisonPending}
        linkedBesoins={actions.editLinkedBesoins}
        besoinMontants={actions.editBesoinMontants}
        onBesoinMontantChange={(besoinId, value) =>
          actions.setEditBesoinMontants((prev) => ({ ...prev, [besoinId]: value }))
        }
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
