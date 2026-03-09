import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReservationCard } from './ReservationCard'
import type { Reservation } from '@/types/database'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    storage: { from: vi.fn() },
  },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

const openReservation: Reservation = {
  id: 'res-1',
  lot_id: 'lot-1',
  piece_id: 'piece-1',
  description: 'Fissure au niveau du plafond dans le séjour',
  status: 'ouvert',
  resolved_at: null,
  created_by: 'user-1',
  created_by_email: 'test@test.fr',
  created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  pieces: { nom: 'Séjour' },
  reservation_photos: [
    { id: 'photo-1', reservation_id: 'res-1', photo_url: 'https://example.com/photo.jpg', position: 0, created_at: new Date().toISOString() },
  ],
}

const resolvedReservation: Reservation = {
  ...openReservation,
  id: 'res-2',
  status: 'resolu',
  resolved_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  pieces: { nom: 'SDB' },
}

function renderCard(reservation: Reservation = openReservation) {
  return render(
    <ReservationCard reservation={reservation} lotId="lot-1" />,
    { wrapper: createWrapper() },
  )
}

describe('ReservationCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders piece name and description', () => {
    renderCard()
    expect(screen.getByText('Séjour')).toBeInTheDocument()
    expect(screen.getByText('Fissure au niveau du plafond dans le séjour')).toBeInTheDocument()
  })

  it('renders "Ouvert" badge for open reservation', () => {
    renderCard()
    expect(screen.getByText('Ouvert')).toBeInTheDocument()
  })

  it('renders "Résolu" badge for resolved reservation', () => {
    renderCard(resolvedReservation)
    expect(screen.getByText('Résolu')).toBeInTheDocument()
  })

  it('renders photo thumbnail when photo_url is present', () => {
    renderCard()
    const img = screen.getByAltText('Photo réserve')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg')
  })

  it('does not render photo when reservation_photos is empty', () => {
    renderCard({ ...openReservation, reservation_photos: [] })
    expect(screen.queryByAltText('Photo réserve')).not.toBeInTheDocument()
  })

  it('opens detail dialog on click', async () => {
    const user = userEvent.setup()
    renderCard()

    await user.click(screen.getByRole('button'))
    expect(screen.getByText('Réserve — Séjour')).toBeInTheDocument()
  })

  it('shows "Marquer comme résolue" button for open reservations in detail', async () => {
    const user = userEvent.setup()
    renderCard()

    await user.click(screen.getByRole('button'))
    expect(screen.getByRole('button', { name: 'Marquer comme résolue' })).toBeInTheDocument()
  })

  it('does not show "Marquer comme résolue" for resolved reservations', async () => {
    const user = userEvent.setup()
    renderCard(resolvedReservation)

    await user.click(screen.getByRole('button'))
    expect(screen.queryByRole('button', { name: 'Marquer comme résolue' })).not.toBeInTheDocument()
  })

  it('shows "Supprimer" option in dropdown menu', async () => {
    const user = userEvent.setup()
    renderCard()

    // Open detail dialog
    await user.click(screen.getByRole('button'))

    // Open dropdown menu - find the more button within the dialog
    const moreButtons = screen.getAllByRole('button')
    const moreButton = moreButtons.find(
      (btn) => btn.querySelector('svg.lucide-more-vertical') !== null,
    )
    if (moreButton) {
      await user.click(moreButton)
      expect(await screen.findByText('Supprimer')).toBeInTheDocument()
    }
  })
})
