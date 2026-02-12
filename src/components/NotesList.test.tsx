import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NotesList } from './NotesList'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

vi.mock('@/lib/utils/useShareContext', () => ({
  useShareContext: () => 'Chantier Test — Plot A — Lot 101',
}))

vi.mock('@/lib/utils/sharePhoto', () => ({
  sharePhoto: vi.fn(),
}))

vi.mock('sonner', () => {
  const toast = vi.fn() as ReturnType<typeof vi.fn> & { error: ReturnType<typeof vi.fn> }
  toast.error = vi.fn()
  return { toast }
})

import { supabase } from '@/lib/supabase'
import { sharePhoto } from '@/lib/utils/sharePhoto'
import { toast } from 'sonner'

const mockNotes = [
  {
    id: 'note-1',
    lot_id: 'lot-1',
    piece_id: null,
    content: 'Fissure au plafond',
    is_blocking: true,
    created_by: 'user-1',
    created_by_email: 'bruno@test.fr',
    photo_url: null,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h ago
  },
  {
    id: 'note-2',
    lot_id: 'lot-1',
    piece_id: null,
    content: 'Peinture OK',
    is_blocking: false,
    created_by: 'user-2',
    created_by_email: 'alice@test.fr',
    photo_url: null,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1d ago
  },
]

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

function mockQuery(data: unknown[] | null, error: Error | null = null) {
  const mockOrder = vi.fn().mockResolvedValue({ data, error })
  const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
  vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)
}

