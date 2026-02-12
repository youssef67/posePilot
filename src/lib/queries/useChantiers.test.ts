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
import { useChantiers } from './useChantiers'

const mockChantiers = [
  {
    id: '1',
    nom: 'Chantier Test',
    type: 'complet' as const,
    status: 'active' as const,
    progress_done: 0,
    progress_total: 0,
    created_at: '2026-01-01T00:00:00Z',
    created_by: 'user-1',
  },
]

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useChantiers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches active chantiers by default', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: mockChantiers, error: null })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useChantiers(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('chantiers')
    expect(mockSelect).toHaveBeenCalledWith('*')
    expect(mockEq).toHaveBeenCalledWith('status', 'active')
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(result.current.data).toEqual(mockChantiers)
  })

  it('fetches termine chantiers when status param is termine', async () => {
    const termineMock = [{ ...mockChantiers[0], status: 'termine' as const }]
    const mockOrder = vi.fn().mockResolvedValue({ data: termineMock, error: null })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useChantiers('termine'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockEq).toHaveBeenCalledWith('status', 'termine')
    expect(result.current.data).toEqual(termineMock)
  })

  it('uses query key with status filter', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: mockChantiers, error: null })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useChantiers('active'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const cached = queryClient.getQueryData(['chantiers', { status: 'active' }])
    expect(cached).toEqual(mockChantiers)
  })

  it('returns error on supabase failure', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useChantiers(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('DB error')
  })
})
