import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { sharePhoto } from './sharePhoto'

describe('sharePhoto', () => {
  const photoUrl = 'https://storage.example.com/note-photos/photo.jpg'
  const shareText = 'Chantier Les Oliviers — Plot A — Lot 203 — SDB : support fissuré'
  const fakeBlob = new Blob(['fake-image'], { type: 'image/jpeg' })

  let originalShare: typeof navigator.share | undefined
  let originalCanShare: typeof navigator.canShare | undefined
  let originalClipboard: Clipboard
  let originalFetch: typeof globalThis.fetch
  let originalCreateObjectURL: typeof URL.createObjectURL
  let originalRevokeObjectURL: typeof URL.revokeObjectURL

  beforeEach(() => {
    originalShare = navigator.share
    originalCanShare = navigator.canShare
    originalClipboard = navigator.clipboard
    originalFetch = globalThis.fetch
    originalCreateObjectURL = URL.createObjectURL
    originalRevokeObjectURL = URL.revokeObjectURL

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(fakeBlob),
    })
    URL.createObjectURL = vi.fn(() => 'blob:fake-url')
    URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    Object.defineProperty(navigator, 'share', { value: originalShare, configurable: true })
    Object.defineProperty(navigator, 'canShare', { value: originalCanShare, configurable: true })
    Object.defineProperty(navigator, 'clipboard', { value: originalClipboard, configurable: true })
    globalThis.fetch = originalFetch
    URL.createObjectURL = originalCreateObjectURL
    URL.revokeObjectURL = originalRevokeObjectURL
  })

  it('uses Web Share API when supported and canShare files — returns "shared"', async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined)
    const mockCanShare = vi.fn().mockReturnValue(true)
    Object.defineProperty(navigator, 'share', { value: mockShare, configurable: true })
    Object.defineProperty(navigator, 'canShare', { value: mockCanShare, configurable: true })

    const result = await sharePhoto({ photoUrl, shareText })

    expect(result).toBe('shared')
    expect(globalThis.fetch).toHaveBeenCalledWith(photoUrl)
    expect(mockCanShare).toHaveBeenCalled()
    expect(mockShare).toHaveBeenCalledWith(
      expect.objectContaining({
        files: expect.arrayContaining([expect.any(File)]),
        text: shareText,
      }),
    )
  })

  it('returns "cancelled" when user cancels share (AbortError)', async () => {
    const abortError = new DOMException('Share canceled', 'AbortError')
    const mockShare = vi.fn().mockRejectedValue(abortError)
    const mockCanShare = vi.fn().mockReturnValue(true)
    Object.defineProperty(navigator, 'share', { value: mockShare, configurable: true })
    Object.defineProperty(navigator, 'canShare', { value: mockCanShare, configurable: true })

    const result = await sharePhoto({ photoUrl, shareText })

    expect(result).toBe('cancelled')
  })

  it('falls back to download + clipboard when Web Share API not supported — returns "downloaded"', async () => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true })
    const mockWriteText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      configurable: true,
    })

    // Mock document.createElement for the download link
    const mockClick = vi.fn()
    const mockLink = { href: '', download: '', style: { display: '' }, click: mockClick } as unknown as HTMLAnchorElement
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink)
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink)
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink)

    const result = await sharePhoto({ photoUrl, shareText })

    expect(result).toBe('downloaded')
    expect(mockClick).toHaveBeenCalled()
    expect((mockLink as unknown as { download: string }).download).toBe('photo.jpg')
    expect(mockWriteText).toHaveBeenCalledWith(shareText)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake-url')
  })

  it('falls back to download when canShare returns false for files', async () => {
    const mockShare = vi.fn()
    const mockCanShare = vi.fn().mockReturnValue(false)
    Object.defineProperty(navigator, 'share', { value: mockShare, configurable: true })
    Object.defineProperty(navigator, 'canShare', { value: mockCanShare, configurable: true })

    const mockWriteText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      configurable: true,
    })

    const mockClick = vi.fn()
    const mockLink = { href: '', download: '', style: { display: '' }, click: mockClick } as unknown as HTMLAnchorElement
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink)
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink)
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink)

    const result = await sharePhoto({ photoUrl, shareText })

    expect(result).toBe('downloaded')
    expect(mockShare).not.toHaveBeenCalled()
    expect(mockClick).toHaveBeenCalled()
    expect(mockWriteText).toHaveBeenCalledWith(shareText)
  })

  it('throws when fetch fails', async () => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true })
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    await expect(sharePhoto({ photoUrl, shareText })).rejects.toThrow('Network error')
  })

  it('throws when response is not ok (e.g. 404)', async () => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true })
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 })

    await expect(sharePhoto({ photoUrl, shareText })).rejects.toThrow('Failed to fetch photo: 404')
  })
})
