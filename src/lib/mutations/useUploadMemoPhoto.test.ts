import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    storage: { from: vi.fn() },
    from: vi.fn(),
  },
}))

vi.mock('@/lib/utils/compressImage', () => ({
  compressPhoto: vi.fn().mockResolvedValue(new Blob(['compressed'], { type: 'image/jpeg' })),
}))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { supabase } from '@/lib/supabase'
import { useUploadMemoPhoto } from './useUploadMemoPhoto'

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useUploadMemoPhoto', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uploads photo and updates memo', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'u1' } },
      error: null,
    } as never)

    const mockUpload = vi.fn().mockResolvedValue({ error: null })
    const mockGetPublicUrl = vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/photo.jpg' } })
    vi.mocked(supabase.storage.from).mockReturnValue({
      upload: mockUpload,
      getPublicUrl: mockGetPublicUrl,
    } as never)

    const mockEq = vi.fn().mockResolvedValue({ error: null })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)

    const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })
    const { result } = renderHook(() => useUploadMemoPhoto(), { wrapper: createWrapper() })

    result.current.mutate({ file, memoId: 'memo-1', entityType: 'chantier', entityId: 'ch-1' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockUpload).toHaveBeenCalled()
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ photo_url: 'https://example.com/photo.jpg' }))
  })
})
