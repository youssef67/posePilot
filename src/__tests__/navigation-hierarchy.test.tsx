import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { QueryClient } from '@tanstack/react-query'
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
  useUpdateChantierStatus: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useCreatePlot', () => ({
  useCreatePlot: () => ({ mutate: vi.fn(), isPending: false }),
  DEFAULT_TASK_DEFINITIONS: ['Ragréage'],
}))
vi.mock('@/lib/mutations/useUpdatePlotTasks', () => ({
  useUpdatePlotTasks: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useDeletePlot', () => ({
  useDeletePlot: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useCreateVariante', () => ({
  useCreateVariante: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useDeleteVariante', () => ({
  useDeleteVariante: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useAddVariantePiece', () => ({
  useAddVariantePiece: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useDeleteVariantePiece', () => ({
  useDeleteVariantePiece: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useCreateLot', () => ({
  useCreateLot: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useCreateBatchLots', () => ({
  useCreateBatchLots: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useToggleLotTma', () => ({
  useToggleLotTma: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useAddLotPiece', () => ({
  useAddLotPiece: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useAddLotTask', () => ({
  useAddLotTask: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useAddLotDocument', () => ({
  useAddLotDocument: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useToggleDocumentRequired', () => ({
  useToggleDocumentRequired: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useDeleteVarianteDocument', () => ({
  useDeleteVarianteDocument: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useAddVarianteDocument', () => ({
  useAddVarianteDocument: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useUpdateTaskStatus', () => ({
  useUpdateTaskStatus: () => ({ mutate: vi.fn(), isPending: false }),
}))

import { supabase } from '@/lib/supabase'

const mockChantier = {
  id: 'c1',
  nom: 'Les Oliviers',
  type: 'complet' as const,
  status: 'active' as const,
  progress_done: 0,
  progress_total: 0,
  created_at: '2026-01-01T00:00:00Z',
  created_by: 'user-1',
}

const mockPlot = {
  id: 'p1',
  chantier_id: 'c1',
  nom: 'Plot A',
  task_definitions: ['Ragréage', 'Pose'],
  progress_done: 1,
  progress_total: 3,
  created_at: '2026-01-01T00:00:00Z',
}

const mockEtages = [
  { id: 'e1', plot_id: 'p1', nom: 'RDC', progress_done: 1, progress_total: 3, created_at: '2026-01-01T00:00:00Z' },
  { id: 'e2', plot_id: 'p1', nom: 'Étage 1', progress_done: 0, progress_total: 0, created_at: '2026-01-02T00:00:00Z' },
]

const mockLots = [
  {
    id: 'l1',
    etage_id: 'e1',
    variante_id: 'v1',
    plot_id: 'p1',
    code: '101',
    is_tma: false,
    progress_done: 1,
    progress_total: 3,
    created_at: '2026-01-01T00:00:00Z',
    etages: { nom: 'RDC' },
    variantes: { nom: 'T2' },
    pieces: [{ count: 2 }],
  },
  {
    id: 'l2',
    etage_id: 'e2',
    variante_id: 'v1',
    plot_id: 'p1',
    code: '201',
    is_tma: true,
    progress_done: 0,
    progress_total: 0,
    created_at: '2026-01-02T00:00:00Z',
    etages: { nom: 'Étage 1' },
    variantes: { nom: 'T2' },
    pieces: [{ count: 1 }],
  },
]

const mockPieces = [
  {
    id: 'pi1',
    lot_id: 'l1',
    nom: 'Séjour',
    progress_done: 1,
    progress_total: 2,
    created_at: '2026-01-01T00:00:00Z',
    taches: [
      { id: 't1', piece_id: 'pi1', nom: 'Ragréage', status: 'done', created_at: '2026-01-01T00:00:00Z' },
      { id: 't2', piece_id: 'pi1', nom: 'Pose', status: 'not_started', created_at: '2026-01-02T00:00:00Z' },
    ],
  },
  {
    id: 'pi2',
    lot_id: 'l1',
    nom: 'Chambre',
    progress_done: 0,
    progress_total: 1,
    created_at: '2026-01-02T00:00:00Z',
    taches: [
      { id: 't3', piece_id: 'pi2', nom: 'Ragréage', status: 'not_started', created_at: '2026-01-01T00:00:00Z' },
    ],
  },
]

const mockVariantes = [
  { id: 'v1', plot_id: 'p1', nom: 'T2', created_at: '2026-01-01T00:00:00Z', variante_pieces: [{ count: 2 }] },
]

const mockDocuments = [
  { id: 'd1', lot_id: 'l1', nom: 'PV Pose', is_required: true, created_at: '2026-01-01T00:00:00Z' },
]

