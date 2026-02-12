import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupChannelMock, renderRoute } from '@/test/route-test-utils'

// Polyfill for Radix UI Select — methods not available in JSDOM
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {}
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {}
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}

vi.mock('sonner', () => {
  const toast = vi.fn() as ReturnType<typeof vi.fn> & { error: ReturnType<typeof vi.fn> }
  toast.error = vi.fn()
  return { toast }
})

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1', email: 'test@test.fr' } } }) },
    storage: { from: vi.fn().mockReturnValue({ upload: vi.fn(), getPublicUrl: vi.fn() }) },
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue({}),
      }),
    }),
    removeChannel: vi.fn(),
  },
}))

vi.mock('@/lib/utils/compressImage', () => ({
  compressPhoto: vi.fn().mockResolvedValue(new File(['c'], 'c.jpg', { type: 'image/jpeg' })),
}))

vi.mock('@/lib/mutations/useUpdateChantierStatus', () => ({
  useUpdateChantierStatus: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}))

vi.mock('@/lib/mutations/useCreatePlot', () => ({
  useCreatePlot: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  DEFAULT_TASK_DEFINITIONS: ['Ragréage', 'Phonique', 'Pose', 'Plinthes', 'Joints', 'Silicone'],
}))

vi.mock('@/lib/mutations/useUpdatePlotTasks', () => ({
  useUpdatePlotTasks: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}))

vi.mock('@/lib/mutations/useDeletePlot', () => ({
  useDeletePlot: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}))

vi.mock('@/lib/mutations/useCreateVariante', () => ({
  useCreateVariante: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}))

vi.mock('@/lib/mutations/useDeleteVariante', () => ({
  useDeleteVariante: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}))

vi.mock('@/lib/mutations/useAddVariantePiece', () => ({
  useAddVariantePiece: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}))

vi.mock('@/lib/mutations/useDeleteVariantePiece', () => ({
  useDeleteVariantePiece: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}))

vi.mock('@/lib/mutations/useAddVarianteDocument', () => ({
  useAddVarianteDocument: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}))

vi.mock('@/lib/mutations/useDeleteVarianteDocument', () => ({
  useDeleteVarianteDocument: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}))

vi.mock('@/lib/mutations/useToggleDocumentRequired', () => ({
  useToggleDocumentRequired: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}))

vi.mock('@/lib/mutations/useCreateLot', () => ({
  useCreateLot: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}))

vi.mock('@/lib/mutations/useCreateBatchLots', () => ({
  useCreateBatchLots: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}))

vi.mock('@/lib/mutations/useToggleLotTma', () => ({
  useToggleLotTma: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}))

const mockUpdatePlinthStatus = vi.fn()
vi.mock('@/lib/mutations/useUpdatePlinthStatus', () => ({
  useUpdatePlinthStatus: () => ({
    mutate: mockUpdatePlinthStatus,
    isPending: false,
  }),
}))

vi.mock('@/lib/mutations/useAddLotPiece', () => ({
  useAddLotPiece: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}))

vi.mock('@/lib/mutations/useAddLotTask', () => ({
  useAddLotTask: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}))

vi.mock('@/lib/mutations/useAddLotDocument', () => ({
  useAddLotDocument: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}))

import { supabase } from '@/lib/supabase'

const mockChantier = {
  id: 'chantier-1',
  nom: 'Les Oliviers',
  type: 'complet' as const,
  status: 'active' as const,
  progress_done: 0,
  progress_total: 0,
  created_at: '2026-01-01T00:00:00Z',
  created_by: 'user-1',
}

const mockPlot = {
  id: 'plot-1',
  chantier_id: 'chantier-1',
  nom: 'Plot A',
  task_definitions: ['Ragréage'],
  progress_done: 0,
  progress_total: 0,
  created_at: '2026-01-01T00:00:00Z',
}

const mockEtages = [
  { id: 'etage-1', plot_id: 'plot-1', nom: 'RDC', progress_done: 0, progress_total: 0, created_at: '2026-01-01T00:00:00Z' },
]

const mockLot = {
  id: 'lot-1',
  etage_id: 'etage-1',
  variante_id: 'var-1',
  plot_id: 'plot-1',
  code: '203',
  is_tma: true,
  has_blocking_note: false,
  has_missing_docs: false,
  progress_done: 1,
  progress_total: 2,
  created_at: '2026-01-01T00:00:00Z',
  metrage_m2_total: 12.5,
  metrage_ml_total: 8.2,
  plinth_status: 'non_commandees',
  etages: { nom: 'RDC' },
  variantes: { nom: 'Type A' },
  pieces: [{ count: 3 }],
}

