import imageCompression from 'browser-image-compression'

export async function compressPhoto(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<File> {
  return imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    initialQuality: 0.7,
    fileType: 'image/jpeg',
    onProgress,
  })
}
