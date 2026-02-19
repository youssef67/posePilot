import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

import { supabase } from '@/lib/supabase'
import { useLotPhotos } from './useLotPhotos'

const mockPhotos = [
  {
    id: 'photo-1',
    lot_id: 'lot-1',
    photo_url: 'https://example.com/photo1.jpg',
    created_by: 'user-1',
    created_at: '2026-02-19T10:00:00Z',
  },
  {
    id: 'photo-2',
    lot_id: 'lot-1',
    photo_url: 'https://example.com/photo2.jpg',
    created_by: 'user-1',
    created_at: '2026-02-19T09:00:00Z',
  },
]

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useLotPhotos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches photos for a lot ordered by created_at DESC', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: mockPhotos, error: null })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useLotPhotos('lot-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.data).toEqual(mockPhotos))

    expect(supabase.from).toHaveBeenCalledWith('lot_photos')
    expect(mockSelect).toHaveBeenCalledWith('*')
    expect(mockEq).toHaveBeenCalledWith('lot_id', 'lot-1')
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
  })

  it('uses query key ["lot-photos", lotId]', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: mockPhotos, error: null })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useLotPhotos('lot-1'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const cached = queryClient.getQueryData(['lot-photos', 'lot-1'])
    expect(cached).toEqual(mockPhotos)
  })

  it('returns error on supabase failure', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useLotPhotos('lot-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('DB error')
  })

  it('is disabled when lotId is empty', async () => {
    const { result } = renderHook(() => useLotPhotos(''), { wrapper: createWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
  })
})
