export interface SharePhotoParams {
  photoUrl: string
  shareText: string
}

export type ShareResult = 'shared' | 'downloaded' | 'cancelled'

export async function sharePhoto({ photoUrl, shareText }: SharePhotoParams): Promise<ShareResult> {
  // Single fetch — reused for both Web Share and fallback paths
  const response = await fetch(photoUrl)
  if (!response.ok) throw new Error(`Failed to fetch photo: ${response.status}`)
  const blob = await response.blob()

  // Try Web Share API with file
  if (navigator.share) {
    try {
      const file = new File([blob], 'photo.jpg', { type: blob.type || 'image/jpeg' })

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: shareText })
        return 'shared'
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return 'cancelled'
      }
      throw err
    }
  }

  // Fallback: download photo + copy text to clipboard
  const blobUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = 'photo.jpg'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(blobUrl)

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(shareText)
  }

  return 'downloaded'
}
