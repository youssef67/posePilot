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
import { useBesoins } from './useBesoins'

const mockBesoins = [
  {
    id: 'b1',
    chantier_id: 'ch1',
    description: 'Colle pour faïence 20kg',
    livraison_id: null,
    created_at: '2026-02-10T10:00:00Z',
    created_by: 'user-1',
  },
  {
    id: 'b2',
    chantier_id: 'ch1',
    description: 'Joint gris 5kg',
    livraison_id: null,
    created_at: '2026-02-09T10:00:00Z',
    created_by: 'user-2',
  },
]

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useBesoins', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches pending besoins for a chantier', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: mockBesoins, error: null })
    const mockIs = vi.fn().mockReturnValue({ order: mockOrder })
    const mockEq = vi.fn().mockReturnValue({ is: mockIs })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useBesoins('ch1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('besoins')
    expect(mockSelect).toHaveBeenCalledWith('*')
    expect(mockEq).toHaveBeenCalledWith('chantier_id', 'ch1')
    expect(mockIs).toHaveBeenCalledWith('livraison_id', null)
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(result.current.data).toEqual(mockBesoins)
  })

  it('is disabled when chantierId is empty', () => {
    const { result } = renderHook(() => useBesoins(''), { wrapper: createWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
  })

  it('returns error on supabase failure', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') })
    const mockIs = vi.fn().mockReturnValue({ order: mockOrder })
    const mockEq = vi.fn().mockReturnValue({ is: mockIs })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useBesoins('ch1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('DB error')
  })
})