describe('NotesList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows skeleton while loading', () => {
    // Never resolving promise to keep loading state
    const mockOrder = vi.fn().mockReturnValue(new Promise(() => {}))
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)

    render(<NotesList lotId="lot-1" />, { wrapper: createWrapper() })

    expect(screen.getByTestId('notes-skeleton')).toBeInTheDocument()
  })

  it('shows "Aucune note" when no notes exist', async () => {
    mockQuery([])

    render(<NotesList lotId="lot-1" />, { wrapper: createWrapper() })

    expect(await screen.findByText('Aucune note')).toBeInTheDocument()
  })

  it('renders notes with content', async () => {
    mockQuery(mockNotes)

    render(<NotesList lotId="lot-1" />, { wrapper: createWrapper() })

    expect(await screen.findByText('Fissure au plafond')).toBeInTheDocument()
    expect(screen.getByText('Peinture OK')).toBeInTheDocument()
  })

  it('shows blocking badge for blocking notes', async () => {
    mockQuery(mockNotes)

    render(<NotesList lotId="lot-1" />, { wrapper: createWrapper() })

    await screen.findByText('Fissure au plafond')
    expect(screen.getByText('Bloquant')).toBeInTheDocument()
  })

  it('shows author name extracted from email', async () => {
    mockQuery(mockNotes)

    render(<NotesList lotId="lot-1" />, { wrapper: createWrapper() })

    await screen.findByText('Fissure au plafond')
    expect(screen.getByText('bruno')).toBeInTheDocument()
    expect(screen.getByText('alice')).toBeInTheDocument()
  })

  it('applies destructive border on blocking notes', async () => {
    mockQuery([mockNotes[0]]) // Only blocking note

    render(<NotesList lotId="lot-1" />, { wrapper: createWrapper() })

    await screen.findByText('Fissure au plafond')
    const noteContainer = screen.getByText('Fissure au plafond').closest('[class*="border-l-destructive"]')
    expect(noteContainer).toBeInTheDocument()
  })

  it('shows relative time', async () => {
    mockQuery(mockNotes)

    render(<NotesList lotId="lot-1" />, { wrapper: createWrapper() })

    await screen.findByText('Fissure au plafond')
    // Should contain relative time text (e.g., "il y a 2 heures")
    const timeElements = screen.getAllByText(/il y a/)
    expect(timeElements.length).toBeGreaterThan(0)
  })

  it('shows "?" for author when email is null', async () => {
    mockQuery([{ ...mockNotes[0], created_by_email: null }])

    render(<NotesList lotId="lot-1" />, { wrapper: createWrapper() })

    await screen.findByText('Fissure au plafond')
    expect(screen.getByText('?')).toBeInTheDocument()
  })

  it('renders photo thumbnail when note has photo_url', async () => {
    const noteWithPhoto = {
      ...mockNotes[0],
      photo_url: 'https://storage.example.com/note-photos/photo.jpg',
    }
    mockQuery([noteWithPhoto])

    render(<NotesList lotId="lot-1" />, { wrapper: createWrapper() })

    await screen.findByText('Fissure au plafond')
    const thumbnail = screen.getByTestId('photo-thumbnail')
    expect(thumbnail).toBeInTheDocument()
    expect((thumbnail as HTMLImageElement).src).toBe('https://storage.example.com/note-photos/photo.jpg')
  })

  it('does NOT render photo thumbnail when photo_url is null', async () => {
    mockQuery([mockNotes[0]]) // photo_url = null

    render(<NotesList lotId="lot-1" />, { wrapper: createWrapper() })

    await screen.findByText('Fissure au plafond')
    expect(screen.queryByTestId('photo-thumbnail')).not.toBeInTheDocument()
  })

  it('shows share button when note has photo_url', async () => {
    const noteWithPhoto = {
      ...mockNotes[0],
      photo_url: 'https://storage.example.com/note-photos/photo.jpg',
    }
    mockQuery([noteWithPhoto])

    render(<NotesList lotId="lot-1" />, { wrapper: createWrapper() })

    await screen.findByText('Fissure au plafond')
    expect(screen.getByRole('button', { name: 'Partager la photo' })).toBeInTheDocument()
  })

  it('does NOT show share button when note has no photo', async () => {
    mockQuery([mockNotes[0]]) // photo_url = null

    render(<NotesList lotId="lot-1" />, { wrapper: createWrapper() })

    await screen.findByText('Fissure au plafond')
    expect(screen.queryByRole('button', { name: 'Partager la photo' })).not.toBeInTheDocument()
  })

  it('calls sharePhoto with correct context when share button is clicked', async () => {
    const user = userEvent.setup()
    const noteWithPhoto = {
      ...mockNotes[0],
      photo_url: 'https://storage.example.com/note-photos/photo.jpg',
    }
    mockQuery([noteWithPhoto])
    vi.mocked(sharePhoto).mockResolvedValue('shared')

    render(<NotesList lotId="lot-1" />, { wrapper: createWrapper() })

    await screen.findByText('Fissure au plafond')
    await user.click(screen.getByRole('button', { name: 'Partager la photo' }))

    expect(sharePhoto).toHaveBeenCalledWith({
      photoUrl: 'https://storage.example.com/note-photos/photo.jpg',
      shareText: 'Chantier Test — Plot A — Lot 101 : Fissure au plafond',
    })
  })

  it('shows "Photo partagée" toast when share result is "shared"', async () => {
    const user = userEvent.setup()
    const noteWithPhoto = {
      ...mockNotes[0],
      photo_url: 'https://storage.example.com/note-photos/photo.jpg',
    }
    mockQuery([noteWithPhoto])
    vi.mocked(sharePhoto).mockResolvedValue('shared')

    render(<NotesList lotId="lot-1" />, { wrapper: createWrapper() })

    await screen.findByText('Fissure au plafond')
    await user.click(screen.getByRole('button', { name: 'Partager la photo' }))

    expect(toast).toHaveBeenCalledWith('Photo partagée')
  })

  it('shows download toast when share result is "downloaded"', async () => {
    const user = userEvent.setup()
    const noteWithPhoto = {
      ...mockNotes[0],
      photo_url: 'https://storage.example.com/note-photos/photo.jpg',
    }
    mockQuery([noteWithPhoto])
    vi.mocked(sharePhoto).mockResolvedValue('downloaded')

    render(<NotesList lotId="lot-1" />, { wrapper: createWrapper() })

    await screen.findByText('Fissure au plafond')
    await user.click(screen.getByRole('button', { name: 'Partager la photo' }))

    expect(toast).toHaveBeenCalledWith('Photo téléchargée — texte copié dans le presse-papiers')
  })

  it('shows error toast when sharePhoto throws', async () => {
    const user = userEvent.setup()
    const noteWithPhoto = {
      ...mockNotes[0],
      photo_url: 'https://storage.example.com/note-photos/photo.jpg',
    }
    mockQuery([noteWithPhoto])
    vi.mocked(sharePhoto).mockRejectedValue(new Error('Network error'))

    render(<NotesList lotId="lot-1" />, { wrapper: createWrapper() })

    await screen.findByText('Fissure au plafond')
    await user.click(screen.getByRole('button', { name: 'Partager la photo' }))

    expect(toast.error).toHaveBeenCalledWith('Erreur lors du partage de la photo')
  })
})
