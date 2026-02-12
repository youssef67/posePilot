import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, ChevronDown, ChevronRight, EllipsisVertical, Plus, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
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
import { useVariantePieces } from '@/lib/queries/useVariantePieces'
import { useVarianteDocuments } from '@/lib/queries/useVarianteDocuments'
import { usePlots } from '@/lib/queries/usePlots'
import { useAddVariantePiece } from '@/lib/mutations/useAddVariantePiece'
import { useDeleteVariantePiece } from '@/lib/mutations/useDeleteVariantePiece'
import { useDeleteVariante } from '@/lib/mutations/useDeleteVariante'
import { useAddVarianteDocument } from '@/lib/mutations/useAddVarianteDocument'
import { useDeleteVarianteDocument } from '@/lib/mutations/useDeleteVarianteDocument'
import { useToggleDocumentRequired } from '@/lib/mutations/useToggleDocumentRequired'
import { useVariantes } from '@/lib/queries/useVariantes'

export const Route = createFileRoute(
  '/_authenticated/chantiers/$chantierId/plots/$plotId/variantes/$varianteId',
)({
  component: VarianteDetailPage,
})

function VarianteDetailPage() {
  const { chantierId, plotId, varianteId } = Route.useParams()
  const navigate = useNavigate()
  const { data: pieces, isLoading: piecesLoading } = useVariantePieces(varianteId)
  const { data: documents, isLoading: documentsLoading } = useVarianteDocuments(varianteId)
  const { data: plots, isLoading: plotsLoading } = usePlots(chantierId)
  const { data: variantes, isLoading: variantesLoading } = useVariantes(plotId)
  const addPiece = useAddVariantePiece()
  const deletePiece = useDeleteVariantePiece()
  const deleteVariante = useDeleteVariante()
  const addDocument = useAddVarianteDocument()
  const deleteDocument = useDeleteVarianteDocument()
  const toggleRequired = useToggleDocumentRequired()

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [newPieceName, setNewPieceName] = useState('')
  const [newDocName, setNewDocName] = useState('')
  const [expandedPieces, setExpandedPieces] = useState<Set<string>>(new Set())

  const plot = plots?.find((p) => p.id === plotId)
  const variante = variantes?.find((v) => v.id === varianteId)
  const taskDefinitions = plot?.task_definitions ?? []

  function togglePiece(pieceId: string) {
    setExpandedPieces((prev) => {
      const next = new Set(prev)
      if (next.has(pieceId)) {
        next.delete(pieceId)
      } else {
        next.add(pieceId)
      }
      return next
    })
  }

  function handleAddPiece() {
    const trimmed = newPieceName.trim()
    if (!trimmed) return
    if (pieces?.some((p) => p.nom.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Cette pièce existe déjà')
      return
    }
    addPiece.mutate({ varianteId, nom: trimmed, plotId })
    setNewPieceName('')
  }

  function handleDeletePiece(pieceId: string) {
    deletePiece.mutate({ pieceId, varianteId, plotId })
  }

  function handleAddDocument() {
    const trimmed = newDocName.trim()
    if (!trimmed) return
    if (documents?.some((d) => d.nom.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Ce document existe déjà')
      return
    }
    addDocument.mutate({ varianteId, nom: trimmed })
    setNewDocName('')
  }

  function handleDeleteDocument(docId: string) {
    deleteDocument.mutate({ docId, varianteId })
  }

  function handleToggleRequired(docId: string, isRequired: boolean) {
    toggleRequired.mutate({ docId, isRequired, varianteId })
  }

  function handleDeleteVariante() {
    deleteVariante.mutate(
      { varianteId, plotId },
      {
        onSuccess: () => {
          toast('Variante supprimée')
          navigate({
            to: '/chantiers/$chantierId/plots/$plotId',
            params: { chantierId, plotId },
          })
        },
        onError: () => {
          toast.error('Erreur lors de la suppression de la variante')
        },
      },
    )
  }

  if (piecesLoading || documentsLoading || plotsLoading || variantesLoading) {
    return (
      <div className="flex flex-col">
        <header className="flex items-center justify-between px-4 py-3 border-b border-border">
          <Button variant="ghost" size="icon" asChild>
            <Link
              to="/chantiers/$chantierId/plots/$plotId"
              params={{ chantierId, plotId }}
              aria-label="Retour"
            >
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <div className="h-5 w-32 rounded bg-muted animate-pulse" />
          <div className="size-9" />
        </header>
        <div className="flex-1 flex items-center justify-center py-16">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!variante) {
    return (
      <div className="flex flex-col">
        <header className="flex items-center justify-between px-4 py-3 border-b border-border">
          <Button variant="ghost" size="icon" asChild>
            <Link
              to="/chantiers/$chantierId/plots/$plotId"
              params={{ chantierId, plotId }}
              aria-label="Retour"
            >
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <span className="text-lg font-semibold text-foreground">Erreur</span>
          <div className="size-9" />
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16 px-4">
          <p className="text-muted-foreground">Variante introuvable</p>
          <Button
            variant="outline"
            onClick={() =>
              navigate({
                to: '/chantiers/$chantierId/plots/$plotId',
                params: { chantierId, plotId },
              })
            }
          >
            Retour au plot
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
            to="/chantiers/$chantierId/plots/$plotId"
            params={{ chantierId, plotId }}
            aria-label="Retour"
          >
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <h1 className="text-lg font-semibold text-foreground truncate mx-2">
          {variante.nom}
        </h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Options de la variante">
              <EllipsisVertical className="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              variant="destructive"
              onSelect={(e) => {
                e.preventDefault()
                setShowDeleteDialog(true)
              }}
            >
              <Trash2 className="mr-2 size-4" />
              Supprimer la variante
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="p-4">
        <h2 className="text-base font-semibold text-foreground mb-3">
          Pièces
        </h2>

        {pieces && pieces.length > 0 ? (
          <div className="border border-border rounded-lg divide-y divide-border mb-4">
            {pieces.map((piece) => (
              <div key={piece.id}>
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <button
                    type="button"
                    className="shrink-0 text-muted-foreground"
                    onClick={() => togglePiece(piece.id)}
                    aria-label={expandedPieces.has(piece.id) ? `Replier ${piece.nom}` : `Déplier ${piece.nom}`}
                  >
                    {expandedPieces.has(piece.id) ? (
                      <ChevronDown className="size-4" />
                    ) : (
                      <ChevronRight className="size-4" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground">{piece.nom}</span>
                    <p className="text-xs text-muted-foreground">
                      {taskDefinitions.length} tâche{taskDefinitions.length !== 1 ? 's' : ''} héritée{taskDefinitions.length !== 1 ? 's' : ''} du plot
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => handleDeletePiece(piece.id)}
                    aria-label={`Supprimer ${piece.nom}`}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
                {expandedPieces.has(piece.id) && taskDefinitions.length > 0 && (
                  <div className="px-10 pb-2.5">
                    <ul className="space-y-1">
                      {taskDefinitions.map((task) => (
                        <li key={task} className="text-xs text-muted-foreground">
                          {task}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mb-4">
            Aucune pièce définie
          </p>
        )}

        <div className="flex gap-2">
          <Input
            placeholder="Nouvelle pièce..."
            value={newPieceName}
            onChange={(e) => setNewPieceName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddPiece()
            }}
            aria-label="Nouvelle pièce"
          />
          <Button
            onClick={handleAddPiece}
            disabled={!newPieceName.trim()}
          >
            <Plus className="mr-1 size-4" />
            Ajouter
          </Button>
        </div>

        <hr className="my-6 border-border" />

        <h2 className="text-base font-semibold text-foreground mb-3">
          Documents par défaut
        </h2>

        {documents && documents.length > 0 ? (
          <div className="border border-border rounded-lg divide-y divide-border mb-4">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 px-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-foreground">{doc.nom}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    id={`doc-${doc.id}`}
                    checked={doc.is_required}
                    onCheckedChange={(checked) => handleToggleRequired(doc.id, checked)}
                    aria-label={`Obligatoire ${doc.nom}`}
                  />
                  <Label htmlFor={`doc-${doc.id}`} className="text-xs whitespace-nowrap">
                    {doc.is_required ? 'Obligatoire' : 'Optionnel'}
                  </Label>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => handleDeleteDocument(doc.id)}
                  aria-label={`Supprimer ${doc.nom}`}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mb-4">
            Aucun document requis — Les lots hériteront de zéro contrainte documentaire.
          </p>
        )}

        <div className="flex gap-2">
          <Input
            placeholder="Nouveau document..."
            value={newDocName}
            onChange={(e) => setNewDocName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddDocument()
            }}
            aria-label="Nouveau document"
          />
          <Button
            onClick={handleAddDocument}
            disabled={!newDocName.trim() || addDocument.isPending}
          >
            <Plus className="mr-1 size-4" />
            Ajouter
          </Button>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette variante ?</AlertDialogTitle>
            <AlertDialogDescription>
              La variante {variante.nom} et toutes ses pièces et documents seront supprimés définitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteVariante}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