function setupSupabaseMock() {
  vi.mocked(supabase.from).mockImplementation((table: string) => {
    if (table === 'chantiers') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockImplementation((_col: string, val: unknown) => {
            if (val === 'c1') {
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
            order: vi.fn().mockResolvedValue({ data: mockVariantes, error: null }),
          }),
        }),
      } as never
    }
    if (table === 'pieces') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockPieces, error: null }),
          }),
        }),
      } as never
    }
    if (table === 'lot_documents') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockDocuments, error: null }),
          }),
        }),
      } as never
    }
    return { select: vi.fn() } as never
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  setupChannelMock(supabase)
  setupSupabaseMock()
})

describe('Navigation hiérarchique — Chantier → Plot → Étage → Lot → Pièce', () => {
  it('plot page shows étages grid with navigation cards (AC #1)', async () => {
    renderRoute('/chantiers/c1/plots/p1')

    expect(await screen.findByRole('heading', { name: 'Étages' })).toBeInTheDocument()
    // 'RDC' appears in both the Étages grid and the Lots grouping header
    expect(screen.getAllByText('RDC').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Étage 1').length).toBeGreaterThanOrEqual(1)
  })

  it('étage page shows lots filtered for that étage (AC #2)', async () => {
    renderRoute('/chantiers/c1/plots/p1/e1')

    expect(await screen.findByRole('heading', { name: 'RDC' })).toBeInTheDocument()
    expect(screen.getByText('Lot 101')).toBeInTheDocument()
    // Lot 201 is on étage e2, should not appear
    expect(screen.queryByText('Lot 201')).not.toBeInTheDocument()
  })

  it('lot page shows pièces with task progress (AC #3)', async () => {
    renderRoute('/chantiers/c1/plots/p1/e1/l1')

    // Use heading role to avoid matching breadcrumb text
    expect(await screen.findByRole('heading', { name: /Lot 101/ })).toBeInTheDocument()
    expect(screen.getByText('Séjour')).toBeInTheDocument()
    expect(screen.getByText('Chambre')).toBeInTheDocument()
    expect(screen.getByText('1/2 tâches')).toBeInTheDocument()
  })

  it('pièce page shows task list with TapCycleButtons (AC #4)', async () => {
    renderRoute('/chantiers/c1/plots/p1/e1/l1/pi1')

    expect(await screen.findByRole('heading', { name: 'Séjour' })).toBeInTheDocument()
    expect(screen.getByText('Ragréage')).toBeInTheDocument()
    expect(screen.getByText('Pose')).toBeInTheDocument()
    // TapCycleButtons rendered for each task
    const tapButtons = screen.getAllByRole('button', { name: /^Statut :/ })
    expect(tapButtons.length).toBeGreaterThan(0)
  })

  it('BreadcrumbNav shows at deep levels (AC #5)', async () => {
    renderRoute('/chantiers/c1/plots/p1/e1/l1')

    expect(await screen.findByLabelText("Fil d'Ariane")).toBeInTheDocument()
  })

  it('BreadcrumbNav resolves dynamic names from cache (AC #5)', async () => {
    // Pre-populate cache so BreadcrumbNav can resolve dynamic names
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    queryClient.setQueryData(['chantiers', 'c1'], mockChantier)
    queryClient.setQueryData(['plots', 'c1'], [mockPlot])

    renderRoute('/chantiers/c1/plots/p1/e1', queryClient)

    const nav = await screen.findByLabelText("Fil d'Ariane")
    expect(nav).toBeInTheDocument()
    // Should resolve chantier name from cache
    expect(nav.textContent).toContain('Les Oliviers')
    // Should resolve plot name from cache
    expect(nav.textContent).toContain('Plot A')
  })

  it('étage page lot card shows TMA badge (AC #2)', async () => {
    // Navigate to étage 2 which has the TMA lot
    renderRoute('/chantiers/c1/plots/p1/e2')

    expect(await screen.findByText('Lot 201')).toBeInTheDocument()
    expect(screen.getByText('TMA')).toBeInTheDocument()
  })

  it('existing variantes route still works (no regression)', async () => {
    // Setup mock for variante_pieces and variante_documents
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'chantiers') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockImplementation((_col: string, val: unknown) => {
              if (val === 'c1') return { single: vi.fn().mockResolvedValue({ data: mockChantier, error: null }) }
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
      if (table === 'variantes') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [{ id: 'v1', plot_id: 'p1', nom: 'T2', created_at: '2026-01-01T00:00:00Z' }],
                error: null,
              }),
            }),
          }),
        } as never
      }
      if (table === 'variante_pieces') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        } as never
      }
      if (table === 'variante_documents') {
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

    renderRoute('/chantiers/c1/plots/p1/variantes/v1')

    expect(await screen.findByText('T2')).toBeInTheDocument()
  })
})
