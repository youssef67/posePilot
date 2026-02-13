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
    livraison_id: null,
    created_at: '2026-02-10T10:00:00Z',
    created_by: 'user-1',
  },
  {
    id: 'b2',
    chantier_id: 'ch1',
    description: 'Joint gris 5kg',
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
