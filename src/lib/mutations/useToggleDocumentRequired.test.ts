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
import { useToggleDocumentRequired } from './useToggleDocumentRequired'

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
}

function createWrapper(queryClient?: QueryClient) {
  const qc = queryClient ?? createQueryClient()
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children)
}

function mockSupabaseUpdate(data: unknown) {
  const mockSingle = vi.fn().mockResolvedValue({ data, error: null })
  const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
  const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
  const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
  vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)
  return { mockUpdate, mockEq, mockSelect, mockSingle }
}

describe('useToggleDocumentRequired', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates is_required on specified document', async () => {
    const { mockUpdate, mockEq } = mockSupabaseUpdate({
      id: 'doc-1',
      variante_id: 'var-1',
      nom: 'Plan de pose',
      is_required: true,
      created_at: '2026-01-01T00:00:00Z',
    })

    const { result } = renderHook(() => useToggleDocumentRequired(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ docId: 'doc-1', isRequired: true, varianteId: 'var-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('variante_documents')
    expect(mockUpdate).toHaveBeenCalledWith({ is_required: true })
    expect(mockEq).toHaveBeenCalledWith('id', 'doc-1')
  })

  it('invalidates variante-documents query on settled', async () => {
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    mockSupabaseUpdate({
      id: 'doc-1',
      variante_id: 'var-1',
      nom: 'Plan',
      is_required: false,
      created_at: '2026-01-01T00:00:00Z',
    })

    const { result } = renderHook(() => useToggleDocumentRequired(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ docId: 'doc-1', isRequired: false, varianteId: 'var-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['variante-documents', 'var-1'] })
  })

  it('rolls back cache on mutation error', async () => {
    const queryClient = createQueryClient()
    const previousDocs = [
      { id: 'doc-1', variante_id: 'var-1', nom: 'Plan', is_required: false, created_at: '2026-01-01T00:00:00Z' },
    ]
    queryClient.setQueryData(['variante-documents', 'var-1'], previousDocs)

    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: new Error('Update failed') })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)

    const { result } = renderHook(() => useToggleDocumentRequired(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ docId: 'doc-1', isRequired: true, varianteId: 'var-1' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    const cachedData = queryClient.getQueryData(['variante-documents', 'var-1'])
    expect(cachedData).toEqual(previousDocs)
  })

  it('optimistically toggles is_required in cache', async () => {
    const queryClient = createQueryClient()
    const previousDocs = [
      { id: 'doc-1', variante_id: 'var-1', nom: 'Plan', is_required: false, created_at: '2026-01-01T00:00:00Z' },
      { id: 'doc-2', variante_id: 'var-1', nom: 'Fiche', is_required: true, created_at: '2026-01-02T00:00:00Z' },
    ]
    queryClient.setQueryData(['variante-documents', 'var-1'], previousDocs)

    // Use a never-resolving promise to keep mutation in pending state
    const mockSingle = vi.fn().mockReturnValue(new Promise(() => {}))
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)

    const { result } = renderHook(() => useToggleDocumentRequired(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ docId: 'doc-1', isRequired: true, varianteId: 'var-1' })
    })

    // Cache should be optimistically updated
    const cachedData = queryClient.getQueryData<typeof previousDocs>(['variante-documents', 'var-1'])
    expect(cachedData?.[0].is_required).toBe(true)
    expect(cachedData?.[1].is_required).toBe(true) // untouched
  })
})
