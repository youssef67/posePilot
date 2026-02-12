import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StatusCard, StatusCardSkeleton, STATUS_COLORS } from './StatusCard'

describe('StatusCard', () => {
  it('renders title', () => {
    render(<StatusCard title="Résidence A" statusColor={STATUS_COLORS.NOT_STARTED} />)
    expect(screen.getByText('Résidence A')).toBeInTheDocument()
  })

  it('renders subtitle when provided', () => {
    render(
      <StatusCard
        title="Résidence A"
        subtitle="En cours"
        statusColor={STATUS_COLORS.NOT_STARTED}
      />,
    )
    expect(screen.getByText('En cours')).toBeInTheDocument()
  })

  it('renders lateral status bar with correct color', () => {
    const { container } = render(
      <StatusCard title="Résidence A" statusColor="#F59E0B" />,
    )
    const bar = container.querySelector('[data-testid="status-bar"]')
    expect(bar).toHaveStyle({ backgroundColor: '#F59E0B' })
  })

  it('renders indicator when provided', () => {
    render(
      <StatusCard
        title="Résidence A"
        statusColor={STATUS_COLORS.NOT_STARTED}
        indicator={<span>0%</span>}
      />,
    )
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('renders badge when provided', () => {
    render(
      <StatusCard
        title="Résidence A"
        statusColor={STATUS_COLORS.NOT_STARTED}
        badge={<span>Complet</span>}
      />,
    )
    expect(screen.getByText('Complet')).toBeInTheDocument()
  })

  it('renders with role when provided', () => {
    render(<StatusCard title="Résidence A" statusColor={STATUS_COLORS.NOT_STARTED} role="listitem" />)
    expect(screen.getByRole('listitem')).toBeInTheDocument()
  })

  it('does not render role when not provided', () => {
    const { container } = render(<StatusCard title="Résidence A" statusColor={STATUS_COLORS.NOT_STARTED} />)
    expect(container.firstElementChild).not.toHaveAttribute('role')
  })

  it('has aria-label including title', () => {
    render(
      <StatusCard
        title="Résidence A"
        statusColor={STATUS_COLORS.NOT_STARTED}
        aria-label="Chantier Résidence A, complet, 0%"
      />,
    )
    expect(screen.getByLabelText('Chantier Résidence A, complet, 0%')).toBeInTheDocument()
  })

  it('applies cursor-pointer when onClick is provided', () => {
    const onClick = vi.fn()
    const { container } = render(
      <StatusCard
        title="Résidence A"
        statusColor={STATUS_COLORS.NOT_STARTED}
        onClick={onClick}
      />,
    )
    expect(container.firstElementChild?.className).toContain('cursor-pointer')
  })

  it('does not apply cursor-pointer when onClick is not provided', () => {
    const { container } = render(<StatusCard title="Résidence A" statusColor={STATUS_COLORS.NOT_STARTED} />)
    expect(container.firstElementChild?.className).not.toContain('cursor-pointer')
  })

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    const { container } = render(
      <StatusCard
        title="Résidence A"
        statusColor={STATUS_COLORS.NOT_STARTED}
        onClick={onClick}
      />,
    )
    await user.click(container.firstElementChild!)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('applies custom className', () => {
    const { container } = render(
      <StatusCard
        title="Test"
        statusColor={STATUS_COLORS.NOT_STARTED}
        className="my-custom-class"
      />,
    )
    expect(container.firstElementChild?.className).toContain('my-custom-class')
  })
})

describe('StatusCardSkeleton', () => {
  it('renders with animate-pulse', () => {
    const { container } = render(<StatusCardSkeleton />)
    const skeleton = container.firstElementChild
    expect(skeleton?.className).toContain('animate-pulse')
  })

  it('has aria-hidden="true"', () => {
    const { container } = render(<StatusCardSkeleton />)
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('renders grey status bar placeholder', () => {
    const { container } = render(<StatusCardSkeleton />)
    const bar = container.querySelector('[data-testid="status-bar"]')
    expect(bar).toBeInTheDocument()
  })
})

describe('StatusCard — isBlocked', () => {
  it('overrides status bar to BLOCKED red when isBlocked=true', () => {
    const { container } = render(
      <StatusCard title="Lot 203" statusColor={STATUS_COLORS.DONE} isBlocked />,
    )
    const bar = container.querySelector('[data-testid="status-bar"]')
    expect(bar).toHaveStyle({ backgroundColor: STATUS_COLORS.BLOCKED })
  })

  it('shows AlertTriangle icon when isBlocked=true', () => {
    render(<StatusCard title="Lot 203" statusColor={STATUS_COLORS.DONE} isBlocked />)
    expect(screen.getByLabelText('Bloqué')).toBeInTheDocument()
  })

  it('does not show AlertTriangle when isBlocked is false', () => {
    render(<StatusCard title="Lot 203" statusColor={STATUS_COLORS.DONE} />)
    expect(screen.queryByLabelText('Bloqué')).not.toBeInTheDocument()
  })

  it('uses normal statusColor when isBlocked is not set', () => {
    const { container } = render(
      <StatusCard title="Lot 203" statusColor={STATUS_COLORS.IN_PROGRESS} />,
    )
    const bar = container.querySelector('[data-testid="status-bar"]')
    expect(bar).toHaveStyle({ backgroundColor: STATUS_COLORS.IN_PROGRESS })
  })
})

describe('StatusCard — hasMissingDocs', () => {
  it('shows FileWarning icon when hasMissingDocs is true', () => {
    render(<StatusCard title="Lot 101" statusColor={STATUS_COLORS.NOT_STARTED} hasMissingDocs />)
    expect(screen.getByLabelText('Documents manquants')).toBeInTheDocument()
  })

  it('does not show FileWarning icon when hasMissingDocs is false', () => {
    render(<StatusCard title="Lot 101" statusColor={STATUS_COLORS.NOT_STARTED} hasMissingDocs={false} />)
    expect(screen.queryByLabelText('Documents manquants')).not.toBeInTheDocument()
  })

  it('does not show FileWarning icon when hasMissingDocs is not set', () => {
    render(<StatusCard title="Lot 101" statusColor={STATUS_COLORS.NOT_STARTED} />)
    expect(screen.queryByLabelText('Documents manquants')).not.toBeInTheDocument()
  })

  it('shows both AlertTriangle and FileWarning when isBlocked and hasMissingDocs', () => {
    render(<StatusCard title="Lot 101" statusColor={STATUS_COLORS.DONE} isBlocked hasMissingDocs />)
    expect(screen.getByLabelText('Bloqué')).toBeInTheDocument()
    expect(screen.getByLabelText('Documents manquants')).toBeInTheDocument()
  })

  it('does not override status bar color when hasMissingDocs is true', () => {
    const { container } = render(
      <StatusCard title="Lot 101" statusColor={STATUS_COLORS.IN_PROGRESS} hasMissingDocs />,
    )
    const bar = container.querySelector('[data-testid="status-bar"]')
    expect(bar).toHaveStyle({ backgroundColor: STATUS_COLORS.IN_PROGRESS })
  })
})

describe('StatusCard — secondaryInfo', () => {
  it('renders secondaryInfo when provided', () => {
    render(
      <StatusCard
        title="Lot 203"
        statusColor={STATUS_COLORS.NOT_STARTED}
        secondaryInfo="12.5 m² · 8.2 ML"
      />,
    )
    expect(screen.getByText('12.5 m² · 8.2 ML')).toBeInTheDocument()
  })

  it('does not render secondaryInfo when not provided', () => {
    render(<StatusCard title="Lot 203" statusColor={STATUS_COLORS.NOT_STARTED} />)
    expect(screen.queryByText(/m²/)).not.toBeInTheDocument()
  })

  it('renders secondaryInfo with only m²', () => {
    render(
      <StatusCard
        title="Lot 203"
        statusColor={STATUS_COLORS.NOT_STARTED}
        secondaryInfo="12.5 m²"
      />,
    )
    expect(screen.getByText('12.5 m²')).toBeInTheDocument()
  })
})

describe('STATUS_COLORS', () => {
  it('exports expected color constants', () => {
    expect(STATUS_COLORS.NOT_STARTED).toBe('#64748B')
    expect(STATUS_COLORS.IN_PROGRESS).toBe('#F59E0B')
    expect(STATUS_COLORS.DONE).toBe('#10B981')
    expect(STATUS_COLORS.BLOCKED).toBe('#EF4444')
  })
})
