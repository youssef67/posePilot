import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DepotFournirSheet } from './DepotFournirSheet'
import type { Besoin } from '@/types/database'
import type { DepotArticleWithCump } from '@/lib/queries/useDepotArticles'

const mockBesoin: Besoin = {
  id: 'b1',
  chantier_id: 'ch1',
  description: 'Sac de colle faïence',
  quantite: 10,
  montant_unitaire: null,
  is_depot: false,
  livraison_id: null,
  created_at: '2026-02-20T10:00:00Z',
  created_by: 'user-1',
}

const mockArticles: DepotArticleWithCump[] = [
  {
    id: 'art-1',
    designation: 'Sac de colle Mapei',
    quantite: 20,
    valeur_totale: 210,
    unite: 'sacs',
    created_at: '2026-02-20T10:00:00Z',
    created_by: 'user-1',
    cump: 10.5,
  },
  {
    id: 'art-2',
    designation: 'Mortier-colle gris',
    quantite: 15,
    valeur_totale: 120,
    unite: 'sacs',
    created_at: '2026-02-20T10:00:00Z',
    created_by: 'user-1',
    cump: 8,
  },
  {
    id: 'art-3',
    designation: 'Joint blanc',
    quantite: 0,
    valeur_totale: 0,
    unite: 'kg',
    created_at: '2026-02-20T10:00:00Z',
    created_by: 'user-1',
    cump: null,
  },
]

describe('DepotFournirSheet', () => {
  const mockOnOpenChange = vi.fn()
  const mockOnConfirm = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('displays besoin description, quantity and chantier name (AC #2)', () => {
    render(
      <DepotFournirSheet
        besoin={mockBesoin}
        chantierNom="Résidence Les Oliviers"
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        articles={mockArticles}
      />,
    )

    expect(screen.getByText(/Sac de colle faïence/)).toBeInTheDocument()
    expect(screen.getByText(/10 unités/)).toBeInTheDocument()
    expect(screen.getByText(/Résidence Les Oliviers/)).toBeInTheDocument()
  })

  it('lists only articles with quantite > 0 and shows CUMP (AC #2)', () => {
    render(
      <DepotFournirSheet
        besoin={mockBesoin}
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        articles={mockArticles}
      />,
    )

    expect(screen.getByText('Sac de colle Mapei')).toBeInTheDocument()
    expect(screen.getByText('Mortier-colle gris')).toBeInTheDocument()
    // Joint blanc has quantite=0, should not appear
    expect(screen.queryByText('Joint blanc')).not.toBeInTheDocument()
    // CUMP should be displayed
    expect(screen.getByText(/10,50/)).toBeInTheDocument()
    expect(screen.getByText(/8,00/)).toBeInTheDocument()
  })

  it('puts matching articles first via case-insensitive comparison (AC #2)', () => {
    // Besoin description "Sac de colle faïence" includes "sac de colle"
    // which is contained in "Sac de colle Mapei" → match
    render(
      <DepotFournirSheet
        besoin={{ ...mockBesoin, description: 'Sac de colle' }}
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        articles={mockArticles}
      />,
    )

    const articleButtons = screen.getAllByRole('button', { pressed: false }).filter(
      (btn) => btn.textContent?.includes('Mapei') || btn.textContent?.includes('Mortier'),
    )
    // "Sac de colle Mapei" contains "sac de colle" → match, should be first
    expect(articleButtons[0].textContent).toContain('Sac de colle Mapei')
    expect(articleButtons[0].textContent).toContain('correspondance')
  })

  it('shows montant when article is selected (AC #2)', async () => {
    const user = userEvent.setup()
    render(
      <DepotFournirSheet
        besoin={mockBesoin}
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        articles={mockArticles}
      />,
    )

    const articleBtn = screen.getByText('Sac de colle Mapei').closest('button')!
    await user.click(articleBtn)

    // 10 × 10,50 € = 105,00 €
    expect(screen.getByTestId('montant-total')).toHaveTextContent(/105,00/)
  })

  it('shows stock insuffisant warning and partial option when stock < besoin.quantite (AC #4)', async () => {
    const user = userEvent.setup()
    const lowStockArticles: DepotArticleWithCump[] = [
      { ...mockArticles[0], quantite: 5, valeur_totale: 52.5 },
    ]

    render(
      <DepotFournirSheet
        besoin={mockBesoin}
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        articles={lowStockArticles}
      />,
    )

    const articleBtn = screen.getByText('Sac de colle Mapei').closest('button')!
    await user.click(articleBtn)

    expect(screen.getByText(/Stock insuffisant/)).toBeInTheDocument()
    expect(screen.getByText(/5 disponible sur 10/)).toBeInTheDocument()

    // "Fournir" footer button should be disabled until partial accepted
    const allFournirBtns = screen.getAllByRole('button', { name: /Fournir/i })
    const footerBtn = allFournirBtns.find((btn) => btn.textContent?.trim() === 'Fournir')!
    expect(footerBtn).toBeDisabled()

    // Accept partial
    const partialBtn = allFournirBtns.find((btn) => btn.textContent?.includes('partiellement'))!
    await user.click(partialBtn)

    expect(footerBtn).toBeEnabled()
  })

  it('calls onConfirm with correct params on validation (AC #3)', async () => {
    const user = userEvent.setup()
    render(
      <DepotFournirSheet
        besoin={mockBesoin}
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        articles={mockArticles}
      />,
    )

    const articleBtn = screen.getByText('Sac de colle Mapei').closest('button')!
    await user.click(articleBtn)

    const fournirBtn = screen.getByRole('button', { name: /Fournir/i })
    await user.click(fournirBtn)

    expect(mockOnConfirm).toHaveBeenCalledWith({
      besoinId: 'b1',
      articleId: 'art-1',
      quantite: 10,
    })
  })
})
