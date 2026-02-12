import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LotSearchBar } from './LotSearchBar'
import type { ChantierLot } from '@/lib/queries/useChantierLots'

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('@/lib/queries/useChantierLots', () => ({
  useChantierLots: vi.fn(),
}))

vi.mock('@/lib/utils/useLotSearchHistory', () => ({
  useLotSearchHistory: vi.fn(),
}))

import { useChantierLots } from '@/lib/queries/useChantierLots'
import { useLotSearchHistory } from '@/lib/utils/useLotSearchHistory'

const mockLots: ChantierLot[] = [
  {
    id: 'lot-1',
    code: '101',
    plot_id: 'plot-1',
    etage_id: 'etage-1',
    plots: { nom: 'Plot A' },
    etages: { nom: 'RDC' },
  },
  {
    id: 'lot-2',
    code: '102',
    plot_id: 'plot-1',
    etage_id: 'etage-1',
    plots: { nom: 'Plot A' },
    etages: { nom: 'RDC' },
  },
  {
    id: 'lot-3',
    code: '203',
    plot_id: 'plot-1',
    etage_id: 'etage-2',
    plots: { nom: 'Plot A' },
    etages: { nom: 'É1' },
  },
  {
    id: 'lot-4',
    code: '301',
    plot_id: 'plot-2',
    etage_id: 'etage-3',
    plots: { nom: 'Plot B' },
    etages: { nom: 'RDC' },
  },
]

const mockAddToHistory = vi.fn()
const mockClearHistory = vi.fn()

function setupMocks(
  opts: {
    lots?: ChantierLot[] | undefined
    isLoading?: boolean
    history?: string[]
  } = {},
) {
  const { lots = mockLots, isLoading = false, history = [] } = opts
  vi.mocked(useChantierLots).mockReturnValue({
    data: lots,
    isLoading,
    isError: false,
    error: null,
  } as ReturnType<typeof useChantierLots>)
  vi.mocked(useLotSearchHistory).mockReturnValue({
    history,
    addToHistory: mockAddToHistory,
    clearHistory: mockClearHistory,
  })
}

