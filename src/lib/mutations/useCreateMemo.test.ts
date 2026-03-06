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
  toast: { success: vi.fn() },
}))

import { supabase } from '@/lib/supabase'
import { useCreateMemo } from './useCreateMemo'

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return { wrapper: ({ children }: { children: React.ReactNode }) => createElement(QueryClientProvider, { client: queryClient }, children), queryClient }
}

describe('useCreateMemo', () => {
  beforeEach(() => vi.clearAllMocks())

  it('inserts memo into memos table', async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'm1', chantier_id: 'ch-1', content: 'Test', created_by_email: 'a@b.com' }, error: null })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never)

    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useCreateMemo(), { wrapper })

    await act(async () => {
      result.current.mutate({ chantierId: 'ch-1', content: 'Test', createdByEmail: 'a@b.com' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(supabase.from).toHaveBeenCalledWith('memos')
    expect(mockInsert).toHaveBeenCalledWith({
      chantier_id: 'ch-1',
      etage_id: null,
      content: 'Test',
      created_by_email: 'a@b.com',
    })
  })
})
