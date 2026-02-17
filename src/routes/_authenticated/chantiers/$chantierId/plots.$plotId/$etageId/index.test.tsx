import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupChannelMock, renderRoute } from '@/test/route-test-utils'

vi.mock('sonner', () => {
  const toast = vi.fn() as ReturnType<typeof vi.fn> & { error: ReturnType<typeof vi.fn> }
  toast.error = vi.fn()
  return { toast }
})

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
  created_at: '2026-01-01T00:00:00Z',
}

const mockEtages = [
  { id: 'etage-1', plot_id: 'plot-1', nom: 'RDC', progress_done: 0, progress_total: 0, created_at: '2026-01-01T00:00:00Z' },
]

const mockLots = [
  {
    id: 'lot-1',
    etage_id: 'etage-1',
    variante_id: 'var-1',
    plot_id: 'plot-1',
    code: '001',
    is_tma: false,
    has_blocking_note: false,
    has_missing_docs: false,
    progress_done: 3,
    progress_total: 5,
    metrage_m2_total: 25.5,
    metrage_ml_total: 16.4,
    plinth_status: 'non_commandees',
    created_at: '2026-01-01T00:00:00Z',
    etages: { nom: 'RDC' },
    variantes: { nom: 'Type A' },
    pieces: [{ count: 4 }],
  },
  {
    id: 'lot-2',
    etage_id: 'etage-1',
    variante_id: 'var-2',
    plot_id: 'plot-1',
    code: '002',
    is_tma: true,
    has_blocking_note: false,
    has_missing_docs: false,
    progress_done: 5,
    progress_total: 5,
    metrage_m2_total: 0,
    metrage_ml_total: 0,
    plinth_status: 'non_commandees',
    created_at: '2026-01-02T00:00:00Z',
    etages: { nom: 'RDC' },
    variantes: { nom: 'Type B' },
    pieces: [{ count: 3 }],
  },
]

function setupMockSupabase(lots: typeof mockLots = mockLots) {
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
    if (table === 'lot_documents') {
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
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      } as never
    }
    return { select: vi.fn() } as never
  })
}

describe('EtageIndexPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupChannelMock(supabase)
  })

  it('renders etage name in heading', async () => {
    setupMockSupabase()
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1')

    expect(await screen.findByRole('heading', { name: 'RDC' })).toBeInTheDocument()
  })

  it('shows lots filtered by etage', async () => {
    setupMockSupabase()
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1')

    expect(await screen.findByText('Lot 001')).toBeInTheDocument()
    expect(screen.getByText('Lot 002')).toBeInTheDocument()
  })

  it('shows "Aucun lot" when no lots for this etage', async () => {
    setupMockSupabase([])
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1')

    expect(await screen.findByText('Aucun lot sur cet étage')).toBeInTheDocument()
  })

  it('shows progress indicator X/Y on lot cards', async () => {
    setupMockSupabase()
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1')

    expect(await screen.findByText('3/5')).toBeInTheDocument()
    expect(screen.getByText('5/5')).toBeInTheDocument()
  })

  it('shows correct status color on lot cards', async () => {
    setupMockSupabase()
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1')

    await screen.findByText('Lot 001')
    const statusBars = screen.getAllByTestId('status-bar')
    // lot-1: 3/5 = IN_PROGRESS (#F59E0B), lot-2: 5/5 = DONE (#10B981)
    const lotStatusBars = statusBars.filter(
      (bar) =>
        bar.style.backgroundColor === 'rgb(245, 158, 11)' ||
        bar.style.backgroundColor === 'rgb(16, 185, 129)',
    )
    expect(lotStatusBars.length).toBeGreaterThanOrEqual(2)
  })

  it('shows TMA badge on TMA lot', async () => {
    setupMockSupabase()
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1')

    await screen.findByText('Lot 002')
    expect(screen.getByText('TMA')).toBeInTheDocument()
  })

  it('shows metrage on lot card when values > 0', async () => {
    setupMockSupabase()
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1')

    await screen.findByText('Lot 001')
    expect(screen.getByText('25.5 m² · 16.4 ML')).toBeInTheDocument()
  })

  it('hides metrage on lot card when both values are 0', async () => {
    setupMockSupabase()
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1')

    await screen.findByText('Lot 002')
    // Lot 002 has 0/0 metrage — no metrage text should appear for it
    const lot002Card = screen.getByText('Lot 002').closest('[class*="relative"]')!
    expect(lot002Card.textContent).not.toContain('m²')
    expect(lot002Card.textContent).not.toContain('ML')
  })
})