describe('LotSearchBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders search bar with placeholder', () => {
    setupMocks()
    render(<LotSearchBar chantierId="chantier-1" />)

    expect(
      screen.getByPlaceholderText('Rechercher un lot...'),
    ).toBeInTheDocument()
  })

  it('has inputMode="numeric"', () => {
    setupMocks()
    render(<LotSearchBar chantierId="chantier-1" />)

    const input = screen.getByPlaceholderText('Rechercher un lot...')
    expect(input).toHaveAttribute('inputmode', 'numeric')
  })

  it('has role="search" and aria-label', () => {
    setupMocks()
    render(<LotSearchBar chantierId="chantier-1" />)

    expect(screen.getByRole('search')).toBeInTheDocument()
    expect(
      screen.getByLabelText('Rechercher un lot par numéro'),
    ).toBeInTheDocument()
  })

  it('filters lots in real-time on input', async () => {
    setupMocks()
    const user = userEvent.setup()
    render(<LotSearchBar chantierId="chantier-1" />)

    const input = screen.getByPlaceholderText('Rechercher un lot...')
    await user.click(input)
    await user.type(input, '20')

    expect(screen.getByText('Lot 203')).toBeInTheDocument()
    expect(screen.queryByText('Lot 101')).not.toBeInTheDocument()
    expect(screen.queryByText('Lot 102')).not.toBeInTheDocument()
    expect(screen.queryByText('Lot 301')).not.toBeInTheDocument()
  })

  it('shows full location for each result (Plot › Étage)', async () => {
    setupMocks()
    const user = userEvent.setup()
    render(<LotSearchBar chantierId="chantier-1" />)

    const input = screen.getByPlaceholderText('Rechercher un lot...')
    await user.click(input)
    await user.type(input, '10')

    const locations = screen.getAllByText(/Plot A › RDC/)
    expect(locations.length).toBeGreaterThan(0)
  })

  it('shows "Aucun lot trouvé" when no results match', async () => {
    setupMocks()
    const user = userEvent.setup()
    render(<LotSearchBar chantierId="chantier-1" />)

    const input = screen.getByPlaceholderText('Rechercher un lot...')
    await user.click(input)
    await user.type(input, '999')

    expect(
      screen.getByText(/Aucun lot trouvé pour « 999 »/),
    ).toBeInTheDocument()
    expect(screen.getByText('Vérifiez le numéro')).toBeInTheDocument()
  })

  it('navigates to lot on result click', async () => {
    setupMocks()
    render(<LotSearchBar chantierId="chantier-1" />)

    const input = screen.getByPlaceholderText('Rechercher un lot...')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: '203' } })

    const result = screen.getByText('Lot 203')
    fireEvent.mouseDown(result.closest('li')!)

    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/chantiers/$chantierId/plots/$plotId/$etageId/$lotId',
      params: {
        chantierId: 'chantier-1',
        plotId: 'plot-1',
        etageId: 'etage-2',
        lotId: 'lot-3',
      },
    })
  })

  it('adds query to history on lot selection', () => {
    setupMocks()
    render(<LotSearchBar chantierId="chantier-1" />)

    const input = screen.getByPlaceholderText('Rechercher un lot...')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: '203' } })

    const result = screen.getByText('Lot 203')
    fireEvent.mouseDown(result.closest('li')!)

    expect(mockAddToHistory).toHaveBeenCalledWith('203')
  })

  it('shows history when input is empty and focused', () => {
    setupMocks({ history: ['101', '203', '301'] })
    render(<LotSearchBar chantierId="chantier-1" />)

    const input = screen.getByPlaceholderText('Rechercher un lot...')
    fireEvent.focus(input)

    expect(screen.getByText('101')).toBeInTheDocument()
    expect(screen.getByText('203')).toBeInTheDocument()
    expect(screen.getByText('301')).toBeInTheDocument()
  })

  it('sets query to history entry on click', () => {
    setupMocks({ history: ['101'] })
    render(<LotSearchBar chantierId="chantier-1" />)

    const input = screen.getByPlaceholderText('Rechercher un lot...')
    fireEvent.focus(input)

    const entry = screen.getByText('101')
    fireEvent.mouseDown(entry.closest('li')!)

    expect(input).toHaveValue('101')
  })

  it('clears input on X button click', async () => {
    setupMocks()
    const user = userEvent.setup()
    render(<LotSearchBar chantierId="chantier-1" />)

    const input = screen.getByPlaceholderText('Rechercher un lot...')
    await user.click(input)
    await user.type(input, '101')

    const clearBtn = screen.getByLabelText('Effacer la recherche')
    await user.click(clearBtn)

    expect(input).toHaveValue('')
  })

  it('does not show dropdown when empty history and no query', () => {
    setupMocks({ history: [] })
    render(<LotSearchBar chantierId="chantier-1" />)

    const input = screen.getByPlaceholderText('Rechercher un lot...')
    fireEvent.focus(input)

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('has role="listbox" on results list', async () => {
    setupMocks()
    const user = userEvent.setup()
    render(<LotSearchBar chantierId="chantier-1" />)

    const input = screen.getByPlaceholderText('Rechercher un lot...')
    await user.click(input)
    await user.type(input, '10')

    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('shows loading indicator (animate-pulse) when lots are loading', () => {
    setupMocks({ isLoading: true, lots: undefined })
    const { container } = render(<LotSearchBar chantierId="chantier-1" />)

    const pulsingIcon = container.querySelector('.animate-pulse')
    expect(pulsingIcon).toBeInTheDocument()
  })

  it('closes dropdown on Escape key', async () => {
    setupMocks()
    const user = userEvent.setup()
    render(<LotSearchBar chantierId="chantier-1" />)

    const input = screen.getByPlaceholderText('Rechercher un lot...')
    await user.click(input)
    await user.type(input, '10')

    expect(screen.getByRole('listbox')).toBeInTheDocument()

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('navigates results with arrow keys and selects with Enter', () => {
    setupMocks()
    render(<LotSearchBar chantierId="chantier-1" />)

    const input = screen.getByPlaceholderText('Rechercher un lot...')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: '10' } })

    // Arrow down to first result
    fireEvent.keyDown(input, { key: 'ArrowDown' })

    const firstOption = screen.getByText('Lot 101').closest('[role="option"]')
    expect(firstOption).toHaveAttribute('aria-selected', 'true')

    // Enter to select
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/chantiers/$chantierId/plots/$plotId/$etageId/$lotId',
      params: {
        chantierId: 'chantier-1',
        plotId: 'plot-1',
        etageId: 'etage-1',
        lotId: 'lot-1',
      },
    })
  })
})
