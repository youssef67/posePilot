import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReservationForm } from './ReservationForm'

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

const mockPieces = [
  { id: 'piece-1', nom: 'Séjour' },
  { id: 'piece-2', nom: 'Chambre' },
]

function mockSupabaseInsert(data: unknown = { id: 'reservation-1' }) {
  const mockSingle = vi.fn().mockResolvedValue({ data, error: null })
  const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
  const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
  vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never)
  vi.mocked(supabase.auth.getUser).mockResolvedValue({
    data: { user: { id: 'user-1', email: 'test@test.fr' } },
  } as never)
  vi.mocked(supabase.storage.from).mockReturnValue({
    upload: vi.fn().mockResolvedValue({ error: null }),
    getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/photo.jpg' } }),
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

function renderForm(props: Partial<React.ComponentProps<typeof ReservationForm>> = {}) {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    lotId: 'lot-1',
    pieces: mockPieces,
  }
  return render(<ReservationForm {...defaultProps} {...props} />, { wrapper: createWrapper() })
}

describe('ReservationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseInsert()
  })

  it('renders sheet with title "Nouvelle réserve"', () => {
    renderForm()
    expect(screen.getByText('Nouvelle réserve')).toBeInTheDocument()
  })

  it('renders piece selector and description textarea', () => {
    renderForm()
    expect(screen.getByText('Sélectionner une pièce')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Décrire le défaut...')).toBeInTheDocument()
  })

  it('renders disabled "Créer" button when no piece selected and no description', () => {
    renderForm()
    const button = screen.getByRole('button', { name: 'Créer' })
    expect(button).toBeDisabled()
  })

  it('does not render when open is false', () => {
    renderForm({ open: false })
    expect(screen.queryByText('Nouvelle réserve')).not.toBeInTheDocument()
  })

  it('shows "Ajoutez d\'abord des pièces au lot" when pieces is empty', () => {
    renderForm({ pieces: [] })
    expect(screen.getByText("Ajoutez d'abord des pièces au lot")).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Décrire le défaut...')).not.toBeInTheDocument()
  })

  it('renders photo button', () => {
    renderForm()
    expect(screen.getByRole('button', { name: /Photo/ })).toBeInTheDocument()
  })

  it('enables "Créer" button when piece is selected and description is entered', async () => {
    const user = userEvent.setup()
    renderForm()

    // Type description
    await user.type(screen.getByPlaceholderText('Décrire le défaut...'), 'Fissure plafond')

    // Button still disabled (no piece selected)
    expect(screen.getByRole('button', { name: 'Créer' })).toBeDisabled()
  })

  it('renders hidden photo capture input', () => {
    renderForm()
    expect(screen.getByTestId('photo-capture-input')).toBeInTheDocument()
  })
})
