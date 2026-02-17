import { getDocumentSignedUrl } from './documentStorage'

export type ShareResult = 'shared' | 'downloaded' | 'cancelled'

/** File extension → MIME type mapping for common document types */
function getMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'pdf':
      return 'application/pdf'
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'heic':
      return 'image/heic'
    default:
      return 'application/octet-stream'
  }
}

export async function shareDocument(filePath: string, fileName: string): Promise<ShareResult> {
  const signedUrl = await getDocumentSignedUrl(filePath)

  const response = await fetch(signedUrl)
  if (!response.ok) throw new Error(`Failed to fetch document: ${response.status}`)
  const blob = await response.blob()

  const mimeType = getMimeType(fileName)
  const file = new File([blob], fileName, { type: mimeType })

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return 'shared'
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return 'cancelled'
      }
      throw err
    }
  }

  // Fallback: download the file
  const blobUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = fileName
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(blobUrl)

  return 'downloaded'
}
