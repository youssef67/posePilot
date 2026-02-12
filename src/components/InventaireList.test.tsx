import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InventaireList } from './InventaireList'
import type { InventaireWithLocation } from '@/lib/queries/useInventaire'

const mockItems: InventaireWithLocation[] = [
  {
    id: 'inv1',
    chantier_id: 'ch1',
    plot_id: 'p1',
    etage_id: 'e1',
    designation: 'Colle faïence 20kg',
    quantite: 12,
    created_at: '2026-02-10T10:00:00Z',
    created_by: 'user-1',
    plots: { nom: 'Plot A' },
    etages: { nom: 'RDC' },
  },
  {
    id: 'inv2',
    chantier_id: 'ch1',
    plot_id: 'p1',
    etage_id: 'e2',
    designation: 'Colle faïence 20kg',
    quantite: 8,
    created_at: '2026-02-10T11:00:00Z',
    created_by: 'user-1',
    plots: { nom: 'Plot A' },
    etages: { nom: 'É1' },
  },
  {
    id: 'inv3',
    chantier_id: 'ch1',
    plot_id: 'p2',
    etage_id: 'e3',
    designation: 'Croisillons 2mm',
    quantite: 5,
    created_at: '2026-02-10T12:00:00Z',
    created_by: 'user-1',
    plots: { nom: 'Plot B' },
    etages: { nom: 'RDC' },
  },
]

const defaultProps = {
  items: mockItems,
  isLoading: false,
  onOpenSheet: vi.fn(),
  onIncrement: vi.fn(),
  onDecrement: vi.fn(),
  onDelete: vi.fn(),
}

describe('InventaireList', () => {
  it('renders loading skeleton', () => {
    render(<InventaireList {...defaultProps} items={undefined} isLoading={true} />)

    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBe(3)
  })

  it('renders empty state with CTA', () => {
    render(<InventaireList {...defaultProps} items={[]} isLoading={false} />)

    expect(screen.getByText('Aucun matériel enregistré')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ajouter du matériel' })).toBeInTheDocument()
  })

  it('calls onOpenSheet when CTA is clicked in empty state', async () => {
    const onOpenSheet = vi.fn()
    render(<InventaireList {...defaultProps} items={[]} onOpenSheet={onOpenSheet} />)

    await userEvent.click(screen.getByRole('button', { name: 'Ajouter du matériel' }))
    expect(onOpenSheet).toHaveBeenCalledTimes(1)
  })

  it('renders items in list mode (non-aggregated)', () => {
    render(<InventaireList {...defaultProps} />)

    expect(screen.getAllByText('Colle faïence 20kg')).toHaveLength(2)
    expect(screen.getByText('Croisillons 2mm')).toBeInTheDocument()
    expect(screen.getByText('Plot A — RDC')).toBeInTheDocument()
    expect(screen.getByText('Plot A — É1')).toBeInTheDocument()
    expect(screen.getByText('Plot B — RDC')).toBeInTheDocument()
  })

  it('renders aggregated groups with totals', () => {
    render(<InventaireList {...defaultProps} aggregated={true} />)

    expect(screen.getByText('Total: 20')).toBeInTheDocument()
    expect(screen.getByText('Total: 5')).toBeInTheDocument()
    // Location details visible
    expect(screen.getByText(/Plot A — RDC : 12/)).toBeInTheDocument()
    expect(screen.getByText(/Plot A — É1 : 8/)).toBeInTheDocument()
    expect(screen.getByText(/Plot B — RDC : 5/)).toBeInTheDocument()
  })

  it('calls onIncrement when + is clicked', async () => {
    const onIncrement = vi.fn()
    render(<InventaireList {...defaultProps} onIncrement={onIncrement} />)

    const incrementButtons = screen.getAllByRole('button', { name: /Augmenter/ })
    await userEvent.click(incrementButtons[0])
    expect(onIncrement).toHaveBeenCalledWith(mockItems[0])
  })

  it('calls onDecrement when - is clicked and quantity > 1', async () => {
    const onDecrement = vi.fn()
    render(<InventaireList {...defaultProps} onDecrement={onDecrement} />)

    const decrementButtons = screen.getAllByRole('button', { name: /Diminuer/ })
    await userEvent.click(decrementButtons[0]) // inv1 has quantite=12
    expect(onDecrement).toHaveBeenCalledWith(mockItems[0])
  })

  it('shows confirmation dialog when - is clicked at quantity = 1', async () => {
    const itemWithOne: InventaireWithLocation[] = [
      { ...mockItems[0], quantite: 1 },
    ]
    render(<InventaireList {...defaultProps} items={itemWithOne} />)

    const decrementBtn = screen.getByRole('button', { name: /Diminuer/ })
    await userEvent.click(decrementBtn)

    expect(screen.getByText('Supprimer ce matériel ?')).toBeInTheDocument()
  })

  it('calls onDelete when confirmation dialog is confirmed', async () => {
    const onDelete = vi.fn()
    const itemWithOne: InventaireWithLocation[] = [
      { ...mockItems[0], quantite: 1 },
    ]
    render(<InventaireList {...defaultProps} items={itemWithOne} onDelete={onDelete} />)

    await userEvent.click(screen.getByRole('button', { name: /Diminuer/ }))

    const dialog = screen.getByRole('alertdialog')
    const confirmBtn = within(dialog).getByRole('button', { name: 'Supprimer' })
    await userEvent.click(confirmBtn)

    expect(onDelete).toHaveBeenCalledWith(itemWithOne[0])
  })

  it('displays +/- buttons in aggregated mode on individual items', async () => {
    const onIncrement = vi.fn()
    render(<InventaireList {...defaultProps} aggregated={true} onIncrement={onIncrement} />)

    const incrementButtons = screen.getAllByRole('button', { name: /Augmenter/ })
    // 3 individual items = 3 increment buttons
    expect(incrementButtons).toHaveLength(3)
    await userEvent.click(incrementButtons[0])
    expect(onIncrement).toHaveBeenCalled()
  })
})
