import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderRoute, createMockAuth, setupChannelMock } from '@/test/route-test-utils'

const { mockUpdateMutate } = vi.hoisted(() => ({
  mockUpdateMutate: vi.fn(),
}))

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

// Mock all mutations that routes in the route tree may import
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
vi.mock('@/lib/mutations/useCreateChantier', () => ({
  useCreateChantier: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useCreateNote', () => ({
  useCreateNote: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useUploadNotePhoto', () => ({
  useUploadNotePhoto: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useToggleLotDocumentRequired', () => ({
  useToggleLotDocumentRequired: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useUploadLotDocument', () => ({
  useUploadLotDocument: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useReplaceLotDocument', () => ({
  useReplaceLotDocument: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useCreateBesoin', () => ({
  useCreateBesoin: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useTransformBesoinToLivraison', () => ({
  useTransformBesoinToLivraison: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useCreateLivraison', () => ({
  useCreateLivraison: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useUpdateLivraisonStatus', () => ({
  useUpdateLivraisonStatus: () => ({ mutate: mockUpdateMutate, isPending: false }),
}))
vi.mock('@/lib/mutations/useUploadLivraisonDocument', () => ({
  useUploadLivraisonDocument: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useReplaceLivraisonDocument', () => ({
  useReplaceLivraisonDocument: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/utils/documentStorage', () => ({
  getDocumentSignedUrl: vi.fn(),
  downloadDocument: vi.fn(),
}))

import { supabase } from '@/lib/supabase'

const mockLivraisons = [
  {
    id: 'liv1',
    chantier_id: 'ch1',
    description: 'Colle pour faïence 20kg',
    status: 'commande',
    date_prevue: null,
    bc_file_url: null,
    bc_file_name: null,
    bl_file_url: null,
    bl_file_name: null,
    created_at: '2026-02-10T10:00:00Z',
    created_by: 'user-1',
    chantiers: { nom: 'Résidence Les Oliviers' },
  },
  {
    id: 'liv2',
    chantier_id: 'ch2',
    description: 'Croisillons 3mm',
    status: 'prevu',
    date_prevue: '2026-02-15',
    bc_file_url: null,
    bc_file_name: null,
    bl_file_url: null,
    bl_file_name: null,
    created_at: '2026-02-09T10:00:00Z',
    created_by: 'user-2',
    chantiers: { nom: 'Rénovation Duval' },
  },
  {
    id: 'liv3',
    chantier_id: 'ch1',
    description: 'Peinture blanche 10L',
    status: 'livre',
    date_prevue: '2026-02-08',
    bc_file_url: null,
    bc_file_name: null,
    bl_file_url: null,
    bl_file_name: null,
    created_at: '2026-02-05T10:00:00Z',
    created_by: 'user-1',
    chantiers: { nom: 'Résidence Les Oliviers' },
  },
]

function createAuthWithUser() {
  const auth = createMockAuth()
  auth.user = { id: 'user-1', email: 'youssef@test.fr' } as never
  return auth
}

function setupMocks(livraisons = mockLivraisons) {
  setupChannelMock(supabase as unknown as { channel: ReturnType<typeof vi.fn> })

  vi.mocked(supabase.from).mockImplementation((table: string) => {
    if (table === 'livraisons') {
      return {
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: livraisons, error: null }),
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: livraisons, error: null }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: livraisons[0], error: null }),
            }),
          }),
        }),
      } as never
    }
    if (table === 'besoins') {
      return {
        select: vi.fn().mockReturnValue({
          is: vi.fn().mockResolvedValue({ count: 2, error: null }),
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      } as never
    }
    if (table === 'activity_logs') {
      return {
        select: vi.fn().mockImplementation((...args: unknown[]) => {
          if (args.length > 1) {
            return { gt: vi.fn().mockReturnValue({ neq: vi.fn().mockResolvedValue({ count: 0, error: null }) }) }
          }
          return { neq: vi.fn().mockReturnValue({ order: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue({ data: [], error: null }) }) }) }
        }),
      } as never
    }
    const mockEmpty = vi.fn().mockResolvedValue({ data: [], error: null })
    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: mockEmpty,
          eq: vi.fn().mockReturnValue({ order: mockEmpty }),
        }),
        neq: vi.fn().mockReturnValue({ order: vi.fn().mockReturnValue({ limit: mockEmpty }) }),
        order: mockEmpty,
        is: vi.fn().mockResolvedValue({ count: 0, error: null }),
      }),
    } as never
  })
}

