import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

import { supabase } from '@/lib/supabase'
import { useVarianteDocuments } from './useVarianteDocuments'

const mockDocuments = [
  {
    id: 'doc-1',
    variante_id: 'var-1',
    nom: 'Plan de pose',
    is_required: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'doc-2',
    variante_id: 'var-1',
    nom: 'Fiche de choix',
    is_required: false,
    created_at: '2026-01-02T00:00:00Z',
  },
]

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useVarianteDocuments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches documents for a variante ordered by created_at ASC', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: mockDocuments, error: null })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useVarianteDocuments('var-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('variante_documents')
    expect(mockSelect).toHaveBeenCalledWith('*')
    expect(mockEq).toHaveBeenCalledWith('variante_id', 'var-1')
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: true })
    expect(result.current.data).toEqual(mockDocuments)
  })

  it('uses query key ["variante-documents", varianteId]', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: mockDocuments, error: null })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useVarianteDocuments('var-1'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const cached = queryClient.getQueryData(['variante-documents', 'var-1'])
    expect(cached).toEqual(mockDocuments)
  })

  it('returns error on supabase failure', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useVarianteDocuments('var-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('DB error')
  })

  it('is disabled when varianteId is empty', async () => {
    const { result } = renderHook(() => useVarianteDocuments(''), { wrapper: createWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
  })
})
