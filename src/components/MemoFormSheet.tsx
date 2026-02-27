import { useEffect, useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useCreateMemo } from '@/lib/mutations/useCreateMemo'
import { useUpdateMemo } from '@/lib/mutations/useUpdateMemo'
import { useAuth } from '@/lib/auth'
import type { ChantierMemo } from '@/types/database'

interface MemoFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  chantierId: string
  editMemo?: ChantierMemo | null
}

export function MemoFormSheet({ open, onOpenChange, chantierId, editMemo }: MemoFormSheetProps) {
  const [content, setContent] = useState(editMemo?.content ?? '')
  useEffect(() => {
    setContent(editMemo?.content ?? '')
  }, [editMemo])
  const createMemo = useCreateMemo()
  const updateMemo = useUpdateMemo()
  const { user } = useAuth()

  const isEdit = !!editMemo

  function handleSubmit() {
    const trimmed = content.trim()
    if (!trimmed) return

    if (isEdit && editMemo) {
      updateMemo.mutate(
        { memoId: editMemo.id, content: trimmed, chantierId },
        { onSuccess: () => onOpenChange(false) },
      )
    } else {
      createMemo.mutate(
        { chantierId, content: trimmed, createdByEmail: user?.email ?? '?' },
        { onSuccess: () => onOpenChange(false) },
      )
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-xl">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Modifier le mémo' : 'Nouveau mémo'}</SheetTitle>
          <SheetDescription className="sr-only">
            {isEdit ? 'Modifier le contenu du mémo' : 'Ajouter un mémo au chantier'}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4 pb-4">
          <Textarea
            placeholder="Écrire un mémo..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
          />
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || createMemo.isPending || updateMemo.isPending}
          >
            {isEdit ? 'Modifier' : 'Ajouter'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
