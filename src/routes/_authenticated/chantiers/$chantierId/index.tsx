import { useState, useCallback, useMemo } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Boxes, CheckCircle2, EllipsisVertical, Package, Plus, Trash2, Truck } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { StatusCard, STATUS_COLORS, StatusCardSkeleton } from '@/components/StatusCard'
import { BesoinsList } from '@/components/BesoinsList'
import { LivraisonsList } from '@/components/LivraisonsList'
import { LivraisonSheets } from '@/components/LivraisonSheets'
import { Fab } from '@/components/Fab'
import { ChantierIndicators } from '@/components/ChantierIndicators'
import { computeStatus } from '@/lib/utils/computeStatus'
import { findLotsPretsACarreler, computeMetrageVsInventaire } from '@/lib/utils/computeChantierIndicators'
import { useRealtimePlots } from '@/lib/subscriptions/useRealtimePlots'
import { useRealtimeBesoins } from '@/lib/subscriptions/useRealtimeBesoins'
import { useRealtimeLivraisons } from '@/lib/subscriptions/useRealtimeLivraisons'
import { useRealtimeInventaire } from '@/lib/subscriptions/useRealtimeInventaire'
import { useCreatePlot } from '@/lib/mutations/useCreatePlot'
import { useCreateBesoin } from '@/lib/mutations/useCreateBesoin'
import { useUpdateBesoin } from '@/lib/mutations/useUpdateBesoin'
import { useDeleteBesoin } from '@/lib/mutations/useDeleteBesoin'
import { useTransformBesoinToLivraison } from '@/lib/mutations/useTransformBesoinToLivraison'
import { useUpdateChantierStatus } from '@/lib/mutations/useUpdateChantierStatus'
import { useChantier } from '@/lib/queries/useChantier'
import { useBesoins } from '@/lib/queries/useBesoins'
import { useLivraisons } from '@/lib/queries/useLivraisons'
import { GridFilterTabs } from '@/components/GridFilterTabs'
import { usePlots } from '@/lib/queries/usePlots'
import { useLivraisonsCount } from '@/lib/queries/useLivraisonsCount'
import { useLotsWithTaches } from '@/lib/queries/useLotsWithTaches'
import { useInventaire } from '@/lib/queries/useInventaire'
import { useLivraisonActions } from '@/lib/hooks/useLivraisonActions'
import { formatMetrage } from '@/lib/utils/formatMetrage'
import type { Besoin } from '@/types/database'

export const Route = createFileRoute(
  '/_authenticated/chantiers/$chantierId/',
)({
  component: ChantierIndexPage,
})

