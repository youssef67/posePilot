import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChantierIndicators } from './ChantierIndicators'
import type { LotPretACarreler, MetrageVsInventaire } from '@/lib/utils/computeChantierIndicators'
import type { Livraison } from '@/types/database'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...props }: { children: React.ReactNode; to: string }) => (
    <a href={props.to} data-testid="lot-link">
      {children}
    </a>
  ),
}))

const mockLot: LotPretACarreler = {
  id: 'lot-1',
  code: '101',
  plotId: 'plot-1',
  etageId: 'etage-1',
  plotNom: 'Plot A',
  etageNom: 'É1',
}

const mockMetrage: MetrageVsInventaire = {
  totalM2: 1250,
  totalML: 320,
  inventaireCount: 3,
  inventaireDesignations: [
    { designation: 'Colle', totalQuantite: 15 },
    { designation: 'Joint', totalQuantite: 5 },
    { designation: 'Plinthes', totalQuantite: 20 },
  ],
}

const mockLivraison: Livraison = {
  id: 'liv-1',
  chantier_id: 'ch-1',
  description: 'Colle 60x60',
  status: 'prevu',
  date_prevue: '2026-02-15',
  bc_file_url: null,
  bc_file_name: null,
  bl_file_url: null,
  bl_file_name: null,
  created_at: '2026-02-01',
  created_by: null,
}

describe('ChantierIndicators', () => {
  it('renders nothing when all data is empty', () => {
    const { container } = render(
      <ChantierIndicators
        chantierId="ch-1"
        lotsPretsACarreler={[]}
        metrageVsInventaire={{ totalM2: 0, totalML: 0, inventaireCount: 0, inventaireDesignations: [] }}
        besoinsEnAttente={0}
        livraisonsPrevues={[]}
      />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows lots prêts section when available', () => {
    render(
      <ChantierIndicators
        chantierId="ch-1"
        lotsPretsACarreler={[mockLot]}
        besoinsEnAttente={0}
        livraisonsPrevues={[]}
      />,
    )
    expect(screen.getByText(/1 lot prêt à carreler/)).toBeInTheDocument()
    expect(screen.getByText(/Lot 101 — Plot A › É1/)).toBeInTheDocument()
  })

  it('hides lots prêts section when empty', () => {
    render(
      <ChantierIndicators
        chantierId="ch-1"
        lotsPretsACarreler={[]}
        besoinsEnAttente={2}
        livraisonsPrevues={[]}
      />,
    )
    expect(screen.queryByText(/prêt.*carreler/)).not.toBeInTheDocument()
  })

  it('shows besoins counter when > 0', () => {
    render(
      <ChantierIndicators
        chantierId="ch-1"
        besoinsEnAttente={3}
        livraisonsPrevues={[]}
      />,
    )
    expect(screen.getByText(/3 besoins en attente non commandés/)).toBeInTheDocument()
  })

  it('hides besoins counter when 0', () => {
    render(
      <ChantierIndicators
        chantierId="ch-1"
        lotsPretsACarreler={[mockLot]}
        besoinsEnAttente={0}
        livraisonsPrevues={[]}
      />,
    )
    expect(screen.queryByText(/besoin/i)).not.toBeInTheDocument()
  })

  it('shows livraisons prévues with dates', () => {
    render(
      <ChantierIndicators
        chantierId="ch-1"
        besoinsEnAttente={0}
        livraisonsPrevues={[mockLivraison]}
      />,
    )
    expect(screen.getByText(/Livraisons prévues/)).toBeInTheDocument()
    expect(screen.getByText(/Colle 60x60/)).toBeInTheDocument()
  })

  it('shows métrés vs inventaire when data available', () => {
    render(
      <ChantierIndicators
        chantierId="ch-1"
        metrageVsInventaire={mockMetrage}
        besoinsEnAttente={0}
        livraisonsPrevues={[]}
      />,
    )
    expect(screen.getByText(/Métrés & Inventaire/)).toBeInTheDocument()
    expect(screen.getByText(/1250 m²/)).toBeInTheDocument()
    expect(screen.getByText(/3 articles en stock/)).toBeInTheDocument()
  })

  it('hides métrés section when all zeros', () => {
    render(
      <ChantierIndicators
        chantierId="ch-1"
        metrageVsInventaire={{ totalM2: 0, totalML: 0, inventaireCount: 0, inventaireDesignations: [] }}
        besoinsEnAttente={1}
        livraisonsPrevues={[]}
      />,
    )
    expect(screen.queryByText(/Métrés/)).not.toBeInTheDocument()
  })

  it('lots prêts items are clickable links', () => {
    render(
      <ChantierIndicators
        chantierId="ch-1"
        lotsPretsACarreler={[mockLot]}
        besoinsEnAttente={0}
        livraisonsPrevues={[]}
      />,
    )
    const links = screen.getAllByTestId('lot-link')
    expect(links).toHaveLength(1)
    expect(links[0].tagName).toBe('A')
  })

  it('renders nothing when lotsPretsACarreler is undefined and other data empty', () => {
    const { container } = render(
      <ChantierIndicators
        chantierId="ch-1"
        besoinsEnAttente={0}
        livraisonsPrevues={[]}
      />,
    )
    expect(container.firstChild).toBeNull()
  })
})
