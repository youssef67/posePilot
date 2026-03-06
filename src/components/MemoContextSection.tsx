import { useState } from 'react'
import { ChevronDown, ChevronRight, StickyNote } from 'lucide-react'
import { useContextMemos } from '@/lib/queries/useContextMemos'
import { formatRelativeTime } from '@/lib/utils/formatRelativeTime'
import type { Memo } from '@/types/database'

interface MemoContextSectionProps {
  chantierId: string
  plotId: string
  etageId: string
  chantierNom: string
  plotNom: string
  etageNom: string
}

function MemoReadOnly({ memo }: { memo: Memo }) {
  return (
    <div className="pl-4 border-l-2 border-muted py-1">
      <p className="text-sm whitespace-pre-wrap">{memo.content}</p>
      {memo.photo_url && (
        <img
          src={memo.photo_url}
          alt="Photo du mémo"
          className="mt-1 h-16 w-16 rounded-lg object-cover"
        />
      )}
      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        <span>{memo.created_by_email.split('@')[0]}</span>
        <span>·</span>
        <span>{formatRelativeTime(memo.created_at)}</span>
      </div>
    </div>
  )
}

function MemoGroup({ label, memos, defaultOpen }: { label: string; memos: Memo[]; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div>
      <button
        type="button"
        className="flex items-center gap-2 w-full text-left py-1.5"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
        <span className="text-sm font-medium flex-1">{label}</span>
        <span className="text-xs text-muted-foreground">({memos.length})</span>
      </button>
      {open && memos.length > 0 && (
        <div className="flex flex-col gap-2 pl-6 pb-2">
          {memos.map((memo) => (
            <MemoReadOnly key={memo.id} memo={memo} />
          ))}
        </div>
      )}
    </div>
  )
}

export function MemoContextSection({ chantierId, plotId, etageId, chantierNom, plotNom, etageNom }: MemoContextSectionProps) {
  const { data } = useContextMemos(chantierId, plotId, etageId)

  if (!data) return null

  const total = data.chantier.length + data.plot.length + data.etage.length
  if (total === 0) return null

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <StickyNote className="size-4 text-[#3B82F6]" />
        <h2 className="text-base font-semibold text-foreground">Mémos</h2>
      </div>
      <div className="flex flex-col gap-1 rounded-lg border p-3">
        <MemoGroup
          label={`Chantier — ${chantierNom}`}
          memos={data.chantier}
          defaultOpen={data.chantier.length > 0}
        />
        <MemoGroup
          label={`Plot — ${plotNom}`}
          memos={data.plot}
          defaultOpen={data.plot.length > 0}
        />
        <MemoGroup
          label={`Étage — ${etageNom}`}
          memos={data.etage}
          defaultOpen={data.etage.length > 0}
        />
      </div>
    </div>
  )
}
