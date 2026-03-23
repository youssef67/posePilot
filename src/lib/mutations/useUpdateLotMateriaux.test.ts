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
import { useUpdateLotMateriaux } from './useUpdateLotMateriaux'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useUpdateLotMateriaux', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls supabase update with materiaux_statut and materiaux_note', async () => {
    const updated = { id: 'lot-1', materiaux_statut: 'partiel', materiaux_note: 'Manque colle' }
    const mockSingle = vi.fn().mockResolvedValue({ data: updated, error: null })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)

    const { result } = renderHook(() => useUpdateLotMateriaux(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({
        lotId: 'lot-1',
        plotId: 'plot-1',
        materiaux_statut: 'partiel',
        materiaux_note: 'Manque colle',
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('lots')
    expect(mockUpdate).toHaveBeenCalledWith({ materiaux_statut: 'partiel', materiaux_note: 'Manque colle' })
    expect(mockEq).toHaveBeenCalledWith('id', 'lot-1')
  })

  it('calls supabase update with recu status and null note', async () => {
    const updated = { id: 'lot-1', materiaux_statut: 'recu', materiaux_note: null }
    const mockSingle = vi.fn().mockResolvedValue({ data: updated, error: null })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)

    const { result } = renderHook(() => useUpdateLotMateriaux(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({
        lotId: 'lot-1',
        plotId: 'plot-1',
        materiaux_statut: 'recu',
        materiaux_note: null,
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockUpdate).toHaveBeenCalledWith({ materiaux_statut: 'recu', materiaux_note: null })
  })

  it('handles errors from supabase', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockEq = vi.fn().mockReturnValue({ select: mockSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)

    const { result } = renderHook(() => useUpdateLotMateriaux(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({
        lotId: 'lot-1',
        plotId: 'plot-1',
        materiaux_statut: 'recu',
        materiaux_note: null,
      })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
