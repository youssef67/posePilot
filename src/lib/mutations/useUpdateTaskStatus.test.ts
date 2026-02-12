import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

vi.mock('sonner', () => {
  const toast = vi.fn() as ReturnType<typeof vi.fn> & { error: ReturnType<typeof vi.fn> }
  toast.error = vi.fn()
  return { toast }
})

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useUpdateTaskStatus } from './useUpdateTaskStatus'

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

const mockPieces = [
  {
    id: 'piece-1',
    lot_id: 'lot-1',
    nom: 'Séjour',
    created_at: '2026-01-01T00:00:00Z',
    taches: [
      { id: 'tache-1', piece_id: 'piece-1', nom: 'Ragréage', status: 'not_started' as const, created_at: '2026-01-01T00:00:00Z' },
      { id: 'tache-2', piece_id: 'piece-1', nom: 'Pose', status: 'done' as const, created_at: '2026-01-01T00:00:00Z' },
    ],
  },
  {
    id: 'piece-2',
    lot_id: 'lot-1',
    nom: 'Chambre',
    created_at: '2026-01-02T00:00:00Z',
    taches: [],
  },
]

describe('useUpdateTaskStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls supabase update with correct params', async () => {
    const { mockUpdate, mockEq } = mockSupabaseUpdate({
      id: 'tache-1', piece_id: 'piece-1', nom: 'Ragréage', status: 'in_progress', created_at: '2026-01-01T00:00:00Z',
    })

    const { result } = renderHook(() => useUpdateTaskStatus(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ tacheId: 'tache-1', status: 'in_progress', lotId: 'lot-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('taches')
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'in_progress' })
    expect(mockEq).toHaveBeenCalledWith('id', 'tache-1')
  })

  it('optimistically updates task status in cache', async () => {
    const queryClient = createQueryClient()
    queryClient.setQueryData(['pieces', 'lot-1'], structuredClone(mockPieces))

    // Never-resolving to keep pending
    const mockSingle = vi.fn().mockReturnValue(new Promise(() => {}))
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)

    const { result } = renderHook(() => useUpdateTaskStatus(), { wrapper: createWrapper(queryClient) })

    await act(async () => {
      result.current.mutate({ tacheId: 'tache-1', status: 'in_progress', lotId: 'lot-1' })
    })

    const cached = queryClient.getQueryData<typeof mockPieces>(['pieces', 'lot-1'])
    expect(cached?.[0].taches[0].status).toBe('in_progress')
    expect(cached?.[0].taches[1].status).toBe('done') // untouched
    expect(cached?.[1].taches).toHaveLength(0) // untouched
  })

  it('rolls back cache on error and shows toast', async () => {
    const queryClient = createQueryClient()
    queryClient.setQueryData(['pieces', 'lot-1'], structuredClone(mockPieces))

    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: new Error('fail') })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)

    const { result } = renderHook(() => useUpdateTaskStatus(), { wrapper: createWrapper(queryClient) })

    await act(async () => {
      result.current.mutate({ tacheId: 'tache-1', status: 'in_progress', lotId: 'lot-1' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    const cached = queryClient.getQueryData<typeof mockPieces>(['pieces', 'lot-1'])
    expect(cached?.[0].taches[0].status).toBe('not_started') // rolled back
    expect(toast.error).toHaveBeenCalledWith('Impossible de mettre à jour le statut')
  })

  it('invalidates pieces query on settled', async () => {
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    mockSupabaseUpdate({
      id: 'tache-1', piece_id: 'piece-1', nom: 'Ragréage', status: 'in_progress', created_at: '2026-01-01T00:00:00Z',
    })

    const { result } = renderHook(() => useUpdateTaskStatus(), { wrapper: createWrapper(queryClient) })

    await act(async () => {
      result.current.mutate({ tacheId: 'tache-1', status: 'in_progress', lotId: 'lot-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['pieces', 'lot-1'] })
  })
})
