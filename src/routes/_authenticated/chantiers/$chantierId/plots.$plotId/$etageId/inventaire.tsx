import { useState, useMemo } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Fab } from '@/components/Fab'
import { InventaireList } from '@/components/InventaireList'
import { TransferSheet } from '@/components/TransferSheet'
import { useRealtimeInventaire } from '@/lib/subscriptions/useRealtimeInventaire'
import { useCreateInventaire } from '@/lib/mutations/useCreateInventaire'
import { useUpdateInventaire } from '@/lib/mutations/useUpdateInventaire'
import { useDeleteInventaire } from '@/lib/mutations/useDeleteInventaire'
import { useInventaire } from '@/lib/queries/useInventaire'
import { useEtages } from '@/lib/queries/useEtages'
import { useLots } from '@/lib/queries/useLots'
import type { InventaireWithLocation } from '@/lib/queries/useInventaire'

export const Route = createFileRoute(
  '/_authenticated/chantiers/$chantierId/plots/$plotId/$etageId/inventaire',
)({
  component: EtageInventairePage,
})

function EtageInventairePage() {
  const { chantierId, plotId, etageId } = Route.useParams()
  const { data: etages } = useEtages(plotId)
  const etage = etages?.find((e) => e.id === etageId)
  const { data: items, isLoading } = useInventaire(chantierId, { type: 'etage', etageId })
  useRealtimeInventaire(chantierId)
  const createInventaire = useCreateInventaire()
  const updateInventaire = useUpdateInventaire()
  const deleteInventaire = useDeleteInventaire()

  const { data: allLots } = useLots(plotId)
  const etageLots = useMemo(
    () => allLots?.filter((l) => l.etage_id === etageId) ?? [],
    [allLots, etageId],
  )

  const [showSheet, setShowSheet] = useState(false)
  const [editingItem, setEditingItem] = useState<InventaireWithLocation | null>(null)
  const [designation, setDesignation] = useState('')
  const [quantite, setQuantite] = useState('1')
  const [selectedLotId, setSelectedLotId] = useState('')
  const [errors, setErrors] = useState<{ designation?: string; quantite?: string }>({})
  const [transferItem, setTransferItem] = useState<InventaireWithLocation | null>(null)
  const [showTransferSheet, setShowTransferSheet] = useState(false)
  const [transferDirection, setTransferDirection] = useState<'to-general' | 'to-lot'>('to-general')

  function handleOpenSheet() {
    setEditingItem(null)
    setDesignation('')
    setQuantite('1')
    setSelectedLotId('')
    setErrors({})
    setShowSheet(true)
  }

  function handleEdit(item: InventaireWithLocation) {
    setEditingItem(item)
    setDesignation(item.designation)
    setQuantite(String(item.quantite))
    setSelectedLotId(item.lot_id ?? '')
    setErrors({})
    setShowSheet(true)
  }

  function handleSubmit() {
    const trimmedDesignation = designation.trim()
    const qty = parseInt(quantite, 10)
    const newErrors: { designation?: string; quantite?: string } = {}

    if (!trimmedDesignation) {
      newErrors.designation = 'La désignation est requise'
    }
    if (!qty || qty <= 0) {
      newErrors.quantite = 'La quantité doit être supérieure à 0'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    if (editingItem) {
      updateInventaire.mutate(
        {
          id: editingItem.id,
          chantierId,
          designation: trimmedDesignation,
          quantite: qty,
          lotId: selectedLotId && selectedLotId !== 'none' ? selectedLotId : null,
        },
        {
          onSuccess: () => {
            setShowSheet(false)
            toast('Matériel modifié')
          },
          onError: () => toast.error('Erreur lors de la modification'),
        },
      )
    } else {
      createInventaire.mutate(
        {
          chantierId,
          plotId,
          etageId,
          lotId: selectedLotId && selectedLotId !== 'none' ? selectedLotId : null,
          designation: trimmedDesignation,
          quantite: qty,
        },
        {
          onSuccess: () => {
            setShowSheet(false)
            toast('Matériel ajouté')
          },
          onError: () => toast.error("Erreur lors de l'ajout du matériel"),
        },
      )
    }
  }

  function handleIncrement(item: InventaireWithLocation) {
    updateInventaire.mutate({
      id: item.id,
      quantite: item.quantite + 1,
      chantierId,
    })
  }

  function handleDecrement(item: InventaireWithLocation) {
    updateInventaire.mutate({
      id: item.id,
      quantite: item.quantite - 1,
      chantierId,
    })
  }

  function handleDelete(item: InventaireWithLocation) {
    deleteInventaire.mutate(
      { id: item.id, chantierId, plotId: item.plot_id },
      {
        onSuccess: () => toast('Matériel supprimé'),
        onError: () => toast.error('Erreur lors de la suppression'),
      },
    )
  }

  function handleTransfer(item: InventaireWithLocation) {
    setTransferDirection('to-general')
    setTransferItem(item)
    setShowTransferSheet(true)
  }

  function handleTransferToLot(item: InventaireWithLocation) {
    setTransferDirection('to-lot')
    setTransferItem(item)
    setShowTransferSheet(true)
  }

  const uniqueDesignations = items
    ? new Set(items.map((i) => i.designation.trim().toLowerCase())).size
    : 0

  return (
    <div className="flex flex-col min-h-[calc(100vh-56px-env(safe-area-inset-bottom))]">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <Button variant="ghost" size="icon" asChild>
          <Link
            to="/chantiers/$chantierId/plots/$plotId/$etageId"
            params={{ chantierId, plotId, etageId }}
            aria-label="Retour"
          >
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <h1 className="text-lg font-semibold text-foreground truncate">
          Inventaire{etage ? ` — ${etage.nom}` : ''}
        </h1>
      </header>

      <div className="flex-1 p-4">
        <h2 className="text-base font-semibold text-foreground mb-3">
          {items && items.length > 0
            ? `${uniqueDesignations} matériaux enregistrés`
            : 'Inventaire'}
        </h2>

        <InventaireList
          items={items}
          isLoading={isLoading}
          aggregated={true}
          onOpenSheet={handleOpenSheet}
          onEdit={handleEdit}
          onIncrement={handleIncrement}
          onDecrement={handleDecrement}
          onDelete={handleDelete}
          onTransfer={handleTransfer}
          transferLabel="Retourner"
          onTransferToLot={handleTransferToLot}
          showSourceBadge={true}
        />

        <Fab onClick={handleOpenSheet} />
      </div>

      <Sheet open={showSheet} onOpenChange={setShowSheet}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>{editingItem ? 'Modifier le matériel' : 'Nouveau matériel'}</SheetTitle>
            <SheetDescription>
              {editingItem
                ? 'Modifiez les informations du matériel.'
                : `Ajoutez du matériel à l'inventaire${etage ? ` de ${etage.nom}` : ''}.`}
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 space-y-4">
            <div>
              <label htmlFor="designation" className="text-sm font-medium text-foreground">
                Désignation
              </label>
              <Input
                id="designation"
                placeholder="Ex: Colle pour faïence 20kg"
                value={designation}
                onChange={(e) => {
                  setDesignation(e.target.value)
                  if (errors.designation) setErrors((prev) => ({ ...prev, designation: undefined }))
                }}
                aria-invalid={!!errors.designation}
              />
              {errors.designation && (
                <p className="text-sm text-destructive mt-1">{errors.designation}</p>
              )}
            </div>
            <div>
              <label htmlFor="quantite" className="text-sm font-medium text-foreground">
                Quantité
              </label>
              <Input
                id="quantite"
                type="number"
                inputMode="numeric"
                min={1}
                value={quantite}
                onChange={(e) => {
                  setQuantite(e.target.value)
                  if (errors.quantite) setErrors((prev) => ({ ...prev, quantite: undefined }))
                }}
                aria-invalid={!!errors.quantite}
              />
              {errors.quantite && (
                <p className="text-sm text-destructive mt-1">{errors.quantite}</p>
              )}
            </div>
            {etageLots.length > 0 && (
              <div>
                <label className="text-sm font-medium text-foreground">Lot (optionnel)</label>
                <Select value={selectedLotId} onValueChange={setSelectedLotId}>
                  <SelectTrigger aria-label="Sélectionner un lot">
                    <SelectValue placeholder="Aucun lot" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun lot</SelectItem>
                    {etageLots.map((lot) => (
                      <SelectItem key={lot.id} value={lot.id}>
                        Lot {lot.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <SheetFooter>
            <Button
              onClick={handleSubmit}
              disabled={createInventaire.isPending || updateInventaire.isPending}
              className="w-full"
            >
              {editingItem ? 'Enregistrer' : 'Ajouter le matériel'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <TransferSheet
        open={showTransferSheet}
        onOpenChange={setShowTransferSheet}
        item={transferItem}
        direction={transferDirection}
        chantierId={chantierId}
        plotId={plotId}
        etageId={etageId}
        etageName={etage?.nom}
      />
    </div>
  )
}
