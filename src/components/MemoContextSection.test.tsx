import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoContextSection } from './MemoContextSection'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

import { supabase } from '@/lib/supabase'

function Wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

const baseMemo = {
  created_by_email: 'a@b.com',
  created_at: '2026-02-10T00:00:00Z',
  updated_at: '2026-02-10T00:00:00Z',
  memo_photos: [],
}

function mockEtageMemos(memos: unknown[]) {
  const mockOrder = vi.fn().mockResolvedValue({ data: memos, error: null })
  const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
  vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)
}

describe('MemoContextSection', () => {
  beforeEach(() => vi.clearAllMocks())

  it('displays etage memos only', async () => {
    mockEtageMemos([
      { id: 'm1', chantier_id: null, plot_id: null, etage_id: 'e-1', content: 'Etage memo 1', ...baseMemo },
      { id: 'm2', chantier_id: null, plot_id: null, etage_id: 'e-1', content: 'Etage memo 2', ...baseMemo },
    ])

    render(
      <Wrapper>
        <MemoContextSection etageId="e-1" etageNom="RDC" />
      </Wrapper>,
    )

    expect(await screen.findByText('Etage memo 1')).toBeInTheDocument()
    expect(screen.getByText('Etage memo 2')).toBeInTheDocument()
    expect(screen.getByText(/Mémos étage — RDC/)).toBeInTheDocument()
  })

  it('renders nothing when no memos exist (AC #4)', async () => {
    mockEtageMemos([])

    const { container } = render(
      <Wrapper>
        <MemoContextSection etageId="e-1" etageNom="RDC" />
      </Wrapper>,
    )

    await waitFor(() => {
      expect(container.textContent).toBe('')
    })
  })

  it('displays multi-photo thumbnails (AC #7)', async () => {
    mockEtageMemos([
      {
        id: 'm1', chantier_id: null, plot_id: null, etage_id: 'e-1', content: 'With photos',
        ...baseMemo,
        memo_photos: [
          { id: 'ph-1', memo_id: 'm1', photo_url: 'https://example.com/a.jpg', position: 0, created_at: '' },
          { id: 'ph-2', memo_id: 'm1', photo_url: 'https://example.com/b.jpg', position: 1, created_at: '' },
        ],
      },
    ])

    render(
      <Wrapper>
        <MemoContextSection etageId="e-1" etageNom="RDC" />
      </Wrapper>,
    )

    const imgs = await screen.findAllByAltText('Photo du mémo')
    expect(imgs).toHaveLength(2)
  })

  it('does not show chantier/plot group labels (AC #3)', async () => {
    mockEtageMemos([
      { id: 'm1', chantier_id: null, plot_id: null, etage_id: 'e-1', content: 'Only etage', ...baseMemo },
    ])

    render(
      <Wrapper>
        <MemoContextSection etageId="e-1" etageNom="RDC" />
      </Wrapper>,
    )

    await screen.findByText('Only etage')
    expect(screen.queryByText(/Chantier —/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Plot —/)).not.toBeInTheDocument()
  })
})
