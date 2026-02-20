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
import { useAllPendingBesoins } from './useAllPendingBesoins'

const mockBesoins = [
  {
    id: 'b1',
    chantier_id: 'ch1',
    description: 'Colle pour faïence 20kg',
    livraison_id: null,
    created_at: '2026-02-10T10:00:00Z',
    created_by: 'user-1',
    chantiers: { nom: 'Résidence Les Oliviers' },
  },
  {
    id: 'b2',
    chantier_id: 'ch2',
    description: 'Joint gris 5kg',
    livraison_id: null,
    created_at: '2026-02-09T10:00:00Z',
    created_by: 'user-2',
    chantiers: { nom: 'Rénovation Duval' },
  },
]

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useAllPendingBesoins', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches all pending besoins with chantier name', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: mockBesoins, error: null })
    const mockIs = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ is: mockIs })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useAllPendingBesoins(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.data).toEqual(mockBesoins))

    expect(supabase.from).toHaveBeenCalledWith('besoins')
    expect(mockSelect).toHaveBeenCalledWith('*, chantiers(nom)')
    expect(mockIs).toHaveBeenCalledWith('livraison_id', null)
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
  })

  it('returns empty array as placeholder', () => {
    const mockOrder = vi.fn().mockReturnValue(new Promise(() => {}))
    const mockIs = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ is: mockIs })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useAllPendingBesoins(), { wrapper: createWrapper() })

    expect(result.current.data).toEqual([])
  })

  it('returns error on supabase failure', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') })
    const mockIs = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ is: mockIs })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useAllPendingBesoins(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('DB error')
  })
})
