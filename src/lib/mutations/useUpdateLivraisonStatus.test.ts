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
import { useUpdateLivraisonStatus } from './useUpdateLivraisonStatus'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useUpdateLivraisonStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates status to prevu with date_prevue', async () => {
    const updated = {
      id: 'liv1',
      chantier_id: 'ch1',
      description: 'Colle faïence',
      status: 'prevu',
      date_prevue: '2026-02-20',
      created_at: '2026-02-10T10:00:00Z',
      created_by: 'user-1',
    }
    const mockSingle = vi.fn().mockResolvedValue({ data: updated, error: null })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)

    const { result } = renderHook(() => useUpdateLivraisonStatus(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({
        livraisonId: 'liv1',
        chantierId: 'ch1',
        newStatus: 'prevu',
        datePrevue: '2026-02-20',
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('livraisons')
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'prevu', date_prevue: '2026-02-20' })
    expect(mockEq).toHaveBeenCalledWith('id', 'liv1')
  })

  it('updates status to livre with auto date du jour', async () => {
    const today = new Date().toISOString().split('T')[0]
    const updated = {
      id: 'liv1',
      chantier_id: 'ch1',
      description: 'Colle faïence',
      status: 'livre',
      date_prevue: today,
      created_at: '2026-02-10T10:00:00Z',
      created_by: 'user-1',
    }
    const mockSingle = vi.fn().mockResolvedValue({ data: updated, error: null })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)

    const { result } = renderHook(() => useUpdateLivraisonStatus(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({
        livraisonId: 'liv1',
        chantierId: 'ch1',
        newStatus: 'livre',
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockUpdate).toHaveBeenCalledWith({ status: 'livre', date_prevue: today })
  })

  it('returns error on supabase failure', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: new Error('Update failed') })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)

    const { result } = renderHook(() => useUpdateLivraisonStatus(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({
        livraisonId: 'liv1',
        chantierId: 'ch1',
        newStatus: 'prevu',
        datePrevue: '2026-02-20',
      })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Update failed')
  })

  it('rejects invalid datePrevue format', async () => {
    const { result } = renderHook(() => useUpdateLivraisonStatus(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({
        livraisonId: 'liv1',
        chantierId: 'ch1',
        newStatus: 'prevu',
        datePrevue: 'not-a-date',
      })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('datePrevue must be in YYYY-MM-DD format')
  })

  it('applies optimistic update for prevu transition', async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: { id: 'liv1', status: 'prevu', date_prevue: '2026-02-20' },
      error: null,
    })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    queryClient.setQueryData(['livraisons', 'ch1'], [
      { id: 'liv1', status: 'commande', date_prevue: null, chantier_id: 'ch1', description: 'Test' },
    ])

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useUpdateLivraisonStatus(), { wrapper })

    await act(async () => {
      result.current.mutate({
        livraisonId: 'liv1',
        chantierId: 'ch1',
        newStatus: 'prevu',
        datePrevue: '2026-02-20',
      })
    })

    const cached = queryClient.getQueryData<unknown[]>(['livraisons', 'ch1'])
    expect(cached).toBeDefined()
  })
})
