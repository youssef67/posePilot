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
  fournisseur: null as string | null,
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

  // Fournisseur display tests
  it('displays fournisseur when non-null', () => {
    render(
      <DeliveryCard
        livraison={{ ...baseLivraison, fournisseur: 'Leroy Merlin' }}
        chantierId="ch1"
        onMarquerPrevu={vi.fn()}
        onConfirmerLivraison={vi.fn()}
      />,
      { wrapper: createWrapper() },
    )
    expect(screen.getByText('Leroy Merlin')).toBeInTheDocument()
  })

  it('does not display fournisseur when null', () => {
    render(
      <DeliveryCard
        livraison={baseLivraison}
        chantierId="ch1"
        onMarquerPrevu={vi.fn()}
        onConfirmerLivraison={vi.fn()}
      />,
      { wrapper: createWrapper() },
    )
    expect(screen.queryByText('Leroy Merlin')).not.toBeInTheDocument()
  })

  // DropdownMenu tests
  it('shows DropdownMenu when onEdit provided and status is not livre', () => {
    render(
      <DeliveryCard
        livraison={baseLivraison}
        chantierId="ch1"
        onMarquerPrevu={vi.fn()}
        onConfirmerLivraison={vi.fn()}
        onEdit={vi.fn()}
      />,
      { wrapper: createWrapper() },
    )
    expect(screen.getByLabelText('Actions livraison')).toBeInTheDocument()
  })

  it('does not show DropdownMenu when status is livre', () => {
    render(
      <DeliveryCard
        livraison={{ ...baseLivraison, status: 'livre', date_prevue: '2026-02-12' }}
        chantierId="ch1"
        onMarquerPrevu={vi.fn()}
        onConfirmerLivraison={vi.fn()}
        onEdit={vi.fn()}
      />,
      { wrapper: createWrapper() },
    )
    expect(screen.queryByLabelText('Actions livraison')).not.toBeInTheDocument()
  })

  it('calls onEdit with livraison when "Modifier" is clicked', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    render(
      <DeliveryCard
        livraison={baseLivraison}
        chantierId="ch1"
        onMarquerPrevu={vi.fn()}
        onConfirmerLivraison={vi.fn()}
        onEdit={onEdit}
      />,
      { wrapper: createWrapper() },
    )
    await user.click(screen.getByLabelText('Actions livraison'))
    await user.click(screen.getByText('Modifier'))
    expect(onEdit).toHaveBeenCalledWith(baseLivraison)
  })

  // Linked besoins indicator + accordion
  const mockLinkedBesoins = [
    { id: 'b1', chantier_id: 'ch1', description: 'Colle faience', livraison_id: 'liv1', created_at: '2026-02-10T10:00:00Z', created_by: 'user-1' },
    { id: 'b2', chantier_id: 'ch1', description: 'Joint gris 5kg', livraison_id: 'liv1', created_at: '2026-02-10T11:00:00Z', created_by: 'user-1' },
    { id: 'b3', chantier_id: 'ch1', description: 'Carrelage 60x60', livraison_id: 'liv1', created_at: '2026-02-10T12:00:00Z', created_by: 'user-1' },
  ]

  it('shows "N besoins" indicator when linkedBesoins is non-empty', () => {
    render(
      <DeliveryCard
        livraison={baseLivraison}
        chantierId="ch1"
        onMarquerPrevu={vi.fn()}
        onConfirmerLivraison={vi.fn()}
        linkedBesoins={mockLinkedBesoins}
      />,
      { wrapper: createWrapper() },
    )
    expect(screen.getByText('3 besoins')).toBeInTheDocument()
  })

  it('does not show besoins indicator when linkedBesoins is empty', () => {
    render(
      <DeliveryCard
        livraison={baseLivraison}
        chantierId="ch1"
        onMarquerPrevu={vi.fn()}
        onConfirmerLivraison={vi.fn()}
        linkedBesoins={[]}
      />,
      { wrapper: createWrapper() },
    )
    expect(screen.queryByText(/besoin/)).not.toBeInTheDocument()
  })

  it('does not show besoins indicator when linkedBesoins is undefined', () => {
    render(
      <DeliveryCard
        livraison={baseLivraison}
        chantierId="ch1"
        onMarquerPrevu={vi.fn()}
        onConfirmerLivraison={vi.fn()}
      />,
      { wrapper: createWrapper() },
    )
    expect(screen.queryByText(/besoin/)).not.toBeInTheDocument()
  })

  it('expands accordion on click showing besoin descriptions and author', async () => {
    const user = userEvent.setup()
    render(
      <DeliveryCard
        livraison={baseLivraison}
        chantierId="ch1"
        onMarquerPrevu={vi.fn()}
        onConfirmerLivraison={vi.fn()}
        linkedBesoins={mockLinkedBesoins}
      />,
      { wrapper: createWrapper() },
    )
    // Accordion collapsed initially
    expect(screen.queryByText('Colle faience')).not.toBeInTheDocument()

    // Click to expand
    await user.click(screen.getByText('3 besoins'))

    // Now besoin descriptions visible
    expect(screen.getByText('Colle faience')).toBeInTheDocument()
    expect(screen.getByText('Joint gris 5kg')).toBeInTheDocument()
    expect(screen.getByText('Carrelage 60x60')).toBeInTheDocument()
    // Author initial shown (Y for youssef@test.com since created_by matches user-1)
    const details = screen.getAllByText(/Y · il y a 2h/)
    expect(details.length).toBeGreaterThanOrEqual(3)
  })

  // Delete tests (Story 6.9)
  it('shows "Supprimer" in DropdownMenu when onDelete provided and status is not livre', async () => {
    const user = userEvent.setup()
    render(
      <DeliveryCard
        livraison={baseLivraison}
        chantierId="ch1"
        onMarquerPrevu={vi.fn()}
        onConfirmerLivraison={vi.fn()}
        onDelete={vi.fn()}
      />,
      { wrapper: createWrapper() },
    )
    await user.click(screen.getByLabelText('Actions livraison'))
    expect(screen.getByText('Supprimer')).toBeInTheDocument()
  })

  it('does not show "Supprimer" when status is livre', () => {
    render(
      <DeliveryCard
        livraison={{ ...baseLivraison, status: 'livre', date_prevue: '2026-02-12' }}
        chantierId="ch1"
        onMarquerPrevu={vi.fn()}
        onConfirmerLivraison={vi.fn()}
        onDelete={vi.fn()}
      />,
      { wrapper: createWrapper() },
    )
    expect(screen.queryByLabelText('Actions livraison')).not.toBeInTheDocument()
  })

  it('calls onDelete with livraison and linkedBesoins when "Supprimer" clicked', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(
      <DeliveryCard
        livraison={baseLivraison}
        chantierId="ch1"
        onMarquerPrevu={vi.fn()}
        onConfirmerLivraison={vi.fn()}
        onDelete={onDelete}
        linkedBesoins={mockLinkedBesoins}
      />,
      { wrapper: createWrapper() },
    )
    await user.click(screen.getByLabelText('Actions livraison'))
    await user.click(screen.getByText('Supprimer'))
    expect(onDelete).toHaveBeenCalledWith(baseLivraison, mockLinkedBesoins)
  })

  it('shows separator when both onEdit and onDelete are provided', async () => {
    const user = userEvent.setup()
    render(
      <DeliveryCard
        livraison={baseLivraison}
        chantierId="ch1"
        onMarquerPrevu={vi.fn()}
        onConfirmerLivraison={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
      { wrapper: createWrapper() },
    )
    await user.click(screen.getByLabelText('Actions livraison'))
    expect(screen.getByText('Modifier')).toBeInTheDocument()
    expect(screen.getByText('Supprimer')).toBeInTheDocument()
    // DropdownMenuSeparator renders in a portal — query from document
    expect(screen.getByRole('separator')).toBeInTheDocument()
  })

  it('shows singular "1 besoin" when only one linked besoin', () => {
    render(
      <DeliveryCard
        livraison={baseLivraison}
        chantierId="ch1"
        onMarquerPrevu={vi.fn()}
        onConfirmerLivraison={vi.fn()}
        linkedBesoins={[mockLinkedBesoins[0]]}
      />,
      { wrapper: createWrapper() },
    )
    expect(screen.getByText('1 besoin')).toBeInTheDocument()
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
