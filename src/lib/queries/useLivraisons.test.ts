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
import { useLivraisons } from './useLivraisons'

const mockLivraisons = [
  {
    id: 'liv1',
    chantier_id: 'ch1',
    description: 'Colle pour faïence 20kg',
    status: 'commande',
    date_prevue: null,
    bc_file_url: null,
    bc_file_name: null,
    bl_file_url: null,
    bl_file_name: null,
    created_at: '2026-02-10T10:00:00Z',
    created_by: 'user-1',
  },
  {
    id: 'liv2',
    chantier_id: 'ch1',
    description: 'Croisillons 3mm',
    status: 'prevu',
    date_prevue: '2026-02-15',
    bc_file_url: null,
    bc_file_name: null,
    bl_file_url: null,
    bl_file_name: null,
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

describe('useLivraisons', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches livraisons for a chantier ordered by created_at DESC', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: mockLivraisons, error: null })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useLivraisons('ch1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(supabase.from).toHaveBeenCalledWith('livraisons')
    expect(mockSelect).toHaveBeenCalledWith('*')
    expect(mockEq).toHaveBeenCalledWith('chantier_id', 'ch1')
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(result.current.data).toEqual(mockLivraisons)
  })

  it('is disabled when chantierId is empty', () => {
    const { result } = renderHook(() => useLivraisons(''), { wrapper: createWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
  })

  it('returns error on supabase failure', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    const { result } = renderHook(() => useLivraisons('ch1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('DB error')
  })
})
