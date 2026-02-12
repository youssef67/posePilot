import { supabase } from '@/lib/supabase'

export async function getDocumentSignedUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(filePath, 3600) // 1h expiration
  if (error) throw error
  return data.signedUrl
}

export async function downloadDocument(filePath: string, fileName: string): Promise<void> {
  // Use signed URL with Content-Disposition: attachment for iOS Safari compatibility
  // (the download attribute on <a> is not supported on iOS Safari)
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(filePath, 60, { download: fileName })
  if (error) throw error

  const a = document.createElement('a')
  a.href = data.signedUrl
  a.download = fileName
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
