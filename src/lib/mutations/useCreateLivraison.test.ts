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
import { useCreateLivraison } from './useCreateLivraison'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useCreateLivraison', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: { id: 'user-1' } as never }, error: null })
  })

  it('inserts a livraison with status commande and returns data', async () => {
    const created = {
      id: 'liv-new',
      chantier_id: 'ch1',
      description: 'Colle faïence',
      status: 'commande',
      date_prevue: null,
      bc_file_url: null,
      bc_file_name: null,
      bl_file_url: null,
      bl_file_name: null,
      created_at: '2026-02-10T10:00:00Z',
      created_by: 'user-1',
    }
    const mockSingle = vi.fn().mockResolvedValue({ data: created, error: null })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never)

    const { result } = renderHook(() => useCreateLivraison(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ chantierId: 'ch1', description: 'Colle faïence' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('livraisons')
    expect(mockInsert).toHaveBeenCalledWith({
      chantier_id: 'ch1',
      description: 'Colle faïence',
      status: 'commande',
      created_by: 'user-1',
    })
    expect(result.current.data).toEqual(created)
  })

  it('returns error on supabase failure', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: new Error('Insert failed') })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never)

    const { result } = renderHook(() => useCreateLivraison(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ chantierId: 'ch1', description: 'Test' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Insert failed')
  })

  it('applies optimistic update on mutate', async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: { id: 'liv-new', chantier_id: 'ch1', description: 'Test', status: 'commande', date_prevue: null, bc_file_url: null, bc_file_name: null, bl_file_url: null, bl_file_name: null, created_at: '2026-02-10T10:00:00Z', created_by: 'user-1' },
      error: null,
    })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never)

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    queryClient.setQueryData(['livraisons', 'ch1'], [])

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useCreateLivraison(), { wrapper })

    await act(async () => {
      result.current.mutate({ chantierId: 'ch1', description: 'Test' })
    })

    const cached = queryClient.getQueryData<unknown[]>(['livraisons', 'ch1'])
    expect(cached).toBeDefined()
  })
})
