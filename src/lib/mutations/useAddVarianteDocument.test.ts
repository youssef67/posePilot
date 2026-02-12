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
import { useAddVarianteDocument } from './useAddVarianteDocument'

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

describe('useAddVarianteDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('inserts document with variante_id and nom', async () => {
    const { mockInsert } = mockSupabaseInsert({
      id: 'doc-1',
      variante_id: 'var-1',
      nom: 'Plan de pose',
      is_required: false,
      created_at: '2026-01-01T00:00:00Z',
    })

    const { result } = renderHook(() => useAddVarianteDocument(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ varianteId: 'var-1', nom: 'Plan de pose' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('variante_documents')
    expect(mockInsert).toHaveBeenCalledWith({ variante_id: 'var-1', nom: 'Plan de pose' })
  })

  it('invalidates variante-documents query on settled', async () => {
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    mockSupabaseInsert({
      id: 'doc-1',
      variante_id: 'var-1',
      nom: 'Fiche de choix',
      is_required: false,
      created_at: '2026-01-01T00:00:00Z',
    })

    const { result } = renderHook(() => useAddVarianteDocument(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ varianteId: 'var-1', nom: 'Fiche de choix' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['variante-documents', 'var-1'] })
  })

  it('rolls back cache on mutation error', async () => {
    const queryClient = createQueryClient()
    const previousDocs = [
      { id: 'existing-1', variante_id: 'var-1', nom: 'Existing', is_required: false, created_at: '2026-01-01T00:00:00Z' },
    ]
    queryClient.setQueryData(['variante-documents', 'var-1'], previousDocs)

    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: new Error('Insert failed') })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never)

    const { result } = renderHook(() => useAddVarianteDocument(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ varianteId: 'var-1', nom: 'Fail' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    const cachedData = queryClient.getQueryData(['variante-documents', 'var-1'])
    expect(cachedData).toEqual(previousDocs)
  })
})
