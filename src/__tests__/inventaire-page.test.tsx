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

const mockLots = [
  { id: 'lot1', etage_id: 'e1', plot_id: 'p1', code: '101', variante_id: 'v1', position: 1, progress_done: 0, progress_total: 0, has_blocking_note: false, has_open_reservation: false, has_missing_docs: false, has_inventaire: false, metrage_m2_total: 0, metrage_ml_total: 0, plinth_status: 'non_commandees', created_at: '2026-01-01', etages: { nom: 'RDC' }, variantes: { nom: 'T2' }, pieces: [{ count: 0 }], lot_badge_assignments: [] },
]

const mockInventaire = [
  {
    id: 'inv1',
    chantier_id: 'abc-123',
    plot_id: 'p1',
    etage_id: 'e1',
    lot_id: null,
    designation: 'Colle faïence 20kg',
    quantite: 12,
    created_at: '2026-02-10T10:00:00Z',
    created_by: 'user-1',
    plots: { nom: 'Plot A' },
    etages: { nom: 'RDC' },
    lots: null,
  },
]

function setupMocks(inventaire: unknown[] = [], lots: unknown[] = []) {
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
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: inventaire, error: null }),
            }),
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
    if (table === 'lots') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: lots, error: null }),
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

describe('InventairePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupChannelMock(supabase as unknown as { channel: ReturnType<typeof vi.fn> })
  })

  it('renders heading with chantier name', async () => {
    setupMocks()
    renderRoute('/chantiers/abc-123/inventaire')

    expect(await screen.findByRole('heading', { name: /Inventaire — Les Oliviers/ })).toBeInTheDocument()
  })

  it('shows empty state when no inventaire items', async () => {
    setupMocks([])
    renderRoute('/chantiers/abc-123/inventaire')

    expect(await screen.findByText('Aucun matériel enregistré')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ajouter du matériel' })).toBeInTheDocument()
  })

  it('shows inventaire items in aggregated mode', async () => {
    setupMocks(mockInventaire)
    renderRoute('/chantiers/abc-123/inventaire')

    expect(await screen.findByText('Colle faïence 20kg')).toBeInTheDocument()
    expect(screen.getByText('Total: 12')).toBeInTheDocument()
    expect(screen.getByText('1 matériaux enregistrés')).toBeInTheDocument()
  })

  it('shows FAB button', async () => {
    setupMocks()
    renderRoute('/chantiers/abc-123/inventaire')

    await screen.findByRole('heading', { name: /Inventaire — Les Oliviers/ })
    expect(screen.getByRole('button', { name: 'Ajouter' })).toBeInTheDocument()
  })

  it('has back link to chantier detail', async () => {
    setupMocks()
    renderRoute('/chantiers/abc-123/inventaire')

    await screen.findByRole('heading', { name: /Inventaire — Les Oliviers/ })
    expect(screen.getByRole('link', { name: 'Retour' })).toHaveAttribute(
      'href',
      '/chantiers/abc-123',
    )
  })
})

