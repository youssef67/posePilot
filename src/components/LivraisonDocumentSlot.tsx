import { useRef, useState } from 'react'
import { FileText, FileCheck2, MoreVertical, ExternalLink, RefreshCw, Download } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { useUploadLivraisonDocument } from '@/lib/mutations/useUploadLivraisonDocument'
import { useReplaceLivraisonDocument } from '@/lib/mutations/useReplaceLivraisonDocument'
import { getDocumentSignedUrl, downloadDocument } from '@/lib/utils/documentStorage'
import type { Livraison } from '@/types/database'

const ACCEPT = 'application/pdf,image/jpeg,image/png,image/heic'

const LABELS = {
  bc: 'Bon de commande',
  bl: 'Bon de livraison',
} as const

interface LivraisonDocumentSlotProps {
  type: 'bc' | 'bl'
  livraison: Livraison
  chantierId: string
  disabled?: boolean
}

export function LivraisonDocumentSlot({ type, livraison, chantierId, disabled }: LivraisonDocumentSlotProps) {
  const uploadMutation = useUploadLivraisonDocument()
  const replaceMutation = useReplaceLivraisonDocument()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<'upload' | 'replace'>('upload')

  const fileUrl = type === 'bc' ? livraison.bc_file_url : livraison.bl_file_url
  const fileName = type === 'bc' ? livraison.bc_file_name : livraison.bl_file_name
  const isFilled = fileUrl !== null
  const isUploading = uploadMutation.isPending || replaceMutation.isPending
  const label = LABELS[type]

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    if (mode === 'replace' && fileUrl) {
      replaceMutation.mutate({
        livraisonId: livraison.id,
        chantierId,
        file,
        documentType: type,
        oldFileUrl: fileUrl,
      })
    } else {
      uploadMutation.mutate({
        livraisonId: livraison.id,
        chantierId,
        file,
        documentType: type,
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
    if (!fileUrl) return
    const newTab = window.open('about:blank', '_blank')
    try {
      const url = await getDocumentSignedUrl(fileUrl)
      if (newTab) {
        newTab.location.href = url
      }
    } catch {
      newTab?.close()
      toast.error("Impossible d'ouvrir le document")
    }
  }

  async function handleDownload() {
    if (!fileUrl || !fileName) return
    try {
      await downloadDocument(fileUrl, fileName)
    } catch {
      toast.error('Impossible de télécharger le document')
    }
  }

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={handleFileSelect}
        data-testid={`file-input-${type}-${livraison.id}`}
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
              <span className="text-sm text-foreground block truncate">{label}</span>
              {fileName && (
                <span className="text-xs text-muted-foreground block truncate">{fileName}</span>
              )}
            </div>
          </button>
        ) : (
          <button
            type="button"
            className="flex items-center gap-3 flex-1 min-w-0 text-left"
            onClick={triggerUpload}
            disabled={isUploading || disabled}
          >
            <FileText className="size-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <span className="text-sm text-foreground block truncate">{label}</span>
              <span className="text-xs text-muted-foreground block">Ajouter un fichier</span>
            </div>
          </button>
        )}

        {isFilled && (
          <div className="shrink-0 ml-2">
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
                <DropdownMenuItem onClick={handleDownload}>
                  <Download className="size-4" />
                  Télécharger
                </DropdownMenuItem>
                <DropdownMenuItem onClick={triggerReplace}>
                  <RefreshCw className="size-4" />
                  Remplacer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {isUploading && (
        <div className="h-1 bg-muted mx-3 mb-1 rounded-full overflow-hidden" role="progressbar">
          <div className="h-full w-full bg-primary animate-pulse rounded-full" />
        </div>
      )}
    </div>
  )
}
