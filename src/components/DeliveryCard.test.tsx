import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { DeliveryCard, DeliveryCardSkeleton } from './DeliveryCard'

vi.mock('@/lib/auth', () => ({
  useAuth: () => ({ user: { id: 'user-1', email: 'youssef@test.com' } }),
}))

vi.mock('@/lib/utils/formatRelativeTime', () => ({
  formatRelativeTime: () => 'il y a 2h',
}))

vi.mock('@/lib/mutations/useUploadLivraisonDocument', () => ({
  useUploadLivraisonDocument: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useReplaceLivraisonDocument', () => ({
  useReplaceLivraisonDocument: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/utils/documentStorage', () => ({
  getDocumentSignedUrl: vi.fn(),
  downloadDocument: vi.fn(),
}))
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children)
}

const baseLivraison = {
  id: 'liv1',
  chantier_id: 'ch1',
  description: 'Colle pour faïence 20kg',
  status: 'commande' as const,
  date_prevue: null,
  bc_file_url: null,
  bc_file_name: null,
  bl_file_url: null,
  bl_file_name: null,
  created_at: '2026-02-10T10:00:00Z',
  created_by: 'user-1',
}

describe('DeliveryCard', () => {
  it('renders description', () => {
    render(
      <DeliveryCard
        livraison={baseLivraison}
        chantierId="ch1"
        onMarquerPrevu={vi.fn()}
        onConfirmerLivraison={vi.fn()}
      />,
      { wrapper: createWrapper() },
    )
    expect(screen.getByText('Colle pour faïence 20kg')).toBeInTheDocument()
  })

  it('renders status label "Commandé" for commande', () => {
    render(
      <DeliveryCard
        livraison={baseLivraison}
        chantierId="ch1"
        onMarquerPrevu={vi.fn()}
        onConfirmerLivraison={vi.fn()}
      />,
      { wrapper: createWrapper() },
    )
    expect(screen.getByText('Commandé')).toBeInTheDocument()
  })

  it('renders status bar with orange color for commande', () => {
    const { container } = render(
      <DeliveryCard
        livraison={baseLivraison}
        chantierId="ch1"
        onMarquerPrevu={vi.fn()}
        onConfirmerLivraison={vi.fn()}
      />,
      { wrapper: createWrapper() },
    )
    const bar = container.querySelector('[data-testid="status-bar"]')
    expect(bar).toHaveStyle({ backgroundColor: '#F59E0B' })
  })

  it('renders "Marquer prévu" button for commande status', () => {
    render(
      <DeliveryCard
        livraison={baseLivraison}
        chantierId="ch1"
        onMarquerPrevu={vi.fn()}
        onConfirmerLivraison={vi.fn()}
      />,
      { wrapper: createWrapper() },
    )
    expect(screen.getByRole('button', { name: 'Marquer prévu' })).toBeInTheDocument()
  })

  it('calls onMarquerPrevu when "Marquer prévu" is clicked', async () => {
    const user = userEvent.setup()
    const onMarquerPrevu = vi.fn()
    render(
      <DeliveryCard
        livraison={baseLivraison}
        chantierId="ch1"
        onMarquerPrevu={onMarquerPrevu}
        onConfirmerLivraison={vi.fn()}
      />,
      { wrapper: createWrapper() },
    )
    await user.click(screen.getByRole('button', { name: 'Marquer prévu' }))
    expect(onMarquerPrevu).toHaveBeenCalledWith('liv1')
  })

  it('renders "Confirmer livraison" button for prevu status', () => {
    render(
      <DeliveryCard
        livraison={{ ...baseLivraison, status: 'prevu', date_prevue: '2026-02-15' }}
        chantierId="ch1"
        onMarquerPrevu={vi.fn()}
        onConfirmerLivraison={vi.fn()}
      />,
      { wrapper: createWrapper() },
    )
    expect(screen.getByRole('button', { name: 'Confirmer livraison' })).toBeInTheDocument()
  })

  it('calls onConfirmerLivraison when "Confirmer livraison" is clicked', async () => {
    const user = userEvent.setup()
    const onConfirmer = vi.fn()
    render(
      <DeliveryCard
        livraison={{ ...baseLivraison, status: 'prevu', date_prevue: '2026-02-15' }}
        chantierId="ch1"
        onMarquerPrevu={vi.fn()}
        onConfirmerLivraison={onConfirmer}
      />,
      { wrapper: createWrapper() },
    )
    await user.click(screen.getByRole('button', { name: 'Confirmer livraison' }))
    expect(onConfirmer).toHaveBeenCalledWith('liv1')
  })

  it('renders status label "Prévu" with blue bar for prevu', () => {
    const { container } = render(
      <DeliveryCard
        livraison={{ ...baseLivraison, status: 'prevu', date_prevue: '2026-02-15' }}
        chantierId="ch1"
        onMarquerPrevu={vi.fn()}
        onConfirmerLivraison={vi.fn()}
      />,
      { wrapper: createWrapper() },
    )
    expect(screen.getByText('Prévu')).toBeInTheDocument()
    const bar = container.querySelector('[data-testid="status-bar"]')
    expect(bar).toHaveStyle({ backgroundColor: '#3B82F6' })
  })

  it('renders status bar with green color for livre', () => {
    const { container } = render(
      <DeliveryCard
        livraison={{ ...baseLivraison, status: 'livre', date_prevue: '2026-02-12' }}
        chantierId="ch1"
        onMarquerPrevu={vi.fn()}
        onConfirmerLivraison={vi.fn()}
      />,
      { wrapper: createWrapper() },
    )
    const bar = container.querySelector('[data-testid="status-bar"]')
    expect(bar).toHaveStyle({ backgroundColor: '#10B981' })
  })

  it('renders date_prevue when provided', () => {
    render(
      <DeliveryCard
        livraison={{ ...baseLivraison, status: 'prevu', date_prevue: '2026-02-15' }}
        chantierId="ch1"
        onMarquerPrevu={vi.fn()}
        onConfirmerLivraison={vi.fn()}
      />,
      { wrapper: createWrapper() },
    )
    expect(screen.getByText(/15 fév/)).toBeInTheDocument()
  })

  it('does not render date when date_prevue is null', () => {
    render(
      <DeliveryCard
        livraison={baseLivraison}
        chantierId="ch1"
        onMarquerPrevu={vi.fn()}
        onConfirmerLivraison={vi.fn()}
      />,
      { wrapper: createWrapper() },
    )
    expect(screen.queryByText(/fév/)).not.toBeInTheDocument()
  })

  it('renders author initial and relative time', () => {
    render(
      <DeliveryCard
        livraison={baseLivraison}
        chantierId="ch1"
        onMarquerPrevu={vi.fn()}
        onConfirmerLivraison={vi.fn()}
      />,
      { wrapper: createWrapper() },
    )
    expect(screen.getByText(/Y · il y a 2h/)).toBeInTheDocument()
  })

  // chantierNom prop
  it('renders chantierNom when provided', () => {
    render(
      <DeliveryCard
        livraison={baseLivraison}
        chantierId="ch1"
        onMarquerPrevu={vi.fn()}
        onConfirmerLivraison={vi.fn()}
        chantierNom="Résidence Les Oliviers"
      />,
      { wrapper: createWrapper() },
    )
    expect(screen.getByText('Résidence Les Oliviers')).toBeInTheDocument()
  })

  it('does not render chantierNom when not provided', () => {
    render(
      <DeliveryCard
        livraison={baseLivraison}
        chantierId="ch1"
        onMarquerPrevu={vi.fn()}
        onConfirmerLivraison={vi.fn()}
      />,
      { wrapper: createWrapper() },
    )
    expect(screen.queryByText('Résidence Les Oliviers')).not.toBeInTheDocument()
  })

  // highlighted prop
  it('renders "Cette semaine" badge when highlighted is true', () => {
    render(
      <DeliveryCard
        livraison={{ ...baseLivraison, status: 'prevu', date_prevue: '2026-02-15' }}
        chantierId="ch1"
        onMarquerPrevu={vi.fn()}
        onConfirmerLivraison={vi.fn()}
        highlighted
      />,
      { wrapper: createWrapper() },
    )
    expect(screen.getByText('Cette semaine')).toBeInTheDocument()
  })

  it('does not render "Cette semaine" badge when highlighted is false', () => {
    render(
      <DeliveryCard
        livraison={{ ...baseLivraison, status: 'prevu', date_prevue: '2026-02-15' }}
        chantierId="ch1"
        onMarquerPrevu={vi.fn()}
        onConfirmerLivraison={vi.fn()}
      />,
      { wrapper: createWrapper() },
    )
    expect(screen.queryByText('Cette semaine')).not.toBeInTheDocument()
  })

  // Document indicator badges
  it('shows BC ✓ badge when bc_file_url is present', () => {
    render(
      <DeliveryCard
        livraison={{ ...baseLivraison, bc_file_url: 'path/to/bc.pdf', bc_file_name: 'bc.pdf' }}
        chantierId="ch1"
        onMarquerPrevu={vi.fn()}
        onConfirmerLivraison={vi.fn()}
      />,
      { wrapper: createWrapper() },
    )
    expect(screen.getByText('BC ✓')).toBeInTheDocument()
  })

  it('shows BL ✓ badge when bl_file_url is present', () => {
    render(
      <DeliveryCard
        livraison={{ ...baseLivraison, status: 'livre', bl_file_url: 'path/to/bl.jpg', bl_file_name: 'bl.jpg' }}
        chantierId="ch1"
        onMarquerPrevu={vi.fn()}
        onConfirmerLivraison={vi.fn()}
      />,
      { wrapper: createWrapper() },
    )
    expect(screen.getByText('BL ✓')).toBeInTheDocument()
  })

  it('does not show BC ✓ or BL ✓ badges when no documents attached', () => {
    render(
      <DeliveryCard
        livraison={baseLivraison}
        chantierId="ch1"
        onMarquerPrevu={vi.fn()}
        onConfirmerLivraison={vi.fn()}
      />,
      { wrapper: createWrapper() },
    )
    expect(screen.queryByText('BC ✓')).not.toBeInTheDocument()
    expect(screen.queryByText('BL ✓')).not.toBeInTheDocument()
  })

  // Document slots
  it('always shows BC document slot', () => {
    render(
      <DeliveryCard
        livraison={baseLivraison}
        chantierId="ch1"
        onMarquerPrevu={vi.fn()}
        onConfirmerLivraison={vi.fn()}
      />,
      { wrapper: createWrapper() },
    )
    expect(screen.getByText('Bon de commande')).toBeInTheDocument()
  })

  it('does not show BL slot for commande status', () => {
    render(
      <DeliveryCard
        livraison={baseLivraison}
        chantierId="ch1"
        onMarquerPrevu={vi.fn()}
        onConfirmerLivraison={vi.fn()}
      />,
      { wrapper: createWrapper() },
    )
    expect(screen.queryByText('Bon de livraison')).not.toBeInTheDocument()
  })

  it('does not show BL slot for prevu status', () => {
    render(
      <DeliveryCard
        livraison={{ ...baseLivraison, status: 'prevu', date_prevue: '2026-02-15' }}
        chantierId="ch1"
        onMarquerPrevu={vi.fn()}
        onConfirmerLivraison={vi.fn()}
      />,
      { wrapper: createWrapper() },
    )
    expect(screen.queryByText('Bon de livraison')).not.toBeInTheDocument()
  })

  it('shows BL slot for livre status', () => {
    render(
      <DeliveryCard
        livraison={{ ...baseLivraison, status: 'livre', date_prevue: '2026-02-12' }}
        chantierId="ch1"
        onMarquerPrevu={vi.fn()}
        onConfirmerLivraison={vi.fn()}
      />,
      { wrapper: createWrapper() },
    )
    expect(screen.getByText('Bon de livraison')).toBeInTheDocument()
  })
})

describe('DeliveryCardSkeleton', () => {
  it('renders with animate-pulse', () => {
    const { container } = render(<DeliveryCardSkeleton />)
    expect(container.firstElementChild?.className).toContain('animate-pulse')
  })

  it('has aria-hidden="true"', () => {
    const { container } = render(<DeliveryCardSkeleton />)
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('renders grey status bar placeholder', () => {
    const { container } = render(<DeliveryCardSkeleton />)
    const bar = container.querySelector('[data-testid="status-bar"]')
    expect(bar).toBeInTheDocument()
  })
})