const mockPieces = [
  {
    id: 'piece-1',
    lot_id: 'lot-1',
    nom: 'Séjour',
    progress_done: 1,
    progress_total: 2,
    created_at: '2026-01-01T00:00:00Z',
    taches: [
      { id: 't1', piece_id: 'piece-1', nom: 'Ragréage', status: 'done', created_at: '2026-01-01T00:00:00Z' },
      { id: 't2', piece_id: 'piece-1', nom: 'Pose', status: 'not_started', created_at: '2026-01-01T00:00:00Z' },
    ],
  },
]

const mockDocuments = [
  { id: 'doc-1', lot_id: 'lot-1', nom: 'PV Pose', is_required: true, file_url: 'path/to/pv.pdf', file_name: 'pv.pdf', created_at: '2026-01-01T00:00:00Z' },
]

const mockNotes = [
  {
    id: 'note-1',
    lot_id: 'lot-1',
    piece_id: null,
    content: 'Fissure au plafond',
    is_blocking: true,
    created_by: 'user-1',
    created_by_email: 'bruno@test.fr',
    photo_url: null,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
]

function setupMockSupabase(options?: {
  lots?: typeof mockLot[]
  pieces?: typeof mockPieces
  documents?: typeof mockDocuments
  notes?: typeof mockNotes
}) {
  const lots = options?.lots ?? [mockLot]
  const pieces = options?.pieces ?? mockPieces
  const documents = options?.documents ?? mockDocuments
  const notes = options?.notes ?? mockNotes

  vi.mocked(supabase.from).mockImplementation((table: string) => {
    if (table === 'chantiers') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockImplementation((_col: string, val: unknown) => {
            if (val === 'chantier-1') {
              return { single: vi.fn().mockResolvedValue({ data: mockChantier, error: null }) }
            }
            return { order: vi.fn().mockResolvedValue({ data: [], error: null }) }
          }),
        }),
      } as never
    }
    if (table === 'plots') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [mockPlot], error: null }),
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
    if (table === 'variantes') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      } as never
    }
    if (table === 'pieces') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: pieces, error: null }),
          }),
        }),
      } as never
    }
    if (table === 'lot_documents') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: documents, error: null }),
          }),
        }),
      } as never
    }
    if (table === 'notes') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: notes, error: null }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'new-note' }, error: null }),
          }),
        }),
      } as never
    }
    return { select: vi.fn() } as never
  })
}

describe('LotIndexPage (etage route)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupChannelMock(supabase)
  })

  it('renders lot code in heading', async () => {
    setupMockSupabase()
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1/lot-1')

    expect(await screen.findByRole('heading', { name: 'Lot 203' })).toBeInTheDocument()
  })

  it('shows TMA badge', async () => {
    setupMockSupabase()
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1/lot-1')

    await screen.findByRole('heading', { name: 'Lot 203' })
    expect(screen.getByText('TMA', { selector: '.border-amber-500' })).toBeInTheDocument()
  })

  it('shows pieces with task progress', async () => {
    setupMockSupabase()
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1/lot-1')

    expect(await screen.findByText('Séjour')).toBeInTheDocument()
    expect(screen.getByText('1/2 tâches')).toBeInTheDocument()
  })

  it('shows documents list', async () => {
    setupMockSupabase()
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1/lot-1')

    expect(await screen.findByText('PV Pose')).toBeInTheDocument()
    expect(screen.getByText('Obligatoire')).toBeInTheDocument()
  })

  it('shows "Aucun document" when documents list is empty', async () => {
    setupMockSupabase({ documents: [] })
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1/lot-1')

    expect(await screen.findByText('Aucun document')).toBeInTheDocument()
  })
})

const filterPieces = [
  {
    id: 'p-a',
    lot_id: 'lot-1',
    nom: 'Séjour',
    progress_done: 1,
    progress_total: 3,
    created_at: '2026-01-01T00:00:00Z',
    taches: [],
  },
  {
    id: 'p-b',
    lot_id: 'lot-1',
    nom: 'Cuisine',
    progress_done: 2,
    progress_total: 2,
    created_at: '2026-01-02T00:00:00Z',
    taches: [],
  },
  {
    id: 'p-c',
    lot_id: 'lot-1',
    nom: 'SDB',
    progress_done: 0,
    progress_total: 2,
    created_at: '2026-01-03T00:00:00Z',
    taches: [],
  },
]

