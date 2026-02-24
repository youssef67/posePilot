import { useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

export interface BesoinLineValue {
  description: string
  quantite: number
  chantierId: string
}

interface ChantierOption {
  id: string
  nom: string
}

interface BesoinLineFormProps {
  value: BesoinLineValue
  onChange: (value: BesoinLineValue) => void
  onRemove?: () => void
  showChantierSelect: boolean
  chantiers: ChantierOption[]
  autoFocus?: boolean
  index: number
}

export function BesoinLineForm({
  value,
  onChange,
  onRemove,
  showChantierSelect,
  chantiers,
  autoFocus = false,
  index,
}: BesoinLineFormProps) {
  const descRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus && descRef.current) {
      descRef.current.focus()
    }
  }, [autoFocus])

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground shrink-0 w-5">
          {index + 1}
        </span>
        <div className="flex-1">
          <Input
            ref={descRef}
            placeholder="Description du besoin"
            value={value.description}
            onChange={(e) => onChange({ ...value, description: e.target.value })}
            aria-label={`Description ligne ${index + 1}`}
          />
        </div>
        <div className="w-20">
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            value={value.quantite}
            onChange={(e) => {
              const q = parseInt(e.target.value, 10)
              onChange({ ...value, quantite: isNaN(q) || q < 1 ? 1 : q })
            }}
            aria-label={`Quantité ligne ${index + 1}`}
          />
        </div>
        {onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground"
            onClick={onRemove}
            aria-label={`Supprimer ligne ${index + 1}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      {showChantierSelect && (
        <div className="pl-7">
          <Select
            value={value.chantierId}
            onValueChange={(v) => onChange({ ...value, chantierId: v })}
          >
            <SelectTrigger aria-label={`Chantier ligne ${index + 1}`}>
              <SelectValue placeholder="Choisir un chantier" />
            </SelectTrigger>
            <SelectContent>
              {chantiers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
