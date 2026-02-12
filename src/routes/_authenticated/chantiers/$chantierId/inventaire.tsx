import { useState } from 'react'
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
import { useRealtimeInventaire } from '@/lib/subscriptions/useRealtimeInventaire'
import { useCreateInventaire } from '@/lib/mutations/useCreateInventaire'
import { useUpdateInventaire } from '@/lib/mutations/useUpdateInventaire'
import { useDeleteInventaire } from '@/lib/mutations/useDeleteInventaire'
import { useInventaire } from '@/lib/queries/useInventaire'
import { useChantier } from '@/lib/queries/useChantier'
import { usePlots } from '@/lib/queries/usePlots'
import { useEtages } from '@/lib/queries/useEtages'
import type { InventaireWithLocation } from '@/lib/queries/useInventaire'

export const Route = createFileRoute(
  '/_authenticated/chantiers/$chantierId/inventaire',
)({
  validateSearch: (search: Record<string, unknown>) => ({
    plotId: typeof search.plotId === 'string' ? search.plotId : undefined,
    etageId: typeof search.etageId === 'string' ? search.etageId : undefined,
  }),
  component: InventairePage,
})

function InventairePage() {
  const { chantierId } = Route.useParams()
  const { plotId: defaultPlotId, etageId: defaultEtageId } = Route.useSearch()
  const { data: chantier } = useChantier(chantierId)
  const { data: items, isLoading } = useInventaire(chantierId)
  useRealtimeInventaire(chantierId)
  const createInventaire = useCreateInventaire()
  const updateInventaire = useUpdateInventaire()
  const deleteInventaire = useDeleteInventaire()

  const [showSheet, setShowSheet] = useState(false)
  const [designation, setDesignation] = useState('')
  const [quantite, setQuantite] = useState('1')
  const [selectedPlotId, setSelectedPlotId] = useState(defaultPlotId ?? '')
  const [selectedEtageId, setSelectedEtageId] = useState(defaultEtageId ?? '')
  const [errors, setErrors] = useState<{ designation?: string; quantite?: string; plot?: string; etage?: string }>({})

  const { data: plots } = usePlots(chantierId)
  const { data: etages } = useEtages(selectedPlotId)

  function handleOpenSheet() {
    setDesignation('')
    setQuantite('1')
    setSelectedPlotId(defaultPlotId ?? '')
    setSelectedEtageId(defaultEtageId ?? '')
    setErrors({})
    setShowSheet(true)
  }

  function handlePlotChange(plotId: string) {
    setSelectedPlotId(plotId)
    setSelectedEtageId('')
  }

  function handleCreate() {
    const trimmedDesignation = designation.trim()
    const qty = parseInt(quantite, 10)
    const newErrors: { designation?: string; quantite?: string; plot?: string; etage?: string } = {}

    if (!trimmedDesignation) {
      newErrors.designation = 'La désignation est requise'
    }
    if (!qty || qty <= 0) {
      newErrors.quantite = 'La quantité doit être supérieure à 0'
    }
    if (!selectedPlotId) {
      newErrors.plot = 'Le plot est requis'
    }
    if (!selectedEtageId) {
      newErrors.etage = "L'étage est requis"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    createInventaire.mutate(
      {
        chantierId,
        plotId: selectedPlotId,
        etageId: selectedEtageId,
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
      { id: item.id, chantierId },
      {
        onSuccess: () => toast('Matériel supprimé'),
        onError: () => toast.error('Erreur lors de la suppression'),
      },
    )
  }

  const uniqueDesignations = items
    ? new Set(items.map((i) => i.designation.trim().toLowerCase())).size
    : 0

  return (
    <div className="flex flex-col min-h-[calc(100vh-56px-env(safe-area-inset-bottom))]">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <Button variant="ghost" size="icon" asChild>
          <Link
            to="/chantiers/$chantierId"
            params={{ chantierId }}
            aria-label="Retour"
          >
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <h1 className="text-lg font-semibold text-foreground truncate">
          Inventaire{chantier ? ` — ${chantier.nom}` : ''}
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
          onIncrement={handleIncrement}
          onDecrement={handleDecrement}
          onDelete={handleDelete}
        />

        <Fab onClick={handleOpenSheet} />
      </div>

      <Sheet open={showSheet} onOpenChange={setShowSheet}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Nouveau matériel</SheetTitle>
            <SheetDescription>
              Ajoutez du matériel à l&apos;inventaire du chantier.
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
            <div>
              <label className="text-sm font-medium text-foreground">Plot</label>
              <Select
                value={selectedPlotId}
                onValueChange={(v) => {
                  handlePlotChange(v)
                  if (errors.plot) setErrors((prev) => ({ ...prev, plot: undefined }))
                }}
              >
                <SelectTrigger aria-label="Sélectionner un plot" aria-invalid={!!errors.plot}>
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
              {errors.plot && (
                <p className="text-sm text-destructive mt-1">{errors.plot}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Étage</label>
              <Select
                value={selectedEtageId}
                onValueChange={(v) => {
                  setSelectedEtageId(v)
                  if (errors.etage) setErrors((prev) => ({ ...prev, etage: undefined }))
                }}
                disabled={!selectedPlotId}
              >
                <SelectTrigger aria-label="Sélectionner un étage" aria-invalid={!!errors.etage}>
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
              {errors.etage && (
                <p className="text-sm text-destructive mt-1">{errors.etage}</p>
              )}
            </div>
          </div>
          <SheetFooter>
            <Button
              onClick={handleCreate}
              disabled={createInventaire.isPending}
              className="w-full"
            >
              Ajouter le matériel
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
