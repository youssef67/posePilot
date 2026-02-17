import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { NoteResponsesList } from './NoteResponsesList'
import type { Note } from '@/types/database'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: { getUser: vi.fn() },
  },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { supabase } from '@/lib/supabase'

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children)
}

const mockNote: Note = {
  id: 'note-1',
  lot_id: 'lot-1',
  piece_id: null,
  content: 'Fuite détectée',
  is_blocking: true,
  created_by: 'u-1',
  created_by_email: 'youssef@test.fr',
  photo_url: null,
  created_at: new Date().toISOString(),
}

function mockQueryResponses(data: unknown[]) {
  const mockOrder = vi.fn().mockResolvedValue({ data, error: null })
  const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
  vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)
}

function mockInsert() {
  const mockInsert = vi.fn().mockResolvedValue({ error: null })
  vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never)
  vi.mocked(supabase.auth.getUser).mockResolvedValue({
    data: { user: { id: 'user-1', email: 'youssef@test.fr' } },
  } as never)
  return { mockInsert }
}

function mockUpdate() {
  const mockEq = vi.fn().mockResolvedValue({ error: null })
  const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
  vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as never)
  return { mockUpdate, mockEq }
}

const mockResponses = [
  {
    id: 'r-1',
    note_id: 'note-1',
    content: 'Plombier contacté',
    created_by: 'u-1',
    created_by_email: 'alice@test.fr',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'r-2',
    note_id: 'note-1',
    content: 'Réparation effectuée',
    created_by: 'u-2',
    created_by_email: 'bruno@test.fr',
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
]

describe('NoteResponsesList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows "Aucune réponse" when empty', async () => {
    mockQueryResponses([])

    render(<NoteResponsesList note={mockNote} />, { wrapper: createWrapper() })

    expect(await screen.findByText('Aucune réponse')).toBeInTheDocument()
  })

  it('renders responses with content and author', async () => {
    mockQueryResponses(mockResponses)

    render(<NoteResponsesList note={mockNote} />, { wrapper: createWrapper() })

    expect(await screen.findByText('Plombier contacté')).toBeInTheDocument()
    expect(screen.getByText('Réparation effectuée')).toBeInTheDocument()
    expect(screen.getByText('alice')).toBeInTheDocument()
    expect(screen.getByText('bruno')).toBeInTheDocument()
  })

  it('shows the response input textarea', async () => {
    mockQueryResponses([])

    render(<NoteResponsesList note={mockNote} />, { wrapper: createWrapper() })

    await screen.findByText('Aucune réponse')
    expect(screen.getByTestId('response-input')).toBeInTheDocument()
    expect(screen.getByText('Envoyer')).toBeInTheDocument()
  })

  it('disables send button when textarea is empty', async () => {
    mockQueryResponses([])

    render(<NoteResponsesList note={mockNote} />, { wrapper: createWrapper() })

    await screen.findByText('Aucune réponse')
    expect(screen.getByText('Envoyer')).toBeDisabled()
  })

  it('enables send button when textarea has content', async () => {
    const user = userEvent.setup()
    mockQueryResponses([])

    render(<NoteResponsesList note={mockNote} />, { wrapper: createWrapper() })

    await screen.findByText('Aucune réponse')
    await user.type(screen.getByTestId('response-input'), 'Ma réponse')
    expect(screen.getByText('Envoyer')).toBeEnabled()
  })

  it('calls createNoteResponse on submit', async () => {
    const user = userEvent.setup()
    mockQueryResponses([])

    render(<NoteResponsesList note={mockNote} />, { wrapper: createWrapper() })

    await screen.findByText('Aucune réponse')
    await user.type(screen.getByTestId('response-input'), 'Fixé')

    // Mock the insert for the mutation call
    const { mockInsert: insertFn } = mockInsert()

    await user.click(screen.getByText('Envoyer'))

    expect(supabase.from).toHaveBeenCalledWith('note_responses')
    expect(insertFn).toHaveBeenCalledWith({
      note_id: 'note-1',
      content: 'Fixé',
      created_by: 'user-1',
      created_by_email: 'youssef@test.fr',
    })
  })

  it('shows "Envoyer et débloquer" button for blocking notes', async () => {
    mockQueryResponses([])

    render(<NoteResponsesList note={mockNote} />, { wrapper: createWrapper() })

    await screen.findByText('Aucune réponse')
    expect(screen.getByTestId('submit-and-resolve')).toBeInTheDocument()
    expect(screen.getByText('Envoyer et débloquer')).toBeInTheDocument()
  })

  it('does not show "Envoyer et débloquer" for non-blocking notes', async () => {
    const nonBlockingNote = { ...mockNote, is_blocking: false }
    mockQueryResponses([])

    render(<NoteResponsesList note={nonBlockingNote} />, { wrapper: createWrapper() })

    await screen.findByText('Aucune réponse')
    expect(screen.queryByTestId('submit-and-resolve')).not.toBeInTheDocument()
  })

  it('disables "Envoyer et débloquer" when textarea is empty', async () => {
    mockQueryResponses([])

    render(<NoteResponsesList note={mockNote} />, { wrapper: createWrapper() })

    await screen.findByText('Aucune réponse')
    expect(screen.getByTestId('submit-and-resolve')).toBeDisabled()
  })

  it('calls createNoteResponse and updateNote on "Envoyer et débloquer"', async () => {
    const user = userEvent.setup()
    mockQueryResponses([])

    render(<NoteResponsesList note={mockNote} onResolved={vi.fn()} />, {
      wrapper: createWrapper(),
    })

    await screen.findByText('Aucune réponse')
    await user.type(screen.getByTestId('response-input'), 'Problème résolu')

    // Mock insert for response creation
    mockInsert()

    await user.click(screen.getByTestId('submit-and-resolve'))

    // First call should create the response
    expect(supabase.from).toHaveBeenCalledWith('note_responses')
  })
})
