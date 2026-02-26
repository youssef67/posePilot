import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

import { supabase } from '@/lib/supabase'
import { useUpdateVariantePieceTasks } from './useUpdateVariantePieceTasks'

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

describe('useUpdateVariantePieceTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates task_overrides on variante_piece', async () => {
    const overrides = ['Ragréage', 'Pose', 'Joints']
    const { mockUpdate } = mockSupabaseUpdate({
      id: 'piece-1',
      variante_id: 'var-1',
      nom: 'Séjour',
      task_overrides: overrides,
      created_at: '2026-01-01T00:00:00Z',
    })

    const { result } = renderHook(() => useUpdateVariantePieceTasks(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ pieceId: 'piece-1', taskOverrides: overrides, varianteId: 'var-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('variante_pieces')
    expect(mockUpdate).toHaveBeenCalledWith({ task_overrides: overrides })
  })

  it('sets task_overrides to null to reset to plot defaults', async () => {
    const { mockUpdate } = mockSupabaseUpdate({
      id: 'piece-1',
      variante_id: 'var-1',
      nom: 'Séjour',
      task_overrides: null,
      created_at: '2026-01-01T00:00:00Z',
    })

    const { result } = renderHook(() => useUpdateVariantePieceTasks(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ pieceId: 'piece-1', taskOverrides: null, varianteId: 'var-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockUpdate).toHaveBeenCalledWith({ task_overrides: null })
  })

  it('optimistically updates cache', async () => {
    const queryClient = createQueryClient()
    const previousPieces = [
      { id: 'piece-1', variante_id: 'var-1', nom: 'Séjour', task_overrides: null, created_at: '2026-01-01T00:00:00Z' },
    ]
    queryClient.setQueryData(['variante-pieces', 'var-1'], previousPieces)

    mockSupabaseUpdate({
      id: 'piece-1',
      variante_id: 'var-1',
      nom: 'Séjour',
      task_overrides: ['Pose'],
      created_at: '2026-01-01T00:00:00Z',
    })

    const { result } = renderHook(() => useUpdateVariantePieceTasks(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ pieceId: 'piece-1', taskOverrides: ['Pose'], varianteId: 'var-1' })
    })

    // Check optimistic update happened immediately
    const cached = queryClient.getQueryData<typeof previousPieces>(['variante-pieces', 'var-1'])
    expect(cached?.[0].task_overrides).toEqual(['Pose'])
  })

  it('rolls back cache on mutation error', async () => {
    const queryClient = createQueryClient()
    const previousPieces = [
      { id: 'piece-1', variante_id: 'var-1', nom: 'Séjour', task_overrides: null, created_at: '2026-01-01T00:00:00Z' },
    ]
    queryClient.setQueryData(['variante-pieces', 'var-1'], previousPieces)

    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: new Error('Update failed') })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)

    const { result } = renderHook(() => useUpdateVariantePieceTasks(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ pieceId: 'piece-1', taskOverrides: ['Pose'], varianteId: 'var-1' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    const cached = queryClient.getQueryData(['variante-pieces', 'var-1'])
    expect(cached).toEqual(previousPieces)
  })
})