const filterMockLots = [
  {
    id: 'lot-a',
    etage_id: 'etage-1',
    variante_id: 'var-1',
    plot_id: 'plot-1',
    code: '101',
    is_tma: false,
    has_blocking_note: false,
    has_missing_docs: false,
    progress_done: 0,
    progress_total: 5,
    metrage_m2_total: 0,
    metrage_ml_total: 0,
    plinth_status: 'non_commandees',
    created_at: '2026-01-01T00:00:00Z',
    etages: { nom: 'RDC' },
    variantes: { nom: 'Type A' },
    pieces: [{ count: 2 }],
  },
  {
    id: 'lot-b',
    etage_id: 'etage-1',
    variante_id: 'var-1',
    plot_id: 'plot-1',
    code: '102',
    is_tma: false,
    has_blocking_note: false,
    has_missing_docs: false,
    progress_done: 2,
    progress_total: 5,
    metrage_m2_total: 0,
    metrage_ml_total: 0,
    plinth_status: 'non_commandees',
    created_at: '2026-01-02T00:00:00Z',
    etages: { nom: 'RDC' },
    variantes: { nom: 'Type A' },
    pieces: [{ count: 3 }],
  },
  {
    id: 'lot-c',
    etage_id: 'etage-1',
    variante_id: 'var-1',
    plot_id: 'plot-1',
    code: '103',
    is_tma: false,
    has_blocking_note: false,
    has_missing_docs: false,
    progress_done: 5,
    progress_total: 5,
    metrage_m2_total: 0,
    metrage_ml_total: 0,
    plinth_status: 'non_commandees',
    created_at: '2026-01-03T00:00:00Z',
    etages: { nom: 'RDC' },
    variantes: { nom: 'Type A' },
    pieces: [{ count: 4 }],
  },
  {
    id: 'lot-d',
    etage_id: 'etage-1',
    variante_id: 'var-1',
    plot_id: 'plot-1',
    code: '104',
    is_tma: false,
    has_blocking_note: false,
    has_missing_docs: false,
    progress_done: 3,
    progress_total: 10,
    metrage_m2_total: 0,
    metrage_ml_total: 0,
    plinth_status: 'non_commandees',
    created_at: '2026-01-04T00:00:00Z',
    etages: { nom: 'RDC' },
    variantes: { nom: 'Type A' },
    pieces: [{ count: 1 }],
  },
]

