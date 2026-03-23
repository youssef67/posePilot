import { useMemo, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, MapPin, Search, X } from 'lucide-react'
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Fab } from '@/components/Fab'
import { InventaireList } from '@/components/InventaireList'
import { TransferSheet } from '@/components/TransferSheet'
import { useRealtimeInventaire } from '@/lib/subscriptions/useRealtimeInventaire'
import { useCreateInventaire } from '@/lib/mutations/useCreateInventaire'
import { useUpdateInventaire } from '@/lib/mutations/useUpdateInventaire'
import { useDeleteInventaire } from '@/lib/mutations/useDeleteInventaire'
import { useInventaire } from '@/lib/queries/useInventaire'
import { useSearchInventaire } from '@/lib/queries/useSearchInventaire'
import { useChantier } from '@/lib/queries/useChantier'
import { useDebounce } from '@/lib/useDebounce'
import type { InventaireWithLocation } from '@/lib/queries/useInventaire'

export const Route = createFileRoute(
  '/_authenticated/chantiers/$chantierId/inventaire',
)({
  component: InventairePage,
})

function getLocationLabel(item: InventaireWithLocation): string {
  if (!item.plots) return 'Stockage général'
  const base = `${item.plots.nom} — ${item.etages?.nom ?? ''}`
  if (item.lots) return `${base} — Lot ${item.lots.code}`
  return base
}

