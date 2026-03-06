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
import { useDeleteIntervenant } from './useDeleteIntervenant'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useDeleteIntervenant', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes an intervenant', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never)

    const { result } = renderHook(() => useDeleteIntervenant(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate('i1')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('intervenants')
    expect(mockEq).toHaveBeenCalledWith('id', 'i1')
  })

  it('returns error on supabase failure', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: new Error('Delete failed') })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never)

    const { result } = renderHook(() => useDeleteIntervenant(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate('i1')
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Delete failed')
  })

  it('applies optimistic removal on mutate', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never)

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    queryClient.setQueryData(['intervenants'], [
      { id: 'i1', nom: 'A2M', created_by: 'u1', created_at: '2026-03-01T00:00:00Z' },
      { id: 'i2', nom: 'Martin', created_by: 'u1', created_at: '2026-03-01T00:00:00Z' },
    ])

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useDeleteIntervenant(), { wrapper })

    await act(async () => {
      result.current.mutate('i1')
    })

    const cached = queryClient.getQueryData<Array<{ id: string }>>(['intervenants'])
    expect(cached).toHaveLength(1)
    expect(cached?.[0].id).toBe('i2')
  })

  it('invalidates intervenants cache on settled', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as never)

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useDeleteIntervenant(), { wrapper })

    await act(async () => {
      result.current.mutate('i1')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const invalidatedKeys = invalidateSpy.mock.calls.map((c) => (c[0] as { queryKey: string[] }).queryKey)
    expect(invalidatedKeys).toContainEqual(['intervenants'])
  })
})
