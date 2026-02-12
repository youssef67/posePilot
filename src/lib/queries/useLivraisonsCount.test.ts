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
import { useLivraisonsCount } from './useLivraisonsCount'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useLivraisonsCount', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns count of livraisons for a chantier', async () => {
    const mockEq = vi.fn().mockResolvedValue({ count: 5, error: null })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useLivraisonsCount('ch1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('livraisons')
    expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact', head: true })
    expect(mockEq).toHaveBeenCalledWith('chantier_id', 'ch1')
    expect(result.current.data).toBe(5)
  })

  it('returns 0 when count is null', async () => {
    const mockEq = vi.fn().mockResolvedValue({ count: null, error: null })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useLivraisonsCount('ch1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBe(0)
  })

  it('is disabled when chantierId is empty', () => {
    const { result } = renderHook(() => useLivraisonsCount(''), { wrapper: createWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
  })

  it('returns error on supabase failure', async () => {
    const mockEq = vi.fn().mockResolvedValue({ count: null, error: new Error('DB error') })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useLivraisonsCount('ch1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('DB error')
  })
})
