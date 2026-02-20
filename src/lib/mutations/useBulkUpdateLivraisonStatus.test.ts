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
import { useBulkUpdateLivraisonStatus } from './useBulkUpdateLivraisonStatus'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

function setupMocks(error: unknown = null) {
  let updateCallIdx = 0
  const mockUpdate = vi.fn()
  vi.mocked(supabase.from).mockImplementation(() => {
    const mockFetchSingle = vi.fn().mockResolvedValue({ data: { status_history: [] }, error: null })
    const mockFetchEq = vi.fn().mockReturnValue({ single: mockFetchSingle })
    const mockFetchSelect = vi.fn().mockReturnValue({ eq: mockFetchEq })

    const idx = ++updateCallIdx
    const mockUpdateSingle = vi.fn().mockResolvedValue({
      data: error ? null : { id: `liv${idx}`, status: 'commande' },
      error,
    })
    const mockUpdateSelect = vi.fn().mockReturnValue({ single: mockUpdateSingle })
    const mockUpdateEq = vi.fn().mockReturnValue({ select: mockUpdateSelect })
    mockUpdate.mockReturnValue({ eq: mockUpdateEq })

    return { select: mockFetchSelect, update: mockUpdate } as never
  })
  return { mockUpdate }
}

describe('useBulkUpdateLivraisonStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates multiple livraisons and returns succeeded/failed', async () => {
    setupMocks()

    const { result } = renderHook(() => useBulkUpdateLivraisonStatus(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({
        livraisons: [{ id: 'liv1' }, { id: 'liv2' }],
        chantierId: 'ch1',
        newStatus: 'commande',
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.succeeded).toHaveLength(2)
    expect(result.current.data?.failed).toHaveLength(0)
  })

  it('passes datePrevue for livraison_prevue transition', async () => {
    const { mockUpdate } = setupMocks()

    const { result } = renderHook(() => useBulkUpdateLivraisonStatus(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({
        livraisons: [{ id: 'liv1' }],
        chantierId: 'ch1',
        newStatus: 'livraison_prevue',
        datePrevue: '2026-03-01',
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'livraison_prevue',
        date_prevue: '2026-03-01',
      }),
    )
  })

  it('rejects invalid datePrevue format', async () => {
    const { result } = renderHook(() => useBulkUpdateLivraisonStatus(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({
        livraisons: [{ id: 'liv1' }],
        chantierId: 'ch1',
        newStatus: 'livraison_prevue',
        datePrevue: 'not-a-date',
      })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('datePrevue must be in YYYY-MM-DD format')
  })

  it('throws when all updates fail', async () => {
    setupMocks(new Error('Update failed'))

    const { result } = renderHook(() => useBulkUpdateLivraisonStatus(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({
        livraisons: [{ id: 'liv1' }],
        chantierId: 'ch1',
        newStatus: 'commande',
      })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Toutes les mises à jour ont échoué')
  })
})
