import { useState, useRef, useCallback } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, MessageSquare, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { usePieces } from '@/lib/queries/usePieces'
import { useUpdateTaskStatus } from '@/lib/mutations/useUpdateTaskStatus'
import { useUpdatePieceMetrage } from '@/lib/mutations/useUpdatePieceMetrage'
import { TapCycleButton } from '@/components/TapCycleButton'
import { BreadcrumbNav } from '@/components/BreadcrumbNav'
import { PaginationDots } from '@/components/PaginationDots'
import { NotesList } from '@/components/NotesList'
import { NoteForm } from '@/components/NoteForm'
import { Fab, type FabMenuItem } from '@/components/Fab'
import { PhotoCapture, type PhotoCaptureHandle } from '@/components/PhotoCapture'
import { useRealtimeNotes } from '@/lib/subscriptions/useRealtimeNotes'
import { useSwipe } from '@/lib/utils/useSwipe'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { TaskStatus } from '@/types/enums'

export const Route = createFileRoute(
  '/_authenticated/chantiers/$chantierId/plots/$plotId/$etageId/$lotId/$pieceId',
)({
  staticData: { breadcrumb: 'Pièce' },
  component: PiecePage,
})

function formatCounter(taches: { status: string }[]) {
  const doneTaches = taches.filter((t) => t.status === 'done').length
  const enCoursTaches = taches.filter((t) => t.status === 'in_progress').length
  const parts: string[] = []
  if (doneTaches > 0 || enCoursTaches > 0) {
    parts.push(`${doneTaches} fait${doneTaches > 1 ? 's' : ''}`)
    if (enCoursTaches > 0) {
      parts.push(`${enCoursTaches} en cours`)
    }
  }
  return parts.length > 0 ? parts.join(', ') : 'Aucune tâche commencée'
}

function parseMetrage(value: string): number | null {
  if (value.trim() === '') return null
  const cleaned = value.replace(',', '.')
  const num = parseFloat(cleaned)
  if (isNaN(num) || num < 0) return null
  return Math.round(num * 100) / 100
}

function isValidMetrage(value: string): boolean {
  if (value.trim() === '') return true
  const cleaned = value.replace(',', '.')
  const num = parseFloat(cleaned)
  if (isNaN(num) || num < 0) return false
  const parts = cleaned.split('.')
  if (parts.length > 1 && parts[1].length > 2) return false
  return true
}

