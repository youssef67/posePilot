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
import { useDeleteBesoin } from './useDeleteBesoin'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useDeleteBesoin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes a pending besoin', async () => {
    const mockIs = vi.fn().mockResolvedValue({ error: null })
    const mockEq = vi.fn().mockReturnValue({ is: mockIs })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never)

    const { result } = renderHook(() => useDeleteBesoin(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ id: 'b1', chantierId: 'ch1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('besoins')
    expect(mockEq).toHaveBeenCalledWith('id', 'b1')
    expect(mockIs).toHaveBeenCalledWith('livraison_id', null)
  })

  it('returns error on supabase failure', async () => {
    const mockIs = vi.fn().mockResolvedValue({ error: new Error('Delete failed') })
    const mockEq = vi.fn().mockReturnValue({ is: mockIs })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never)

    const { result } = renderHook(() => useDeleteBesoin(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ id: 'b1', chantierId: 'ch1' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Delete failed')
  })

  it('applies optimistic removal on mutate', async () => {
    const mockIs = vi.fn().mockResolvedValue({ error: null })
    const mockEq = vi.fn().mockReturnValue({ is: mockIs })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never)

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    queryClient.setQueryData(['besoins', 'ch1'], [
      { id: 'b1', chantier_id: 'ch1', description: 'Colle', livraison_id: null, created_at: '2026-02-10T10:00:00Z', created_by: 'user-1' },
      { id: 'b2', chantier_id: 'ch1', description: 'Joint', livraison_id: null, created_at: '2026-02-10T10:00:00Z', created_by: 'user-1' },
    ])

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useDeleteBesoin(), { wrapper })

    await act(async () => {
      result.current.mutate({ id: 'b1', chantierId: 'ch1' })
    })

    const cached = queryClient.getQueryData<Array<{ id: string }>>(['besoins', 'ch1'])
    expect(cached).toHaveLength(1)
    expect(cached?.[0].id).toBe('b2')
  })
})
