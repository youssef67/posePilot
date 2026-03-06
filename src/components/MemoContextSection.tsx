import { StickyNote } from 'lucide-react'
import { useMemos, type MemoWithPhotos } from '@/lib/queries/useMemos'
import { formatRelativeTime } from '@/lib/utils/formatRelativeTime'

interface MemoContextSectionProps {
  etageId: string
  etageNom: string
}

function MemoReadOnly({ memo }: { memo: MemoWithPhotos }) {
  return (
    <div className="pl-4 border-l-2 border-muted py-1">
      <p className="text-sm whitespace-pre-wrap">{memo.content}</p>
      {memo.memo_photos.length > 0 && (
        <div className="mt-1 flex gap-2 overflow-x-auto">
          {memo.memo_photos.map((photo) => (
            <img
              key={photo.id}
              src={photo.photo_url}
              alt="Photo du mémo"
              className="h-16 w-16 rounded-lg object-cover shrink-0"
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

export function MemoContextSection({ etageId, etageNom }: MemoContextSectionProps) {
  const { data: memos } = useMemos('etage', etageId)

  if (!memos || memos.length === 0) return null

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <StickyNote className="size-4 text-[#3B82F6]" />
        <h2 className="text-base font-semibold text-foreground">Mémos étage — {etageNom}</h2>
      </div>
      <div className="flex flex-col gap-2 rounded-lg border p-3">
        {memos.map((memo) => (
          <MemoReadOnly key={memo.id} memo={memo} />
        ))}
      </div>
    </div>
  )
}
