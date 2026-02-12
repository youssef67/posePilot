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
import { useUpdateInventaire } from './useUpdateInventaire'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useUpdateInventaire', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates inventaire quantity', async () => {
    const updated = {
      id: 'inv1',
      chantier_id: 'ch1',
      plot_id: 'p1',
      etage_id: 'e1',
      designation: 'Colle',
      quantite: 15,
      created_at: '2026-02-10T10:00:00Z',
      created_by: 'user-1',
    }
    const mockSingle = vi.fn().mockResolvedValue({ data: updated, error: null })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)

    const { result } = renderHook(() => useUpdateInventaire(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ id: 'inv1', quantite: 15, chantierId: 'ch1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('inventaire')
    expect(mockUpdate).toHaveBeenCalledWith({ quantite: 15 })
    expect(mockEq).toHaveBeenCalledWith('id', 'inv1')
    expect(result.current.data).toEqual(updated)
  })

  it('returns error on supabase failure', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: new Error('Update failed') })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)

    const { result } = renderHook(() => useUpdateInventaire(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ id: 'inv1', quantite: 10, chantierId: 'ch1' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Update failed')
  })

  it('applies optimistic update on mutate', async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: { id: 'inv1', quantite: 10 },
      error: null,
    })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    queryClient.setQueryData(['inventaire', 'ch1'], [
      { id: 'inv1', quantite: 5, designation: 'Colle', plots: { nom: 'A' }, etages: { nom: 'RDC' } },
    ])

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useUpdateInventaire(), { wrapper })

    await act(async () => {
      result.current.mutate({ id: 'inv1', quantite: 10, chantierId: 'ch1' })
    })

    const cached = queryClient.getQueryData<Array<{ quantite: number }>>(['inventaire', 'ch1'])
    expect(cached).toBeDefined()
  })
})
