import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    storage: { from: vi.fn() },
  },
}))

import { supabase } from '@/lib/supabase'
import { getDocumentSignedUrl, downloadDocument } from './documentStorage'

describe('getDocumentSignedUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns signed URL for given file path', async () => {
    const mockCreateSignedUrl = vi.fn().mockResolvedValue({
      data: { signedUrl: 'https://storage.example.com/signed/doc.pdf' },
      error: null,
    })
    vi.mocked(supabase.storage.from).mockReturnValue({
      createSignedUrl: mockCreateSignedUrl,
    } as never)

    const url = await getDocumentSignedUrl('user-1/lot-1/doc-1_123.pdf')

    expect(supabase.storage.from).toHaveBeenCalledWith('documents')
    expect(mockCreateSignedUrl).toHaveBeenCalledWith('user-1/lot-1/doc-1_123.pdf', 3600)
    expect(url).toBe('https://storage.example.com/signed/doc.pdf')
  })

  it('throws on signed URL error', async () => {
    vi.mocked(supabase.storage.from).mockReturnValue({
      createSignedUrl: vi.fn().mockResolvedValue({
        data: null,
        error: new Error('Not found'),
      }),
    } as never)

    await expect(getDocumentSignedUrl('bad/path.pdf')).rejects.toThrow('Not found')
  })
})

describe('downloadDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates signed URL with download option and triggers anchor click', async () => {
    const mockCreateSignedUrl = vi.fn().mockResolvedValue({
      data: { signedUrl: 'https://storage.example.com/signed/doc.pdf?download=plan.pdf' },
      error: null,
    })
    vi.mocked(supabase.storage.from).mockReturnValue({
      createSignedUrl: mockCreateSignedUrl,
    } as never)

    const mockClick = vi.fn()
    const mockAppendChild = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node)
    const mockRemoveChild = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node)
    vi.spyOn(document, 'createElement').mockReturnValue({
      set href(_v: string) {},
      get href() { return '' },
      download: '',
      rel: '',
      click: mockClick,
    } as never)

    await downloadDocument('user-1/lot-1/doc.pdf', 'plan.pdf')

    expect(supabase.storage.from).toHaveBeenCalledWith('documents')
    expect(mockCreateSignedUrl).toHaveBeenCalledWith('user-1/lot-1/doc.pdf', 60, { download: 'plan.pdf' })
    expect(mockClick).toHaveBeenCalled()

    mockAppendChild.mockRestore()
    mockRemoveChild.mockRestore()
  })

  it('throws on download error', async () => {
    vi.mocked(supabase.storage.from).mockReturnValue({
      createSignedUrl: vi.fn().mockResolvedValue({ data: null, error: new Error('Download failed') }),
    } as never)

    await expect(downloadDocument('bad/path.pdf', 'file.pdf')).rejects.toThrow('Download failed')
  })
})