function ChantierIndexPage() {
  const { chantierId } = Route.useParams()
  const navigate = useNavigate()
  const { data: chantier, isLoading, isError } = useChantier(chantierId)
  const { data: plots, isLoading: plotsLoading } = usePlots(chantierId)
  const { data: besoins, isLoading: besoinsLoading } = useBesoins(chantierId)
  const { data: livraisons, isLoading: livraisonsLoading } = useLivraisons(chantierId)
  const { data: livraisonsCount } = useLivraisonsCount(chantierId)
  const { data: lotsWithTaches } = useLotsWithTaches(chantierId)
  const { data: inventaire } = useInventaire(chantierId)
  useRealtimePlots(chantierId)
  useRealtimeBesoins(chantierId)
  useRealtimeLivraisons(chantierId)
  useRealtimeInventaire(chantierId)
  const createPlot = useCreatePlot()
  const createBesoin = useCreateBesoin()
  const updateBesoin = useUpdateBesoin()
  const deleteBesoin = useDeleteBesoin()
  const livraisonActions = useLivraisonActions(chantierId)
  const transformBesoin = useTransformBesoinToLivraison()
  const updateStatus = useUpdateChantierStatus()

  const lotsPretsACarreler = useMemo(
    () => chantier?.type === 'complet' ? findLotsPretsACarreler(lotsWithTaches ?? []) : undefined,
    [chantier?.type, lotsWithTaches],
  )

  const metrageVsInventaire = useMemo(
    () => chantier?.type === 'complet' ? computeMetrageVsInventaire(plots ?? [], inventaire ?? []) : undefined,
    [chantier?.type, plots, inventaire],
  )

  const livraisonsPrevues = useMemo(
    () => (livraisons ?? []).filter(l => l.status === 'prevu' && l.date_prevue),
    [livraisons],
  )

  const [filteredPlots, setFilteredPlots] = useState<NonNullable<typeof plots>>([])

  const getPlotProgress = useCallback(
    (plot: NonNullable<typeof plots>[0]) => ({ done: plot.progress_done, total: plot.progress_total }),
    [],
  )

  const getPlotAlerts = useCallback(
    (plot: NonNullable<typeof plots>[0]) => plot.has_blocking_note === true,
    [],
  )

  const [showSheet, setShowSheet] = useState(false)
  const [plotName, setPlotName] = useState('')
  const [nameError, setNameError] = useState('')
  const [showTerminerDialog, setShowTerminerDialog] = useState(false)
  const [showSupprimerDialog, setShowSupprimerDialog] = useState(false)
  const [showBesoinSheet, setShowBesoinSheet] = useState(false)
  const [besoinDescription, setBesoinDescription] = useState('')
  const [besoinError, setBesoinError] = useState('')
  const [showCommanderDialog, setShowCommanderDialog] = useState(false)
  const [besoinToCommand, setBesoinToCommand] = useState<Besoin | null>(null)

  const [besoinToEdit, setBesoinToEdit] = useState<Besoin | null>(null)
  const [showEditBesoinSheet, setShowEditBesoinSheet] = useState(false)
  const [editBesoinDescription, setEditBesoinDescription] = useState('')
  const [editBesoinError, setEditBesoinError] = useState('')

  const [besoinToDelete, setBesoinToDelete] = useState<Besoin | null>(null)
  const [showDeleteBesoinDialog, setShowDeleteBesoinDialog] = useState(false)

  function handleTerminer() {
    updateStatus.mutate(
      { chantierId, status: 'termine' },
      {
        onSuccess: () => toast('Chantier archivé'),
        onError: () => toast.error('Erreur lors de l\'archivage du chantier'),
      },
    )
  }

  function handleSupprimer() {
    updateStatus.mutate(
      { chantierId, status: 'supprime' },
      {
        onSuccess: () => toast('Chantier supprimé'),
        onError: () => toast.error('Erreur lors de la suppression du chantier'),
      },
    )
  }

  function handleOpenSheet() {
    setPlotName('')
    setNameError('')
    setShowSheet(true)
  }

  function handleCreatePlot() {
    const trimmed = plotName.trim()
    if (!trimmed) {
      setNameError('Le nom du plot est requis')
      return
    }
    createPlot.mutate(
      { chantierId, nom: trimmed },
      {
        onSuccess: (data) => {
          setShowSheet(false)
          toast('Plot créé')
          navigate({
            to: '/chantiers/$chantierId/plots/$plotId',
            params: { chantierId, plotId: data.id },
          })
        },
        onError: () => {
          toast.error('Erreur lors de la création du plot')
        },
      },
    )
  }

  function handleOpenBesoinSheet() {
    setBesoinDescription('')
    setBesoinError('')
    setShowBesoinSheet(true)
  }

  function handleCreateBesoin() {
    const trimmed = besoinDescription.trim()
    if (!trimmed) {
      setBesoinError('La description est requise')
      return
    }
    createBesoin.mutate(
      { chantierId, description: trimmed },
      {
        onSuccess: () => {
          setShowBesoinSheet(false)
          toast('Besoin créé')
        },
        onError: () => {
          toast.error('Erreur lors de la création du besoin')
        },
      },
    )
  }

  function handleEditBesoin(besoin: Besoin) {
    setBesoinToEdit(besoin)
    setEditBesoinDescription(besoin.description)
    setEditBesoinError('')
    setShowEditBesoinSheet(true)
  }

  function handleConfirmEditBesoin() {
    const trimmed = editBesoinDescription.trim()
    if (!trimmed) {
      setEditBesoinError('La description est requise')
      return
    }
    if (!besoinToEdit) return
    updateBesoin.mutate(
      { id: besoinToEdit.id, chantierId, description: trimmed },
      {
        onSuccess: () => {
          setShowEditBesoinSheet(false)
          setBesoinToEdit(null)
          toast('Besoin modifié')
        },
        onError: () => toast.error('Erreur lors de la modification du besoin'),
      },
    )
  }

  function handleDeleteBesoin(besoin: Besoin) {
    setBesoinToDelete(besoin)
    setShowDeleteBesoinDialog(true)
  }

  function handleConfirmDeleteBesoin() {
    if (!besoinToDelete) return
    deleteBesoin.mutate(
      { id: besoinToDelete.id, chantierId },
      {
        onSuccess: () => {
          setShowDeleteBesoinDialog(false)
          setBesoinToDelete(null)
          toast('Besoin supprimé')
        },
        onError: () => toast.error('Erreur lors de la suppression'),
      },
    )
  }

  function handleCommander(besoin: Besoin) {
    setBesoinToCommand(besoin)
    setShowCommanderDialog(true)
  }

  function handleConfirmCommander() {
    if (!besoinToCommand) return
    transformBesoin.mutate(
      { besoin: besoinToCommand },
      {
        onSuccess: () => {
          setShowCommanderDialog(false)
          setBesoinToCommand(null)
          toast('Besoin commandé')
        },
        onError: () => {
          toast.error('Erreur lors de la commande')
        },
      },
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-56px-env(safe-area-inset-bottom))]">
        <header className="flex items-center justify-between px-4 py-3 border-b border-border">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/" aria-label="Retour">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <div className="h-5 w-40 rounded bg-muted animate-pulse" />
          <div className="size-9" />
        </header>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  if (isError || !chantier) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-56px-env(safe-area-inset-bottom))]">
        <header className="flex items-center justify-between px-4 py-3 border-b border-border">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/" aria-label="Retour">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <span className="text-lg font-semibold text-foreground">Erreur</span>
          <div className="size-9" />
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16 px-4">
          <p className="text-muted-foreground">Chantier introuvable</p>
          <Button variant="outline" onClick={() => navigate({ to: '/' })}>
            Retour à l'accueil
          </Button>
        </div>
      </div>
    )
  }

  const lCount = livraisonsCount ?? 0
  const progressPercent =
    chantier.type === 'complet' && chantier.progress_total > 0
      ? `${Math.round((chantier.progress_done / chantier.progress_total) * 100)}%`
      : chantier.type === 'complet'
        ? '0%'
        : `${lCount} livraison${lCount !== 1 ? 's' : ''}`

  return (
    <div className="flex flex-col min-h-[calc(100vh-56px-env(safe-area-inset-bottom))]">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/" aria-label="Retour">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <h1 className="text-lg font-semibold text-foreground truncate mx-2">
          {chantier.nom}
        </h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Options du chantier">
              <EllipsisVertical className="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                setShowTerminerDialog(true)
              }}
            >
              <CheckCircle2 className="mr-2 size-4" />
              Marquer comme terminé
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onSelect={(e) => {
                e.preventDefault()
                setShowSupprimerDialog(true)
              }}
            >
              <Trash2 className="mr-2 size-4" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="flex-1 p-4">
        {chantier.type === 'leger' ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <Badge variant="secondary">Léger</Badge>
              <span className="text-sm font-medium text-muted-foreground">
                {progressPercent}
              </span>
            </div>

            <ChantierIndicators
              chantierId={chantierId}
              besoinsEnAttente={besoins?.length ?? 0}
              livraisonsPrevues={livraisonsPrevues}
            />

            <h2 className="text-base font-semibold text-foreground mb-3">
              Besoins en attente{besoins && besoins.length > 0 ? ` (${besoins.length})` : ''}
            </h2>

            <BesoinsList
              besoins={besoins}
              isLoading={besoinsLoading}
              onOpenSheet={handleOpenBesoinSheet}
              onCommander={handleCommander}
              onEdit={handleEditBesoin}
              onDelete={handleDeleteBesoin}
            />

            <h2 className="text-base font-semibold text-foreground mb-3 mt-6">
              Livraisons{livraisons && livraisons.length > 0 ? ` (${livraisons.length})` : ''}
            </h2>

            <LivraisonsList
              livraisons={livraisons}
              isLoading={livraisonsLoading}
              chantierId={chantierId}
              onOpenSheet={livraisonActions.handleOpenLivraisonSheet}
              onMarquerPrevu={livraisonActions.handleMarquerPrevu}
              onConfirmerLivraison={livraisonActions.handleConfirmerLivraison}
            />

            <Fab
              menuItems={[
                { icon: Package, label: 'Nouveau besoin', onClick: handleOpenBesoinSheet },
                { icon: Truck, label: 'Nouvelle livraison', onClick: livraisonActions.handleOpenLivraisonSheet },
              ]}
            />
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Complet</Badge>
                <Button variant="outline" size="sm" asChild>
                  <Link
                    to="/chantiers/$chantierId/besoins"
                    params={{ chantierId }}
                  >
                    <Package className="mr-1 size-3.5" />
                    Besoins
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link
                    to="/chantiers/$chantierId/livraisons"
                    params={{ chantierId }}
                  >
                    <Truck className="mr-1 size-3.5" />
                    Livraisons
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link
                    to="/chantiers/$chantierId/inventaire"
                    params={{ chantierId }}
                  >
                    <Boxes className="mr-1 size-3.5" />
                    Inventaire
                  </Link>
                </Button>
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                {progressPercent}
              </span>
            </div>

            <ChantierIndicators
              chantierId={chantierId}
              lotsPretsACarreler={lotsPretsACarreler}
              metrageVsInventaire={metrageVsInventaire}
              besoinsEnAttente={besoins?.length ?? 0}
              livraisonsPrevues={livraisonsPrevues}
            />

            <div className="flex flex-col gap-3">
              <h2 className="text-base font-semibold text-foreground">Plots</h2>

              {plotsLoading ? (
                <div className="flex flex-col gap-3">
                  <StatusCardSkeleton />
                  <StatusCardSkeleton />
                </div>
              ) : plots && plots.length > 0 ? (
                <>
                  <GridFilterTabs
                    items={plots}
                    getProgress={getPlotProgress}
                    getAlerts={getPlotAlerts}
                    onFilteredChange={setFilteredPlots}
                    emptyMessage="Aucun plot"
                  />
                  {filteredPlots.length > 0 && (
                    <div className="flex flex-col gap-3">
                      {filteredPlots.map((plot) => (
                        <StatusCard
                          key={plot.id}
                          title={plot.nom}
                          subtitle={`${plot.task_definitions.length} tâche${plot.task_definitions.length !== 1 ? 's' : ''} définie${plot.task_definitions.length !== 1 ? 's' : ''}`}
                          secondaryInfo={formatMetrage(plot.metrage_m2_total ?? 0, plot.metrage_ml_total ?? 0)}
                          statusColor={STATUS_COLORS[computeStatus(plot.progress_done, plot.progress_total)]}
                          indicator={`${plot.progress_done}/${plot.progress_total}`}
                          isBlocked={getPlotAlerts(plot)}
                          onClick={() =>
                            navigate({
                              to: '/chantiers/$chantierId/plots/$plotId',
                              params: { chantierId, plotId: plot.id },
                            })
                          }
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 py-16">
                  <p className="text-muted-foreground">Aucun plot configuré</p>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={handleOpenSheet}
              >
                <Plus className="mr-2 size-4" />
                {plots && plots.length > 0
                  ? 'Ajouter un plot'
                  : 'Ajouter votre premier plot'}
              </Button>
            </div>
          </>
        )}
      </div>

      <AlertDialog open={showTerminerDialog} onOpenChange={setShowTerminerDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terminer ce chantier ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le chantier {chantier.nom} sera archivé et disparaîtra de la vue active. Vous pourrez le retrouver via le filtre Terminés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleTerminer}>
              Terminer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showSupprimerDialog} onOpenChange={setShowSupprimerDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce chantier ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le chantier {chantier.nom} sera supprimé définitivement. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleSupprimer}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={showSheet} onOpenChange={setShowSheet}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Nouveau plot</SheetTitle>
            <SheetDescription>
              Ajoutez un plot à votre chantier. Les tâches par défaut seront configurées automatiquement.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4">
            <Input
              placeholder="Nom du plot"
              value={plotName}
              onChange={(e) => {
                setPlotName(e.target.value)
                if (nameError) setNameError('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreatePlot()
              }}
              aria-label="Nom du plot"
              aria-invalid={!!nameError}
            />
            {nameError && (
              <p className="text-sm text-destructive mt-1">{nameError}</p>
            )}
          </div>
          <SheetFooter>
            <Button
              onClick={handleCreatePlot}
              disabled={createPlot.isPending}
              className="w-full"
            >
              Créer le plot
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={showBesoinSheet} onOpenChange={setShowBesoinSheet}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Nouveau besoin</SheetTitle>
            <SheetDescription>
              Décrivez le matériel ou la fourniture nécessaire.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4">
            <Textarea
              placeholder="Ex: Colle pour faïence 20kg"
              value={besoinDescription}
              onChange={(e) => {
                setBesoinDescription(e.target.value)
                if (besoinError) setBesoinError('')
              }}
              aria-label="Description du besoin"
              aria-invalid={!!besoinError}
              rows={3}
            />
            {besoinError && (
              <p className="text-sm text-destructive mt-1">{besoinError}</p>
            )}
          </div>
          <SheetFooter>
            <Button
              onClick={handleCreateBesoin}
              disabled={createBesoin.isPending}
              className="w-full"
            >
              Créer le besoin
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={showEditBesoinSheet} onOpenChange={setShowEditBesoinSheet}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Modifier le besoin</SheetTitle>
            <SheetDescription>Modifiez la description du besoin.</SheetDescription>
          </SheetHeader>
          <div className="px-4">
            <Textarea
              value={editBesoinDescription}
              onChange={(e) => {
                setEditBesoinDescription(e.target.value)
                if (editBesoinError) setEditBesoinError('')
              }}
              aria-label="Description du besoin (édition)"
              aria-invalid={!!editBesoinError}
              rows={3}
            />
            {editBesoinError && (
              <p className="text-sm text-destructive mt-1">{editBesoinError}</p>
            )}
          </div>
          <SheetFooter>
            <Button
              onClick={handleConfirmEditBesoin}
              disabled={updateBesoin.isPending}
              className="w-full"
            >
              Enregistrer
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDeleteBesoinDialog} onOpenChange={setShowDeleteBesoinDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce besoin ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le besoin &laquo;{besoinToDelete?.description}&raquo; sera supprimé définitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirmDeleteBesoin}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showCommanderDialog} onOpenChange={setShowCommanderDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Transformer ce besoin en commande ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le besoin &laquo;{besoinToCommand?.description}&raquo; sera transformé en livraison au statut Commandé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCommander}>
              Commander
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <LivraisonSheets actions={livraisonActions} />
    </div>
  )
}
