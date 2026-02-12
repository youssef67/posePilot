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
import { useAllPendingBesoinsCount } from './useAllPendingBesoinsCount'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useAllPendingBesoinsCount', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns count of besoins where livraison_id IS NULL', async () => {
    const mockIs = vi.fn().mockResolvedValue({ count: 3, error: null })
    const mockSelect = vi.fn().mockReturnValue({ is: mockIs })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useAllPendingBesoinsCount(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('besoins')
    expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact', head: true })
    expect(mockIs).toHaveBeenCalledWith('livraison_id', null)
    expect(result.current.data).toBe(3)
  })

  it('returns 0 when count is null', async () => {
    const mockIs = vi.fn().mockResolvedValue({ count: null, error: null })
    const mockSelect = vi.fn().mockReturnValue({ is: mockIs })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useAllPendingBesoinsCount(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBe(0)
  })

  it('returns 0 when no pending besoins', async () => {
    const mockIs = vi.fn().mockResolvedValue({ count: 0, error: null })
    const mockSelect = vi.fn().mockReturnValue({ is: mockIs })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useAllPendingBesoinsCount(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBe(0)
  })

  it('returns error on supabase failure', async () => {
    const mockIs = vi.fn().mockResolvedValue({ count: null, error: new Error('DB error') })
    const mockSelect = vi.fn().mockReturnValue({ is: mockIs })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useAllPendingBesoinsCount(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('DB error')
  })
})
