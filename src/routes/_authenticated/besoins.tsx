import { useState, useMemo, useRef, useCallback } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ClipboardList } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Textarea } from '@/components/ui/textarea'
import { Fab } from '@/components/Fab'
import { useAllPendingBesoins, type BesoinWithChantier } from '@/lib/queries/useAllPendingBesoins'
import { useBulkTransformBesoins } from '@/lib/mutations/useBulkTransformBesoins'
import { useCreateBesoin } from '@/lib/mutations/useCreateBesoin'
import { useChantiers } from '@/lib/queries/useChantiers'
import { useRealtimeAllPendingBesoins } from '@/lib/subscriptions/useRealtimeAllPendingBesoins'
import { formatRelativeTime } from '@/lib/utils/formatRelativeTime'
import { useAuth } from '@/lib/auth'

export const Route = createFileRoute('/_authenticated/besoins')({
  component: BesoinsPage,
})

interface ChantierGroup {
  chantierId: string
  chantierNom: string
  besoins: BesoinWithChantier[]
}

function groupByChantier(besoins: BesoinWithChantier[]): ChantierGroup[] {
  const map = new Map<string, ChantierGroup>()

  for (const besoin of besoins) {
    const existing = map.get(besoin.chantier_id)
    if (existing) {
      existing.besoins.push(besoin)
    } else {
      map.set(besoin.chantier_id, {
        chantierId: besoin.chantier_id,
        chantierNom: besoin.chantiers.nom,
        besoins: [besoin],
      })
    }
  }

  // Sort groups: chantier with most recent besoin first
  return Array.from(map.values()).sort((a, b) => {
    const aDate = a.besoins[0]?.created_at ?? ''
    const bDate = b.besoins[0]?.created_at ?? ''
    return bDate.localeCompare(aDate)
  })
}

function getAuthorInitial(
  createdBy: string | null,
  currentUserId: string | undefined,
  currentUserEmail: string | undefined,
): string | null {
  if (createdBy && createdBy === currentUserId && currentUserEmail) {
    return currentUserEmail.charAt(0).toUpperCase()
  }
  return null
}

