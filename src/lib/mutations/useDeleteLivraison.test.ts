import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    storage: {
      from: vi.fn(),
    },
  },
}))

import { supabase } from '@/lib/supabase'
import { useDeleteLivraison } from './useDeleteLivraison'

function createWrapper(queryClient?: QueryClient) {
  const qc = queryClient ?? new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children)
}

function setupLivraisonDeleteMock() {
  const mockIn = vi.fn().mockResolvedValue({ error: null })
  const mockEq = vi.fn().mockReturnValue({ in: mockIn })
  const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
  return { mockDelete, mockEq, mockIn }
}

function setupBesoinDeleteMock() {
  const mockIn = vi.fn().mockResolvedValue({ error: null })
  const mockDelete = vi.fn().mockReturnValue({ in: mockIn })
  return { mockDelete, mockIn }
}

describe('useDeleteLivraison', () => {
  const livraisonMock = setupLivraisonDeleteMock()
  const besoinMock = setupBesoinDeleteMock()
  const mockStorageRemove = vi.fn().mockResolvedValue({})

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'besoins') return { delete: besoinMock.mockDelete } as never
      if (table === 'livraisons') return { delete: livraisonMock.mockDelete } as never
      return {} as never
    })
    vi.mocked(supabase.storage.from).mockReturnValue({
      remove: mockStorageRemove,
    } as never)
  })

  it('mode release-besoins: deletes livraison without touching besoins', async () => {
    const { result } = renderHook(() => useDeleteLivraison(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({
        livraisonId: 'liv-1',
        chantierId: 'ch1',
        mode: 'release-besoins',
        linkedBesoinIds: ['b1', 'b2'],
        bcFileUrl: null,
        blFileUrl: null,
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(besoinMock.mockDelete).not.toHaveBeenCalled()
    expect(livraisonMock.mockDelete).toHaveBeenCalled()
    expect(livraisonMock.mockEq).toHaveBeenCalledWith('id', 'liv-1')
    expect(livraisonMock.mockIn).toHaveBeenCalledWith('status', ['commande', 'prevu'])
  })

  it('mode delete-all: deletes besoins THEN livraison', async () => {
    const { result } = renderHook(() => useDeleteLivraison(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({
        livraisonId: 'liv-1',
        chantierId: 'ch1',
        mode: 'delete-all',
        linkedBesoinIds: ['b1', 'b2'],
        bcFileUrl: null,
        blFileUrl: null,
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(besoinMock.mockDelete).toHaveBeenCalled()
    expect(besoinMock.mockIn).toHaveBeenCalledWith('id', ['b1', 'b2'])
    expect(livraisonMock.mockDelete).toHaveBeenCalled()
  })

  it('cleans up storage files when BC and BL exist', async () => {
    const { result } = renderHook(() => useDeleteLivraison(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({
        livraisonId: 'liv-1',
        chantierId: 'ch1',
        mode: 'release-besoins',
        linkedBesoinIds: [],
        bcFileUrl: 'bc/file.pdf',
        blFileUrl: 'bl/file.pdf',
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.storage.from).toHaveBeenCalledWith('documents')
    expect(mockStorageRemove).toHaveBeenCalledWith(['bc/file.pdf', 'bl/file.pdf'])
  })

  it('does not call storage remove when no files exist', async () => {
    const { result } = renderHook(() => useDeleteLivraison(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({
        livraisonId: 'liv-1',
        chantierId: 'ch1',
        mode: 'release-besoins',
        linkedBesoinIds: [],
        bcFileUrl: null,
        blFileUrl: null,
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockStorageRemove).not.toHaveBeenCalled()
  })

  it('invalidates 7 query keys on settled', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useDeleteLivraison(), { wrapper: createWrapper(queryClient) })

    await act(async () => {
      result.current.mutate({
        livraisonId: 'liv-1',
        chantierId: 'ch1',
        mode: 'release-besoins',
        linkedBesoinIds: [],
        bcFileUrl: null,
        blFileUrl: null,
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const invalidatedKeys = invalidateSpy.mock.calls.map((c) => (c[0] as { queryKey: string[] }).queryKey)
    expect(invalidatedKeys).toContainEqual(['livraisons', 'ch1'])
    expect(invalidatedKeys).toContainEqual(['livraisons-count', 'ch1'])
    expect(invalidatedKeys).toContainEqual(['all-livraisons'])
    expect(invalidatedKeys).toContainEqual(['besoins', 'ch1'])
    expect(invalidatedKeys).toContainEqual(['all-pending-besoins-count'])
    expect(invalidatedKeys).toContainEqual(['all-besoins', 'ch1'])
    expect(invalidatedKeys).toContainEqual(['all-linked-besoins'])
  })
})
