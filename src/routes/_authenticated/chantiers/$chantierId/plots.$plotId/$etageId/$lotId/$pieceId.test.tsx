import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, within, fireEvent } from '@testing-library/react'
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

const mockUpdateMutate = vi.fn()
vi.mock('@/lib/mutations/useUpdateTaskStatus', () => ({
  useUpdateTaskStatus: () => ({
    mutate: mockUpdateMutate,
    isPending: false,
  }),
}))

const mockMetrageMutate = vi.fn()
vi.mock('@/lib/mutations/useUpdatePieceMetrage', () => ({
  useUpdatePieceMetrage: () => ({
    mutate: mockMetrageMutate,
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
  { id: 'etage-1', plot_id: 'plot-1', nom: 'RDC', created_at: '2026-01-01T00:00:00Z' },
]

const mockLots = [
  {
    id: 'lot-1',
    etage_id: 'etage-1',
    variante_id: 'var-1',
    plot_id: 'plot-1',
    code: '203',
    is_tma: true,
    created_at: '2026-01-01T00:00:00Z',
    etages: { nom: 'RDC' },
    variantes: { nom: 'Type A' },
    pieces: [{ count: 3 }],
  },
]

const mockPieces = [
  {
    id: 'piece-1',
    lot_id: 'lot-1',
    nom: 'Séjour',
    created_at: '2026-01-01T00:00:00Z',
    metrage_m2: null as number | null,
    metrage_ml: null as number | null,
    taches: [
      { id: 't1', piece_id: 'piece-1', nom: 'Ragréage', status: 'done', created_at: '2026-01-01T00:00:00Z' },
      { id: 't2', piece_id: 'piece-1', nom: 'Pose', status: 'in_progress', created_at: '2026-01-01T00:00:00Z' },
      { id: 't3', piece_id: 'piece-1', nom: 'Plinthes', status: 'not_started', created_at: '2026-01-01T00:00:00Z' },
    ],
  },
]

const mockPiecesNoTasks = [
  {
    id: 'piece-1',
    lot_id: 'lot-1',
    nom: 'Séjour',
    created_at: '2026-01-01T00:00:00Z',
    metrage_m2: null as number | null,
    metrage_ml: null as number | null,
    taches: [],
  },
]

const mockPiecesAllNotStarted = [
  {
    id: 'piece-1',
    lot_id: 'lot-1',
    nom: 'Séjour',
    created_at: '2026-01-01T00:00:00Z',
    metrage_m2: null as number | null,
    metrage_ml: null as number | null,
    taches: [
      { id: 't1', piece_id: 'piece-1', nom: 'Ragréage', status: 'not_started' as const, created_at: '2026-01-01T00:00:00Z' },
      { id: 't2', piece_id: 'piece-1', nom: 'Pose', status: 'not_started' as const, created_at: '2026-01-01T00:00:00Z' },
    ],
  },
]

const mockPiecesEmpty: typeof mockPieces = []

const mockMultiplePieces = [
  {
    id: 'piece-1',
    lot_id: 'lot-1',
    nom: 'Séjour',
    created_at: '2026-01-01T00:00:00Z',
    metrage_m2: 12.5,
    metrage_ml: 8.2,
    taches: [
      { id: 't1', piece_id: 'piece-1', nom: 'Ragréage', status: 'done', created_at: '2026-01-01T00:00:00Z' },
      { id: 't2', piece_id: 'piece-1', nom: 'Pose', status: 'in_progress', created_at: '2026-01-01T00:00:00Z' },
      { id: 't3', piece_id: 'piece-1', nom: 'Plinthes', status: 'not_started', created_at: '2026-01-01T00:00:00Z' },
    ],
  },
  {
    id: 'piece-2',
    lot_id: 'lot-1',
    nom: 'Chambre',
    created_at: '2026-01-01T01:00:00Z',
    metrage_m2: null as number | null,
    metrage_ml: null as number | null,
    taches: [
      { id: 't4', piece_id: 'piece-2', nom: 'Ragréage', status: 'not_started', created_at: '2026-01-01T00:00:00Z' },
      { id: 't5', piece_id: 'piece-2', nom: 'Pose', status: 'not_started', created_at: '2026-01-01T00:00:00Z' },
    ],
  },
  {
    id: 'piece-3',
    lot_id: 'lot-1',
    nom: 'SDB',
    created_at: '2026-01-01T02:00:00Z',
    metrage_m2: null as number | null,
    metrage_ml: null as number | null,
    taches: [
      { id: 't6', piece_id: 'piece-3', nom: 'Ragréage', status: 'done', created_at: '2026-01-01T00:00:00Z' },
      { id: 't7', piece_id: 'piece-3', nom: 'Pose', status: 'done', created_at: '2026-01-01T00:00:00Z' },
    ],
  },
]

const mockNotes = [
  {
    id: 'note-1',
    lot_id: null,
    piece_id: 'piece-1',
    content: 'Problème carrelage',
    is_blocking: false,
    created_by: 'user-1',
    created_by_email: 'bruno@test.fr',
    photo_url: null,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
]

function setupMockSupabase(pieces: typeof mockPieces = mockPieces, notes: typeof mockNotes = mockNotes) {
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
            order: vi.fn().mockResolvedValue({ data: mockLots, error: null }),
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
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
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

describe('PiecePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupChannelMock(supabase)
  })

  // 5.1 — Display tasks with TapCycleButton
  it('renders piece name in heading', async () => {
    setupMockSupabase()
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1/lot-1/piece-1')

    expect(await screen.findByRole('heading', { name: 'Séjour' })).toBeInTheDocument()
  })

  it('shows taches with TapCycleButtons', async () => {
    setupMockSupabase()
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1/lot-1/piece-1')

    expect(await screen.findByText('Ragréage')).toBeInTheDocument()
    expect(screen.getByText('Pose')).toBeInTheDocument()
    expect(screen.getByText('Plinthes')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Tâches (3)' })).toBeInTheDocument()

    // TapCycleButtons are rendered (one per task)
    const buttons = screen.getAllByRole('button', { name: /^Statut :/ })
    expect(buttons).toHaveLength(3)
  })

  // 5.2 — Tap cycle changes status
  it('calls updateTaskStatus.mutate when TapCycleButton is clicked', async () => {
    setupMockSupabase()
    const user = userEvent.setup()
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1/lot-1/piece-1')

    // Wait for page to load
    await screen.findByText('Ragréage')

    // Find the TapCycleButton for "Plinthes" (status: not_started → in_progress)
    const plinthesRow = screen.getByText('Plinthes').closest('div')!
    const tapButton = within(plinthesRow).getByRole('button', { name: /^Statut :/ })
    await user.click(tapButton)

    expect(mockUpdateMutate).toHaveBeenCalledWith({
      tacheId: 't3',
      status: 'in_progress',
      lotId: 'lot-1',
    })
  })

  // 5.3 — Counter format "X fait(s), Y en cours"
  it('displays counter "1 fait, 1 en cours"', async () => {
    setupMockSupabase()
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1/lot-1/piece-1')

    expect(await screen.findByText('1 fait, 1 en cours')).toBeInTheDocument()
  })

  // 5.3b — Counter "Aucune tâche commencée" when all tasks are not_started
  it('shows "Aucune tâche commencée" when all tasks are not_started', async () => {
    setupMockSupabase(mockPiecesAllNotStarted)
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1/lot-1/piece-1')

    expect(await screen.findByText('Aucune tâche commencée')).toBeInTheDocument()
  })

  // 5.4 — Empty state "Aucune tâche"
  it('shows "Aucune tâche" when piece has no tasks', async () => {
    setupMockSupabase(mockPiecesNoTasks)
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1/lot-1/piece-1')

    expect(await screen.findByText('Aucune tâche')).toBeInTheDocument()
  })

  // 5.5 — Skeleton loading and "pièce introuvable"
  it('shows "Pièce introuvable" when piece does not exist', async () => {
    setupMockSupabase(mockPiecesEmpty)
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1/lot-1/piece-1')

    expect(await screen.findByText('Pièce introuvable')).toBeInTheDocument()
  })

  it('shows skeleton on loading', async () => {
    // Setup supabase — pieces never resolves to keep loading state
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
      if (table === 'pieces') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue(new Promise(() => {})),
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

    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1/lot-1/piece-1')

    // Skeleton has the back button rendered
    const link = await screen.findByLabelText('Retour')
    expect(link).toBeInTheDocument()

    // Verify skeleton has animated pulse placeholders (heading + counter + 3 task rows)
    const pulseElements = document.querySelectorAll('.animate-pulse')
    expect(pulseElements.length).toBeGreaterThanOrEqual(5)

    // Verify skeleton has circle placeholders matching TapCycleButton size
    const circleSkeletons = document.querySelectorAll('.size-11.rounded-full')
    expect(circleSkeletons.length).toBe(3)
  })

  it('does not show "Détail complet en story 3.2" anymore', async () => {
    setupMockSupabase()
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1/lot-1/piece-1')

    await screen.findByText('Ragréage')
    expect(screen.queryByText('Détail complet en story 3.2')).not.toBeInTheDocument()
  })

  // 5.2 — Swipe left navigates to next piece
  it('swipe left navigates to next piece', async () => {
    setupMockSupabase(mockMultiplePieces)
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1/lot-1/piece-1')

    // Wait for first piece to render
    await screen.findByRole('heading', { name: 'Séjour' })

    // Simulate swipe left on the page container
    const container = screen.getByRole('heading', { name: 'Séjour' }).closest('[class*="flex flex-col"]')!
    fireEvent.pointerDown(container, { clientX: 300, clientY: 300 })
    fireEvent.pointerMove(container, { clientX: 150, clientY: 300 })
    fireEvent.pointerUp(container, { clientX: 150, clientY: 300 })

    // Should navigate to Chambre (piece-2)
    expect(await screen.findByRole('heading', { name: 'Chambre' })).toBeInTheDocument()
  })

  // 5.3 — Swipe right navigates to previous piece
  it('swipe right navigates to previous piece', async () => {
    setupMockSupabase(mockMultiplePieces)
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1/lot-1/piece-2')

    // Wait for second piece to render
    await screen.findByRole('heading', { name: 'Chambre' })

    const container = screen.getByRole('heading', { name: 'Chambre' }).closest('[class*="flex flex-col"]')!
    fireEvent.pointerDown(container, { clientX: 100, clientY: 300 })
    fireEvent.pointerMove(container, { clientX: 250, clientY: 300 })
    fireEvent.pointerUp(container, { clientX: 250, clientY: 300 })

    // Should navigate to Séjour (piece-1)
    expect(await screen.findByRole('heading', { name: 'Séjour' })).toBeInTheDocument()
  })

  // 5.4 — Swipe left on last piece does nothing
  it('swipe left on last piece does not navigate', async () => {
    setupMockSupabase(mockMultiplePieces)
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1/lot-1/piece-3')

    await screen.findByRole('heading', { name: 'SDB' })

    const container = screen.getByRole('heading', { name: 'SDB' }).closest('[class*="flex flex-col"]')!
    fireEvent.pointerDown(container, { clientX: 300, clientY: 300 })
    fireEvent.pointerMove(container, { clientX: 150, clientY: 300 })
    fireEvent.pointerUp(container, { clientX: 150, clientY: 300 })

    // Should still be on SDB
    expect(screen.getByRole('heading', { name: 'SDB' })).toBeInTheDocument()
  })

  // 5.5 — Swipe right on first piece does nothing
  it('swipe right on first piece does not navigate', async () => {
    setupMockSupabase(mockMultiplePieces)
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1/lot-1/piece-1')

    await screen.findByRole('heading', { name: 'Séjour' })

    const container = screen.getByRole('heading', { name: 'Séjour' }).closest('[class*="flex flex-col"]')!
    fireEvent.pointerDown(container, { clientX: 100, clientY: 300 })
    fireEvent.pointerMove(container, { clientX: 250, clientY: 300 })
    fireEvent.pointerUp(container, { clientX: 250, clientY: 300 })

    // Should still be on Séjour
    expect(screen.getByRole('heading', { name: 'Séjour' })).toBeInTheDocument()
  })

  // 5.6 — Pagination dots
  it('shows pagination dots with correct count and active position', async () => {
    setupMockSupabase(mockMultiplePieces)
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1/lot-1/piece-1')

    await screen.findByRole('heading', { name: 'Séjour' })

    const dotsContainer = screen.getByRole('status')
    expect(dotsContainer).toHaveAttribute('aria-label', 'Pièce 1 sur 3')

    const dots = dotsContainer.children
    expect(dots).toHaveLength(3)
    expect(dots[0]).toHaveClass('bg-foreground')
    expect(dots[1]).toHaveClass('bg-muted-foreground/40')
  })

  // 5.6b — No dots with single piece
  it('does not show pagination dots with single piece', async () => {
    setupMockSupabase()
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1/lot-1/piece-1')

    await screen.findByRole('heading', { name: 'Séjour' })

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  // 7.1 — Métrés section
  it('renders Métrés section with Surface and Plinthes fields', async () => {
    setupMockSupabase()
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1/lot-1/piece-1')

    await screen.findByRole('heading', { name: 'Séjour' })

    expect(screen.getByText('Métrés')).toBeInTheDocument()
    expect(screen.getByLabelText('Surface (m²)')).toBeInTheDocument()
    expect(screen.getByLabelText('Plinthes (ML)')).toBeInTheDocument()
  })

  it('pre-fills metrage values from piece data', async () => {
    setupMockSupabase(mockMultiplePieces)
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1/lot-1/piece-1')

    await screen.findByRole('heading', { name: 'Séjour' })

    expect(screen.getByLabelText('Surface (m²)')).toHaveValue(12.5)
    expect(screen.getByLabelText('Plinthes (ML)')).toHaveValue(8.2)
  })

  it('shows empty fields when metrage is null', async () => {
    setupMockSupabase()
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1/lot-1/piece-1')

    await screen.findByRole('heading', { name: 'Séjour' })

    expect(screen.getByLabelText('Surface (m²)')).toHaveValue(null)
    expect(screen.getByLabelText('Plinthes (ML)')).toHaveValue(null)
  })

  it('calls mutation on blur with changed value', async () => {
    const user = userEvent.setup()
    setupMockSupabase()
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1/lot-1/piece-1')

    await screen.findByRole('heading', { name: 'Séjour' })

    const m2Input = screen.getByLabelText('Surface (m²)')
    await user.click(m2Input)
    await user.type(m2Input, '15.5')
    await user.tab()

    expect(mockMetrageMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        pieceId: 'piece-1',
        lotId: 'lot-1',
        plotId: 'plot-1',
        chantierId: 'chantier-1',
        metrage_m2: 15.5,
        metrage_ml: null,
      }),
      expect.anything(),
    )
  })

  it('does not call mutation when value unchanged', async () => {
    const user = userEvent.setup()
    setupMockSupabase()
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1/lot-1/piece-1')

    await screen.findByRole('heading', { name: 'Séjour' })

    // Focus and blur without typing — metrage is null and stays null
    const m2Input = screen.getByLabelText('Surface (m²)')
    await user.click(m2Input)
    await user.tab()

    expect(mockMetrageMutate).not.toHaveBeenCalled()
  })
})

describe('PiecePage — Notes integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupChannelMock(supabase)
  })

  it('shows Notes heading and note content', async () => {
    setupMockSupabase()
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1/lot-1/piece-1')

    expect(await screen.findByRole('heading', { name: 'Notes' })).toBeInTheDocument()
    expect(await screen.findByText('Problème carrelage')).toBeInTheDocument()
  })

  it('shows "Aucune note" when no notes', async () => {
    setupMockSupabase(mockPieces, [])
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1/lot-1/piece-1')

    expect(await screen.findByText('Aucune note')).toBeInTheDocument()
  })

  it('renders FAB on piece page', async () => {
    setupMockSupabase()
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1/lot-1/piece-1')

    await screen.findByRole('heading', { name: 'Séjour' })
    expect(screen.getByRole('button', { name: 'Ajouter' })).toBeInTheDocument()
  })

  it('opens FAB menu with Note and Photo items', async () => {
    const user = userEvent.setup()
    setupMockSupabase()
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1/lot-1/piece-1')

    await screen.findByRole('heading', { name: 'Séjour' })
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))

    expect(screen.getByText('Note')).toBeInTheDocument()
    expect(screen.getByText('Photo')).toBeInTheDocument()
  })

  it('opens NoteForm when Note menu item is clicked', async () => {
    const user = userEvent.setup()
    setupMockSupabase()
    renderRoute('/chantiers/chantier-1/plots/plot-1/etage-1/lot-1/piece-1')

    await screen.findByRole('heading', { name: 'Séjour' })
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))
    await user.click(screen.getByText('Note'))

    expect(await screen.findByText('Nouvelle note')).toBeInTheDocument()
  })
})