describe('EtageIndexPage — GridFilterTabs integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupChannelMock(supabase)
  })

  it('shows filter tabs when lots exist (AC #1)', async () => {
    setupMockSupabase(filterMockLots)
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1')

    expect(await screen.findByRole('tablist')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Tous/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /En cours/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Terminés/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Alertes/i })).toBeInTheDocument()
  })

  it('"Tous" is active by default and shows all lots (AC #6)', async () => {
    setupMockSupabase(filterMockLots)
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1')

    await screen.findByText('Lot 101')
    const tousTab = screen.getByRole('tab', { name: /Tous/i })
    expect(tousTab).toHaveAttribute('data-state', 'active')
    expect(screen.getByText('Lot 101')).toBeInTheDocument()
    expect(screen.getByText('Lot 102')).toBeInTheDocument()
    expect(screen.getByText('Lot 103')).toBeInTheDocument()
    expect(screen.getByText('Lot 104')).toBeInTheDocument()
  })

  it('shows counts on each tab (AC #5)', async () => {
    setupMockSupabase(filterMockLots)
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1')

    await screen.findByRole('tablist')
    expect(screen.getByRole('tab', { name: /Tous/i })).toHaveTextContent('(4)')
    expect(screen.getByRole('tab', { name: /En cours/i })).toHaveTextContent('(2)')
    expect(screen.getByRole('tab', { name: /Terminés/i })).toHaveTextContent('(1)')
    expect(screen.getByRole('tab', { name: /Alertes/i })).toHaveTextContent('(0)')
  })

  it('"En cours" filter shows only partially completed lots (AC #2)', async () => {
    const user = userEvent.setup()
    setupMockSupabase(filterMockLots)
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1')

    await screen.findByRole('tablist')
    await user.click(screen.getByRole('tab', { name: /En cours/i }))

    expect(screen.getByRole('tab', { name: /En cours/i })).toHaveAttribute('data-state', 'active')
    expect(screen.getByText('Lot 102')).toBeInTheDocument()
    expect(screen.getByText('Lot 104')).toBeInTheDocument()
    expect(screen.queryByText('Lot 101')).not.toBeInTheDocument()
    expect(screen.queryByText('Lot 103')).not.toBeInTheDocument()
  })

  it('"Terminés" filter shows only fully completed lots (AC #3)', async () => {
    const user = userEvent.setup()
    setupMockSupabase(filterMockLots)
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1')

    await screen.findByRole('tablist')
    await user.click(screen.getByRole('tab', { name: /Terminés/i }))

    expect(screen.getByText('Lot 103')).toBeInTheDocument()
    expect(screen.queryByText('Lot 101')).not.toBeInTheDocument()
    expect(screen.queryByText('Lot 102')).not.toBeInTheDocument()
    expect(screen.queryByText('Lot 104')).not.toBeInTheDocument()
  })

  it('"Alertes" shows no results — no alert data yet (AC #4)', async () => {
    const user = userEvent.setup()
    setupMockSupabase(filterMockLots)
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1')

    await screen.findByRole('tablist')
    await user.click(screen.getByRole('tab', { name: /Alertes/i }))

    expect(screen.queryByText('Lot 101')).not.toBeInTheDocument()
    expect(screen.queryByText('Lot 102')).not.toBeInTheDocument()
    expect(screen.queryByText('Lot 103')).not.toBeInTheDocument()
    expect(screen.queryByText('Lot 104')).not.toBeInTheDocument()
    expect(screen.getByText('Aucun lot avec alertes')).toBeInTheDocument()
  })

  it('does not show filter tabs when no lots', async () => {
    setupMockSupabase([])
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1')

    await screen.findByText('Aucun lot sur cet étage')
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
  })
})

