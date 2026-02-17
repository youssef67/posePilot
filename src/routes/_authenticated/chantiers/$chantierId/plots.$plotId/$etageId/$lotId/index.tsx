import { useState, useCallback, useMemo, useRef } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, MessageSquare, Camera, FileWarning, Pencil, Check, X, EllipsisVertical, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatusCard, STATUS_COLORS, StatusCardSkeleton } from '@/components/StatusCard'
import { computeStatus } from '@/lib/utils/computeStatus'
import { useLots } from '@/lib/queries/useLots'
import { usePieces } from '@/lib/queries/usePieces'
import { useLotDocuments } from '@/lib/queries/useLotDocuments'
import { useToggleLotTma } from '@/lib/mutations/useToggleLotTma'
import { useUpdatePlinthStatus } from '@/lib/mutations/useUpdatePlinthStatus'
import { PlinthStatus } from '@/types/enums'
import { useAddLotPiece } from '@/lib/mutations/useAddLotPiece'
import { useAddLotTask } from '@/lib/mutations/useAddLotTask'
import { useAddLotDocument } from '@/lib/mutations/useAddLotDocument'
import { useUpdateLot } from '@/lib/mutations/useUpdateLot'
import { useDeleteLots } from '@/lib/mutations/useDeleteLots'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { useVariantes } from '@/lib/queries/useVariantes'
import { useEtages } from '@/lib/queries/useEtages'
import { DocumentSlot } from '@/components/DocumentSlot'
import { BreadcrumbNav } from '@/components/BreadcrumbNav'
import { GridFilterTabs } from '@/components/GridFilterTabs'
import { NotesList } from '@/components/NotesList'
import { NoteForm } from '@/components/NoteForm'
import { Fab, type FabMenuItem } from '@/components/Fab'
import { PhotoCapture, type PhotoCaptureHandle } from '@/components/PhotoCapture'
import { useRealtimePieces } from '@/lib/subscriptions/useRealtimePieces'
import { useRealtimeNotes } from '@/lib/subscriptions/useRealtimeNotes'

export const Route = createFileRoute(
  '/_authenticated/chantiers/$chantierId/plots/$plotId/$etageId/$lotId/',
)({
  component: LotIndexPage,
})

