import { useEffect, useState } from 'react'
import { Package, PackageMinus, PackageCheck } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import type { MateriauxStatut } from '@/lib/mutations/useUpdateLotMateriaux'

const STATUS_OPTIONS: { value: MateriauxStatut; label: string; icon: typeof Package; color: string }[] = [
  { value: 'non_recu', label: 'Non reçu', icon: Package, color: 'text-muted-foreground' },
  { value: 'partiel', label: 'Partiel', icon: PackageMinus, color: 'text-amber-600 dark:text-amber-400' },
  { value: 'recu', label: 'Reçu', icon: PackageCheck, color: 'text-green-600 dark:text-green-400' },
]

interface MateriauxSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lotCode: string
  currentStatut: MateriauxStatut
  currentNote: string | null
  onSubmit: (statut: MateriauxStatut, note: string | null) => void
}

export function MateriauxSheet({ open, onOpenChange, lotCode, currentStatut, currentNote, onSubmit }: MateriauxSheetProps) {
  const [statut, setStatut] = useState<MateriauxStatut>(currentStatut)
  const [note, setNote] = useState(currentNote ?? '')

  useEffect(() => {
    if (open) {
      setStatut(currentStatut)
      setNote(currentNote ?? '')
    }
  }, [open, currentStatut, currentNote])

  function handleSubmit() {
    onSubmit(statut, note.trim() || null)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-xl">
        <SheetHeader>
          <SheetTitle>Matériaux — Lot {lotCode}</SheetTitle>
          <SheetDescription className="sr-only">
            Modifier le statut de réception des matériaux
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4 pb-4">
          <div className="grid grid-cols-3 gap-2">
            {STATUS_OPTIONS.map((opt) => {
              const Icon = opt.icon
              const isSelected = statut === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  data-testid={`statut-${opt.value}`}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 transition-colors ${
                    isSelected
                      ? 'border-primary bg-accent'
                      : 'border-transparent bg-muted/50 hover:bg-muted'
                  }`}
                  onClick={() => setStatut(opt.value)}
                >
                  <Icon className={`size-6 ${opt.color}`} />
                  <span className="text-xs font-medium">{opt.label}</span>
                </button>
              )
            })}
          </div>

          <Textarea
            placeholder="Note (optionnelle)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            data-testid="materiaux-note"
          />

          <Button onClick={handleSubmit} className="w-full" data-testid="materiaux-submit">
            Valider
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
