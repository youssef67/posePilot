import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoFormSheet } from './MemoFormSheet'
import type { MemoWithPhotos } from '@/lib/queries/useMemos'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: 'm1' }, error: null }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'm1' }, error: null }),
          }),
        }),
      }),
    }),
  },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn() },
}))

vi.mock('@/lib/auth', () => ({
  useAuth: () => ({ user: { email: 'test@example.com' } }),
}))

function Wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

const baseMemo: MemoWithPhotos = {
  id: 'm1',
  chantier_id: 'ch-1',
  plot_id: null,
  etage_id: null,
  content: 'Test memo',
  created_by_email: 'a@b.com',
  created_at: '',
  updated_at: '',
  memo_photos: [],
}

describe('MemoFormSheet', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders creation form when no editMemo', () => {
    render(
      <Wrapper>
        <MemoFormSheet open={true} onOpenChange={vi.fn()} entityType="chantier" entityId="ch-1" />
      </Wrapper>,
    )
    expect(screen.getByText('Nouveau mémo')).toBeInTheDocument()
    expect(screen.getByText('Ajouter')).toBeInTheDocument()
  })

  it('renders edit form when editMemo is provided', () => {
    render(
      <Wrapper>
        <MemoFormSheet open={true} onOpenChange={vi.fn()} entityType="chantier" entityId="ch-1" editMemo={baseMemo} />
      </Wrapper>,
    )
    expect(screen.getByText('Modifier le mémo')).toBeInTheDocument()
    expect(screen.getByText('Modifier')).toBeInTheDocument()
  })

  it('disables button when content is empty', () => {
    render(
      <Wrapper>
        <MemoFormSheet open={true} onOpenChange={vi.fn()} entityType="chantier" entityId="ch-1" />
      </Wrapper>,
    )
    expect(screen.getByText('Ajouter')).toBeDisabled()
  })

  it('enables button when content is entered', async () => {
    render(
      <Wrapper>
        <MemoFormSheet open={true} onOpenChange={vi.fn()} entityType="chantier" entityId="ch-1" />
      </Wrapper>,
    )
    await userEvent.type(screen.getByPlaceholderText('Écrire un mémo...'), 'Nouveau mémo test')
    expect(screen.getByText('Ajouter')).not.toBeDisabled()
  })

  it('shows photo capture button in creation mode', () => {
    render(
      <Wrapper>
        <MemoFormSheet open={true} onOpenChange={vi.fn()} entityType="plot" entityId="p-1" />
      </Wrapper>,
    )
    expect(screen.getByText('Ajouter une photo')).toBeInTheDocument()
  })

  it('shows photo capture button in edit mode when under 5 photos (AC #8)', () => {
    render(
      <Wrapper>
        <MemoFormSheet open={true} onOpenChange={vi.fn()} entityType="plot" entityId="p-1" editMemo={baseMemo} />
      </Wrapper>,
    )
    expect(screen.getByText('Ajouter une photo')).toBeInTheDocument()
  })

  it('shows existing photos in edit mode (AC #8)', () => {
    const memoWithPhotos: MemoWithPhotos = {
      ...baseMemo,
      memo_photos: [
        { id: 'ph-1', memo_id: 'm1', photo_url: 'https://example.com/a.jpg', position: 0, created_at: '' },
        { id: 'ph-2', memo_id: 'm1', photo_url: 'https://example.com/b.jpg', position: 1, created_at: '' },
      ],
    }
    render(
      <Wrapper>
        <MemoFormSheet open={true} onOpenChange={vi.fn()} entityType="chantier" entityId="ch-1" editMemo={memoWithPhotos} />
      </Wrapper>,
    )
    const imgs = screen.getAllByAltText('Photo existante')
    expect(imgs).toHaveLength(2)
  })

  it('hides photo button when max photos reached (AC #5)', () => {
    const memoWith5Photos: MemoWithPhotos = {
      ...baseMemo,
      memo_photos: Array.from({ length: 5 }, (_, i) => ({
        id: `ph-${i}`, memo_id: 'm1', photo_url: `https://example.com/${i}.jpg`, position: i, created_at: '',
      })),
    }
    render(
      <Wrapper>
        <MemoFormSheet open={true} onOpenChange={vi.fn()} entityType="chantier" entityId="ch-1" editMemo={memoWith5Photos} />
      </Wrapper>,
    )
    expect(screen.queryByText('Ajouter une photo')).not.toBeInTheDocument()
  })
})
