import { describe, it, expect, vi } from 'vitest'

vi.mock('browser-image-compression', () => ({
  default: vi.fn(),
}))

import { compressPhoto } from './compressImage'
import imageCompression from 'browser-image-compression'

const mockImageCompression = vi.mocked(imageCompression)

describe('compressPhoto', () => {
  it('calls imageCompression with correct options', async () => {
    const inputFile = new File(['photo-data'], 'photo.jpg', { type: 'image/jpeg' })
    const compressedFile = new File(['compressed'], 'compressed.jpg', { type: 'image/jpeg' })
    mockImageCompression.mockResolvedValue(compressedFile)

    const result = await compressPhoto(inputFile)

    expect(mockImageCompression).toHaveBeenCalledWith(inputFile, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
      initialQuality: 0.7,
      fileType: 'image/jpeg',
      onProgress: undefined,
    })
    expect(result).toBe(compressedFile)
  })

  it('forwards onProgress callback to imageCompression', async () => {
    const inputFile = new File(['photo-data'], 'photo.jpg', { type: 'image/jpeg' })
    mockImageCompression.mockResolvedValue(new File(['c'], 'c.jpg'))
    const onProgress = vi.fn()

    await compressPhoto(inputFile, onProgress)

    expect(mockImageCompression).toHaveBeenCalledWith(inputFile, expect.objectContaining({
      onProgress,
    }))
  })

  it('propagates compression errors', async () => {
    const inputFile = new File(['data'], 'img.png', { type: 'image/png' })
    mockImageCompression.mockRejectedValue(new Error('compression failed'))

    await expect(compressPhoto(inputFile)).rejects.toThrow('compression failed')
  })
})
