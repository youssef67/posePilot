import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TransferSheet } from './TransferSheet'
import type { InventaireWithLocation } from '@/lib/queries/useInventaire'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    }),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}))

const mockItem: InventaireWithLocation = {
  id: 'inv1',
  chantier_id: 'ch1',
  plot_id: null,
  etage_id: null,
  lot_id: null,
  designation: 'Colle faïence 20kg',
  quantite: 10,
  source: null,
  created_at: '2026-02-10T10:00:00Z',
  created_by: 'user-1',
  plots: null,
  etages: null,
  lots: null,
}

function renderSheet(props: Partial<React.ComponentProps<typeof TransferSheet>> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <TransferSheet
        open={true}
        onOpenChange={vi.fn()}
        item={mockItem}
        direction="to-general"
        chantierId="ch1"
        {...props}
      />
    </QueryClientProvider>,
  )
}

describe('TransferSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders title for to-general direction', () => {
    renderSheet({ direction: 'to-general' })
    expect(screen.getByText('Retourner au stockage général')).toBeInTheDocument()
  })

  it('renders title for to-etage direction', () => {
    renderSheet({ direction: 'to-etage' })
    expect(screen.getByText('Transférer vers un étage')).toBeInTheDocument()
  })

  it('shows item designation and stock in description', () => {
    renderSheet()
    expect(screen.getByText('Colle faïence 20kg (10 en stock)')).toBeInTheDocument()
  })

  it('shows quantity input defaulting to 1', () => {
    renderSheet()
    expect(screen.getByLabelText('Quantité')).toHaveValue('1')
  })

  it('shows "Tout" button that sets max quantity', async () => {
    const user = userEvent.setup()
    renderSheet()

    await user.click(screen.getByRole('button', { name: 'Tout' }))
    expect(screen.getByLabelText('Quantité')).toHaveValue('10')
  })

  it('shows error when quantity exceeds stock', async () => {
    const user = userEvent.setup()
    renderSheet()

    const input = screen.getByLabelText('Quantité')
    await user.clear(input)
    await user.type(input, '15')

    expect(screen.getByText('Maximum 10 disponibles')).toBeInTheDocument()
  })

  it('shows error when quantity is 0', async () => {
    const user = userEvent.setup()
    renderSheet()

    const input = screen.getByLabelText('Quantité')
    await user.clear(input)
    await user.type(input, '0')

    expect(screen.getByText('La quantité doit être supérieure à 0')).toBeInTheDocument()
  })

  it('disables submit button when quantity is invalid', async () => {
    const user = userEvent.setup()
    renderSheet()

    const input = screen.getByLabelText('Quantité')
    await user.clear(input)
    await user.type(input, '0')

    expect(screen.getByRole('button', { name: /Retourner/ })).toBeDisabled()
  })

  it('enables submit button with valid quantity for to-general', () => {
    renderSheet({ direction: 'to-general' })
    expect(screen.getByRole('button', { name: /Retourner 1 unité/ })).toBeEnabled()
  })

  it('shows plot and étage selectors for to-etage direction', () => {
    renderSheet({ direction: 'to-etage' })
    expect(screen.getByLabelText('Sélectionner un plot')).toBeInTheDocument()
    expect(screen.getByLabelText('Sélectionner un étage')).toBeInTheDocument()
  })

  it('hides plot/étage selectors for to-general direction', () => {
    renderSheet({ direction: 'to-general' })
    expect(screen.queryByLabelText('Sélectionner un plot')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Sélectionner un étage')).not.toBeInTheDocument()
  })

  it('returns null when item is null', () => {
    const { container } = renderSheet({ item: null })
    expect(container.innerHTML).toBe('')
  })

  describe('direction to-lot', () => {
    const toLotProps = {
      direction: 'to-lot' as const,
      plotId: 'p1',
      etageId: 'e1',
      etageName: 'RDC',
      item: { ...mockItem, plot_id: 'p1', etage_id: 'e1', plots: { nom: 'Plot A' }, etages: { nom: 'RDC' } },
    }

    it('renders title "Transférer vers un lot"', () => {
      renderSheet(toLotProps)
      expect(screen.getByText('Transférer vers un lot')).toBeInTheDocument()
    })

    it('shows étage name in description', () => {
      renderSheet(toLotProps)
      expect(screen.getByText('Colle faïence 20kg (10 en stock sur RDC)')).toBeInTheDocument()
    })

    it('shows lot selector', () => {
      renderSheet(toLotProps)
      expect(screen.getByLabelText('Sélectionner un lot')).toBeInTheDocument()
    })

    it('hides plot/étage selectors', () => {
      renderSheet(toLotProps)
      expect(screen.queryByLabelText('Sélectionner un plot')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Sélectionner un étage')).not.toBeInTheDocument()
    })

    it('disables submit when no lot is selected', () => {
      renderSheet(toLotProps)
      expect(screen.getByRole('button', { name: /Transférer 1 unité$/ })).toBeDisabled()
    })
  })
})
