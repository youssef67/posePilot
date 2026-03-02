import { useRef, useState } from 'react'
import { FileText, FileCheck2, MoreVertical, ExternalLink, RefreshCw, Download, Share2, Plus, Trash2 } from 'lucide-react'
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
import { useUploadLotDocumentFile } from '@/lib/mutations/useUploadLotDocumentFile'
import { useDeleteLotDocumentFile } from '@/lib/mutations/useDeleteLotDocumentFile'
import { getDocumentSignedUrl, downloadDocument } from '@/lib/utils/documentStorage'
import { shareDocument } from '@/lib/utils/shareDocument'
import type { LotDocument } from '@/types/database'

interface DocumentSlotProps {
  document: LotDocument
  lotId: string
}

export function DocumentSlot({ document: doc, lotId }: DocumentSlotProps) {
  const uploadMutation = useUploadLotDocument()
  const replaceMutation = useReplaceLotDocument()
  const toggleRequired = useToggleLotDocumentRequired()
  const uploadFileMutation = useUploadLotDocumentFile()
  const deleteFileMutation = useDeleteLotDocumentFile()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<'upload' | 'replace'>('upload')

  const files = doc.lot_document_files ?? []
  const isMulti = doc.allow_multiple
  const isFilled = isMulti ? files.length > 0 : doc.file_url !== null
  const isUploading = uploadMutation.isPending || replaceMutation.isPending || uploadFileMutation.isPending

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    if (isMulti) {
      uploadFileMutation.mutate({ file, documentId: doc.id, lotId })
    } else if (mode === 'replace' && doc.file_url) {
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

  async function handleOpen(fileUrl?: string) {
    const url = fileUrl ?? doc.file_url
    if (!url) return
    const newTab = window.open('about:blank', '_blank')
    try {
      const signedUrl = await getDocumentSignedUrl(url)
      if (newTab) {
        newTab.location.href = signedUrl
      }
    } catch {
      newTab?.close()
      toast.error("Impossible d'ouvrir le document")
    }
  }

  async function handleDownload(fileUrl?: string, fileName?: string) {
    const url = fileUrl ?? doc.file_url
    const name = fileName ?? doc.file_name
    if (!url || !name) return
    try {
      await downloadDocument(url, name)
    } catch {
      toast.error('Impossible de télécharger le document')
    }
  }

  async function handleShare(fileUrl?: string, fileName?: string) {
    const url = fileUrl ?? doc.file_url
    const name = fileName ?? doc.file_name
    if (!url || !name) return
    try {
      const result = await shareDocument(url, name)
      if (result === 'shared') toast('Document partagé')
      if (result === 'downloaded') toast('Document téléchargé')
    } catch {
      toast.error('Impossible de partager le document')
    }
  }

  // Multi-file mode
  if (isMulti) {
    return (
      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/heic"
          className="hidden"
          onChange={handleFileSelect}
          data-testid={`file-input-${doc.id}`}
        />

        <div className="px-3 py-2.5">
          <div className="flex items-center min-h-8">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {isFilled ? (
                <FileCheck2 className="size-5 shrink-0 text-emerald-500" />
              ) : (
                <FileText className="size-5 shrink-0 text-muted-foreground" />
              )}
              <div className="min-w-0 flex-1">
                <span className="text-sm text-foreground block truncate">{doc.nom}</span>
                <span className="text-xs text-muted-foreground block">
                  {files.length} fichier{files.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

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
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={triggerUpload}
                disabled={isUploading}
                aria-label="Ajouter un fichier"
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          {files.length > 0 && (
            <div className="mt-1.5 space-y-1 ml-8">
              {files.map((f) => (
                <div key={f.id} className="flex items-center gap-2 min-h-8 group">
                  <button
                    type="button"
                    className="flex-1 min-w-0 text-left cursor-pointer"
                    onClick={() => handleOpen(f.file_url)}
                  >
                    <span className="text-xs text-muted-foreground block truncate">{f.file_name}</span>
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-7 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="size-3.5" />
                        <span className="sr-only">Actions fichier</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpen(f.file_url)}>
                        <ExternalLink className="size-4" />
                        Ouvrir
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(f.file_url, f.file_name)}>
                        <Download className="size-4" />
                        Télécharger
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare(f.file_url, f.file_name)}>
                        <Share2 className="size-4" />
                        Partager
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => deleteFileMutation.mutate({ fileId: f.id, fileUrl: f.file_url, lotId })}
                      >
                        <Trash2 className="size-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
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

  // Single-file mode (original behavior)
  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png,image/heic"
        className="hidden"
        onChange={handleFileSelect}
        data-testid={`file-input-${doc.id}`}
      />

      <div className="flex items-center min-h-12 px-3 py-2.5 rounded-lg transition-colors hover:bg-muted/50 active:bg-muted">
        {isFilled ? (
          <button
            type="button"
            className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer"
            onClick={() => handleOpen()}
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
            className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer"
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
                <DropdownMenuItem onClick={() => handleOpen()}>
                  <ExternalLink className="size-4" />
                  Ouvrir
                </DropdownMenuItem>
                <DropdownMenuItem onClick={triggerReplace}>
                  <RefreshCw className="size-4" />
                  Remplacer
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownload()}>
                  <Download className="size-4" />
                  Télécharger
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare()}>
                  <Share2 className="size-4" />
                  Partager
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
