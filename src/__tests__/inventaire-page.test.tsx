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

const mockChantier = {
  id: 'abc-123',
  nom: 'Les Oliviers',
  type: 'complet' as const,
  status: 'active' as const,
  progress_done: 3,
  progress_total: 10,
  created_at: '2026-01-01T00:00:00Z',
  created_by: 'user-1',
}

const mockPlots = [
  { id: 'p1', chantier_id: 'abc-123', nom: 'Plot A', order_index: 0, tasks: [], progress_done: 0, progress_total: 0, created_at: '2026-01-01' },
]

const mockEtages = [
  { id: 'e1', plot_id: 'p1', nom: 'RDC', order_index: 0, progress_done: 0, progress_total: 0, created_at: '2026-01-01' },
]

const mockInventaireGeneral = [
  {
    id: 'inv1',
    chantier_id: 'abc-123',
    plot_id: null,
    etage_id: null,
    lot_id: null,
    designation: 'Colle faïence 20kg',
    quantite: 12,
    source: null,
    created_at: '2026-02-10T10:00:00Z',
    created_by: 'user-1',
    plots: null,
    etages: null,
    lots: null,
  },
]

const mockSearchResults = [
  {
    id: 'inv1',
    chantier_id: 'abc-123',
    plot_id: null,
    etage_id: null,
    lot_id: null,
    designation: 'Tubes PER 16mm',
    quantite: 20,
    source: null,
    created_at: '2026-03-10T10:00:00Z',
    created_by: 'user-1',
    plots: null,
    etages: null,
    lots: null,
  },
  {
    id: 'inv2',
    chantier_id: 'abc-123',
    plot_id: 'p1',
    etage_id: 'e1',
    lot_id: null,
    designation: 'Tubes PER 20mm',
    quantite: 15,
    source: null,
    created_at: '2026-03-10T11:00:00Z',
    created_by: 'user-1',
    plots: { nom: 'Bât. A' },
    etages: { nom: 'RDC' },
    lots: null,
  },
]

function setupMocks(inventaire: unknown[] = [], searchResults?: unknown[]) {
  vi.mocked(supabase.from).mockImplementation((table: string) => {
    if (table === 'chantiers') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockChantier, error: null }),
          }),
        }),
      } as never
    }
    if (table === 'inventaire') {
      const orderFn2 = vi.fn().mockResolvedValue({ data: inventaire, error: null })
      const orderFn1 = vi.fn().mockReturnValue({ order: orderFn2 })
      const isFn = vi.fn().mockReturnValue({ is: vi.fn().mockReturnValue({ order: orderFn1 }) })

      // Search chain: eq → ilike → order → order
      const searchOrderFn2 = vi.fn().mockResolvedValue({ data: searchResults ?? [], error: null })
      const searchOrderFn1 = vi.fn().mockReturnValue({ order: searchOrderFn2 })
      const ilikeFn = vi.fn().mockReturnValue({ order: searchOrderFn1 })

      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: isFn,
            ilike: ilikeFn,
            order: orderFn1,
          }),
        }),
      } as never
    }
    if (table === 'plots') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockPlots, error: null }),
          }),
        }),
      } as never
    }
    if (table === 'etages') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockEtages, error: null }),
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

describe('InventairePage — Stockage général', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupChannelMock(supabase as unknown as { channel: ReturnType<typeof vi.fn> })
  })

  it('renders heading with chantier name', async () => {
    setupMocks()
    renderRoute('/chantiers/abc-123/inventaire')

    expect(await screen.findByRole('heading', { name: /Stockage général — Les Oliviers/ })).toBeInTheDocument()
  })

  it('shows empty state when no inventaire items', async () => {
    setupMocks([])
    renderRoute('/chantiers/abc-123/inventaire')

    expect(await screen.findByText('Aucun matériel enregistré')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ajouter du matériel' })).toBeInTheDocument()
  })

  it('shows inventaire items in aggregated mode', async () => {
    setupMocks(mockInventaireGeneral)
    renderRoute('/chantiers/abc-123/inventaire')

    expect(await screen.findByText('Colle faïence 20kg')).toBeInTheDocument()
    expect(screen.getByText('Total: 12')).toBeInTheDocument()
    expect(screen.getByText('1 matériaux enregistrés')).toBeInTheDocument()
  })

  it('shows FAB button', async () => {
    setupMocks()
    renderRoute('/chantiers/abc-123/inventaire')

    await screen.findByRole('heading', { name: /Stockage général — Les Oliviers/ })
    expect(screen.getByRole('button', { name: 'Ajouter' })).toBeInTheDocument()
  })

  it('has back link to chantier detail', async () => {
    setupMocks()
    renderRoute('/chantiers/abc-123/inventaire')

    await screen.findByRole('heading', { name: /Stockage général — Les Oliviers/ })
    expect(screen.getByRole('link', { name: 'Retour' })).toHaveAttribute(
      'href',
      '/chantiers/abc-123',
    )
  })
})

describe('InventairePage — Sheet creation (stockage général)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupChannelMock(supabase as unknown as { channel: ReturnType<typeof vi.fn> })
  })

  it('opens creation sheet with simplified form (no plot/étage selectors)', async () => {
    const user = userEvent.setup()
    setupMocks()
    renderRoute('/chantiers/abc-123/inventaire')

    await screen.findByRole('heading', { name: /Stockage général — Les Oliviers/ })
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))

    expect(await screen.findByText('Nouveau matériel')).toBeInTheDocument()
    expect(screen.getByLabelText('Désignation')).toBeInTheDocument()
    expect(screen.getByLabelText('Quantité')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ajouter le matériel' })).toBeInTheDocument()
    // No plot/étage selectors in stockage général mode
    expect(screen.queryByLabelText('Sélectionner un plot')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Sélectionner un étage')).not.toBeInTheDocument()
    expect(screen.queryByText('Stockage général')).not.toBeInTheDocument()
  })

  it('shows designation validation error on empty submit', async () => {
    const user = userEvent.setup()
    setupMocks()
    renderRoute('/chantiers/abc-123/inventaire')

    await screen.findByRole('heading', { name: /Stockage général — Les Oliviers/ })
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))
    await screen.findByText('Nouveau matériel')

    await user.click(screen.getByRole('button', { name: 'Ajouter le matériel' }))

    expect(await screen.findByText('La désignation est requise')).toBeInTheDocument()
  })
})

