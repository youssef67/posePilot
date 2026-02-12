import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
    },
  },
}))

import { supabase } from '@/lib/supabase'
import { useCreateInventaire } from './useCreateInventaire'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useCreateInventaire', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: { id: 'user-1' } as never }, error: null })
  })

  it('inserts inventaire item and returns data', async () => {
    const created = {
      id: 'inv-new',
      chantier_id: 'ch1',
      plot_id: 'p1',
      etage_id: 'e1',
      designation: 'Colle faïence 20kg',
      quantite: 5,
      created_at: '2026-02-10T10:00:00Z',
      created_by: 'user-1',
      plots: { nom: 'Plot A' },
      etages: { nom: 'RDC' },
    }
    const mockSingle = vi.fn().mockResolvedValue({ data: created, error: null })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never)

    const { result } = renderHook(() => useCreateInventaire(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({
        chantierId: 'ch1',
        plotId: 'p1',
        etageId: 'e1',
        designation: 'Colle faïence 20kg',
        quantite: 5,
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('inventaire')
    expect(mockInsert).toHaveBeenCalledWith({
      chantier_id: 'ch1',
      plot_id: 'p1',
      etage_id: 'e1',
      designation: 'Colle faïence 20kg',
      quantite: 5,
      created_by: 'user-1',
    })
    expect(mockSelect).toHaveBeenCalledWith('*, plots(nom), etages(nom)')
    expect(result.current.data).toEqual(created)
  })

  it('returns error on supabase failure', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: new Error('Insert failed') })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never)

    const { result } = renderHook(() => useCreateInventaire(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({
        chantierId: 'ch1',
        plotId: 'p1',
        etageId: 'e1',
        designation: 'Test',
        quantite: 1,
      })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Insert failed')
  })

  it('applies optimistic update on mutate', async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: { id: 'inv-new', chantier_id: 'ch1', plot_id: 'p1', etage_id: 'e1', designation: 'Test', quantite: 1, created_at: '2026-02-10T10:00:00Z', created_by: 'user-1', plots: { nom: 'A' }, etages: { nom: 'RDC' } },
      error: null,
    })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never)

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    queryClient.setQueryData(['inventaire', 'ch1'], [])

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useCreateInventaire(), { wrapper })

    await act(async () => {
      result.current.mutate({
        chantierId: 'ch1',
        plotId: 'p1',
        etageId: 'e1',
        designation: 'Test',
        quantite: 1,
      })
    })

    const cached = queryClient.getQueryData<unknown[]>(['inventaire', 'ch1'])
    expect(cached).toBeDefined()
  })
})
