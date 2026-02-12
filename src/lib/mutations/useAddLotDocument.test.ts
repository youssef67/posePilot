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
import { useAddLotDocument } from './useAddLotDocument'

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

function mockSupabaseInsert(data: unknown) {
  const mockSingle = vi.fn().mockResolvedValue({ data, error: null })
  const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
  const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
  vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never)
  return { mockInsert, mockSelect, mockSingle }
}

const mockDocument = {
  id: 'doc-new',
  lot_id: 'lot-1',
  nom: 'PV de réception',
  is_required: false,
  created_at: '2026-01-01T00:00:00Z',
}

describe('useAddLotDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls supabase insert with correct params', async () => {
    const { mockInsert } = mockSupabaseInsert(mockDocument)

    const { result } = renderHook(() => useAddLotDocument(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ lotId: 'lot-1', nom: 'PV de réception' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('lot_documents')
    expect(mockInsert).toHaveBeenCalledWith({ lot_id: 'lot-1', nom: 'PV de réception', is_required: false })
  })

  it('optimistically adds document to cache', async () => {
    const queryClient = createQueryClient()
    const previousDocs = [
      { id: 'doc-1', lot_id: 'lot-1', nom: 'Plan de pose', is_required: true, created_at: '2026-01-01T00:00:00Z' },
    ]
    queryClient.setQueryData(['lot-documents', 'lot-1'], previousDocs)

    // Never-resolving to keep pending
    const mockSingle = vi.fn().mockReturnValue(new Promise(() => {}))
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never)

    const { result } = renderHook(() => useAddLotDocument(), { wrapper: createWrapper(queryClient) })

    await act(async () => {
      result.current.mutate({ lotId: 'lot-1', nom: 'PV de réception' })
    })

    const cached = queryClient.getQueryData<typeof previousDocs>(['lot-documents', 'lot-1'])
    expect(cached).toHaveLength(2)
    expect(cached?.[1].nom).toBe('PV de réception')
    expect(cached?.[1].is_required).toBe(false)
  })

  it('rolls back cache on error', async () => {
    const queryClient = createQueryClient()
    const previousDocs = [
      { id: 'doc-1', lot_id: 'lot-1', nom: 'Plan de pose', is_required: true, created_at: '2026-01-01T00:00:00Z' },
    ]
    queryClient.setQueryData(['lot-documents', 'lot-1'], previousDocs)

    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: new Error('fail') })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never)

    const { result } = renderHook(() => useAddLotDocument(), { wrapper: createWrapper(queryClient) })

    await act(async () => {
      result.current.mutate({ lotId: 'lot-1', nom: 'PV de réception' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    const cached = queryClient.getQueryData<typeof previousDocs>(['lot-documents', 'lot-1'])
    expect(cached).toEqual(previousDocs)
  })

  it('invalidates lot-documents query on settled', async () => {
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    mockSupabaseInsert(mockDocument)

    const { result } = renderHook(() => useAddLotDocument(), { wrapper: createWrapper(queryClient) })

    await act(async () => {
      result.current.mutate({ lotId: 'lot-1', nom: 'PV de réception' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['lot-documents', 'lot-1'] })
  })
})
