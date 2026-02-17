import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { NoteDetailDialog } from './NoteDetailDialog'
import type { Note } from '@/types/database'

const mockMutate = vi.fn()

vi.mock('@/lib/mutations/useUpdateNote', () => ({
  useUpdateNote: () => ({ mutate: mockMutate, isPending: false }),
}))

const mockDeleteMutate = vi.fn()

vi.mock('@/lib/mutations/useDeleteNote', () => ({
  useDeleteNote: () => ({ mutate: mockDeleteMutate, isPending: false }),
}))

vi.mock('@/lib/queries/useNoteResponses', () => ({
  useNoteResponses: () => ({ data: [], isLoading: false }),
}))

vi.mock('@/lib/mutations/useCreateNoteResponse', () => ({
  useCreateNoteResponse: () => ({ mutate: vi.fn(), isPending: false }),
}))

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children)
}

const baseNote: Note = {
  id: 'note-1',
  lot_id: 'lot-1',
  piece_id: null,
  content: 'Fissure importante au niveau du plafond',
  is_blocking: false,
  created_by: 'user-1',
  created_by_email: 'youssef@test.fr',
  photo_url: null,
  created_at: '2026-02-15T10:30:00Z',
}

const blockingNote: Note = {
  ...baseNote,
  id: 'note-2',
  is_blocking: true,
}

const noteWithPhoto: Note = {
  ...baseNote,
  id: 'note-3',
  photo_url: 'https://project.supabase.co/storage/v1/object/public/note-photos/user-1/note-3_123.jpg',
}

