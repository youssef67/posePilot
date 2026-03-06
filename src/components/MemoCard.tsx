import { EllipsisVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { formatRelativeTime } from '@/lib/utils/formatRelativeTime'
import type { MemoWithPhotos } from '@/lib/queries/useMemos'

interface MemoCardProps {
  memo: MemoWithPhotos
  onEdit?: (memo: MemoWithPhotos) => void
  onDelete?: (memo: MemoWithPhotos) => void
}

export function MemoCard({ memo, onEdit, onDelete }: MemoCardProps) {
  return (
    <div className="rounded-md border border-l-4 border-l-[#3B82F6] p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm whitespace-pre-wrap">{memo.content}</p>
        {onEdit && onDelete && (
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
        )}
      </div>
      {memo.memo_photos.length > 0 && (
        <div className="mt-2 flex gap-2 overflow-x-auto">
          {memo.memo_photos.map((photo) => (
            <img
              key={photo.id}
              src={photo.photo_url}
              alt="Photo du mémo"
              className="h-20 w-20 rounded-lg object-cover shrink-0"
            />
          ))}
        </div>
      )}
      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        <span>{memo.created_by_email.split('@')[0]}</span>
        <span>·</span>
        <span>{formatRelativeTime(memo.created_at)}</span>
      </div>
    </div>
  )
}
