import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: { getUser: vi.fn() },
  },
}))

import { supabase } from '@/lib/supabase'
import { useCreateChantier } from './useCreateChantier'

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
}

function createWrapper(queryClient?: QueryClient) {
  const qc = queryClient ?? createQueryClient()
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children)
}

function mockSupabaseInsert(data: unknown) {
  const mockSingle = vi.fn().mockResolvedValue({ data, error: null })
  const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
  const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
  vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never)
  vi.mocked(supabase.auth.getUser).mockResolvedValue({
    data: { user: { id: 'user-1' } },
  } as never)
  return { mockInsert, mockSelect, mockSingle }
}

describe('useCreateChantier', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('inserts chantier with nom, type, and created_by', async () => {
    const { mockInsert } = mockSupabaseInsert({
      id: '123',
      nom: 'Test',
      type: 'complet',
      status: 'active',
    })

    const { result } = renderHook(() => useCreateChantier(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ nom: 'Test', type: 'complet' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('chantiers')
    expect(mockInsert).toHaveBeenCalledWith({
      nom: 'Test',
      type: 'complet',
      created_by: 'user-1',
    })
  })

  it('invalidates chantiers query on settled', async () => {
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    mockSupabaseInsert({ id: '456', nom: 'Léger', type: 'leger' })

    const { result } = renderHook(() => useCreateChantier(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ nom: 'Léger', type: 'leger' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['chantiers'] })
  })

  it('returns isPending during mutation', async () => {
    let resolveInsert: (value: unknown) => void
    const mockSingle = vi.fn(
      () => new Promise((resolve) => { resolveInsert = resolve }),
    )
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never)
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-1' } },
    } as never)

    const { result } = renderHook(() => useCreateChantier(), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate({ nom: 'Test', type: 'complet' })
    })

    await waitFor(() => expect(result.current.isPending).toBe(true))

    await act(async () => {
      resolveInsert!({ data: { id: '1' }, error: null })
    })

    await waitFor(() => expect(result.current.isPending).toBe(false))
  })

  it('rolls back cache on mutation error', async () => {
    const queryClient = createQueryClient()
    const previousChantiers = [
      { id: 'existing-1', nom: 'Existing', type: 'complet', status: 'active' },
    ]
    queryClient.setQueryData(['chantiers', { status: 'active' }], previousChantiers)

    // Mock insert to fail
    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: new Error('Insert failed'),
    })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never)
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-1' } },
    } as never)

    const { result } = renderHook(() => useCreateChantier(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ nom: 'Fail', type: 'leger' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    // Cache should be rolled back to previous state
    const cachedData = queryClient.getQueryData(['chantiers', { status: 'active' }])
    expect(cachedData).toEqual(previousChantiers)
  })
})
