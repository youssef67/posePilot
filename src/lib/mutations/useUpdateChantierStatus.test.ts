import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

import { supabase } from '@/lib/supabase'
import { useUpdateChantierStatus } from './useUpdateChantierStatus'

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

function mockSupabaseUpdate(data: unknown) {
  const mockSingle = vi.fn().mockResolvedValue({ data, error: null })
  const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
  const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
  const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
  vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)
  return { mockUpdate, mockEq, mockSelect, mockSingle }
}

function mockSupabaseUpdateError() {
  const mockSingle = vi.fn().mockResolvedValue({
    data: null,
    error: new Error('Update failed'),
  })
  const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
  const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
  const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
  vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)
  return { mockUpdate, mockEq }
}

describe('useUpdateChantierStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls supabase update with correct status and chantierId', async () => {
    const { mockUpdate, mockEq } = mockSupabaseUpdate({
      id: 'chantier-1',
      status: 'termine',
    })

    const { result } = renderHook(() => useUpdateChantierStatus(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate({ chantierId: 'chantier-1', status: 'termine' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('chantiers')
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'termine' })
    expect(mockEq).toHaveBeenCalledWith('id', 'chantier-1')
  })

  it('calls supabase update with supprime status', async () => {
    const { mockUpdate, mockEq } = mockSupabaseUpdate({
      id: 'chantier-2',
      status: 'supprime',
    })

    const { result } = renderHook(() => useUpdateChantierStatus(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate({ chantierId: 'chantier-2', status: 'supprime' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockUpdate).toHaveBeenCalledWith({ status: 'supprime' })
    expect(mockEq).toHaveBeenCalledWith('id', 'chantier-2')
  })

  it('performs optimistic update removing chantier from cache', async () => {
    const queryClient = createQueryClient()
    const activeChantiers = [
      { id: 'chantier-1', nom: 'A', status: 'active' },
      { id: 'chantier-2', nom: 'B', status: 'active' },
    ]
    queryClient.setQueryData(['chantiers', { status: 'active' }], activeChantiers)

    // Use a never-resolving promise to inspect optimistic state
    const mockSingle = vi.fn().mockReturnValue(new Promise(() => {}))
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)

    const { result } = renderHook(() => useUpdateChantierStatus(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => {
      result.current.mutate({ chantierId: 'chantier-1', status: 'termine' })
    })

    await waitFor(() => {
      const cached = queryClient.getQueryData(['chantiers', { status: 'active' }]) as unknown[]
      expect(cached).toHaveLength(1)
      expect((cached[0] as { id: string }).id).toBe('chantier-2')
    })
  })

  it('rolls back all chantiers caches on mutation error', async () => {
    const queryClient = createQueryClient()
    const activeChantiers = [
      { id: 'chantier-1', nom: 'A', status: 'active' },
      { id: 'chantier-2', nom: 'B', status: 'active' },
    ]
    const termineChantiers = [
      { id: 'chantier-3', nom: 'C', status: 'termine' },
    ]
    queryClient.setQueryData(['chantiers', { status: 'active' }], activeChantiers)
    queryClient.setQueryData(['chantiers', { status: 'termine' }], termineChantiers)

    mockSupabaseUpdateError()

    const { result } = renderHook(() => useUpdateChantierStatus(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ chantierId: 'chantier-1', status: 'termine' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    const cachedActive = queryClient.getQueryData(['chantiers', { status: 'active' }])
    expect(cachedActive).toEqual(activeChantiers)
    const cachedTermine = queryClient.getQueryData(['chantiers', { status: 'termine' }])
    expect(cachedTermine).toEqual(termineChantiers)
  })

  it('invalidates all chantiers queries on settled', async () => {
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    mockSupabaseUpdate({ id: 'chantier-1', status: 'termine' })

    const { result } = renderHook(() => useUpdateChantierStatus(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ chantierId: 'chantier-1', status: 'termine' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['chantiers'] })
  })

  it('navigates to home on success', async () => {
    mockSupabaseUpdate({ id: 'chantier-1', status: 'termine' })

    const { result } = renderHook(() => useUpdateChantierStatus(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate({ chantierId: 'chantier-1', status: 'termine' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/' })
  })

  it('does not navigate on error', async () => {
    mockSupabaseUpdateError()

    const { result } = renderHook(() => useUpdateChantierStatus(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate({ chantierId: 'chantier-1', status: 'termine' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('returns isPending during mutation', async () => {
    const mockSingle = vi.fn().mockReturnValue(new Promise(() => {}))
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)

    const { result } = renderHook(() => useUpdateChantierStatus(), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.mutate({ chantierId: 'chantier-1', status: 'termine' })
    })

    await waitFor(() => expect(result.current.isPending).toBe(true))
  })
})