function LotIndexPage() {
  const { chantierId, plotId, etageId, lotId } = Route.useParams()
  const navigate = useNavigate()
  const { data: lots, isLoading: lotsLoading } = useLots(plotId)
  const { data: pieces, isLoading: piecesLoading } = usePieces(lotId)
  const { data: documents, isLoading: documentsLoading } = useLotDocuments(lotId)
  useRealtimePieces(lotId)
  useRealtimeNotes(lotId, 'lot')
  const toggleTma = useToggleLotTma()
  const updatePlinthStatus = useUpdatePlinthStatus()
  const addPiece = useAddLotPiece()
  const addTask = useAddLotTask()
  const addDocument = useAddLotDocument()
  const updateLot = useUpdateLot()
  const { data: variantes } = useVariantes(plotId)
  const { data: allEtages } = useEtages(plotId)

  const deleteLots = useDeleteLots()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const [editMode, setEditMode] = useState(false)
  const [editCode, setEditCode] = useState('')
  const [editVarianteId, setEditVarianteId] = useState('')
  const [editEtageId, setEditEtageId] = useState('')
  const [editCodeError, setEditCodeError] = useState('')

  const [addPieceOpen, setAddPieceOpen] = useState(false)
  const [addPieceValue, setAddPieceValue] = useState('')
  const [addPieceError, setAddPieceError] = useState('')
  const [addTaskOpen, setAddTaskOpen] = useState(false)
  const [addTaskPieceId, setAddTaskPieceId] = useState('')
  const [addTaskValue, setAddTaskValue] = useState('')
  const [addTaskError, setAddTaskError] = useState('')
  const [addDocOpen, setAddDocOpen] = useState(false)
  const [addDocValue, setAddDocValue] = useState('')
  const [addDocError, setAddDocError] = useState('')
  const [filteredPieces, setFilteredPieces] = useState<NonNullable<typeof pieces>>([])
  const [noteFormOpen, setNoteFormOpen] = useState(false)
  const [initialPhoto, setInitialPhoto] = useState<File | undefined>(undefined)
  const photoCaptureRef = useRef<PhotoCaptureHandle>(null)

  const fabMenuItems: FabMenuItem[] = [
    {
      icon: MessageSquare,
      label: 'Note',
      onClick: () => {
        setInitialPhoto(undefined)
        setNoteFormOpen(true)
      },
    },
    {
      icon: Camera,
      label: 'Photo',
      onClick: () => {
        photoCaptureRef.current?.trigger()
      },
    },
  ]

  function handlePhotoSelected(file: File) {
    setInitialPhoto(file)
    setNoteFormOpen(true)
  }

  const getPieceProgress = useCallback(
    (piece: NonNullable<typeof pieces>[0]) => ({ done: piece.progress_done, total: piece.progress_total }),
    [],
  )

  const lot = lots?.find((l) => l.id === lotId)

  function enterEditMode() {
    if (!lot) return
    setEditCode(lot.code)
    setEditVarianteId(lot.variante_id)
    setEditEtageId(lot.etage_id)
    setEditCodeError('')
    setEditMode(true)
  }

  function cancelEditMode() {
    setEditMode(false)
    setEditCodeError('')
  }

  function handleSaveEdit() {
    if (!lot || updateLot.isPending) return
    const trimmedCode = editCode.trim()
    if (!trimmedCode) {
      setEditCodeError('Le code est requis')
      return
    }
    if (
      trimmedCode.toLowerCase() !== lot.code.toLowerCase() &&
      lots?.some((l) => l.id !== lotId && l.code.toLowerCase() === trimmedCode.toLowerCase())
    ) {
      setEditCodeError('Un lot avec ce code existe déjà')
      return
    }
    const updates: { code?: string; varianteId?: string; etageId?: string } = {}
    if (trimmedCode !== lot.code) updates.code = trimmedCode
    if (editVarianteId !== lot.variante_id) updates.varianteId = editVarianteId
    if (editEtageId !== lot.etage_id) updates.etageId = editEtageId

    if (Object.keys(updates).length === 0) {
      setEditMode(false)
      return
    }

    updateLot.mutate(
      { lotId, plotId, ...updates },
      {
        onSuccess: () => {
          toast('Lot modifié')
          setEditMode(false)
        },
        onError: () => toast.error('Erreur lors de la modification du lot'),
      },
    )
  }

  const lotHasContent = (pieces && pieces.length > 0) || (documents && documents.length > 0)

  function handleDeleteLot() {
    deleteLots.mutate(
      { lotIds: [lotId], plotId },
      {
        onSuccess: () => {
          toast('Lot supprimé')
          navigate({
            to: '/chantiers/$chantierId/plots/$plotId/$etageId',
            params: { chantierId, plotId, etageId },
          })
        },
        onError: () => toast.error('Erreur lors de la suppression du lot'),
      },
    )
  }

  const missingDocs = useMemo(
    () => documents?.filter(d => d.is_required && !d.file_url) ?? [],
    [documents],
  )

  function handleAddPiece() {
    if (addPiece.isPending) return
    const trimmed = addPieceValue.trim()
    if (!trimmed) {
      setAddPieceError('Le nom est requis')
      return
    }
    if (pieces?.some((p) => p.nom.toLowerCase() === trimmed.toLowerCase())) {
      setAddPieceError(`« ${trimmed} » existe déjà`)
      return
    }
    addPiece.mutate(
      { lotId, nom: trimmed },
      {
        onSuccess: () => {
          toast(`Pièce « ${trimmed} » ajoutée`)
          setAddPieceValue('')
          setAddPieceError('')
          setAddPieceOpen(false)
        },
        onError: () => {
          toast.error("Erreur lors de l'ajout de la pièce")
        },
      },
    )
  }

  function handleAddTask() {
    if (addTask.isPending) return
    const trimmed = addTaskValue.trim()
    if (!addTaskPieceId) {
      setAddTaskError('Sélectionnez une pièce')
      return
    }
    if (!trimmed) {
      setAddTaskError('Le nom est requis')
      return
    }
    const targetPiece = pieces?.find((p) => p.id === addTaskPieceId)
    if (targetPiece?.taches.some((t) => t.nom.toLowerCase() === trimmed.toLowerCase())) {
      setAddTaskError(`« ${trimmed} » existe déjà sur cette pièce`)
      return
    }
    addTask.mutate(
      { pieceId: addTaskPieceId, nom: trimmed, lotId, position: targetPiece?.taches.length ?? 0 },
      {
        onSuccess: () => {
          toast(`Tâche « ${trimmed} » ajoutée`)
          setAddTaskValue('')
          setAddTaskError('')
          setAddTaskOpen(false)
          setAddTaskPieceId('')
        },
        onError: () => {
          toast.error("Erreur lors de l'ajout de la tâche")
        },
      },
    )
  }

  function handleAddDocument() {
    if (addDocument.isPending) return
    const trimmed = addDocValue.trim()
    if (!trimmed) {
      setAddDocError('Le nom est requis')
      return
    }
    if (documents?.some((d) => d.nom.toLowerCase() === trimmed.toLowerCase())) {
      setAddDocError(`« ${trimmed} » existe déjà`)
      return
    }
    addDocument.mutate(
      { lotId, nom: trimmed },
      {
        onSuccess: () => {
          toast(`Document « ${trimmed} » ajouté`)
          setAddDocValue('')
          setAddDocError('')
          setAddDocOpen(false)
        },
        onError: () => {
          toast.error("Erreur lors de l'ajout du document")
        },
      },
    )
  }

  if (lotsLoading || piecesLoading || documentsLoading) {
    return (
      <div className="flex flex-col">
        <header className="flex items-center justify-between px-4 py-3 border-b border-border">
          <Button variant="ghost" size="icon" asChild>
            <Link
              to="/chantiers/$chantierId/plots/$plotId/$etageId"
              params={{ chantierId, plotId, etageId }}
              aria-label="Retour"
            >
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <div className="h-5 w-32 rounded bg-muted animate-pulse" />
          <div className="size-9" />
        </header>
        <div className="p-4 flex flex-col gap-2">
          <StatusCardSkeleton />
          <StatusCardSkeleton />
        </div>
      </div>
    )
  }

  if (!lot) {
    return (
      <div className="flex flex-col">
        <header className="flex items-center justify-between px-4 py-3 border-b border-border">
          <Button variant="ghost" size="icon" asChild>
            <Link
              to="/chantiers/$chantierId/plots/$plotId/$etageId"
              params={{ chantierId, plotId, etageId }}
              aria-label="Retour"
            >
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <span className="text-lg font-semibold text-foreground">Erreur</span>
          <div className="size-9" />
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16 px-4">
          <p className="text-muted-foreground">Lot introuvable</p>
          <Button
            variant="outline"
            onClick={() =>
              navigate({
                to: '/chantiers/$chantierId/plots/$plotId/$etageId',
                params: { chantierId, plotId, etageId },
              })
            }
          >
            Retour à l'étage
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <Button variant="ghost" size="icon" asChild>
          <Link
            to="/chantiers/$chantierId/plots/$plotId/$etageId"
            params={{ chantierId, plotId, etageId }}
            aria-label="Retour"
          >
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-foreground truncate">
            Lot {lot.code}
          </h1>
          {lot.is_tma && (
            <Badge
              variant="outline"
              className="border-amber-500 text-amber-500 text-[10px]"
            >
              TMA
            </Badge>
          )}
        </div>
        {!editMode ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Options du lot">
                <EllipsisVertical className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); enterEditMode() }}>
                <Pencil className="mr-2 size-4" />
                Modifier le lot
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onSelect={(e) => { e.preventDefault(); setShowDeleteDialog(true) }}
              >
                <Trash2 className="mr-2 size-4" />
                Supprimer le lot
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="size-9" />
        )}
      </header>

      <BreadcrumbNav />

      <div className="px-4 py-2">
        {editMode ? (
          <div className="space-y-3">
            <div>
              <label htmlFor="edit-code" className="text-xs font-medium text-muted-foreground">Code du lot</label>
              <Input
                id="edit-code"
                value={editCode}
                onChange={(e) => { setEditCode(e.target.value); setEditCodeError('') }}
                className="h-9 mt-1"
                aria-label="Code du lot"
              />
              {editCodeError && <p className="text-xs text-destructive mt-1">{editCodeError}</p>}
            </div>
            <div>
              <label htmlFor="edit-variante" className="text-xs font-medium text-muted-foreground">Variante</label>
              <Select value={editVarianteId} onValueChange={setEditVarianteId}>
                <SelectTrigger id="edit-variante" className="w-full h-9 mt-1" aria-label="Variante">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {variantes?.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="edit-etage" className="text-xs font-medium text-muted-foreground">Étage</label>
              <Select value={editEtageId} onValueChange={setEditEtageId}>
                <SelectTrigger id="edit-etage" className="w-full h-9 mt-1" aria-label="Étage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allEtages?.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveEdit} disabled={updateLot.isPending}>
                <Check className="mr-1 size-4" />
                Enregistrer
              </Button>
              <Button size="sm" variant="ghost" onClick={cancelEditMode}>
                <X className="mr-1 size-4" />
                Annuler
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {lot.variantes?.nom ?? 'Variante'} · {lot.etages?.nom ?? 'Étage'}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <label
                htmlFor="tma-switch"
                className="text-sm font-medium text-foreground"
              >
                TMA
              </label>
              <Switch
                id="tma-switch"
                checked={lot.is_tma}
                onCheckedChange={(checked) =>
                  toggleTma.mutate({ lotId, isTma: checked, plotId })
                }
              />
            </div>
            {lot.metrage_ml_total > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <label
                  htmlFor="plinth-select"
                  className="text-sm font-medium text-foreground"
                >
                  Plinthes
                </label>
                <Select
                  value={lot.plinth_status}
                  onValueChange={(value) =>
                    updatePlinthStatus.mutate({
                      lotId,
                      plinthStatus: value as PlinthStatus,
                      plotId,
                    })
                  }
                >
                  <SelectTrigger id="plinth-select" className="w-[180px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={PlinthStatus.NON_COMMANDEES}>Non commandées</SelectItem>
                    <SelectItem value={PlinthStatus.COMMANDEES}>Commandées</SelectItem>
                    <SelectItem value={PlinthStatus.FACONNEES}>Façonnées</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </>
        )}
      </div>

      <div className="border-t border-border" />

      <div className="p-4">
        <h2 className="text-base font-semibold text-foreground mb-3">
          Pièces{pieces && pieces.length > 0 ? ` (${pieces.length})` : ''}
        </h2>

        {pieces && pieces.length > 0 ? (
          <>
            <GridFilterTabs
              items={pieces}
              getProgress={getPieceProgress}
              onFilteredChange={setFilteredPieces}
              emptyMessage="Aucune pièce"
              className="mb-3"
            />
            {filteredPieces.length > 0 && (
              <div className="flex flex-col gap-2">
                {filteredPieces.map((piece) => (
                    <StatusCard
                      key={piece.id}
                      title={piece.nom}
                      subtitle={`${piece.progress_done}/${piece.progress_total} tâche${piece.progress_total !== 1 ? 's' : ''}`}
                      statusColor={STATUS_COLORS[computeStatus(piece.progress_done, piece.progress_total)]}
                      indicator={`${piece.progress_done}/${piece.progress_total}`}
                      onClick={() =>
                        navigate({
                          to: '/chantiers/$chantierId/plots/$plotId/$etageId/$lotId/$pieceId',
                          params: {
                            chantierId,
                            plotId,
                            etageId,
                            lotId,
                            pieceId: piece.id,
                          },
                        })
                      }
                    />
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aucune pièce héritée
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {addPieceOpen ? (
            <div className="w-full">
              <div className="flex items-center gap-2">
                <Input
                  value={addPieceValue}
                  onChange={(e) => {
                    setAddPieceValue(e.target.value)
                    setAddPieceError('')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddPiece()
                    if (e.key === 'Escape') {
                      setAddPieceOpen(false)
                      setAddPieceValue('')
                      setAddPieceError('')
                    }
                  }}
                  placeholder="Nom de la pièce"
                  autoFocus
                  className="h-8 text-sm"
                  aria-label="Nom de la pièce"
                />
                <Button
                  size="sm"
                  onClick={handleAddPiece}
                  disabled={addPiece.isPending}
                >
                  OK
                </Button>
              </div>
              {addPieceError && (
                <p className="text-xs text-destructive mt-1">
                  {addPieceError}
                </p>
              )}
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAddPieceOpen(true)}
            >
              + Ajouter une pièce
            </Button>
          )}
          {addTaskOpen ? (
            <div className="w-full space-y-2">
              <Select
                value={addTaskPieceId}
                onValueChange={(val) => {
                  setAddTaskPieceId(val)
                  setAddTaskError('')
                }}
              >
                <SelectTrigger className="h-8 text-sm" aria-label="Pièce cible">
                  <SelectValue placeholder="Sélectionner une pièce" />
                </SelectTrigger>
                <SelectContent>
                  {pieces?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Input
                  value={addTaskValue}
                  onChange={(e) => {
                    setAddTaskValue(e.target.value)
                    setAddTaskError('')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddTask()
                    if (e.key === 'Escape') {
                      setAddTaskOpen(false)
                      setAddTaskValue('')
                      setAddTaskPieceId('')
                      setAddTaskError('')
                    }
                  }}
                  placeholder="Nom de la tâche"
                  className="h-8 text-sm"
                  aria-label="Nom de la tâche"
                />
                <Button
                  size="sm"
                  onClick={handleAddTask}
                  disabled={addTask.isPending}
                >
                  OK
                </Button>
              </div>
              {addTaskError && (
                <p className="text-xs text-destructive mt-1">
                  {addTaskError}
                </p>
              )}
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAddTaskOpen(true)}
              disabled={!pieces || pieces.length === 0}
            >
              + Ajouter une tâche
            </Button>
          )}
        </div>
      </div>

      <div className="border-t border-border" />

      <div className="p-4">
        <h2 className="text-base font-semibold text-foreground mb-3">
          Documents
          {documents && documents.length > 0 ? ` (${documents.length})` : ''}
        </h2>

        {missingDocs.length > 0 && (
          <div role="alert" className="flex items-start gap-2 p-3 mb-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <FileWarning className="size-5 shrink-0 text-amber-500 mt-0.5" aria-label="Documents manquants" />
            <div>
              <p className="text-sm font-medium text-amber-500">
                {missingDocs.length} document{missingDocs.length > 1 ? 's' : ''} obligatoire{missingDocs.length > 1 ? 's' : ''} manquant{missingDocs.length > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-amber-500/80 mt-0.5">
                {missingDocs.map(d => d.nom).join(', ')}
              </p>
            </div>
          </div>
        )}

        {documents && documents.length > 0 ? (
          <div className="border border-border rounded-lg divide-y divide-border">
            {documents.map((doc) => (
              <DocumentSlot key={doc.id} document={doc} lotId={lotId} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aucun document
          </p>
        )}

        <div className="mt-3">
          {addDocOpen ? (
            <div>
              <div className="flex items-center gap-2">
                <Input
                  value={addDocValue}
                  onChange={(e) => {
                    setAddDocValue(e.target.value)
                    setAddDocError('')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddDocument()
                    if (e.key === 'Escape') {
                      setAddDocOpen(false)
                      setAddDocValue('')
                      setAddDocError('')
                    }
                  }}
                  placeholder="Nom du document"
                  autoFocus
                  className="h-8 text-sm"
                  aria-label="Nom du document"
                />
                <Button
                  size="sm"
                  onClick={handleAddDocument}
                  disabled={addDocument.isPending}
                >
                  OK
                </Button>
              </div>
              {addDocError && (
                <p className="text-xs text-destructive mt-1">{addDocError}</p>
              )}
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAddDocOpen(true)}
            >
              + Ajouter un document
            </Button>
          )}
        </div>
      </div>

      <div className="border-t border-border" />

      <div className="p-4 pb-28">
        <h2 className="text-base font-semibold text-foreground mb-3">Notes</h2>
        <NotesList lotId={lotId} />
      </div>

      <PhotoCapture ref={photoCaptureRef} onPhotoSelected={handlePhotoSelected} />
      <Fab menuItems={fabMenuItems} />
      <NoteForm
        key={initialPhoto ? 'with-photo' : 'without-photo'}
        open={noteFormOpen}
        onOpenChange={(open) => {
          setNoteFormOpen(open)
          if (!open) setInitialPhoto(undefined)
        }}
        lotId={lotId}
        initialPhoto={initialPhoto}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le lot {lot.code} ?</AlertDialogTitle>
            <AlertDialogDescription>
              {lotHasContent
                ? 'Attention : ce lot contient des pièces, tâches ou documents. Toutes ces données seront supprimées définitivement.'
                : 'Ce lot sera supprimé définitivement. Cette action est irréversible.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDeleteLot}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
