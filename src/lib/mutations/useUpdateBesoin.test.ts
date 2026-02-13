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
import { useUpdateBesoin } from './useUpdateBesoin'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useUpdateBesoin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates besoin description', async () => {
    const updated = {
      id: 'b1',
      chantier_id: 'ch1',
      description: 'Colle modifiée',
      livraison_id: null,
      created_at: '2026-02-10T10:00:00Z',
      created_by: 'user-1',
    }
    const mockSingle = vi.fn().mockResolvedValue({ data: updated, error: null })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockIs = vi.fn().mockReturnValue({ select: mockSelect })
    const mockEq = vi.fn().mockReturnValue({ is: mockIs })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)

    const { result } = renderHook(() => useUpdateBesoin(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ id: 'b1', chantierId: 'ch1', description: 'Colle modifiée' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('besoins')
    expect(mockUpdate).toHaveBeenCalledWith({ description: 'Colle modifiée' })
    expect(mockEq).toHaveBeenCalledWith('id', 'b1')
    expect(mockIs).toHaveBeenCalledWith('livraison_id', null)
    expect(result.current.data).toEqual(updated)
  })

  it('returns error on supabase failure', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: new Error('Update failed') })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockIs = vi.fn().mockReturnValue({ select: mockSelect })
    const mockEq = vi.fn().mockReturnValue({ is: mockIs })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)

    const { result } = renderHook(() => useUpdateBesoin(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ id: 'b1', chantierId: 'ch1', description: 'Test' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Update failed')
  })

  it('applies optimistic update on mutate', async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: { id: 'b1', chantier_id: 'ch1', description: 'Modifié', livraison_id: null, created_at: '2026-02-10T10:00:00Z', created_by: 'user-1' },
      error: null,
    })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockIs = vi.fn().mockReturnValue({ select: mockSelect })
    const mockEq = vi.fn().mockReturnValue({ is: mockIs })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    queryClient.setQueryData(['besoins', 'ch1'], [
      { id: 'b1', chantier_id: 'ch1', description: 'Original', livraison_id: null, created_at: '2026-02-10T10:00:00Z', created_by: 'user-1' },
    ])

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useUpdateBesoin(), { wrapper })

    await act(async () => {
      result.current.mutate({ id: 'b1', chantierId: 'ch1', description: 'Modifié' })
    })

    const cached = queryClient.getQueryData<Array<{ id: string; description: string }>>(['besoins', 'ch1'])
    expect(cached).toHaveLength(1)
    expect(cached?.[0].description).toBe('Modifié')
  })
})
