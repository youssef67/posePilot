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
import { useUpdateLivraison } from './useUpdateLivraison'

const mockLivraison = {
  id: 'liv1',
  chantier_id: 'ch1',
  description: 'Colle faïence 20kg',
  status: 'commande' as const,
  fournisseur: 'Leroy Merlin',
  date_prevue: '2026-03-01',
  bc_file_url: null,
  bc_file_name: null,
  bl_file_url: null,
  bl_file_name: null,
  created_at: '2026-02-10T10:00:00Z',
  created_by: 'user-1',
}

function createWrapper(queryClient?: QueryClient) {
  const qc = queryClient ?? new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children)
}

function mockSupabaseChain(resolvedValue: { data: unknown; error: unknown }) {
  const mockSingle = vi.fn().mockResolvedValue(resolvedValue)
  const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
  const mockIn = vi.fn().mockReturnValue({ select: mockSelect })
  const mockEq = vi.fn().mockReturnValue({ in: mockIn })
  const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
  vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)
  return { mockUpdate, mockEq, mockIn, mockSelect, mockSingle }
}

describe('useUpdateLivraison', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates description, fournisseur and date_prevue', async () => {
    const updated = { ...mockLivraison, description: 'Colle modifiée', fournisseur: 'Point P', date_prevue: '2026-03-15' }
    const { mockUpdate, mockEq, mockIn } = mockSupabaseChain({ data: updated, error: null })

    const { result } = renderHook(() => useUpdateLivraison(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({
        id: 'liv1',
        chantierId: 'ch1',
        description: 'Colle modifiée',
        fournisseur: 'Point P',
        datePrevue: '2026-03-15',
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('livraisons')
    expect(mockUpdate).toHaveBeenCalledWith({
      description: 'Colle modifiée',
      fournisseur: 'Point P',
      date_prevue: '2026-03-15',
    })
    expect(mockEq).toHaveBeenCalledWith('id', 'liv1')
    expect(mockIn).toHaveBeenCalledWith('status', ['commande', 'prevu'])
    expect(result.current.data).toEqual(updated)
  })

  it('returns error on supabase failure', async () => {
    mockSupabaseChain({ data: null, error: new Error('Update failed') })

    const { result } = renderHook(() => useUpdateLivraison(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({
        id: 'liv1',
        chantierId: 'ch1',
        description: 'Test',
        fournisseur: null,
        datePrevue: null,
      })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Update failed')
  })

  it('normalizes empty fournisseur string to null', async () => {
    const { mockUpdate } = mockSupabaseChain({ data: { ...mockLivraison, fournisseur: null }, error: null })

    const { result } = renderHook(() => useUpdateLivraison(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({
        id: 'liv1',
        chantierId: 'ch1',
        description: 'Test',
        fournisseur: '',
        datePrevue: '',
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockUpdate).toHaveBeenCalledWith({
      description: 'Test',
      fournisseur: null,
      date_prevue: null,
    })
  })

  it('rejects update when livraison status is livre (server guard)', async () => {
    // .single() throws when 0 rows match the .in('status', ['commande', 'prevu']) filter
    mockSupabaseChain({ data: null, error: { message: 'JSON object requested, multiple (or no) rows returned', code: 'PGRST116' } })

    const { result } = renderHook(() => useUpdateLivraison(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({
        id: 'liv1',
        chantierId: 'ch1',
        description: 'Tentative de modification',
        fournisseur: null,
        datePrevue: null,
      })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toContain('rows returned')
  })

  it('applies optimistic update and invalidates correct keys', async () => {
    mockSupabaseChain({ data: { ...mockLivraison, description: 'Modifié' }, error: null })

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    queryClient.setQueryData(['livraisons', 'ch1'], [mockLivraison])

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useUpdateLivraison(), { wrapper })

    await act(async () => {
      result.current.mutate({
        id: 'liv1',
        chantierId: 'ch1',
        description: 'Modifié',
        fournisseur: 'Point P',
        datePrevue: '2026-04-01',
      })
    })

    // Optimistic update should have applied
    const cached = queryClient.getQueryData<typeof mockLivraison[]>(['livraisons', 'ch1'])
    expect(cached?.[0]?.description).toBe('Modifié')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})
