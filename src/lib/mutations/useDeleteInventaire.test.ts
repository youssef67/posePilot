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
import { useDeleteInventaire } from './useDeleteInventaire'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useDeleteInventaire', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes inventaire item', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never)

    const { result } = renderHook(() => useDeleteInventaire(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ id: 'inv1', chantierId: 'ch1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('inventaire')
    expect(mockEq).toHaveBeenCalledWith('id', 'inv1')
  })

  it('returns error on supabase failure', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: new Error('Delete failed') })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never)

    const { result } = renderHook(() => useDeleteInventaire(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ id: 'inv1', chantierId: 'ch1' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Delete failed')
  })

  it('applies optimistic removal on mutate', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never)

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    queryClient.setQueryData(['inventaire', 'ch1'], [
      { id: 'inv1', designation: 'Colle', quantite: 1 },
      { id: 'inv2', designation: 'Joint', quantite: 3 },
    ])

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useDeleteInventaire(), { wrapper })

    await act(async () => {
      result.current.mutate({ id: 'inv1', chantierId: 'ch1' })
    })

    const cached = queryClient.getQueryData<Array<{ id: string }>>(['inventaire', 'ch1'])
    expect(cached).toBeDefined()
  })
})
