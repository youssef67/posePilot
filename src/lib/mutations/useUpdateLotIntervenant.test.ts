import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}))

import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useUpdateLotIntervenant } from './useUpdateLotIntervenant'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useUpdateLotIntervenant', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates lot intervenant_id', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'lot1', intervenant_id: 'i1' }, error: null })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)

    const { result } = renderHook(() => useUpdateLotIntervenant(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ lotId: 'lot1', plotId: 'p1', intervenantId: 'i1', intervenantNom: 'A2M' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('lots')
    expect(mockUpdate).toHaveBeenCalledWith({ intervenant_id: 'i1' })
    expect(mockEq).toHaveBeenCalledWith('id', 'lot1')
  })

  it('sets intervenant_id to null when removing', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'lot1', intervenant_id: null }, error: null })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)

    const { result } = renderHook(() => useUpdateLotIntervenant(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ lotId: 'lot1', plotId: 'p1', intervenantId: null, intervenantNom: null })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockUpdate).toHaveBeenCalledWith({ intervenant_id: null })
  })

  it('applies optimistic update on mutate', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'lot1', intervenant_id: 'i1' }, error: null })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    queryClient.setQueryData(['lots', 'p1'], [
      { id: 'lot1', intervenant_id: null, plot_id: 'p1' },
      { id: 'lot2', intervenant_id: null, plot_id: 'p1' },
    ])

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useUpdateLotIntervenant(), { wrapper })

    await act(async () => {
      result.current.mutate({ lotId: 'lot1', plotId: 'p1', intervenantId: 'i1', intervenantNom: 'A2M' })
    })

    const cached = queryClient.getQueryData<Array<{ id: string; intervenant_id: string | null; intervenants: { nom: string } | null }>>(['lots', 'p1'])
    expect(cached?.[0].intervenant_id).toBe('i1')
    expect(cached?.[0].intervenants).toEqual({ nom: 'A2M' })
    expect(cached?.[1].intervenant_id).toBeNull()
  })

  it('shows toast and rolls back on error', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: new Error('Update failed') })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const originalData = [{ id: 'lot1', intervenant_id: null, plot_id: 'p1' }]
    queryClient.setQueryData(['lots', 'p1'], originalData)

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useUpdateLotIntervenant(), { wrapper })

    await act(async () => {
      result.current.mutate({ lotId: 'lot1', plotId: 'p1', intervenantId: 'i1', intervenantNom: 'A2M' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalledWith("Impossible de mettre à jour l'intervenant")
  })

  it('invalidates lots cache on settled', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'lot1', intervenant_id: 'i1' }, error: null })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useUpdateLotIntervenant(), { wrapper })

    await act(async () => {
      result.current.mutate({ lotId: 'lot1', plotId: 'p1', intervenantId: 'i1', intervenantNom: 'A2M' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const invalidatedKeys = invalidateSpy.mock.calls.map((c) => (c[0] as { queryKey: string[] }).queryKey)
    expect(invalidatedKeys).toContainEqual(['lots', 'p1'])
  })
})
