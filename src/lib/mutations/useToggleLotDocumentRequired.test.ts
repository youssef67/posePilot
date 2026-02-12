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
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useToggleLotDocumentRequired } from './useToggleLotDocumentRequired'

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

function mockSupabaseUpdate(data: unknown, error: Error | null = null) {
  const mockSingle = vi.fn().mockResolvedValue({ data, error })
  const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
  const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
  const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
  vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)
  return { mockUpdate, mockEq, mockSelect, mockSingle }
}

describe('useToggleLotDocumentRequired', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('toggles is_required true→false on lot_documents', async () => {
    const { mockUpdate, mockEq } = mockSupabaseUpdate({
      id: 'doc-1',
      lot_id: 'lot-1',
      nom: 'Plan',
      is_required: false,
    })

    const { result } = renderHook(() => useToggleLotDocumentRequired(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ docId: 'doc-1', isRequired: false, lotId: 'lot-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('lot_documents')
    expect(mockUpdate).toHaveBeenCalledWith({ is_required: false })
    expect(mockEq).toHaveBeenCalledWith('id', 'doc-1')
  })

  it('toggles is_required false→true on lot_documents', async () => {
    const { mockUpdate, mockEq } = mockSupabaseUpdate({
      id: 'doc-1',
      lot_id: 'lot-1',
      nom: 'Plan',
      is_required: true,
    })

    const { result } = renderHook(() => useToggleLotDocumentRequired(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ docId: 'doc-1', isRequired: true, lotId: 'lot-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('lot_documents')
    expect(mockUpdate).toHaveBeenCalledWith({ is_required: true })
    expect(mockEq).toHaveBeenCalledWith('id', 'doc-1')
  })

  it('rolls back cache and shows toast on error', async () => {
    const queryClient = createQueryClient()
    const previousDocs = [
      { id: 'doc-1', lot_id: 'lot-1', nom: 'Plan', is_required: false, created_at: '2026-01-01T00:00:00Z' },
    ]
    queryClient.setQueryData(['lot-documents', 'lot-1'], previousDocs)

    mockSupabaseUpdate(null, new Error('Update failed'))

    const { result } = renderHook(() => useToggleLotDocumentRequired(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ docId: 'doc-1', isRequired: true, lotId: 'lot-1' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    const cachedData = queryClient.getQueryData(['lot-documents', 'lot-1'])
    expect(cachedData).toEqual(previousDocs)
    expect(toast.error).toHaveBeenCalled()
  })

  it('invalidates lot-documents query on settled', async () => {
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    mockSupabaseUpdate({ id: 'doc-1', lot_id: 'lot-1', nom: 'Plan', is_required: true })

    const { result } = renderHook(() => useToggleLotDocumentRequired(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ docId: 'doc-1', isRequired: true, lotId: 'lot-1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['lot-documents', 'lot-1'] })
  })
})