function BesoinsPage() {
  const { data: besoins, isLoading } = useAllPendingBesoins()
  const { data: chantiers } = useChantiers()
  const bulkTransform = useBulkTransformBesoins()
  const createBesoin = useCreateBesoin()
  const { user } = useAuth()
  useRealtimeAllPendingBesoins()

  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Sheet creation besoin
  const [showSheet, setShowSheet] = useState(false)
  const [selectedChantierId, setSelectedChantierId] = useState('')
  const [description, setDescription] = useState('')
  const [chantierError, setChantierError] = useState('')
  const [descError, setDescError] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  function handleOpenSheet() {
    setSelectedChantierId('')
    setDescription('')
    setChantierError('')
    setDescError('')
    setShowSheet(true)
  }

  async function handleCreate() {
    let hasError = false
    if (!selectedChantierId) {
      setChantierError('Sélectionnez un chantier')
      hasError = true
    }
    const lines = description
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    if (lines.length === 0) {
      setDescError('La description est requise')
      hasError = true
    }
    if (hasError) return

    setIsCreating(true)
    try {
      for (const line of lines) {
        await createBesoin.mutateAsync({
          chantierId: selectedChantierId,
          description: line,
        })
      }
      setShowSheet(false)
      toast(
        lines.length > 1
          ? `${lines.length} besoins créés`
          : 'Besoin créé',
      )
    } catch {
      toast.error('Erreur lors de la création')
    } finally {
      setIsCreating(false)
    }
  }

  const groups = useMemo(() => groupByChantier(besoins ?? []), [besoins])

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  function handleLongPress(besoin: BesoinWithChantier) {
    setSelectionMode(true)
    setSelectedIds(new Set([besoin.id]))
  }

  const handlePointerDown = useCallback(
    (besoin: BesoinWithChantier) => {
      if (selectionMode) return
      longPressTimer.current = setTimeout(() => {
        handleLongPress(besoin)
        longPressTimer.current = null
      }, 500)
    },
    [selectionMode],
  )

  function handleToggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      if (next.size === 0) setSelectionMode(false)
      return next
    })
  }

  function handleSelectAllChantier(group: ChantierGroup) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      const allSelected = group.besoins.every((b) => next.has(b.id))
      if (allSelected) {
        group.besoins.forEach((b) => next.delete(b.id))
        if (next.size === 0) setSelectionMode(false)
      } else {
        group.besoins.forEach((b) => next.add(b.id))
      }
      return next
    })
  }

  function handleEnterSelectionMode() {
    setSelectionMode(true)
    setSelectedIds(new Set())
  }

  function handleCancelSelection() {
    setSelectionMode(false)
    setSelectedIds(new Set())
  }

  function handleBulkTransform() {
    const selectedBesoins = (besoins ?? []).filter((b) => selectedIds.has(b.id))
    if (selectedBesoins.length === 0) return

    bulkTransform.mutate(
      { besoins: selectedBesoins },
      {
        onSuccess: (data) => {
          setSelectionMode(false)
          setSelectedIds(new Set())
          const n = data.succeeded.length
          if (data.failedCount > 0) {
            toast(`${n} livraison${n > 1 ? 's' : ''} créée${n > 1 ? 's' : ''}, ${data.failedCount} échec${data.failedCount > 1 ? 's' : ''}`)
          } else {
            toast(`${n} livraison${n > 1 ? 's' : ''} créée${n > 1 ? 's' : ''}`)
          }
        },
        onError: () => toast.error('Erreur lors de la transformation'),
      },
    )
  }

  const totalBesoins = besoins?.length ?? 0
  const showSelectButton = !selectionMode && totalBesoins >= 2

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Besoins</h1>
        {showSelectButton && (
          <Button variant="outline" size="sm" onClick={handleEnterSelectionMode}>
            Sélectionner
          </Button>
        )}
        {selectionMode && (
          <Button variant="ghost" size="sm" onClick={handleCancelSelection}>
            Annuler
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-5 w-40 rounded bg-muted animate-pulse" />
              <div className="rounded-lg border border-border p-4 animate-pulse">
                <div className="h-4 w-3/4 rounded bg-muted mb-2" />
                <div className="h-3 w-1/2 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && totalBesoins === 0 && (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
          <ClipboardList className="size-12" />
          <p>Aucun besoin en attente</p>
        </div>
      )}

      {!isLoading && totalBesoins > 0 && (
        <div className="flex flex-col gap-6">
          {groups.map((group) => {
            const allGroupSelected = selectionMode && group.besoins.every((b) => selectedIds.has(b.id))
            return (
              <section key={group.chantierId}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-foreground">
                    {group.chantierNom} ({group.besoins.length})
                  </h2>
                  {selectionMode && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSelectAllChantier(group)}
                    >
                      {allGroupSelected ? 'Désélectionner' : 'Tout'}
                    </Button>
                  )}
                </div>
                <div className="space-y-3">
                  {group.besoins.map((besoin) => {
                    const isSelected = selectedIds.has(besoin.id)
                    return (
                      <div
                        key={besoin.id}
                        className="rounded-lg border border-border p-4"
                        style={!selectionMode ? { touchAction: 'manipulation' } : undefined}
                        onPointerDown={!selectionMode ? () => handlePointerDown(besoin) : undefined}
                        onPointerUp={!selectionMode ? clearTimer : undefined}
                        onPointerMove={!selectionMode ? clearTimer : undefined}
                        onPointerCancel={!selectionMode ? clearTimer : undefined}
                        onClick={selectionMode ? () => handleToggleSelect(besoin.id) : undefined}
                        role={selectionMode ? 'checkbox' : undefined}
                        aria-checked={selectionMode ? isSelected : undefined}
                      >
                        <div className="flex items-start gap-3">
                          {selectionMode && (
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleToggleSelect(besoin.id)}
                              className="mt-0.5"
                              aria-label={`Sélectionner ${besoin.description}`}
                              onClick={(e) => e.stopPropagation()}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">
                              {besoin.description}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {(() => {
                                const initial = getAuthorInitial(besoin.created_by, user?.id, user?.email ?? undefined)
                                return initial ? `${initial} · ` : ''
                              })()}
                              {formatRelativeTime(besoin.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      )}

      {selectionMode && selectedIds.size > 0 && (
        <div
          className="fixed bottom-14 left-0 right-0 z-40 border-t bg-background p-4"
          style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
        >
          <Button
            onClick={handleBulkTransform}
            disabled={bulkTransform.isPending}
            className="w-full"
          >
            Passer en livraison ({selectedIds.size})
          </Button>
        </div>
      )}

      {!selectionMode && <Fab onClick={handleOpenSheet} />}

      <Sheet open={showSheet} onOpenChange={setShowSheet}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Nouveau besoin</SheetTitle>
            <SheetDescription>
              Sélectionnez le chantier et décrivez le besoin. Une ligne = un besoin.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 flex flex-col gap-3">
            <div>
              <Select
                value={selectedChantierId}
                onValueChange={(v) => {
                  setSelectedChantierId(v)
                  if (chantierError) setChantierError('')
                }}
              >
                <SelectTrigger aria-label="Chantier" aria-invalid={!!chantierError}>
                  <SelectValue placeholder="Choisir un chantier" />
                </SelectTrigger>
                <SelectContent>
                  {(chantiers ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {chantierError && (
                <p className="text-sm text-destructive mt-1">{chantierError}</p>
              )}
            </div>
            <div>
              <Textarea
                placeholder={"Ex: Colle pour faïence 20kg\nSacs de ciment\nMortier"}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value)
                  if (descError) setDescError('')
                }}
                aria-label="Description du besoin"
                aria-invalid={!!descError}
                rows={4}
              />
              {descError && (
                <p className="text-sm text-destructive mt-1">{descError}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Une ligne par besoin pour en créer plusieurs d'un coup.
              </p>
            </div>
          </div>
          <SheetFooter>
            <Button
              onClick={handleCreate}
              disabled={isCreating}
              className="w-full"
            >
              {isCreating ? 'Création...' : 'Créer'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