describe('LotIndexPage — GridFilterTabs on pieces (AC #1, #7)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupChannelMock(supabase)
  })

  it('shows filter tabs when pieces exist', async () => {
    setupMockSupabase({ pieces: filterPieces })
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1/lot-1')

    expect(await screen.findByRole('tablist')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Tous/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /En cours/i })).toBeInTheDocument()
  })

  it('"En cours" filter shows only partially completed pieces', async () => {
    const user = userEvent.setup()
    setupMockSupabase({ pieces: filterPieces })
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1/lot-1')

    await screen.findByRole('tablist')
    await user.click(screen.getByRole('tab', { name: /En cours/i }))

    expect(screen.getByText('Séjour')).toBeInTheDocument()
    expect(screen.queryByText('Cuisine')).not.toBeInTheDocument()
    expect(screen.queryByText('SDB')).not.toBeInTheDocument()
  })

  it('"Terminés" filter shows only fully completed pieces', async () => {
    const user = userEvent.setup()
    setupMockSupabase({ pieces: filterPieces })
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1/lot-1')

    await screen.findByRole('tablist')
    await user.click(screen.getByRole('tab', { name: /Terminés/i }))

    expect(screen.getByText('Cuisine')).toBeInTheDocument()
    expect(screen.queryByText('Séjour')).not.toBeInTheDocument()
    expect(screen.queryByText('SDB')).not.toBeInTheDocument()
  })
})

describe('LotIndexPage — Missing docs banner (AC #1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupChannelMock(supabase)
  })

  it('shows missing docs banner when required docs have no file', async () => {
    const docsWithMissing = [
      { id: 'd1', lot_id: 'lot-1', nom: 'Plan de pose', is_required: true, file_url: null, file_name: null, created_at: '2026-01-01T00:00:00Z' },
      { id: 'd2', lot_id: 'lot-1', nom: 'Notice', is_required: true, file_url: 'path/to/file.pdf', file_name: 'notice.pdf', created_at: '2026-01-01T00:00:00Z' },
      { id: 'd3', lot_id: 'lot-1', nom: 'Fiche de choix', is_required: true, file_url: null, file_name: null, created_at: '2026-01-01T00:00:00Z' },
      { id: 'd4', lot_id: 'lot-1', nom: 'Attestation', is_required: false, file_url: null, file_name: null, created_at: '2026-01-01T00:00:00Z' },
    ]
    setupMockSupabase({ documents: docsWithMissing })
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1/lot-1')

    expect(await screen.findByText('2 documents obligatoires manquants')).toBeInTheDocument()
    expect(screen.getByText('Plan de pose, Fiche de choix')).toBeInTheDocument()
  })

  it('shows singular text when only one required doc is missing', async () => {
    const docsWithOneMissing = [
      { id: 'd1', lot_id: 'lot-1', nom: 'Plan de pose', is_required: true, file_url: null, file_name: null, created_at: '2026-01-01T00:00:00Z' },
      { id: 'd2', lot_id: 'lot-1', nom: 'Notice', is_required: true, file_url: 'path/to/file.pdf', file_name: 'notice.pdf', created_at: '2026-01-01T00:00:00Z' },
    ]
    setupMockSupabase({ documents: docsWithOneMissing })
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1/lot-1')

    expect(await screen.findByText('1 document obligatoire manquant')).toBeInTheDocument()
    // "Plan de pose" appears both in banner and DocumentSlot — check via aria-label
    expect(screen.getByLabelText('Documents manquants')).toBeInTheDocument()
  })

  it('does not show banner when all required docs have files', async () => {
    const allUploaded = [
      { id: 'd1', lot_id: 'lot-1', nom: 'Plan de pose', is_required: true, file_url: 'path/to/plan.pdf', file_name: 'plan.pdf', created_at: '2026-01-01T00:00:00Z' },
      { id: 'd2', lot_id: 'lot-1', nom: 'Notice', is_required: true, file_url: 'path/to/notice.pdf', file_name: 'notice.pdf', created_at: '2026-01-01T00:00:00Z' },
    ]
    setupMockSupabase({ documents: allUploaded })
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1/lot-1')

    await screen.findByRole('heading', { name: 'Lot 203' })
    expect(screen.queryByText(/document.*obligatoire.*manquant/i)).not.toBeInTheDocument()
  })

  it('does not show banner when only optional docs lack files', async () => {
    const optionalOnly = [
      { id: 'd1', lot_id: 'lot-1', nom: 'Attestation', is_required: false, file_url: null, file_name: null, created_at: '2026-01-01T00:00:00Z' },
    ]
    setupMockSupabase({ documents: optionalOnly })
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1/lot-1')

    await screen.findByRole('heading', { name: 'Lot 203' })
    expect(screen.queryByText(/document.*obligatoire.*manquant/i)).not.toBeInTheDocument()
  })

  it('shows FileWarning icon with correct aria-label', async () => {
    const docsWithMissing = [
      { id: 'd1', lot_id: 'lot-1', nom: 'Plan', is_required: true, file_url: null, file_name: null, created_at: '2026-01-01T00:00:00Z' },
    ]
    setupMockSupabase({ documents: docsWithMissing })
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1/lot-1')

    expect(await screen.findByLabelText('Documents manquants')).toBeInTheDocument()
  })
})