describe('InventairePage — Edit mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupChannelMock(supabase as unknown as { channel: ReturnType<typeof vi.fn> })
  })

  it('opens edit sheet with pre-filled data when edit button is clicked', async () => {
    const user = userEvent.setup()
    setupMocks(mockInventaireGeneral)
    renderRoute('/chantiers/abc-123/inventaire')

    await screen.findByText('Colle faïence 20kg')

    await user.click(screen.getByRole('button', { name: /Modifier Colle faïence/ }))

    expect(await screen.findByText('Modifier le matériel')).toBeInTheDocument()
    expect(screen.getByLabelText('Désignation')).toHaveValue('Colle faïence 20kg')
    expect(screen.getByLabelText('Quantité')).toHaveValue('12')
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeInTheDocument()
  })
})

describe('InventairePage — Transfer button', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupChannelMock(supabase as unknown as { channel: ReturnType<typeof vi.fn> })
  })

  it('shows transfer button on each item', async () => {
    setupMocks(mockInventaireGeneral)
    renderRoute('/chantiers/abc-123/inventaire')

    await screen.findByText('Colle faïence 20kg')
    expect(screen.getByRole('button', { name: /Transférer Colle faïence/ })).toBeInTheDocument()
  })
})

describe('InventairePage — Recherche globale', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupChannelMock(supabase as unknown as { channel: ReturnType<typeof vi.fn> })
  })

  it('shows search input on page load', async () => {
    setupMocks(mockInventaireGeneral)
    renderRoute('/chantiers/abc-123/inventaire')

    expect(await screen.findByLabelText('Rechercher un matériau')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Rechercher un matériau…')).toBeInTheDocument()
  })

  it('does not trigger search with 1 character', async () => {
    const user = userEvent.setup()
    setupMocks(mockInventaireGeneral)
    renderRoute('/chantiers/abc-123/inventaire')

    await screen.findByText('Colle faïence 20kg')

    await user.type(screen.getByLabelText('Rechercher un matériau'), 'a')

    // Should still show general storage items (no search mode)
    expect(screen.getByText('1 matériaux enregistrés')).toBeInTheDocument()
  })

  it('shows cross-étage results when typing 2+ characters', async () => {
    const user = userEvent.setup()
    setupMocks(mockInventaireGeneral, mockSearchResults)
    renderRoute('/chantiers/abc-123/inventaire')

    await screen.findByText('Colle faïence 20kg')

    await user.type(screen.getByLabelText('Rechercher un matériau'), 'tube')

    expect(await screen.findByText(/résultats sur tout le chantier/)).toBeInTheDocument()
    expect(await screen.findByText('Tubes PER 16mm')).toBeInTheDocument()
    expect(await screen.findByText('Tubes PER 20mm')).toBeInTheDocument()
  })

  it('shows result count in search mode', async () => {
    const user = userEvent.setup()
    setupMocks(mockInventaireGeneral, mockSearchResults)
    renderRoute('/chantiers/abc-123/inventaire')

    await screen.findByText('Colle faïence 20kg')

    await user.type(screen.getByLabelText('Rechercher un matériau'), 'tube')

    expect(await screen.findByText('2 résultats sur tout le chantier')).toBeInTheDocument()
  })

  it('shows "no results" message when search finds nothing', async () => {
    const user = userEvent.setup()
    setupMocks(mockInventaireGeneral, [])
    renderRoute('/chantiers/abc-123/inventaire')

    await screen.findByText('Colle faïence 20kg')

    await user.type(screen.getByLabelText('Rechercher un matériau'), 'xyz')

    expect(await screen.findByText(/Aucun matériau trouvé pour/)).toBeInTheDocument()
  })

  it('allows editing an item in search mode (AC7)', async () => {
    const user = userEvent.setup()
    setupMocks(mockInventaireGeneral, mockSearchResults)
    renderRoute('/chantiers/abc-123/inventaire')

    await screen.findByText('Colle faïence 20kg')

    await user.type(screen.getByLabelText('Rechercher un matériau'), 'tube')
    await screen.findByText('Tubes PER 16mm')

    await user.click(screen.getByRole('button', { name: /Modifier Tubes PER 16mm/ }))

    expect(await screen.findByText('Modifier le matériel')).toBeInTheDocument()
    expect(screen.getByLabelText('Désignation')).toHaveValue('Tubes PER 16mm')
  })

  it('shows X button and clears search on click', async () => {
    const user = userEvent.setup()
    setupMocks(mockInventaireGeneral, mockSearchResults)
    renderRoute('/chantiers/abc-123/inventaire')

    await screen.findByText('Colle faïence 20kg')

    await user.type(screen.getByLabelText('Rechercher un matériau'), 'tube')
    expect(screen.getByLabelText('Effacer la recherche')).toBeInTheDocument()

    await user.click(screen.getByLabelText('Effacer la recherche'))

    // Back to general storage view
    expect(await screen.findByText('1 matériaux enregistrés')).toBeInTheDocument()
  })
})