describe('LivraisonsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    setupMocks()
  })

  it('renders the Livraisons heading', async () => {
    renderRoute('/livraisons', { auth: createAuthWithUser() })

    const heading = await screen.findByRole('heading', { name: 'Livraisons' })
    expect(heading).toBeInTheDocument()
  })

  it('renders all livraisons as DeliveryCards', async () => {
    renderRoute('/livraisons', { auth: createAuthWithUser() })

    expect(await screen.findByText('Colle pour faïence 20kg')).toBeInTheDocument()
    expect(await screen.findByText('Croisillons 3mm')).toBeInTheDocument()
    expect(await screen.findByText('Peinture blanche 10L')).toBeInTheDocument()
  })

  it('displays chantier name on each card', async () => {
    renderRoute('/livraisons', { auth: createAuthWithUser() })

    const oliviers = await screen.findAllByText('Résidence Les Oliviers')
    expect(oliviers.length).toBe(2) // 2 livraisons from ch1
    expect(await screen.findByText('Rénovation Duval')).toBeInTheDocument()
  })

  it('renders filter tabs with counts', async () => {
    renderRoute('/livraisons', { auth: createAuthWithUser() })

    expect(await screen.findByRole('tab', { name: /Tous \(3\)/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Commandé \(1\)/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Prévu \(1\)/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Livré \(1\)/ })).toBeInTheDocument()
  })

  it('filters livraisons when tab is clicked', async () => {
    const user = userEvent.setup()
    renderRoute('/livraisons', { auth: createAuthWithUser() })

    await screen.findByText('Colle pour faïence 20kg')

    await user.click(screen.getByRole('tab', { name: /Commandé/ }))

    expect(screen.getByText('Colle pour faïence 20kg')).toBeInTheDocument()
    expect(screen.queryByText('Croisillons 3mm')).not.toBeInTheDocument()
    expect(screen.queryByText('Peinture blanche 10L')).not.toBeInTheDocument()
  })

  it('shows empty state when no livraisons', async () => {
    setupMocks([])

    renderRoute('/livraisons', { auth: createAuthWithUser() })

    expect(await screen.findByText('Aucune livraison')).toBeInTheDocument()
  })

  it('opens DateSheet and calls mutate with correct params on "Marquer prévu"', async () => {
    const user = userEvent.setup()
    renderRoute('/livraisons', { auth: createAuthWithUser() })

    // Wait for "commande" livraison to render
    const btn = await screen.findByRole('button', { name: 'Marquer prévu' })
    await user.click(btn)

    // DateSheet should open
    expect(await screen.findByText('Date de livraison prévue')).toBeInTheDocument()

    // Fill in the date
    const dateInput = screen.getByLabelText('Date prévue')
    await user.type(dateInput, '2026-03-01')

    // Click confirm button
    await user.click(screen.getByRole('button', { name: 'Marquer comme prévu' }))

    expect(mockUpdateMutate).toHaveBeenCalledWith(
      { livraisonId: 'liv1', chantierId: 'ch1', newStatus: 'prevu', datePrevue: '2026-03-01' },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
    )
  })

  it('calls mutate with newStatus "livre" on "Confirmer livraison"', async () => {
    const user = userEvent.setup()
    renderRoute('/livraisons', { auth: createAuthWithUser() })

    const btn = await screen.findByRole('button', { name: 'Confirmer livraison' })
    await user.click(btn)

    expect(mockUpdateMutate).toHaveBeenCalledWith(
      { livraisonId: 'liv2', chantierId: 'ch2', newStatus: 'livre' },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
    )
  })

  it('sorts Prévu livraisons by date_prevue ASC (AC3)', async () => {
    const prevuLivraisons = [
      {
        id: 'p1', chantier_id: 'ch1', description: 'Livraison tardive',
        status: 'prevu', date_prevue: '2026-02-20',
        bc_file_url: null, bc_file_name: null, bl_file_url: null, bl_file_name: null,
        created_at: '2026-02-01T10:00:00Z', created_by: 'user-1',
        chantiers: { nom: 'Chantier A' },
      },
      {
        id: 'p2', chantier_id: 'ch1', description: 'Livraison proche',
        status: 'prevu', date_prevue: '2026-02-12',
        bc_file_url: null, bc_file_name: null, bl_file_url: null, bl_file_name: null,
        created_at: '2026-02-05T10:00:00Z', created_by: 'user-1',
        chantiers: { nom: 'Chantier A' },
      },
      {
        id: 'p3', chantier_id: 'ch2', description: 'Livraison milieu',
        status: 'prevu', date_prevue: '2026-02-16',
        bc_file_url: null, bc_file_name: null, bl_file_url: null, bl_file_name: null,
        created_at: '2026-02-03T10:00:00Z', created_by: 'user-1',
        chantiers: { nom: 'Chantier B' },
      },
    ]
    setupMocks(prevuLivraisons)

    const user = userEvent.setup()
    renderRoute('/livraisons', { auth: createAuthWithUser() })

    // Wait for cards
    await screen.findByText('Livraison tardive')

    // Click "Prévu" tab
    await user.click(screen.getByRole('tab', { name: /Prévu/ }))

    // Get all card descriptions in DOM order — closest in date should be first
    const cards = screen.getAllByText(/Livraison (tardive|proche|milieu)/)
    expect(cards[0]).toHaveTextContent('Livraison proche')   // 2026-02-12
    expect(cards[1]).toHaveTextContent('Livraison milieu')   // 2026-02-16
    expect(cards[2]).toHaveTextContent('Livraison tardive')  // 2026-02-20
  })

  it('shows loading skeletons initially', async () => {
    // Don't resolve the query to keep loading state
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'livraisons') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue(new Promise(() => {})),
          }),
        } as never
      }
      if (table === 'besoins') {
        return {
          select: vi.fn().mockReturnValue({
            is: vi.fn().mockResolvedValue({ count: 0, error: null }),
          }),
        } as never
      }
      if (table === 'activity_logs') {
        return {
          select: vi.fn().mockImplementation((...args: unknown[]) => {
            if (args.length > 1) {
              return { gt: vi.fn().mockReturnValue({ neq: vi.fn().mockResolvedValue({ count: 0, error: null }) }) }
            }
            return { neq: vi.fn().mockReturnValue({ order: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue({ data: [], error: null }) }) }) }
          }),
        } as never
      }
      const mockEmpty = vi.fn().mockResolvedValue({ data: [], error: null })
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ order: mockEmpty }),
          order: mockEmpty,
          is: vi.fn().mockResolvedValue({ count: 0, error: null }),
        }),
      } as never
    })
    setupChannelMock(supabase as unknown as { channel: ReturnType<typeof vi.fn> })

    renderRoute('/livraisons', { auth: createAuthWithUser() })

    // Wait for the heading to confirm the page has rendered
    await screen.findByRole('heading', { name: 'Livraisons' })

    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThanOrEqual(3)
  })
})
