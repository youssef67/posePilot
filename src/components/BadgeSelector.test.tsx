import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

vi.mock('@/lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn() },
}))

const mockMutate = vi.fn()
vi.mock('@/lib/mutations/useAssignBadge', () => ({
  useAssignBadge: () => ({ mutate: mockMutate }),
}))

const mockCreateMutate = vi.fn()
vi.mock('@/lib/mutations/useCreateAndAssignBadge', () => ({
  useCreateAndAssignBadge: () => ({ mutate: mockCreateMutate }),
}))

const mockUnassignMutate = vi.fn()
vi.mock('@/lib/mutations/useUnassignBadge', () => ({
  useUnassignBadge: () => ({ mutate: mockUnassignMutate }),
}))

vi.mock('@/lib/queries/useLotBadges', () => ({
  useLotBadges: () => ({
    data: [
      { id: 'b1', chantier_id: 'ch-1', nom: 'TMA', couleur: 'amber', created_at: '2026-01-01T00:00:00Z' },
      { id: 'b2', chantier_id: 'ch-1', nom: 'PMR', couleur: 'blue', created_at: '2026-01-02T00:00:00Z' },
    ],
  }),
}))

import { BadgeSelector } from './BadgeSelector'

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

const assignedBadges = [
  {
    lot_id: 'lot-1',
    badge_id: 'b1',
    created_at: '2026-01-01T00:00:00Z',
    lot_badges: { id: 'b1', chantier_id: 'ch-1', nom: 'TMA', couleur: 'amber', created_at: '2026-01-01T00:00:00Z' },
  },
]

describe('BadgeSelector', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders assigned badges', () => {
    render(
      <BadgeSelector lotId="lot-1" chantierId="ch-1" plotId="plot-1" assignedBadges={assignedBadges} />,
      { wrapper: createWrapper() },
    )

    expect(screen.getByText('TMA')).toBeInTheDocument()
  })

  it('renders "+ Badge" button', () => {
    render(
      <BadgeSelector lotId="lot-1" chantierId="ch-1" plotId="plot-1" assignedBadges={[]} />,
      { wrapper: createWrapper() },
    )

    expect(screen.getByText('Badge')).toBeInTheDocument()
  })

  it('shows remove button on assigned badges', () => {
    render(
      <BadgeSelector lotId="lot-1" chantierId="ch-1" plotId="plot-1" assignedBadges={assignedBadges} />,
      { wrapper: createWrapper() },
    )

    const removeBtn = screen.getByLabelText('Retirer TMA')
    expect(removeBtn).toBeInTheDocument()
  })

  it('calls unassignBadge when remove is clicked', () => {
    render(
      <BadgeSelector lotId="lot-1" chantierId="ch-1" plotId="plot-1" assignedBadges={assignedBadges} />,
      { wrapper: createWrapper() },
    )

    fireEvent.click(screen.getByLabelText('Retirer TMA'))
    expect(mockUnassignMutate).toHaveBeenCalledWith({ lotId: 'lot-1', badgeId: 'b1', plotId: 'plot-1' })
  })

  it('renders nothing special when no badges assigned', () => {
    render(
      <BadgeSelector lotId="lot-1" chantierId="ch-1" plotId="plot-1" assignedBadges={[]} />,
      { wrapper: createWrapper() },
    )

    // Should not have TMA badge
    expect(screen.queryByText('TMA')).not.toBeInTheDocument()
    // Should still have the + Badge button
    expect(screen.getByText('Badge')).toBeInTheDocument()
  })
})
