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
import { useToggleLotTma } from './useToggleLotTma'

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

const mockLot = {
  id: 'lot-1',
  etage_id: 'etage-1',
  variante_id: 'var-1',
  plot_id: 'plot-1',
  code: '203',
  is_tma: true,
  created_at: '2026-01-01T00:00:00Z',
}

describe('useToggleLotTma', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls supabase update with correct params', async () => {
    const { mockUpdate, mockEq } = mockSupabaseUpdate(mockLot)

    const { result } = renderHook(() => useToggleLotTma(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ lotId: 'lot-1', isTma: true, plotId: 'plot-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('lots')
    expect(mockUpdate).toHaveBeenCalledWith({ is_tma: true })
    expect(mockEq).toHaveBeenCalledWith('id', 'lot-1')
  })

  it('optimistically updates cache', async () => {
    const queryClient = createQueryClient()
    const previousLots = [
      { id: 'lot-1', plot_id: 'plot-1', code: '203', is_tma: false, etage_id: 'e1', variante_id: 'v1', created_at: '2026-01-01T00:00:00Z', etages: { nom: 'RDC' }, variantes: { nom: 'A' }, pieces: [{ count: 2 }] },
      { id: 'lot-2', plot_id: 'plot-1', code: '204', is_tma: false, etage_id: 'e1', variante_id: 'v1', created_at: '2026-01-02T00:00:00Z', etages: { nom: 'RDC' }, variantes: { nom: 'A' }, pieces: [{ count: 1 }] },
    ]
    queryClient.setQueryData(['lots', 'plot-1'], previousLots)

    // Never-resolving promise to keep mutation pending
    const mockSingle = vi.fn().mockReturnValue(new Promise(() => {}))
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)

    const { result } = renderHook(() => useToggleLotTma(), { wrapper: createWrapper(queryClient) })

    await act(async () => {
      result.current.mutate({ lotId: 'lot-1', isTma: true, plotId: 'plot-1' })
    })

    const cached = queryClient.getQueryData<typeof previousLots>(['lots', 'plot-1'])
    expect(cached?.[0].is_tma).toBe(true)
    expect(cached?.[1].is_tma).toBe(false) // untouched
  })

  it('rolls back cache on error', async () => {
    const queryClient = createQueryClient()
    const previousLots = [
      { id: 'lot-1', plot_id: 'plot-1', code: '203', is_tma: false, etage_id: 'e1', variante_id: 'v1', created_at: '2026-01-01T00:00:00Z', etages: { nom: 'RDC' }, variantes: { nom: 'A' }, pieces: [{ count: 2 }] },
    ]
    queryClient.setQueryData(['lots', 'plot-1'], previousLots)

    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: new Error('fail') })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)

    const { result } = renderHook(() => useToggleLotTma(), { wrapper: createWrapper(queryClient) })

    await act(async () => {
      result.current.mutate({ lotId: 'lot-1', isTma: true, plotId: 'plot-1' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    const cached = queryClient.getQueryData<typeof previousLots>(['lots', 'plot-1'])
    expect(cached).toEqual(previousLots)
  })

  it('invalidates lots query on settled', async () => {
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    mockSupabaseUpdate(mockLot)

    const { result } = renderHook(() => useToggleLotTma(), { wrapper: createWrapper(queryClient) })

    await act(async () => {
      result.current.mutate({ lotId: 'lot-1', isTma: true, plotId: 'plot-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['lots', 'plot-1'] })
  })
})
