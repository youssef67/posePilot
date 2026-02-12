import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@tanstack/react-router', () => ({
  useMatches: vi.fn(),
  Link: ({ children, to, className }: { children: React.ReactNode; to: string; className?: string }) => (
    <a href={to} className={className}>{children}</a>
  ),
}))

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: vi.fn(),
}))

import { useMatches } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { BreadcrumbNav } from './BreadcrumbNav'

const mockUseMatches = useMatches as ReturnType<typeof vi.fn>
const mockUseQueryClient = useQueryClient as ReturnType<typeof vi.fn>

describe('BreadcrumbNav', () => {
  const mockGetQueryData = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseQueryClient.mockReturnValue({ getQueryData: mockGetQueryData })
  })

  it('renders nothing when depth <= 1', () => {
    mockUseMatches.mockReturnValue([
      { staticData: { breadcrumb: 'Chantier' }, params: { chantierId: '1' }, pathname: '/chantiers/1' },
    ])
    const { container } = render(<BreadcrumbNav />)
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing when no matches have breadcrumb', () => {
    mockUseMatches.mockReturnValue([
      { staticData: {}, params: {}, pathname: '/' },
      { staticData: {}, params: {}, pathname: '/foo' },
    ])
    const { container } = render(<BreadcrumbNav />)
    expect(container.innerHTML).toBe('')
  })

  it('renders breadcrumb with resolved names from cache', () => {
    mockUseMatches.mockReturnValue([
      { staticData: {}, params: {}, pathname: '/' },
      { staticData: { breadcrumb: 'Chantier' }, params: { chantierId: 'c1' }, pathname: '/chantiers/c1' },
      { staticData: { breadcrumb: 'Plot' }, params: { chantierId: 'c1', plotId: 'p1' }, pathname: '/chantiers/c1/plots/p1' },
    ])
    mockGetQueryData.mockImplementation((key: string[]) => {
      if (key[0] === 'chantiers' && key[1] === 'c1') return { id: 'c1', nom: 'Oliviers' }
      if (key[0] === 'plots' && key[1] === 'c1') return [{ id: 'p1', nom: 'Plot A' }]
      return undefined
    })

    render(<BreadcrumbNav />)
    expect(screen.getByText('Oliviers')).toBeInTheDocument()
    expect(screen.getByText('Plot A')).toBeInTheDocument()
  })

  it('falls back to static label when cache is empty', () => {
    mockUseMatches.mockReturnValue([
      { staticData: { breadcrumb: 'Chantier' }, params: { chantierId: 'c1' }, pathname: '/chantiers/c1' },
      { staticData: { breadcrumb: 'Plot' }, params: { chantierId: 'c1', plotId: 'p1' }, pathname: '/chantiers/c1/plots/p1' },
    ])
    mockGetQueryData.mockReturnValue(undefined)

    render(<BreadcrumbNav />)
    expect(screen.getByText('Chantier')).toBeInTheDocument()
    expect(screen.getByText('Plot')).toBeInTheDocument()
  })

  it('makes non-last segments clickable links', () => {
    mockUseMatches.mockReturnValue([
      { staticData: { breadcrumb: 'Chantier' }, params: { chantierId: 'c1' }, pathname: '/chantiers/c1' },
      { staticData: { breadcrumb: 'Plot' }, params: { chantierId: 'c1', plotId: 'p1' }, pathname: '/chantiers/c1/plots/p1' },
    ])
    mockGetQueryData.mockImplementation((key: string[]) => {
      if (key[0] === 'chantiers') return { id: 'c1', nom: 'Oliviers' }
      if (key[0] === 'plots') return [{ id: 'p1', nom: 'Plot A' }]
      return undefined
    })

    render(<BreadcrumbNav />)
    const link = screen.getByText('Oliviers').closest('a')
    expect(link).toHaveAttribute('href', '/chantiers/c1')
    // Last segment is NOT a link
    expect(screen.getByText('Plot A').closest('a')).toBeNull()
  })

  it('has nav with aria-label "Fil d\'Ariane"', () => {
    mockUseMatches.mockReturnValue([
      { staticData: { breadcrumb: 'Chantier' }, params: { chantierId: 'c1' }, pathname: '/chantiers/c1' },
      { staticData: { breadcrumb: 'Plot' }, params: { chantierId: 'c1', plotId: 'p1' }, pathname: '/chantiers/c1/plots/p1' },
    ])
    mockGetQueryData.mockReturnValue(undefined)

    render(<BreadcrumbNav />)
    expect(screen.getByLabelText("Fil d'Ariane")).toBeInTheDocument()
  })

  it('renders last segment with font-medium', () => {
    mockUseMatches.mockReturnValue([
      { staticData: { breadcrumb: 'Chantier' }, params: { chantierId: 'c1' }, pathname: '/chantiers/c1' },
      { staticData: { breadcrumb: 'Plot' }, params: { chantierId: 'c1', plotId: 'p1' }, pathname: '/chantiers/c1/plots/p1' },
    ])
    mockGetQueryData.mockReturnValue(undefined)

    render(<BreadcrumbNav />)
    const lastSegment = screen.getByText('Plot')
    expect(lastSegment).toHaveClass('font-medium')
  })

  it('renders ellipsis element when > 3 segments', () => {
    mockUseMatches.mockReturnValue([
      { staticData: { breadcrumb: 'Chantier' }, params: { chantierId: 'c1' }, pathname: '/chantiers/c1' },
      { staticData: { breadcrumb: 'Plot' }, params: { chantierId: 'c1', plotId: 'p1' }, pathname: '/chantiers/c1/plots/p1' },
      { staticData: { breadcrumb: 'Étage' }, params: { chantierId: 'c1', plotId: 'p1', etageId: 'e1' }, pathname: '/chantiers/c1/plots/p1/e1' },
      { staticData: { breadcrumb: 'Lot' }, params: { chantierId: 'c1', plotId: 'p1', etageId: 'e1', lotId: 'l1' }, pathname: '/chantiers/c1/plots/p1/e1/l1' },
    ])
    mockGetQueryData.mockReturnValue(undefined)

    render(<BreadcrumbNav />)
    expect(screen.getByText('…')).toBeInTheDocument()
  })

  it('does NOT render ellipsis when <= 3 segments', () => {
    mockUseMatches.mockReturnValue([
      { staticData: { breadcrumb: 'Chantier' }, params: { chantierId: 'c1' }, pathname: '/chantiers/c1' },
      { staticData: { breadcrumb: 'Plot' }, params: { chantierId: 'c1', plotId: 'p1' }, pathname: '/chantiers/c1/plots/p1' },
      { staticData: { breadcrumb: 'Étage' }, params: { chantierId: 'c1', plotId: 'p1', etageId: 'e1' }, pathname: '/chantiers/c1/plots/p1/e1' },
    ])
    mockGetQueryData.mockReturnValue(undefined)

    render(<BreadcrumbNav />)
    expect(screen.queryByText('…')).not.toBeInTheDocument()
  })

  it('resolves lot name with "Lot" prefix', () => {
    mockUseMatches.mockReturnValue([
      { staticData: { breadcrumb: 'Chantier' }, params: { chantierId: 'c1' }, pathname: '/chantiers/c1' },
      { staticData: { breadcrumb: 'Plot' }, params: { chantierId: 'c1', plotId: 'p1' }, pathname: '/chantiers/c1/plots/p1' },
      { staticData: { breadcrumb: 'Étage' }, params: { chantierId: 'c1', plotId: 'p1', etageId: 'e1' }, pathname: '/chantiers/c1/plots/p1/e1' },
      { staticData: { breadcrumb: 'Lot' }, params: { chantierId: 'c1', plotId: 'p1', etageId: 'e1', lotId: 'l1' }, pathname: '/chantiers/c1/plots/p1/e1/l1' },
    ])
    mockGetQueryData.mockImplementation((key: string[]) => {
      if (key[0] === 'lots') return [{ id: 'l1', code: '203' }]
      return undefined
    })

    render(<BreadcrumbNav />)
    expect(screen.getByText('Lot 203')).toBeInTheDocument()
  })

  it('resolves piece name from cache', () => {
    mockUseMatches.mockReturnValue([
      { staticData: { breadcrumb: 'Chantier' }, params: { chantierId: 'c1' }, pathname: '/chantiers/c1' },
      { staticData: { breadcrumb: 'Plot' }, params: { chantierId: 'c1', plotId: 'p1' }, pathname: '/chantiers/c1/plots/p1' },
      { staticData: { breadcrumb: 'Étage' }, params: { chantierId: 'c1', plotId: 'p1', etageId: 'e1' }, pathname: '/chantiers/c1/plots/p1/e1' },
      { staticData: { breadcrumb: 'Lot' }, params: { chantierId: 'c1', plotId: 'p1', etageId: 'e1', lotId: 'l1' }, pathname: '/chantiers/c1/plots/p1/e1/l1' },
      { staticData: { breadcrumb: 'Pièce' }, params: { chantierId: 'c1', plotId: 'p1', etageId: 'e1', lotId: 'l1', pieceId: 'pi1' }, pathname: '/chantiers/c1/plots/p1/e1/l1/pi1' },
    ])
    mockGetQueryData.mockImplementation((key: string[]) => {
      if (key[0] === 'pieces') return [{ id: 'pi1', nom: 'Séjour' }]
      return undefined
    })

    render(<BreadcrumbNav />)
    expect(screen.getByText('Séjour')).toBeInTheDocument()
  })
})