describe('EtageIndexPage — has_missing_docs in alerts filter (AC #4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupChannelMock(supabase)
  })

  const alertLots = [
    {
      id: 'lot-x',
      etage_id: 'etage-1',
      variante_id: 'var-1',
      plot_id: 'plot-1',
      code: '201',
      is_tma: false,
      has_blocking_note: false,
      has_missing_docs: true,
      progress_done: 1,
      progress_total: 3,
      metrage_m2_total: 0,
      metrage_ml_total: 0,
      plinth_status: 'non_commandees',
      created_at: '2026-01-01T00:00:00Z',
      etages: { nom: 'RDC' },
      variantes: { nom: 'Type A' },
      pieces: [{ count: 2 }],
    },
    {
      id: 'lot-y',
      etage_id: 'etage-1',
      variante_id: 'var-1',
      plot_id: 'plot-1',
      code: '202',
      is_tma: false,
      has_blocking_note: false,
      has_missing_docs: false,
      progress_done: 2,
      progress_total: 3,
      metrage_m2_total: 0,
      metrage_ml_total: 0,
      plinth_status: 'non_commandees',
      created_at: '2026-01-02T00:00:00Z',
      etages: { nom: 'RDC' },
      variantes: { nom: 'Type A' },
      pieces: [{ count: 1 }],
    },
    {
      id: 'lot-z',
      etage_id: 'etage-1',
      variante_id: 'var-1',
      plot_id: 'plot-1',
      code: '203',
      is_tma: false,
      has_blocking_note: true,
      has_missing_docs: false,
      progress_done: 0,
      progress_total: 3,
      metrage_m2_total: 0,
      metrage_ml_total: 0,
      plinth_status: 'non_commandees',
      created_at: '2026-01-03T00:00:00Z',
      etages: { nom: 'RDC' },
      variantes: { nom: 'Type A' },
      pieces: [{ count: 3 }],
    },
  ]

  it('"Alertes" shows lots with has_missing_docs OR has_blocking_note', async () => {
    const user = userEvent.setup()
    setupMockSupabase(alertLots)
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1')

    await screen.findByRole('tablist')
    await user.click(screen.getByRole('tab', { name: /Alertes/i }))

    expect(screen.getByText('Lot 201')).toBeInTheDocument()
    expect(screen.getByText('Lot 203')).toBeInTheDocument()
    expect(screen.queryByText('Lot 202')).not.toBeInTheDocument()
  })

  it('shows correct alert count including missing docs', async () => {
    setupMockSupabase(alertLots)
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1')

    await screen.findByRole('tablist')
    expect(screen.getByRole('tab', { name: /Alertes/i })).toHaveTextContent('(2)')
  })

  it('shows FileWarning icon on lot card with has_missing_docs', async () => {
    setupMockSupabase(alertLots)
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1')

    await screen.findByText('Lot 201')
    expect(screen.getByLabelText('Documents manquants')).toBeInTheDocument()
  })

  it('does not show FileWarning icon on lot without has_missing_docs', async () => {
    const noMissingLots = [
      {
        id: 'lot-ok',
        etage_id: 'etage-1',
        variante_id: 'var-1',
        plot_id: 'plot-1',
        code: '301',
        is_tma: false,
        has_blocking_note: false,
        has_missing_docs: false,
        progress_done: 3,
        progress_total: 3,
        plinth_status: 'non_commandees',
        created_at: '2026-01-01T00:00:00Z',
        etages: { nom: 'RDC' },
        variantes: { nom: 'Type A' },
        pieces: [{ count: 1 }],
      },
    ]
    setupMockSupabase(noMissingLots)
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1')

    await screen.findByText('Lot 301')
    expect(screen.queryByLabelText('Documents manquants')).not.toBeInTheDocument()
  })
})

describe('EtageIndexPage — Plinth status badge (AC #3, #4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupChannelMock(supabase)
  })

  it('shows plinth badge when metrage_ml_total > 0 and status is not non_commandees', async () => {
    const lotsWithPlinth = [
      {
        ...mockLots[0],
        plinth_status: 'commandees',
      },
    ]
    setupMockSupabase(lotsWithPlinth)
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1')

    await screen.findByText('Lot 001')
    expect(screen.getByText('Cmd')).toBeInTheDocument()
  })

  it('hides plinth badge when metrage_ml_total is 0', async () => {
    const lotsNoMl = [
      {
        ...mockLots[1],
        plinth_status: 'commandees',
      },
    ]
    setupMockSupabase(lotsNoMl)
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1')

    await screen.findByText('Lot 002')
    expect(screen.queryByText('Cmd')).not.toBeInTheDocument()
  })

  it('shows red badge "Non cmd" when status is non_commandees and metrage_ml_total > 0', async () => {
    setupMockSupabase()
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1')

    await screen.findByText('Lot 001')
    // lot-1 has metrage_ml_total: 16.4 and plinth_status: 'non_commandees'
    expect(screen.getByText('Non cmd')).toBeInTheDocument()
  })

  it('shows green badge with "Faç." for faconnees status', async () => {
    const lotsWithFac = [
      {
        ...mockLots[0],
        plinth_status: 'faconnees',
      },
    ]
    setupMockSupabase(lotsWithFac)
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1')

    await screen.findByText('Lot 001')
    expect(screen.getByText('Faç.')).toBeInTheDocument()
  })
})
