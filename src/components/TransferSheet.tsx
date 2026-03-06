import { useState } from 'react'
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
import { usePlots } from '@/lib/queries/usePlots'
import { useEtages } from '@/lib/queries/useEtages'
import { useLots } from '@/lib/queries/useLots'
import { useTransferInventaire } from '@/lib/mutations/useTransferInventaire'
import type { InventaireWithLocation } from '@/lib/queries/useInventaire'

interface TransferSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: InventaireWithLocation | null
  direction: 'to-etage' | 'to-general' | 'to-lot'
  chantierId: string
  plotId?: string
  etageId?: string
  etageName?: string
}

export function TransferSheet({
  open,
  onOpenChange,
  item,
  direction,
  chantierId,
  plotId,
  etageId,
  etageName,
}: TransferSheetProps) {
  const [selectedPlotId, setSelectedPlotId] = useState('')
  const [selectedEtageId, setSelectedEtageId] = useState('')
  const [selectedLotId, setSelectedLotId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const transfer = useTransferInventaire()

  const { data: plots } = usePlots(chantierId)
  const { data: etages } = useEtages(selectedPlotId)
  const { data: allLots } = useLots(plotId ?? '')
  const etageLots = allLots?.filter((l) => l.etage_id === etageId) ?? []
  const selectedLot = etageLots.find((l) => l.id === selectedLotId)

  const maxQty = item?.quantite ?? 0
  const qty = parseInt(quantity, 10)
  const isValidQty = !isNaN(qty) && qty > 0 && qty <= maxQty
  const canSubmit =
    direction === 'to-general'
      ? isValidQty
      : direction === 'to-lot'
        ? isValidQty && !!selectedLotId
        : isValidQty && !!selectedPlotId && !!selectedEtageId

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setSelectedPlotId('')
      setSelectedEtageId('')
      setSelectedLotId('')
      setQuantity('1')
    }
    onOpenChange(nextOpen)
  }

  function handlePlotChange(plotId: string) {
    setSelectedPlotId(plotId)
    setSelectedEtageId('')
  }

  function handleSubmit() {
    if (!item || !canSubmit) return

    const targetPlotId =
      direction === 'to-general' ? null : direction === 'to-lot' ? plotId! : selectedPlotId
    const targetEtageId =
      direction === 'to-general' ? null : direction === 'to-lot' ? etageId! : selectedEtageId
    const targetLotId = direction === 'to-lot' ? selectedLotId : null

    transfer.mutate(
      {
        sourceId: item.id,
        quantity: qty,
        targetPlotId,
        targetEtageId,
        targetLotId,
        chantierId,
      },
      {
        onSuccess: () => {
          const msg =
            direction === 'to-lot'
              ? `${qty}× ${item.designation} transférés vers Lot ${selectedLot?.code}`
              : direction === 'to-etage'
                ? `${qty}× ${item.designation} transférés vers ${etages?.find((e) => e.id === selectedEtageId)?.nom}`
                : `${qty}× ${item.designation} retournés au stock général`
          toast(msg)
          handleOpenChange(false)
        },
        onError: () => toast.error('Erreur lors du transfert'),
      },
    )
  }

  if (!item) return null

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>
            {direction === 'to-lot'
              ? 'Transférer vers un lot'
              : direction === 'to-etage'
                ? 'Transférer vers un étage'
                : 'Retourner au stockage général'}
          </SheetTitle>
          <SheetDescription>
            {direction === 'to-lot'
              ? `${item.designation} (${maxQty} en stock sur ${etageName ?? ''})`
              : `${item.designation} (${maxQty} en stock)`}
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 space-y-4">
          {direction === 'to-etage' && (
            <>
              <div>
                <label className="text-sm font-medium text-foreground">Plot</label>
                <Select value={selectedPlotId} onValueChange={handlePlotChange}>
                  <SelectTrigger aria-label="Sélectionner un plot">
                    <SelectValue placeholder="Sélectionner un plot" />
                  </SelectTrigger>
                  <SelectContent>
                    {plots?.map((plot) => (
                      <SelectItem key={plot.id} value={plot.id}>
                        {plot.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Étage</label>
                <Select
                  value={selectedEtageId}
                  onValueChange={setSelectedEtageId}
                  disabled={!selectedPlotId}
                >
                  <SelectTrigger aria-label="Sélectionner un étage">
                    <SelectValue placeholder="Sélectionner un étage" />
                  </SelectTrigger>
                  <SelectContent>
                    {etages?.map((etage) => (
                      <SelectItem key={etage.id} value={etage.id}>
                        {etage.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          {direction === 'to-lot' && (
            <div>
              <label className="text-sm font-medium text-foreground">Lot</label>
              <Select value={selectedLotId} onValueChange={setSelectedLotId}>
                <SelectTrigger aria-label="Sélectionner un lot">
                  <SelectValue placeholder="Sélectionner un lot" />
                </SelectTrigger>
                <SelectContent>
                  {etageLots.map((lot) => (
                    <SelectItem key={lot.id} value={lot.id}>
                      Lot {lot.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <label htmlFor="transfer-qty" className="text-sm font-medium text-foreground">
              Quantité
            </label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                id="transfer-qty"
                type="number"
                inputMode="numeric"
                min={1}
                max={maxQty}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(String(maxQty))}
              >
                Tout
              </Button>
            </div>
            {!isNaN(qty) && qty > maxQty && (
              <p className="text-sm text-destructive mt-1">
                Maximum {maxQty} disponibles
              </p>
            )}
            {!isNaN(qty) && qty <= 0 && quantity !== '' && (
              <p className="text-sm text-destructive mt-1">
                La quantité doit être supérieure à 0
              </p>
            )}
          </div>
        </div>
        <SheetFooter>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || transfer.isPending}
            className="w-full"
          >
            {direction === 'to-lot'
              ? `Transférer ${isValidQty ? qty : ''} unité${qty > 1 ? 's' : ''}${selectedLot ? ` vers Lot ${selectedLot.code}` : ''}`
              : direction === 'to-etage'
                ? `Transférer ${isValidQty ? qty : ''} unité${qty > 1 ? 's' : ''}`
                : `Retourner ${isValidQty ? qty : ''} unité${qty > 1 ? 's' : ''}`}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
