import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue({}),
      }),
    }),
    removeChannel: vi.fn(),
  },
}))

import { supabase } from '@/lib/supabase'
import { renderRoute, setupChannelMock } from '@/test/route-test-utils'

const mockEtages = [
  { id: 'e1', plot_id: 'p1', nom: 'RDC', order_index: 0, progress_done: 0, progress_total: 0, created_at: '2026-01-01' },
]

const mockLots = [
  {
    id: 'lot1',
    etage_id: 'e1',
    plot_id: 'p1',
    variante_id: 'v1',
    code: '101',
    position: 0,
    progress_done: 0,
    progress_total: 0,
    has_blocking_note: false,
    has_open_reservation: false,
    has_missing_docs: false,
    has_inventaire: false,
    metrage_m2_total: 0,
    metrage_ml_total: 0,
    plinth_status: 'non_commandees',
    cout_materiaux: 0,
    materiaux_recus: false,
    created_at: '2026-01-01',
  },
]

const mockInventaireEtage = [
  {
    id: 'inv1',
    chantier_id: 'ch1',
    plot_id: 'p1',
    etage_id: 'e1',
    lot_id: null,
    designation: 'Carrelage 60x60',
    quantite: 20,
    created_at: '2026-02-10T10:00:00Z',
    created_by: 'user-1',
    plots: { nom: 'Plot A' },
    etages: { nom: 'RDC' },
    lots: null,
  },
]

function setupMocks(inventaire: unknown[] = []) {
  vi.mocked(supabase.from).mockImplementation((table: string) => {
    if (table === 'etages') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockEtages, error: null }),
          }),
        }),
      } as never
    }
    if (table === 'lots') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockLots, error: null }),
          }),
        }),
      } as never
    }
    if (table === 'inventaire') {
      const orderFn2 = vi.fn().mockResolvedValue({ data: inventaire, error: null })
      const orderFn1 = vi.fn().mockReturnValue({ order: orderFn2 })
      const eqEtage = vi.fn().mockReturnValue({ order: orderFn1 })
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: eqEtage,
            order: orderFn1,
          }),
        }),
      } as never
    }
    if (table === 'plots') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      } as never
    }
    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    } as never
  })
}

describe('EtageInventairePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupChannelMock(supabase as unknown as { channel: ReturnType<typeof vi.fn> })
  })

  it('renders heading with étage name', async () => {
    setupMocks()
    renderRoute('/chantiers/ch1/plots/p1/e1/inventaire')

    expect(await screen.findByRole('heading', { name: /Inventaire — RDC/ })).toBeInTheDocument()
  })

  it('shows empty state when no inventaire items', async () => {
    setupMocks([])
    renderRoute('/chantiers/ch1/plots/p1/e1/inventaire')

    expect(await screen.findByText('Aucun matériel enregistré')).toBeInTheDocument()
  })

  it('shows inventaire items', async () => {
    setupMocks(mockInventaireEtage)
    renderRoute('/chantiers/ch1/plots/p1/e1/inventaire')

    expect(await screen.findByText('Carrelage 60x60')).toBeInTheDocument()
    expect(screen.getByText('Total: 20')).toBeInTheDocument()
  })

  it('shows "Retourner" as transfer button label', async () => {
    setupMocks(mockInventaireEtage)
    renderRoute('/chantiers/ch1/plots/p1/e1/inventaire')

    await screen.findByText('Carrelage 60x60')
    expect(screen.getByRole('button', { name: /Retourner Carrelage/ })).toBeInTheDocument()
  })

  it('has back link to étage page', async () => {
    setupMocks()
    renderRoute('/chantiers/ch1/plots/p1/e1/inventaire')

    await screen.findByRole('heading', { name: /Inventaire — RDC/ })
    expect(screen.getByRole('link', { name: 'Retour' })).toHaveAttribute(
      'href',
      '/chantiers/ch1/plots/p1/e1',
    )
  })

  it('opens creation sheet with lot selector', async () => {
    const user = userEvent.setup()
    setupMocks()
    renderRoute('/chantiers/ch1/plots/p1/e1/inventaire')

    await screen.findByRole('heading', { name: /Inventaire — RDC/ })
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))

    expect(await screen.findByText('Nouveau matériel')).toBeInTheDocument()
    expect(screen.getByLabelText('Désignation')).toBeInTheDocument()
    expect(screen.getByLabelText('Quantité')).toBeInTheDocument()
    expect(screen.getByLabelText('Sélectionner un lot')).toBeInTheDocument()
  })
})
