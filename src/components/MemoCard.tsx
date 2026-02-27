import { EllipsisVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import type { ChantierMemo } from '@/types/database'

interface MemoCardProps {
  memo: ChantierMemo
  onEdit: (memo: ChantierMemo) => void
  onDelete: (memo: ChantierMemo) => void
}

const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' })

function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diffSeconds = Math.round((date - now) / 1000)

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['week', 60 * 60 * 24 * 7],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
  ]

  for (const [unit, seconds] of units) {
    if (Math.abs(diffSeconds) >= seconds) {
      return rtf.format(Math.round(diffSeconds / seconds), unit)
    }
  }

  return rtf.format(diffSeconds, 'second')
}

function extractAuthorName(email: string): string {
  return email.split('@')[0]
}

export function MemoCard({ memo, onEdit, onDelete }: MemoCardProps) {
  return (
    <div className="rounded-md border border-l-4 border-l-[#3B82F6] p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm whitespace-pre-wrap">{memo.content}</p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" aria-label="Options du mémo">
              <EllipsisVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onEdit(memo)}>
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={() => onDelete(memo)}>
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        <span>{extractAuthorName(memo.created_by_email)}</span>
        <span>·</span>
        <span>{formatRelativeTime(memo.created_at)}</span>
      </div>
    </div>
  )
}