function MetrageSection({
  pieceId,
  lotId,
  plotId,
  chantierId,
  metrageM2,
  metrageMl,
}: {
  pieceId: string
  lotId: string
  plotId: string
  chantierId: string
  metrageM2: number | null
  metrageMl: number | null
}) {
  const updateMetrage = useUpdatePieceMetrage()
  const [m2Value, setM2Value] = useState(metrageM2 != null ? String(metrageM2) : '')
  const [mlValue, setMlValue] = useState(metrageMl != null ? String(metrageMl) : '')
  const [m2Error, setM2Error] = useState('')
  const [mlError, setMlError] = useState('')

  const saveMetrage = useCallback(
    (field: 'm2' | 'ml', rawValue: string) => {
      const currentM2 = field === 'm2' ? rawValue : m2Value
      const currentMl = field === 'ml' ? rawValue : mlValue

      if (!isValidMetrage(currentM2)) {
        if (field === 'm2') setM2Error('Nombre >= 0, max 2 décimales')
        return
      }
      if (!isValidMetrage(currentMl)) {
        if (field === 'ml') setMlError('Nombre >= 0, max 2 décimales')
        return
      }

      const newM2 = parseMetrage(currentM2)
      const newMl = parseMetrage(currentMl)

      if (newM2 === metrageM2 && newMl === metrageMl) return

      updateMetrage.mutate(
        { pieceId, lotId, plotId, chantierId, metrage_m2: newM2, metrage_ml: newMl },
        { onSuccess: () => toast.success('Métrés sauvegardés') },
      )
    },
    [m2Value, mlValue, metrageM2, metrageMl, pieceId, lotId, plotId, chantierId, updateMetrage],
  )

  const handleBlur = (field: 'm2' | 'ml') => {
    saveMetrage(field, field === 'm2' ? m2Value : mlValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent, field: 'm2' | 'ml') => {
    if (e.key === 'Enter') {
      e.preventDefault()
      ;(e.target as HTMLInputElement).blur()
    }
    if (field === 'm2') setM2Error('')
    if (field === 'ml') setMlError('')
  }

  return (
    <div className="px-4 pt-4">
      <h2 className="text-sm text-muted-foreground mb-2">Métrés</h2>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="metrage-m2" className="text-sm font-medium text-foreground mb-1 block">
            Surface (m²)
          </label>
          <Input
            id="metrage-m2"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="—"
            className="h-10"
            value={m2Value}
            onChange={(e) => {
              setM2Value(e.target.value)
              setM2Error('')
            }}
            onBlur={() => handleBlur('m2')}
            onKeyDown={(e) => handleKeyDown(e, 'm2')}
            aria-invalid={!!m2Error}
          />
          {m2Error && <p className="text-xs text-destructive mt-1">{m2Error}</p>}
        </div>
        <div>
          <label htmlFor="metrage-ml" className="text-sm font-medium text-foreground mb-1 block">
            Plinthes (ML)
          </label>
          <Input
            id="metrage-ml"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="—"
            className="h-10"
            value={mlValue}
            onChange={(e) => {
              setMlValue(e.target.value)
              setMlError('')
            }}
            onBlur={() => handleBlur('ml')}
            onKeyDown={(e) => handleKeyDown(e, 'ml')}
            aria-invalid={!!mlError}
          />
          {mlError && <p className="text-xs text-destructive mt-1">{mlError}</p>}
        </div>
      </div>
    </div>
  )
}

function PiecePage() {
  const { chantierId, plotId, etageId, lotId, pieceId } = Route.useParams()
  const navigate = useNavigate()
  const { data: pieces, isLoading } = usePieces(lotId)
  const updateTaskStatus = useUpdateTaskStatus()
  useRealtimeNotes(pieceId, 'piece')
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null)
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

  const piece = pieces?.find((p) => p.id === pieceId)
  const currentIndex = pieces?.findIndex((p) => p.id === pieceId) ?? -1
  const hasPrev = currentIndex > 0
  const hasNext = pieces ? currentIndex < pieces.length - 1 : false

  const swipeHandlers = useSwipe({
    onSwipe: (direction) => {
      if (direction === 'left' && hasNext) {
        setSlideDirection('left')
        navigate({
          to: '/chantiers/$chantierId/plots/$plotId/$etageId/$lotId/$pieceId',
          params: { chantierId, plotId, etageId, lotId, pieceId: pieces![currentIndex + 1].id },
        })
      } else if (direction === 'right' && hasPrev) {
        setSlideDirection('right')
        navigate({
          to: '/chantiers/$chantierId/plots/$plotId/$etageId/$lotId/$pieceId',
          params: { chantierId, plotId, etageId, lotId, pieceId: pieces![currentIndex - 1].id },
        })
      }
    },
  })

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <header className="flex items-center justify-between px-4 py-3 border-b border-border">
          <Button variant="ghost" size="icon" asChild>
            <Link
              to="/chantiers/$chantierId/plots/$plotId/$etageId/$lotId"
              params={{ chantierId, plotId, etageId, lotId }}
              aria-label="Retour"
            >
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <div className="h-5 w-32 rounded bg-muted animate-pulse" />
          <div className="size-9" />
        </header>
        <div className="p-4">
          <div className="h-5 w-28 rounded bg-muted animate-pulse mb-1" />
          <div className="h-4 w-40 rounded bg-muted animate-pulse mb-3" />
          <div className="border border-border rounded-lg divide-y divide-border">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2.5">
                <div className="h-3.5 w-32 rounded bg-muted animate-pulse" />
                <div className="size-11 rounded-full bg-muted animate-pulse shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!piece) {
    return (
      <div className="flex flex-col">
        <header className="flex items-center justify-between px-4 py-3 border-b border-border">
          <Button variant="ghost" size="icon" asChild>
            <Link
              to="/chantiers/$chantierId/plots/$plotId/$etageId/$lotId"
              params={{ chantierId, plotId, etageId, lotId }}
              aria-label="Retour"
            >
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <span className="text-lg font-semibold text-foreground">Erreur</span>
          <div className="size-9" />
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16 px-4">
          <p className="text-muted-foreground">Pièce introuvable</p>
          <Button
            variant="outline"
            onClick={() =>
              navigate({
                to: '/chantiers/$chantierId/plots/$plotId/$etageId/$lotId',
                params: { chantierId, plotId, etageId, lotId },
              })
            }
          >
            Retour au lot
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      key={pieceId}
      className={cn(
        'flex flex-col',
        slideDirection === 'left' && 'motion-safe:animate-slide-in-right',
        slideDirection === 'right' && 'motion-safe:animate-slide-in-left',
      )}
      onAnimationEnd={() => setSlideDirection(null)}
      {...swipeHandlers}
    >
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <Button variant="ghost" size="icon" asChild>
          <Link
            to="/chantiers/$chantierId/plots/$plotId/$etageId/$lotId"
            params={{ chantierId, plotId, etageId, lotId }}
            aria-label="Retour"
          >
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <h1 className="text-lg font-semibold text-foreground truncate mx-2">
          {piece.nom}
        </h1>
        <div className="size-9" />
      </header>

      <BreadcrumbNav />

      <MetrageSection
        key={`${pieceId}-${piece.metrage_m2}-${piece.metrage_ml}`}
        pieceId={pieceId}
        lotId={lotId}
        plotId={plotId}
        chantierId={chantierId}
        metrageM2={piece.metrage_m2}
        metrageMl={piece.metrage_ml}
      />

      <div className="p-4">
        <h2 className="text-base font-semibold text-foreground mb-1">
          Tâches ({piece.taches.length})
        </h2>
        <p className="text-sm text-muted-foreground mb-3">
          {formatCounter(piece.taches)}
        </p>

        {piece.taches.length > 0 ? (
          <div className="border border-border rounded-lg divide-y divide-border">
            {piece.taches.map((tache) => (
              <div
                key={tache.id}
                className="flex items-center justify-between px-3 py-2.5"
              >
                <span className="text-sm text-foreground">{tache.nom}</span>
                <TapCycleButton
                  status={tache.status as TaskStatus}
                  onCycle={(newStatus) =>
                    updateTaskStatus.mutate({
                      tacheId: tache.id,
                      status: newStatus,
                      lotId,
                    })
                  }
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Aucune tâche</p>
        )}
      </div>

      <div className="border-t border-border" />

      <div className="p-4">
        <h2 className="text-base font-semibold text-foreground mb-3">Notes</h2>
        <NotesList pieceId={pieceId} />
      </div>

      {pieces && pieces.length > 1 && (
        <PaginationDots total={pieces.length} current={currentIndex} />
      )}

      <PhotoCapture ref={photoCaptureRef} onPhotoSelected={handlePhotoSelected} />
      <Fab menuItems={fabMenuItems} />
      <NoteForm
        key={initialPhoto ? 'with-photo' : 'without-photo'}
        open={noteFormOpen}
        onOpenChange={(open) => {
          setNoteFormOpen(open)
          if (!open) setInitialPhoto(undefined)
        }}
        pieceId={pieceId}
        initialPhoto={initialPhoto}
      />
    </div>
  )
}
