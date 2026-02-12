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
import { useChantier } from './useChantier'

const mockChantier = {
  id: 'chantier-1',
  nom: 'Résidence A',
  type: 'complet' as const,
  status: 'active' as const,
  progress_done: 3,
  progress_total: 10,
  created_at: '2026-01-01T00:00:00Z',
  created_by: 'user-1',
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

function mockSupabaseSingle(data: unknown, error: unknown = null) {
  const mockSingle = vi.fn().mockResolvedValue({ data, error })
  const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
  vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)
  return { mockSelect, mockEq, mockSingle }
}

describe('useChantier', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches a single chantier by id', async () => {
    const { mockSelect, mockEq } = mockSupabaseSingle(mockChantier)

    const { result } = renderHook(() => useChantier('chantier-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('chantiers')
    expect(mockSelect).toHaveBeenCalledWith('*')
    expect(mockEq).toHaveBeenCalledWith('id', 'chantier-1')
    expect(result.current.data).toEqual(mockChantier)
  })

  it('returns error on supabase failure', async () => {
    mockSupabaseSingle(null, new Error('Not found'))

    const { result } = renderHook(() => useChantier('invalid-id'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Not found')
  })

  it('does not fetch when chantierId is empty', async () => {
    mockSupabaseSingle(null)

    const { result } = renderHook(() => useChantier(''), {
      wrapper: createWrapper(),
    })

    // Should stay in idle state, not fetch
    await new Promise((r) => setTimeout(r, 50))
    expect(result.current.isFetching).toBe(false)
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('uses correct query key with chantierId', async () => {
    mockSupabaseSingle(mockChantier)

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useChantier('chantier-1'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const cached = queryClient.getQueryData(['chantiers', 'chantier-1'])
    expect(cached).toEqual(mockChantier)
  })
})