describe('LotIndexPage — Plinth status selector (AC #1, #2, #4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupChannelMock(supabase)
  })

  it('shows plinth status selector when metrage_ml_total > 0', async () => {
    setupMockSupabase()
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1/lot-1')

    await screen.findByRole('heading', { name: 'Lot 203' })
    expect(screen.getByText('Plinthes')).toBeInTheDocument()
    expect(screen.getByText('Non commandées')).toBeInTheDocument()
  })

  it('hides plinth status selector when metrage_ml_total is 0', async () => {
    const lotNoMl = { ...mockLot, metrage_ml_total: 0 }
    setupMockSupabase({ lots: [lotNoMl] })
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1/lot-1')

    await screen.findByRole('heading', { name: 'Lot 203' })
    expect(screen.queryByText('Plinthes')).not.toBeInTheDocument()
  })

  it('calls updatePlinthStatus on select change', async () => {
    const user = userEvent.setup()
    setupMockSupabase()
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1/lot-1')

    await screen.findByRole('heading', { name: 'Lot 203' })
    await user.click(screen.getByRole('combobox', { name: 'Plinthes' }))
    await user.click(screen.getByRole('option', { name: 'Commandées' }))

    expect(mockUpdatePlinthStatus).toHaveBeenCalledWith({
      lotId: 'lot-1',
      plinthStatus: 'commandees',
      plotId: 'plot-1',
    })
  })
})

describe('LotIndexPage — Notes integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupChannelMock(supabase)
  })

  it('shows Notes heading and note content', async () => {
    setupMockSupabase()
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1/lot-1')

    expect(await screen.findByRole('heading', { name: 'Notes' })).toBeInTheDocument()
    expect(await screen.findByText('Fissure au plafond')).toBeInTheDocument()
  })

  it('shows blocking badge on blocking note', async () => {
    setupMockSupabase()
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1/lot-1')

    await screen.findByText('Fissure au plafond')
    expect(screen.getByText('Bloquant')).toBeInTheDocument()
  })

  it('shows "Aucune note" when no notes exist', async () => {
    setupMockSupabase({ notes: [] })
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1/lot-1')

    expect(await screen.findByText('Aucune note')).toBeInTheDocument()
  })

  it('renders FAB button', async () => {
    setupMockSupabase()
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1/lot-1')

    await screen.findByRole('heading', { name: 'Lot 203' })
    expect(screen.getByRole('button', { name: 'Ajouter' })).toBeInTheDocument()
  })

  it('opens FAB menu with Note and Photo items', async () => {
    const user = userEvent.setup()
    setupMockSupabase()
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1/lot-1')

    await screen.findByRole('heading', { name: 'Lot 203' })
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))

    expect(screen.getByText('Note')).toBeInTheDocument()
    expect(screen.getByText('Photo')).toBeInTheDocument()
  })

  it('opens NoteForm when Note menu item is clicked', async () => {
    const user = userEvent.setup()
    setupMockSupabase()
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1/lot-1')

    await screen.findByRole('heading', { name: 'Lot 203' })
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))
    await user.click(screen.getByText('Note'))

    expect(await screen.findByText('Nouvelle note')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Écrire une note...')).toBeInTheDocument()
  })
})
