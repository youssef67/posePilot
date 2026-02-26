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
import { useUpdateChantierFinances } from './useUpdateChantierFinances'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useUpdateChantierFinances', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls supabase update with ajustement and sous-traitance', async () => {
    const updated = { id: 'ch-1', ajustement_depenses: 500, cout_sous_traitance: 1200 }
    const mockSingle = vi.fn().mockResolvedValue({ data: updated, error: null })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)

    const { result } = renderHook(() => useUpdateChantierFinances(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({
        chantierId: 'ch-1',
        ajustement_depenses: 500,
        cout_sous_traitance: 1200,
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('chantiers')
    expect(mockUpdate).toHaveBeenCalledWith({ ajustement_depenses: 500, cout_sous_traitance: 1200 })
    expect(mockEq).toHaveBeenCalledWith('id', 'ch-1')
  })

  it('handles errors from supabase', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)

    const { result } = renderHook(() => useUpdateChantierFinances(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({
        chantierId: 'ch-1',
        ajustement_depenses: 0,
        cout_sous_traitance: 0,
      })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
