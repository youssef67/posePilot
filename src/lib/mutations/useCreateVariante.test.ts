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
import { useCreateVariante } from './useCreateVariante'

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
  return { mockInsert, mockSelect, mockSingle }
}

describe('useCreateVariante', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('inserts variante with plot_id and nom', async () => {
    const { mockInsert } = mockSupabaseInsert({
      id: 'var-1',
      plot_id: 'plot-1',
      nom: 'Type A',
      created_at: '2026-01-01T00:00:00Z',
    })

    const { result } = renderHook(() => useCreateVariante(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ plotId: 'plot-1', nom: 'Type A' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('variantes')
    expect(mockInsert).toHaveBeenCalledWith({ plot_id: 'plot-1', nom: 'Type A' })
  })

  it('invalidates variantes query on settled', async () => {
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    mockSupabaseInsert({
      id: 'var-1',
      plot_id: 'plot-1',
      nom: 'Type A',
      created_at: '2026-01-01T00:00:00Z',
    })

    const { result } = renderHook(() => useCreateVariante(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ plotId: 'plot-1', nom: 'Type A' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['variantes', 'plot-1'] })
  })

  it('rolls back cache on mutation error', async () => {
    const queryClient = createQueryClient()
    const previousVariantes = [
      { id: 'existing-1', plot_id: 'plot-1', nom: 'Existing', created_at: '2026-01-01T00:00:00Z' },
    ]
    queryClient.setQueryData(['variantes', 'plot-1'], previousVariantes)

    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: new Error('Insert failed') })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never)

    const { result } = renderHook(() => useCreateVariante(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ plotId: 'plot-1', nom: 'Fail' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    const cachedData = queryClient.getQueryData(['variantes', 'plot-1'])
    expect(cachedData).toEqual(previousVariantes)
  })
})
