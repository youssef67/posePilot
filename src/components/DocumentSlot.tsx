import { useRef, useState } from 'react'
import { FileText, FileCheck2, MoreVertical, ExternalLink, RefreshCw, Download } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { useUploadLotDocument } from '@/lib/mutations/useUploadLotDocument'
import { useReplaceLotDocument } from '@/lib/mutations/useReplaceLotDocument'
import { useToggleLotDocumentRequired } from '@/lib/mutations/useToggleLotDocumentRequired'
import { getDocumentSignedUrl, downloadDocument } from '@/lib/utils/documentStorage'
import type { LotDocument } from '@/types/database'

interface DocumentSlotProps {
  document: LotDocument
  lotId: string
}

export function DocumentSlot({ document: doc, lotId }: DocumentSlotProps) {
  const uploadMutation = useUploadLotDocument()
  const replaceMutation = useReplaceLotDocument()
  const toggleRequired = useToggleLotDocumentRequired()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<'upload' | 'replace'>('upload')

  const isFilled = doc.file_url !== null
  const isUploading = uploadMutation.isPending || replaceMutation.isPending

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    // Reset input so the same file can be re-selected
    e.target.value = ''

    if (mode === 'replace' && doc.file_url) {
      replaceMutation.mutate({
        file,
        documentId: doc.id,
        lotId,
        oldFileUrl: doc.file_url,
      })
    } else {
      uploadMutation.mutate({
        file,
        documentId: doc.id,
        lotId,
      })
    }
  }

  function triggerUpload() {
    setMode('upload')
    fileInputRef.current?.click()
  }

  function triggerReplace() {
    setMode('replace')
    fileInputRef.current?.click()
  }

  async function handleOpen() {
    if (!doc.file_url) return
    // Open window synchronously to avoid Safari iOS popup blocker
    const newTab = window.open('about:blank', '_blank')
    try {
      const url = await getDocumentSignedUrl(doc.file_url)
      if (newTab) {
        newTab.location.href = url
      }
    } catch {
      newTab?.close()
      toast.error("Impossible d'ouvrir le document")
    }
  }

  async function handleDownload() {
    if (!doc.file_url || !doc.file_name) return
    try {
      await downloadDocument(doc.file_url, doc.file_name)
    } catch {
      toast.error('Impossible de télécharger le document')
    }
  }

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handleFileSelect}
        data-testid={`file-input-${doc.id}`}
      />

      <div className="flex items-center min-h-12 px-3 py-2.5">
        {isFilled ? (
          <button
            type="button"
            className="flex items-center gap-3 flex-1 min-w-0 text-left"
            onClick={handleOpen}
          >
            <FileCheck2 className="size-5 shrink-0 text-emerald-500" />
            <div className="min-w-0 flex-1">
              <span className="text-sm text-foreground block truncate">{doc.nom}</span>
              {doc.file_name && (
                <span className="text-xs text-muted-foreground block truncate">{doc.file_name}</span>
              )}
            </div>
          </button>
        ) : (
          <button
            type="button"
            className="flex items-center gap-3 flex-1 min-w-0 text-left"
            onClick={triggerUpload}
            disabled={isUploading}
          >
            <FileText className="size-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <span className="text-sm text-foreground block truncate">{doc.nom}</span>
              <span className="text-xs text-muted-foreground block">Aucun fichier</span>
            </div>
          </button>
        )}

        <div className="flex items-center gap-1 shrink-0 ml-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              toggleRequired.mutate({ docId: doc.id, isRequired: !doc.is_required, lotId })
            }}
            aria-label="Basculer obligatoire"
            aria-pressed={doc.is_required}
            className="min-h-8 px-1 flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
          >
            <Badge variant={doc.is_required ? 'default' : 'secondary'} className="text-[10px]">
              {doc.is_required ? 'Obligatoire' : 'Optionnel'}
            </Badge>
          </button>

          {isFilled && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreVertical className="size-4" />
                  <span className="sr-only">Actions document</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleOpen}>
                  <ExternalLink className="size-4" />
                  Ouvrir
                </DropdownMenuItem>
                <DropdownMenuItem onClick={triggerReplace}>
                  <RefreshCw className="size-4" />
                  Remplacer
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownload}>
                  <Download className="size-4" />
                  Télécharger
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {isUploading && (
        <div className="h-1 bg-muted mx-3 mb-1 rounded-full overflow-hidden" role="progressbar">
          <div className="h-full w-full bg-primary animate-pulse rounded-full" />
        </div>
      )}
    </div>
  )
}
