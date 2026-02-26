import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DepotArticleList } from './DepotArticleList'
import type { DepotArticleWithCump } from '@/lib/queries/useDepotArticles'

const mockArticles: DepotArticleWithCump[] = [
  {
    id: 'da1',
    designation: 'Sac de colle Mapei',
    quantite: 20,
    valeur_totale: 210,
    unite: 'sacs',
    created_at: '2026-02-20T10:00:00Z',
    created_by: 'user-1',
    cump: 10.5,
  },
  {
    id: 'da2',
    designation: 'Carrelage 30x30 blanc',
    quantite: 45,
    valeur_totale: 675,
    unite: 'm²',
    created_at: '2026-02-20T11:00:00Z',
    created_by: 'user-1',
    cump: 15,
  },
]

const defaultProps = {
  articles: mockArticles,
  isLoading: false,
  onOpenSheet: vi.fn(),
  onIncrement: vi.fn(),
  onDecrement: vi.fn(),
}

describe('DepotArticleList', () => {
  it('renders 3 skeleton cards when loading', () => {
    render(<DepotArticleList {...defaultProps} articles={undefined} isLoading={true} />)

    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBe(3)
  })

  it('renders empty state with Warehouse icon and CTA', () => {
    render(<DepotArticleList {...defaultProps} articles={[]} isLoading={false} />)

    expect(screen.getByText('Aucun article au dépôt')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ajouter un article' })).toBeInTheDocument()
  })

  it('calls onOpenSheet when CTA is clicked in empty state', async () => {
    const onOpenSheet = vi.fn()
    render(<DepotArticleList {...defaultProps} articles={[]} onOpenSheet={onOpenSheet} />)

    await userEvent.click(screen.getByRole('button', { name: 'Ajouter un article' }))
    expect(onOpenSheet).toHaveBeenCalledTimes(1)
  })

  it('renders article designation, quantity with unit, CUMP and valeur totale', () => {
    render(<DepotArticleList {...defaultProps} />)

    expect(screen.getByText('Sac de colle Mapei')).toBeInTheDocument()
    expect(screen.getByText('Carrelage 30x30 blanc')).toBeInTheDocument()
    // Quantity with unit and CUMP
    expect(screen.getByText(/20 sacs · CUMP/)).toBeInTheDocument()
    expect(screen.getByText(/45 m² · CUMP/)).toBeInTheDocument()
    // Valeur totale formatted in EUR
    expect(screen.getByText(/Valeur : 210,00/)).toBeInTheDocument()
    expect(screen.getByText(/Valeur : 675,00/)).toBeInTheDocument()
  })

  it('renders CUMP formatted in EUR', () => {
    render(<DepotArticleList {...defaultProps} />)

    // CUMP for first article: 10.50 €
    expect(screen.getByText(/10,50\s*€/)).toBeInTheDocument()
    // CUMP for second article: 15.00 €
    expect(screen.getByText(/15,00\s*€/)).toBeInTheDocument()
  })

  it('renders — for CUMP when null', () => {
    const articlesWithNullCump: DepotArticleWithCump[] = [
      { ...mockArticles[0], quantite: 0, valeur_totale: 0, cump: null },
    ]
    render(<DepotArticleList {...defaultProps} articles={articlesWithNullCump} />)

    expect(screen.getByText(/CUMP : —/)).toBeInTheDocument()
  })

  it('calls onIncrement when + is clicked', async () => {
    const onIncrement = vi.fn()
    render(<DepotArticleList {...defaultProps} onIncrement={onIncrement} />)

    const incrementButtons = screen.getAllByRole('button', { name: /Augmenter/ })
    await userEvent.click(incrementButtons[0])
    expect(onIncrement).toHaveBeenCalledWith(mockArticles[0])
  })

  it('calls onDecrement when - is clicked and quantity > 0', async () => {
    const onDecrement = vi.fn()
    render(<DepotArticleList {...defaultProps} onDecrement={onDecrement} />)

    const decrementButtons = screen.getAllByRole('button', { name: /Diminuer/ })
    await userEvent.click(decrementButtons[0]) // quantite=20
    expect(onDecrement).toHaveBeenCalledWith(mockArticles[0])
  })

  it('disables - button when quantity is 0', () => {
    const articleAtZero: DepotArticleWithCump[] = [
      { ...mockArticles[0], quantite: 0, valeur_totale: 0, cump: null },
    ]
    render(<DepotArticleList {...defaultProps} articles={articleAtZero} />)

    const decrementButton = screen.getByRole('button', { name: /Diminuer/ })
    expect(decrementButton).toBeDisabled()
  })

  it('does not call onDecrement when - is clicked at quantity 0', async () => {
    const onDecrement = vi.fn()
    const articleAtZero: DepotArticleWithCump[] = [
      { ...mockArticles[0], quantite: 0, valeur_totale: 0, cump: null },
    ]
    render(<DepotArticleList {...defaultProps} articles={articleAtZero} onDecrement={onDecrement} />)

    const decrementButton = screen.getByRole('button', { name: /Diminuer/ })
    await userEvent.click(decrementButton)
    expect(onDecrement).not.toHaveBeenCalled()
  })

  it('calls onDecrement (not delete) when going from quantity 1 to 0', async () => {
    const onDecrement = vi.fn()
    const articleWithOne: DepotArticleWithCump[] = [
      { ...mockArticles[0], quantite: 1, cump: 10.5 },
    ]
    render(<DepotArticleList {...defaultProps} articles={articleWithOne} onDecrement={onDecrement} />)

    await userEvent.click(screen.getByRole('button', { name: /Diminuer/ }))
    expect(onDecrement).toHaveBeenCalledWith(articleWithOne[0])
    // No AlertDialog should appear
    expect(screen.queryByText('Supprimer cet article ?')).not.toBeInTheDocument()
  })
})
