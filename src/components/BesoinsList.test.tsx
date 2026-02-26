import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BesoinsList } from './BesoinsList'
import type { Besoin } from '@/types/database'

vi.mock('@/lib/auth', () => ({
  useAuth: () => ({ user: { id: 'user-1', email: 'test@test.com' } }),
}))

vi.mock('@/lib/utils/formatRelativeTime', () => ({
  formatRelativeTime: () => 'il y a 2h',
}))

const mockBesoins: Besoin[] = [
  {
    id: 'b1',
    chantier_id: 'ch1',
    description: 'Colle pour faïence 20kg',
    quantite: 10,
    montant_unitaire: null,
    is_depot: false,
    livraison_id: null,
    created_at: '2026-02-10T10:00:00Z',
    created_by: 'user-1',
  },
  {
    id: 'b2',
    chantier_id: 'ch1',
    description: 'Joint gris 5kg',
    quantite: 5,
    montant_unitaire: null,
    is_depot: false,
    livraison_id: null,
    created_at: '2026-02-10T11:00:00Z',
    created_by: 'user-1',
  },
]

describe('BesoinsList — DropdownMenu', () => {
  const mockOnOpenSheet = vi.fn()
  const mockOnCommander = vi.fn()
  const mockOnEdit = vi.fn()
  const mockOnDelete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows DropdownMenu trigger on each besoin when onEdit and onDelete are provided', () => {
    render(
      <BesoinsList
        besoins={mockBesoins}
        isLoading={false}
        onOpenSheet={mockOnOpenSheet}
        onCommander={mockOnCommander}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
    )

    const actionButtons = screen.getAllByRole('button', { name: 'Actions' })
    expect(actionButtons).toHaveLength(2)
  })

  it('DropdownMenu contains "Modifier" and "Supprimer" items', async () => {
    const user = userEvent.setup()
    render(
      <BesoinsList
        besoins={mockBesoins}
        isLoading={false}
        onOpenSheet={mockOnOpenSheet}
        onCommander={mockOnCommander}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
    )

    const actionButtons = screen.getAllByRole('button', { name: 'Actions' })
    await user.click(actionButtons[0])

    expect(await screen.findByText('Modifier')).toBeInTheDocument()
    expect(screen.getByText('Supprimer')).toBeInTheDocument()
  })

  it('clicking "Modifier" calls onEdit with the correct besoin', async () => {
    const user = userEvent.setup()
    render(
      <BesoinsList
        besoins={mockBesoins}
        isLoading={false}
        onOpenSheet={mockOnOpenSheet}
        onCommander={mockOnCommander}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
    )

    const actionButtons = screen.getAllByRole('button', { name: 'Actions' })
    await user.click(actionButtons[0])
    await user.click(await screen.findByText('Modifier'))

    expect(mockOnEdit).toHaveBeenCalledWith(mockBesoins[0])
  })

  it('clicking "Supprimer" calls onDelete with the correct besoin', async () => {
    const user = userEvent.setup()
    render(
      <BesoinsList
        besoins={mockBesoins}
        isLoading={false}
        onOpenSheet={mockOnOpenSheet}
        onCommander={mockOnCommander}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
    )

    const actionButtons = screen.getAllByRole('button', { name: 'Actions' })
    await user.click(actionButtons[0])
    await user.click(await screen.findByText('Supprimer'))

    expect(mockOnDelete).toHaveBeenCalledWith(mockBesoins[0])
  })

  it('does not show DropdownMenu when onEdit and onDelete are not provided', () => {
    render(
      <BesoinsList
        besoins={mockBesoins}
        isLoading={false}
        onOpenSheet={mockOnOpenSheet}
        onCommander={mockOnCommander}
      />,
    )

    expect(screen.queryByRole('button', { name: 'Actions' })).not.toBeInTheDocument()
  })
})

describe('BesoinsList — Fournir depuis le dépôt', () => {
  const mockOnOpenSheet = vi.fn()
  const mockOnCommander = vi.fn()
  const mockOnFournirDepot = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows "Dépôt" button on each besoin when hasDepotStock and onFournirDepot are provided', () => {
    render(
      <BesoinsList
        besoins={mockBesoins}
        isLoading={false}
        onOpenSheet={mockOnOpenSheet}
        onCommander={mockOnCommander}
        onFournirDepot={mockOnFournirDepot}
        hasDepotStock={true}
      />,
    )

    const depotButtons = screen.getAllByRole('button', { name: /Dépôt/i })
    expect(depotButtons).toHaveLength(2)
  })

  it('clicking "Dépôt" calls onFournirDepot with the correct besoin', async () => {
    const user = userEvent.setup()
    render(
      <BesoinsList
        besoins={mockBesoins}
        isLoading={false}
        onOpenSheet={mockOnOpenSheet}
        onCommander={mockOnCommander}
        onFournirDepot={mockOnFournirDepot}
        hasDepotStock={true}
      />,
    )

    const depotButtons = screen.getAllByRole('button', { name: /Dépôt/i })
    await user.click(depotButtons[0])

    expect(mockOnFournirDepot).toHaveBeenCalledWith(mockBesoins[0])
  })

  it('does not show "Dépôt" button when hasDepotStock is false', () => {
    render(
      <BesoinsList
        besoins={mockBesoins}
        isLoading={false}
        onOpenSheet={mockOnOpenSheet}
        onCommander={mockOnCommander}
        onFournirDepot={mockOnFournirDepot}
        hasDepotStock={false}
      />,
    )

    expect(screen.queryByRole('button', { name: /Dépôt/i })).not.toBeInTheDocument()
  })

  it('does not show "Dépôt" button when onFournirDepot is not provided', () => {
    render(
      <BesoinsList
        besoins={mockBesoins}
        isLoading={false}
        onOpenSheet={mockOnOpenSheet}
        onCommander={mockOnCommander}
        hasDepotStock={true}
      />,
    )

    expect(screen.queryByRole('button', { name: /Dépôt/i })).not.toBeInTheDocument()
  })

  it('does not show "Dépôt" button in selection mode', () => {
    render(
      <BesoinsList
        besoins={mockBesoins}
        isLoading={false}
        onOpenSheet={mockOnOpenSheet}
        onCommander={mockOnCommander}
        onFournirDepot={mockOnFournirDepot}
        hasDepotStock={true}
        selectionMode={true}
        selectedIds={new Set()}
        onToggleSelect={vi.fn()}
      />,
    )

    expect(screen.queryByRole('button', { name: /Dépôt/i })).not.toBeInTheDocument()
  })
})
