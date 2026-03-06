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
  photo_url: null,
  created_at: '2026-02-10T00:00:00Z',
  updated_at: '2026-02-10T00:00:00Z',
}

function mockContextMemos(memos: unknown[]) {
  const mockOrder = vi.fn().mockResolvedValue({ data: memos, error: null })
  const mockOr = vi.fn().mockReturnValue({ order: mockOrder })
  const mockSelect = vi.fn().mockReturnValue({ or: mockOr })
  vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)
}

describe('MemoContextSection', () => {
  beforeEach(() => vi.clearAllMocks())

  it('displays grouped memos by level', async () => {
    mockContextMemos([
      { id: 'm1', chantier_id: 'ch-1', plot_id: null, etage_id: null, content: 'Chantier memo', ...baseMemo },
      { id: 'm2', chantier_id: null, plot_id: 'p-1', etage_id: null, content: 'Plot memo', ...baseMemo },
      { id: 'm3', chantier_id: null, plot_id: null, etage_id: 'e-1', content: 'Etage memo', ...baseMemo },
    ])

    render(
      <Wrapper>
        <MemoContextSection
          chantierId="ch-1" plotId="p-1" etageId="e-1"
          chantierNom="Alpha" plotNom="Plot A" etageNom="RDC"
        />
      </Wrapper>,
    )

    expect(await screen.findByText('Chantier memo')).toBeInTheDocument()
    expect(screen.getByText('Plot memo')).toBeInTheDocument()
    expect(screen.getByText('Etage memo')).toBeInTheDocument()
    expect(screen.getByText(/Chantier — Alpha/)).toBeInTheDocument()
    expect(screen.getByText(/Plot — Plot A/)).toBeInTheDocument()
  })

  it('renders nothing when no memos exist', async () => {
    mockContextMemos([])

    const { container } = render(
      <Wrapper>
        <MemoContextSection
          chantierId="ch-1" plotId="p-1" etageId="e-1"
          chantierNom="Alpha" plotNom="Plot A" etageNom="RDC"
        />
      </Wrapper>,
    )

    await waitFor(() => {
      expect(container.textContent).toBe('')
    })
  })

  it('displays photo thumbnails for memos with photos', async () => {
    mockContextMemos([
      { id: 'm1', chantier_id: 'ch-1', plot_id: null, etage_id: null, content: 'With photo', ...baseMemo, photo_url: 'https://example.com/photo.jpg' },
    ])

    render(
      <Wrapper>
        <MemoContextSection
          chantierId="ch-1" plotId="p-1" etageId="e-1"
          chantierNom="Alpha" plotNom="Plot A" etageNom="RDC"
        />
      </Wrapper>,
    )

    const img = await screen.findByAltText('Photo du mémo')
    expect(img).toBeInTheDocument()
    expect((img as HTMLImageElement).src).toBe('https://example.com/photo.jpg')
  })
})
