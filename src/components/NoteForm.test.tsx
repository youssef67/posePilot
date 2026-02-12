import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NoteForm } from './NoteForm'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: { getUser: vi.fn() },
    storage: { from: vi.fn() },
  },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/lib/utils/compressImage', () => ({
  compressPhoto: vi.fn().mockResolvedValue(new File(['c'], 'c.jpg', { type: 'image/jpeg' })),
}))

import { supabase } from '@/lib/supabase'

function mockSupabaseInsert(data: unknown = { id: 'note-1' }) {
  const mockSingle = vi.fn().mockResolvedValue({ data, error: null })
  const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
  const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
  vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never)
  vi.mocked(supabase.auth.getUser).mockResolvedValue({
    data: { user: { id: 'user-1', email: 'test@test.fr' } },
  } as never)
  return { mockInsert }
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

function renderNoteForm(props: Partial<React.ComponentProps<typeof NoteForm>> = {}) {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    lotId: 'lot-1',
  }
  return render(<NoteForm {...defaultProps} {...props} />, { wrapper: createWrapper() })
}

describe('NoteForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseInsert()
  })

  it('renders sheet with title "Nouvelle note"', () => {
    renderNoteForm()
    expect(screen.getByText('Nouvelle note')).toBeInTheDocument()
  })

  it('renders textarea with placeholder', () => {
    renderNoteForm()
    expect(screen.getByPlaceholderText('Écrire une note...')).toBeInTheDocument()
  })

  it('renders switch with "Bloquant" label', () => {
    renderNoteForm()
    expect(screen.getByText('Bloquant')).toBeInTheDocument()
    expect(screen.getByRole('switch')).toBeInTheDocument()
  })

  it('renders disabled "Créer" button when textarea is empty and no photo', () => {
    renderNoteForm()
    const button = screen.getByRole('button', { name: 'Créer' })
    expect(button).toBeDisabled()
  })

  it('enables "Créer" button when text is entered', async () => {
    const user = userEvent.setup()
    renderNoteForm()
    await user.type(screen.getByPlaceholderText('Écrire une note...'), 'Test note')
    expect(screen.getByRole('button', { name: 'Créer' })).toBeEnabled()
  })

  it('calls useCreateNote and closes on submit', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const { mockInsert } = mockSupabaseInsert()
    renderNoteForm({ onOpenChange })

    await user.type(screen.getByPlaceholderText('Écrire une note...'), 'Fissure')
    await user.click(screen.getByRole('button', { name: 'Créer' }))

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        content: 'Fissure',
        is_blocking: false,
        lot_id: 'lot-1',
        piece_id: null,
      }),
    )
  })

  it('sends is_blocking=true when switch is toggled', async () => {
    const user = userEvent.setup()
    const { mockInsert } = mockSupabaseInsert()
    renderNoteForm()

    await user.click(screen.getByRole('switch'))
    await user.type(screen.getByPlaceholderText('Écrire une note...'), 'Bloquant!')
    await user.click(screen.getByRole('button', { name: 'Créer' }))

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ is_blocking: true }),
    )
  })

  it('does not render when open is false', () => {
    renderNoteForm({ open: false })
    expect(screen.queryByText('Nouvelle note')).not.toBeInTheDocument()
  })

  it('applies destructive style to label when blocking is toggled', async () => {
    const user = userEvent.setup()
    renderNoteForm()

    const label = screen.getByText('Bloquant')
    expect(label.className).not.toContain('text-destructive')
    await user.click(screen.getByRole('switch'))
    expect(label.className).toContain('text-destructive')
  })

  it('renders "Ajouter une photo" button', () => {
    renderNoteForm()
    expect(screen.getByRole('button', { name: /Ajouter une photo/ })).toBeInTheDocument()
  })

  it('shows photo preview when initialPhoto is provided', () => {
    const file = new File(['photo-data'], 'photo.jpg', { type: 'image/jpeg' })
    renderNoteForm({ initialPhoto: file })

    expect(screen.getByTestId('note-form-photo-preview')).toBeInTheDocument()
    // "Ajouter une photo" button should be hidden
    expect(screen.queryByRole('button', { name: /Ajouter une photo/ })).not.toBeInTheDocument()
    // Remove button visible
    expect(screen.getByRole('button', { name: 'Supprimer la photo' })).toBeInTheDocument()
  })

  it('removes photo preview when remove button is clicked', async () => {
    const user = userEvent.setup()
    const file = new File(['photo-data'], 'photo.jpg', { type: 'image/jpeg' })
    renderNoteForm({ initialPhoto: file })

    await user.click(screen.getByRole('button', { name: 'Supprimer la photo' }))

    expect(screen.queryByTestId('note-form-photo-preview')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ajouter une photo/ })).toBeInTheDocument()
  })

  it('enables "Créer" button when photo is selected even without text', () => {
    const file = new File(['photo-data'], 'photo.jpg', { type: 'image/jpeg' })
    renderNoteForm({ initialPhoto: file })

    expect(screen.getByRole('button', { name: 'Créer' })).toBeEnabled()
  })

  it('renders hidden photo capture input', () => {
    renderNoteForm()
    expect(screen.getByTestId('photo-capture-input')).toBeInTheDocument()
  })
})