describe('InventairePage — Sheet creation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupChannelMock(supabase as unknown as { channel: ReturnType<typeof vi.fn> })
  })

  it('opens creation sheet when FAB is clicked', async () => {
    const user = userEvent.setup()
    setupMocks()
    renderRoute('/chantiers/abc-123/inventaire')

    await screen.findByRole('heading', { name: /Inventaire — Les Oliviers/ })
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))

    expect(await screen.findByText('Nouveau matériel')).toBeInTheDocument()
    expect(screen.getByLabelText('Désignation')).toBeInTheDocument()
    expect(screen.getByLabelText('Quantité')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ajouter le matériel' })).toBeInTheDocument()
  })

  it('shows designation validation error on empty submit', async () => {
    const user = userEvent.setup()
    setupMocks()
    renderRoute('/chantiers/abc-123/inventaire')

    await screen.findByRole('heading', { name: /Inventaire — Les Oliviers/ })
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))
    await screen.findByText('Nouveau matériel')

    await user.click(screen.getByRole('button', { name: 'Ajouter le matériel' }))

    expect(await screen.findByText('La désignation est requise')).toBeInTheDocument()
  })

  it('shows plot validation error when plot not selected', async () => {
    const user = userEvent.setup()
    setupMocks()
    renderRoute('/chantiers/abc-123/inventaire')

    await screen.findByRole('heading', { name: /Inventaire — Les Oliviers/ })
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))
    await screen.findByText('Nouveau matériel')

    // Fill designation but leave plot/étage empty
    const designationInput = screen.getByLabelText('Désignation')
    await user.type(designationInput, 'Colle test')

    await user.click(screen.getByRole('button', { name: 'Ajouter le matériel' }))

    expect(await screen.findByText('Le plot est requis')).toBeInTheDocument()
  })

  it('shows étage validation error when étage not selected', async () => {
    const user = userEvent.setup()
    setupMocks()
    renderRoute('/chantiers/abc-123/inventaire')

    await screen.findByRole('heading', { name: /Inventaire — Les Oliviers/ })
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))
    await screen.findByText('Nouveau matériel')

    // Fill designation but leave étage empty
    const designationInput = screen.getByLabelText('Désignation')
    await user.type(designationInput, 'Colle test')

    await user.click(screen.getByRole('button', { name: 'Ajouter le matériel' }))

    expect(await screen.findByText("L'étage est requis")).toBeInTheDocument()
  })
})

describe('InventairePage — Edit mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupChannelMock(supabase as unknown as { channel: ReturnType<typeof vi.fn> })
  })

  it('opens edit sheet with pre-filled data when edit button is clicked', async () => {
    const user = userEvent.setup()
    setupMocks(mockInventaire)
    renderRoute('/chantiers/abc-123/inventaire')

    await screen.findByText('Colle faïence 20kg')

    await user.click(screen.getByRole('button', { name: /Modifier Colle faïence/ }))

    expect(await screen.findByText('Modifier le matériel')).toBeInTheDocument()
    expect(screen.getByLabelText('Désignation')).toHaveValue('Colle faïence 20kg')
    expect(screen.getByLabelText('Quantité')).toHaveValue('12')
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeInTheDocument()
  })
})

describe('InventairePage — Lot selector (AC3, AC5)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupChannelMock(supabase as unknown as { channel: ReturnType<typeof vi.fn> })
  })

  it('shows lot selector when plot+étage are pre-selected and lots exist (AC3)', async () => {
    const user = userEvent.setup()
    setupMocks([], mockLots)
    renderRoute('/chantiers/abc-123/inventaire?plotId=p1&etageId=e1')

    await screen.findByRole('heading', { name: /Inventaire — Les Oliviers/ })
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))
    await screen.findByText('Nouveau matériel')

    expect(screen.getByText('Lot (optionnel)')).toBeInTheDocument()
    expect(screen.getByLabelText('Sélectionner un lot')).toBeInTheDocument()
  })

  it('hides lot selector when no lots exist for étage', async () => {
    const user = userEvent.setup()
    setupMocks([], [])
    renderRoute('/chantiers/abc-123/inventaire?plotId=p1&etageId=e1')

    await screen.findByRole('heading', { name: /Inventaire — Les Oliviers/ })
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))
    await screen.findByText('Nouveau matériel')

    expect(screen.queryByText('Lot (optionnel)')).not.toBeInTheDocument()
  })

  it('hides lot selector in stockage général mode (AC5)', async () => {
    const user = userEvent.setup()
    setupMocks([], mockLots)
    renderRoute('/chantiers/abc-123/inventaire?plotId=p1&etageId=e1')

    await screen.findByRole('heading', { name: /Inventaire — Les Oliviers/ })
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))
    await screen.findByText('Nouveau matériel')

    // Lot selector should be visible initially
    expect(screen.getByText('Lot (optionnel)')).toBeInTheDocument()

    // Toggle stockage général
    await user.click(screen.getByRole('switch'))

    // Lot selector should be hidden
    expect(screen.queryByText('Lot (optionnel)')).not.toBeInTheDocument()
    // Plot and étage selectors also hidden
    expect(screen.queryByLabelText('Sélectionner un plot')).not.toBeInTheDocument()
  })
})