function InventairePage() {
  const { chantierId } = Route.useParams()
  const { data: chantier } = useChantier(chantierId)
  const { data: items, isLoading } = useInventaire(chantierId, { type: 'general' })
  useRealtimeInventaire(chantierId)
  const createInventaire = useCreateInventaire()
  const updateInventaire = useUpdateInventaire()
  const deleteInventaire = useDeleteInventaire()

  const { data: allItems } = useInventaire(chantierId)

  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)
  const isSearchMode = debouncedSearch.trim().length >= 2
  const { data: searchResults, isLoading: isSearchLoading, isFetching: isSearchFetching } = useSearchInventaire(chantierId, debouncedSearch)

  const [showSheet, setShowSheet] = useState(false)
  const [editingItem, setEditingItem] = useState<InventaireWithLocation | null>(null)
  const [designation, setDesignation] = useState('')
  const [quantite, setQuantite] = useState('1')
  const [errors, setErrors] = useState<{ designation?: string; quantite?: string }>({})
  const [transferItem, setTransferItem] = useState<InventaireWithLocation | null>(null)
  const [showTransferSheet, setShowTransferSheet] = useState(false)

  function handleOpenSheet() {
    setEditingItem(null)
    setDesignation('')
    setQuantite('1')
    setErrors({})
    setShowSheet(true)
  }

  function handleEdit(item: InventaireWithLocation) {
    setEditingItem(item)
    setDesignation(item.designation)
    setQuantite(String(item.quantite))
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
          plotId: null,
          etageId: null,
          lotId: null,
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
    setTransferItem(item)
    setShowTransferSheet(true)
  }

  const { elsewhereMap, elsewhereOnly } = useMemo(() => {
    if (!allItems || isSearchMode) return { elsewhereMap: undefined, elsewhereOnly: [] as { designation: string; totalQuantite: number; items: InventaireWithLocation[] }[] }
    const generalKeys = new Set(
      (items ?? []).map((i) => i.designation.trim().toLowerCase()),
    )
    const grouped = new Map<string, { designation: string; items: InventaireWithLocation[] }>()
    for (const item of allItems) {
      if (item.plot_id === null && item.etage_id === null) continue
      const key = item.designation.trim().toLowerCase()
      const existing = grouped.get(key)
      if (existing) {
        existing.items.push(item)
      } else {
        grouped.set(key, { designation: item.designation, items: [item] })
      }
    }
    const elsewhereMapResult = new Map<string, { designation: string; quantite: number; locations: number }>()
    for (const [key, group] of grouped) {
      elsewhereMapResult.set(key, {
        designation: group.designation,
        quantite: group.items.reduce((sum, i) => sum + i.quantite, 0),
        locations: group.items.length,
      })
    }
    const onlyElsewhere = Array.from(grouped.entries())
      .filter(([key]) => !generalKeys.has(key))
      .map(([, g]) => ({
        designation: g.designation,
        totalQuantite: g.items.reduce((sum, i) => sum + i.quantite, 0),
        items: g.items.sort((a, b) => getLocationLabel(a).localeCompare(getLocationLabel(b))),
      }))
      .sort((a, b) => a.designation.localeCompare(b.designation))
    return { elsewhereMap: elsewhereMapResult, elsewhereOnly: onlyElsewhere }
  }, [allItems, items, isSearchMode])

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
          Stockage général{chantier ? ` — ${chantier.nom}` : ''}
        </h1>
      </header>

      <div className="flex-1 p-4">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un matériau…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-9"
            aria-label="Rechercher un matériau"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Effacer la recherche"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <h2 className="text-base font-semibold text-foreground mb-3">
          {isSearchMode
            ? `${searchResults?.length ?? 0} résultat${(searchResults?.length ?? 0) !== 1 ? 's' : ''} sur tout le chantier`
            : items && items.length > 0
              ? `${uniqueDesignations} matériaux enregistrés`
              : 'Inventaire'}
        </h2>

        {isSearchMode ? (
          searchResults && searchResults.length === 0 && !isSearchLoading && !isSearchFetching ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <Search className="h-10 w-10 text-muted-foreground opacity-40" />
              <p className="text-muted-foreground">
                Aucun matériau trouvé pour «&nbsp;{debouncedSearch.trim()}&nbsp;»
              </p>
            </div>
          ) : (
            <InventaireList
              items={searchResults}
              isLoading={isSearchLoading}
              aggregated={true}
              onOpenSheet={handleOpenSheet}
              onEdit={handleEdit}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
              onDelete={handleDelete}
              onTransfer={handleTransfer}
              transferLabel="Transférer"
            />
          )
        ) : (
          <>
            <InventaireList
              items={items}
              isLoading={isLoading}
              aggregated={true}
              elsewhereMap={elsewhereMap}
              onOpenSheet={handleOpenSheet}
              onEdit={handleEdit}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
              onDelete={handleDelete}
              onTransfer={handleTransfer}
              transferLabel="Transférer"
            />
            {elsewhereOnly.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                  Aussi sur le chantier
                </h3>
                <Accordion type="multiple" className="space-y-2">
                  {elsewhereOnly.map((group) => (
                    <AccordionItem
                      key={group.designation}
                      value={group.designation}
                      className="rounded-lg border border-border/50 bg-muted/30 px-4"
                    >
                      <AccordionTrigger className="py-3 hover:no-underline">
                        <div className="flex items-center justify-between flex-1 pr-2">
                          <span className="text-sm text-foreground">{group.designation}</span>
                          <span className="text-xs text-muted-foreground">
                            {group.totalQuantite} sur {group.items.length} localisation{group.items.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-3">
                        <div className="space-y-1">
                          {group.items.map((item) => (
                            <Link
                              key={item.id}
                              to="/chantiers/$chantierId/plots/$plotId/$etageId/inventaire"
                              params={{
                                chantierId,
                                plotId: item.plot_id!,
                                etageId: item.etage_id!,
                              }}
                              className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-muted/50 transition-colors"
                            >
                              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <MapPin className="h-3 w-3" />
                                {getLocationLabel(item)}
                              </span>
                              <span className="text-xs font-medium text-foreground">{item.quantite}</span>
                            </Link>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}
          </>
        )}

        <Fab onClick={handleOpenSheet} />
      </div>

      <Sheet open={showSheet} onOpenChange={setShowSheet}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>{editingItem ? 'Modifier le matériel' : 'Nouveau matériel'}</SheetTitle>
            <SheetDescription>
              {editingItem
                ? 'Modifiez les informations du matériel.'
                : 'Ajoutez du matériel au stockage général.'}
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
        direction="to-etage"
        chantierId={chantierId}
      />
    </div>
  )
}