describe('NoteDetailDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders note content, date and no badge when not blocking', () => {
    render(
      <NoteDetailDialog note={baseNote} open onOpenChange={vi.fn()} />,
      { wrapper: createWrapper() },
    )

    expect(screen.getByTestId('note-content')).toHaveTextContent('Fissure importante au niveau du plafond')
    expect(screen.getByTestId('note-date')).toBeInTheDocument()
    expect(screen.queryByText('Bloquant')).not.toBeInTheDocument()
  })

  it('shows blocking badge when note is blocking', () => {
    render(
      <NoteDetailDialog note={blockingNote} open onOpenChange={vi.fn()} />,
      { wrapper: createWrapper() },
    )

    expect(screen.getByText('Bloquant')).toBeInTheDocument()
  })

  it('shows photo thumbnail when note has photo_url', () => {
    render(
      <NoteDetailDialog note={noteWithPhoto} open onOpenChange={vi.fn()} />,
      { wrapper: createWrapper() },
    )

    const thumbnail = screen.getByTestId('photo-thumbnail') as HTMLImageElement
    expect(thumbnail.src).toBe(noteWithPhoto.photo_url)
  })

  it('does not render photo when photo_url is null', () => {
    render(
      <NoteDetailDialog note={baseNote} open onOpenChange={vi.fn()} />,
      { wrapper: createWrapper() },
    )

    expect(screen.queryByTestId('photo-thumbnail')).not.toBeInTheDocument()
  })

  it('switches to edit mode when Modifier is clicked', async () => {
    const user = userEvent.setup()
    render(
      <NoteDetailDialog note={baseNote} open onOpenChange={vi.fn()} />,
      { wrapper: createWrapper() },
    )

    await user.click(screen.getByRole('button', { name: /modifier/i }))

    expect(screen.getByTestId('edit-content')).toHaveValue(baseNote.content)
    expect(screen.getByText('Enregistrer')).toBeInTheDocument()
    expect(screen.getByText('Annuler')).toBeInTheDocument()
  })

  it('calls useUpdateNote on save', async () => {
    const user = userEvent.setup()
    render(
      <NoteDetailDialog note={baseNote} open onOpenChange={vi.fn()} />,
      { wrapper: createWrapper() },
    )

    await user.click(screen.getByRole('button', { name: /modifier/i }))
    const textarea = screen.getByTestId('edit-content')
    await user.clear(textarea)
    await user.type(textarea, 'Contenu modifié')
    await user.click(screen.getByText('Enregistrer'))

    expect(mockMutate).toHaveBeenCalledWith(
      { noteId: 'note-1', content: 'Contenu modifié', isBlocking: false },
      expect.any(Object),
    )
  })

  it('cancels edit mode when Annuler is clicked', async () => {
    const user = userEvent.setup()
    render(
      <NoteDetailDialog note={baseNote} open onOpenChange={vi.fn()} />,
      { wrapper: createWrapper() },
    )

    await user.click(screen.getByRole('button', { name: /modifier/i }))
    expect(screen.getByTestId('edit-content')).toBeInTheDocument()

    await user.click(screen.getByText('Annuler'))
    expect(screen.queryByTestId('edit-content')).not.toBeInTheDocument()
    expect(screen.getByTestId('note-content')).toBeInTheDocument()
  })

  it('shows confirmation dialog on Supprimer click', async () => {
    const user = userEvent.setup()
    render(
      <NoteDetailDialog note={baseNote} open onOpenChange={vi.fn()} />,
      { wrapper: createWrapper() },
    )

    await user.click(screen.getByRole('button', { name: /supprimer/i }))

    expect(screen.getByText('Supprimer cette note ?')).toBeInTheDocument()
  })

  it('mentions photo in delete confirmation when note has photo', async () => {
    const user = userEvent.setup()
    render(
      <NoteDetailDialog note={noteWithPhoto} open onOpenChange={vi.fn()} />,
      { wrapper: createWrapper() },
    )

    // Load the photo to avoid it being hidden
    fireEvent.load(screen.getByTestId('photo-thumbnail'))

    await user.click(screen.getByRole('button', { name: /supprimer/i }))

    expect(screen.getByText(/et sa photo/)).toBeInTheDocument()
  })

  it('calls useDeleteNote on confirm delete', async () => {
    const user = userEvent.setup()
    render(
      <NoteDetailDialog note={baseNote} open onOpenChange={vi.fn()} />,
      { wrapper: createWrapper() },
    )

    await user.click(screen.getByRole('button', { name: /supprimer/i }))
    // Click the confirmation "Supprimer" button inside AlertDialog
    const buttons = screen.getAllByRole('button', { name: /supprimer/i })
    const confirmBtn = buttons.find((btn) => btn.closest('[role="alertdialog"]'))
    await user.click(confirmBtn!)

    expect(mockDeleteMutate).toHaveBeenCalledWith(
      { noteId: 'note-1', photoUrl: null },
      expect.any(Object),
    )
  })

  it('does not render when note is null', () => {
    const { container } = render(
      <NoteDetailDialog note={null} open onOpenChange={vi.fn()} />,
      { wrapper: createWrapper() },
    )

    expect(container.innerHTML).toBe('')
  })

  it('shows tabs with "Réponse apportée" for blocking notes', () => {
    render(
      <NoteDetailDialog note={blockingNote} open onOpenChange={vi.fn()} />,
      { wrapper: createWrapper() },
    )

    expect(screen.getByText('Note')).toBeInTheDocument()
    expect(screen.getByTestId('tab-responses')).toBeInTheDocument()
    expect(screen.getByText('Réponse apportée')).toBeInTheDocument()
  })

  it('does NOT show tabs for non-blocking notes', () => {
    render(
      <NoteDetailDialog note={baseNote} open onOpenChange={vi.fn()} />,
      { wrapper: createWrapper() },
    )

    expect(screen.queryByTestId('tab-responses')).not.toBeInTheDocument()
  })

  it('shows NoteResponsesList when Réponse apportée tab is clicked', async () => {
    const user = userEvent.setup()
    render(
      <NoteDetailDialog note={blockingNote} open onOpenChange={vi.fn()} />,
      { wrapper: createWrapper() },
    )

    await user.click(screen.getByTestId('tab-responses'))

    // NoteResponsesList renders "Aucune réponse" when empty + input
    expect(screen.getByText('Aucune réponse')).toBeInTheDocument()
    expect(screen.getByTestId('response-input')).toBeInTheDocument()
  })
})
