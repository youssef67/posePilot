import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
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
import { BesoinsList } from '@/components/BesoinsList'
import { useRealtimeBesoins } from '@/lib/subscriptions/useRealtimeBesoins'
import { useCreateBesoin } from '@/lib/mutations/useCreateBesoin'
import { useTransformBesoinToLivraison } from '@/lib/mutations/useTransformBesoinToLivraison'
import { useBesoins } from '@/lib/queries/useBesoins'
import { useChantier } from '@/lib/queries/useChantier'
import type { Besoin } from '@/types/database'

export const Route = createFileRoute(
  '/_authenticated/chantiers/$chantierId/besoins',
)({
  component: BesoinsPage,
})

function BesoinsPage() {
  const { chantierId } = Route.useParams()
  const { data: chantier } = useChantier(chantierId)
  const { data: besoins, isLoading } = useBesoins(chantierId)
  useRealtimeBesoins(chantierId)
  const createBesoin = useCreateBesoin()
  const transformBesoin = useTransformBesoinToLivraison()

  const [showSheet, setShowSheet] = useState(false)
  const [description, setDescription] = useState('')
  const [descError, setDescError] = useState('')
  const [showCommanderDialog, setShowCommanderDialog] = useState(false)
  const [besoinToCommand, setBesoinToCommand] = useState<Besoin | null>(null)

  function handleOpenSheet() {
    setDescription('')
    setDescError('')
    setShowSheet(true)
  }

  function handleCreate() {
    const trimmed = description.trim()
    if (!trimmed) {
      setDescError('La description est requise')
      return
    }
    createBesoin.mutate(
      { chantierId, description: trimmed },
      {
        onSuccess: () => {
          setShowSheet(false)
          toast('Besoin créé')
        },
        onError: () => toast.error('Erreur lors de la création du besoin'),
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
        onError: () => toast.error('Erreur lors de la commande'),
      },
    )
  }

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
          Besoins{chantier ? ` — ${chantier.nom}` : ''}
        </h1>
      </header>

      <div className="flex-1 p-4">
        <h2 className="text-base font-semibold text-foreground mb-3">
          Besoins en attente{besoins && besoins.length > 0 ? ` (${besoins.length})` : ''}
        </h2>

        <BesoinsList
          besoins={besoins}
          isLoading={isLoading}
          onOpenSheet={handleOpenSheet}
          onCommander={handleCommander}
        />

        <Fab onClick={handleOpenSheet} />
      </div>

      <Sheet open={showSheet} onOpenChange={setShowSheet}>
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
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                if (descError) setDescError('')
              }}
              aria-label="Description du besoin"
              aria-invalid={!!descError}
              rows={3}
            />
            {descError && (
              <p className="text-sm text-destructive mt-1">{descError}</p>
            )}
          </div>
          <SheetFooter>
            <Button
              onClick={handleCreate}
              disabled={createBesoin.isPending}
              className="w-full"
            >
              Créer le besoin
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

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
    </div>
  )
}
