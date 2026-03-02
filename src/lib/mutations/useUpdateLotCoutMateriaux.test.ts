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
import { useUpdateLotCoutMateriaux } from './useUpdateLotCoutMateriaux'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useUpdateLotCoutMateriaux', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls supabase update with cout_materiaux', async () => {
    const updated = { id: 'lot-1', cout_materiaux: 1250.5 }
    const mockSingle = vi.fn().mockResolvedValue({ data: updated, error: null })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)

    const { result } = renderHook(() => useUpdateLotCoutMateriaux(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({
        lotId: 'lot-1',
        plotId: 'plot-1',
        chantierId: 'ch-1',
        cout_materiaux: 1250.5,
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('lots')
    expect(mockUpdate).toHaveBeenCalledWith({ cout_materiaux: 1250.5 })
    expect(mockEq).toHaveBeenCalledWith('id', 'lot-1')
  })

  it('handles errors from supabase', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)

    const { result } = renderHook(() => useUpdateLotCoutMateriaux(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({
        lotId: 'lot-1',
        plotId: 'plot-1',
        chantierId: 'ch-1',
        cout_materiaux: 0,
      })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
