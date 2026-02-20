import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderRoute, setupChannelMock } from '@/test/route-test-utils'

const { mockBulkTransformMutate, mockUseAllPendingBesoinsOverride } = vi.hoisted(() => ({
  mockBulkTransformMutate: vi.fn(),
  mockUseAllPendingBesoinsOverride: { current: null as (() => unknown) | null },
}))

vi.mock('sonner', () => {
  const toast = vi.fn() as ReturnType<typeof vi.fn> & { error: ReturnType<typeof vi.fn> }
  toast.error = vi.fn()
  return { toast, Toaster: () => null }
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
  useUpdateLivraisonStatus: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useUploadLivraisonDocument', () => ({
  useUploadLivraisonDocument: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useReplaceLivraisonDocument', () => ({
  useReplaceLivraisonDocument: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useUpdateLivraison', () => ({
  useUpdateLivraison: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useDeleteLivraison', () => ({
  useDeleteLivraison: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useUpdateBesoin', () => ({
  useUpdateBesoin: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useDeleteBesoin', () => ({
  useDeleteBesoin: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useCreateGroupedLivraison', () => ({
  useCreateGroupedLivraison: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useBulkTransformBesoins', () => ({
  useBulkTransformBesoins: () => ({ mutate: mockBulkTransformMutate, isPending: false }),
}))
vi.mock('@/lib/mutations/useCreateInventaire', () => ({
  useCreateInventaire: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useUpdateInventaire', () => ({
  useUpdateInventaire: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useDeleteInventaire', () => ({
  useDeleteInventaire: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useUpdatePieceMetrage', () => ({
  useUpdatePieceMetrage: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useUpdatePlinthStatus', () => ({
  useUpdatePlinthStatus: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useUpdateNote', () => ({
  useUpdateNote: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useDeleteNote', () => ({
  useDeleteNote: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useCreateNoteResponse', () => ({
  useCreateNoteResponse: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useReorderTaches', () => ({
  useReorderTaches: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useDuplicatePlot', () => ({
  useDuplicatePlot: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useDeleteLots', () => ({
  useDeleteLots: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useUpdateLot', () => ({
  useUpdateLot: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useDeleteLotPiece', () => ({
  useDeleteLotPiece: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useAddLotTask', () => ({
  useAddLotTask: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/queries/useAllPendingBesoins', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/queries/useAllPendingBesoins')>()
  return {
    ...actual,
    useAllPendingBesoins: (...args: unknown[]) => {
      if (mockUseAllPendingBesoinsOverride.current) return mockUseAllPendingBesoinsOverride.current()
      return actual.useAllPendingBesoins(...args)
    },
  }
})
vi.mock('@/lib/utils/documentStorage', () => ({
  getDocumentSignedUrl: vi.fn(),
  downloadDocument: vi.fn(),
}))

vi.mock('@/lib/utils/formatRelativeTime', () => ({
  formatRelativeTime: () => 'il y a 2h',
}))

import { supabase } from '@/lib/supabase'

const mockBesoins = [
  {
    id: 'b1',
    chantier_id: 'ch1',
    description: 'Colle pour faïence 20kg',
    livraison_id: null,
    created_at: '2026-02-10T10:00:00Z',
    created_by: 'user-1',
    chantiers: { nom: 'Résidence Les Oliviers' },
  },
  {
    id: 'b2',
    chantier_id: 'ch1',
    description: 'Croisillons 3mm',
    livraison_id: null,
    created_at: '2026-02-09T10:00:00Z',
    created_by: 'user-2',
    chantiers: { nom: 'Résidence Les Oliviers' },
  },
  {
    id: 'b3',
    chantier_id: 'ch2',
    description: 'Joint gris anthracite',
    livraison_id: null,
    created_at: '2026-02-08T10:00:00Z',
    created_by: 'user-1',
    chantiers: { nom: 'Rénovation Duval' },
  },
]

function setupMocks(besoins = mockBesoins) {
  setupChannelMock(supabase as never)
  mockUseAllPendingBesoinsOverride.current = () => ({
    data: besoins,
    isLoading: false,
    isError: false,
    isSuccess: true,
  })
  // Mock other queries that BottomNavigation or other routes use
  vi.mocked(supabase.from).mockImplementation((table: string) => {
    if (table === 'activity_logs') {
      return { select: vi.fn().mockReturnValue({ gt: vi.fn().mockReturnValue({ neq: vi.fn().mockResolvedValue({ count: 0, error: null }) }) }) } as never
    }
    if (table === 'besoins') {
      return { select: vi.fn().mockReturnValue({ is: vi.fn().mockResolvedValue({ count: besoins.length, error: null }) }) } as never
    }
    return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [], error: null }) }) } as never
  })
}

describe('BesoinsPage — display', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAllPendingBesoinsOverride.current = null
  })

  it('shows heading "Besoins"', async () => {
    setupMocks()
    renderRoute('/besoins')

    expect(await screen.findByRole('heading', { name: 'Besoins' })).toBeInTheDocument()
  })

  it('groups besoins by chantier with header and count', async () => {
    setupMocks()
    renderRoute('/besoins')

    expect(await screen.findByText('Résidence Les Oliviers (2)')).toBeInTheDocument()
    expect(screen.getByText('Rénovation Duval (1)')).toBeInTheDocument()
  })

  it('shows besoin descriptions', async () => {
    setupMocks()
    renderRoute('/besoins')

    expect(await screen.findByText('Colle pour faïence 20kg')).toBeInTheDocument()
    expect(screen.getByText('Croisillons 3mm')).toBeInTheDocument()
    expect(screen.getByText('Joint gris anthracite')).toBeInTheDocument()
  })

  it('shows relative time for each besoin', async () => {
    setupMocks()
    renderRoute('/besoins')

    await screen.findByText('Colle pour faïence 20kg')
    const times = screen.getAllByText(/il y a 2h/)
    expect(times.length).toBeGreaterThanOrEqual(3)
  })
})

describe('BesoinsPage — loading state', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAllPendingBesoinsOverride.current = null
  })

  it('shows skeleton placeholders while loading', async () => {
    setupChannelMock(supabase as never)
    mockUseAllPendingBesoinsOverride.current = () => ({
      data: undefined,
      isLoading: true,
      isError: false,
      isSuccess: false,
    })
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'activity_logs') {
        return { select: vi.fn().mockReturnValue({ gt: vi.fn().mockReturnValue({ neq: vi.fn().mockResolvedValue({ count: 0, error: null }) }) }) } as never
      }
      if (table === 'besoins') {
        return { select: vi.fn().mockReturnValue({ is: vi.fn().mockResolvedValue({ count: 0, error: null }) }) } as never
      }
      return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [], error: null }) }) } as never
    })
    renderRoute('/besoins')

    await screen.findByRole('heading', { name: 'Besoins' })
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThanOrEqual(3)
  })

  it('does not show empty state or besoin descriptions while loading', async () => {
    setupChannelMock(supabase as never)
    mockUseAllPendingBesoinsOverride.current = () => ({
      data: undefined,
      isLoading: true,
      isError: false,
      isSuccess: false,
    })
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'activity_logs') {
        return { select: vi.fn().mockReturnValue({ gt: vi.fn().mockReturnValue({ neq: vi.fn().mockResolvedValue({ count: 0, error: null }) }) }) } as never
      }
      if (table === 'besoins') {
        return { select: vi.fn().mockReturnValue({ is: vi.fn().mockResolvedValue({ count: 0, error: null }) }) } as never
      }
      return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [], error: null }) }) } as never
    })
    renderRoute('/besoins')

    await screen.findByRole('heading', { name: 'Besoins' })
    expect(screen.queryByText('Aucun besoin en attente')).not.toBeInTheDocument()
  })
})

describe('BesoinsPage — empty state', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAllPendingBesoinsOverride.current = null
  })

  it('shows empty state when no besoins', async () => {
    setupMocks([])
    renderRoute('/besoins')

    expect(await screen.findByText('Aucun besoin en attente')).toBeInTheDocument()
  })

  it('does not show "Sélectionner" button when empty', async () => {
    setupMocks([])
    renderRoute('/besoins')

    await screen.findByText('Aucun besoin en attente')
    expect(screen.queryByRole('button', { name: 'Sélectionner' })).not.toBeInTheDocument()
  })
})

describe('BesoinsPage — selection mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAllPendingBesoinsOverride.current = null
  })

  it('shows "Sélectionner" button when 2+ besoins exist', async () => {
    setupMocks()
    renderRoute('/besoins')

    await screen.findByText('Colle pour faïence 20kg')
    expect(screen.getByRole('button', { name: 'Sélectionner' })).toBeInTheDocument()
  })

  it('enters selection mode with checkboxes', async () => {
    const user = userEvent.setup()
    setupMocks()
    renderRoute('/besoins')

    await screen.findByText('Colle pour faïence 20kg')
    await user.click(screen.getByRole('button', { name: 'Sélectionner' }))

    expect(screen.getByLabelText('Sélectionner Colle pour faïence 20kg')).toBeInTheDocument()
    expect(screen.getByLabelText('Sélectionner Croisillons 3mm')).toBeInTheDocument()
    expect(screen.getByLabelText('Sélectionner Joint gris anthracite')).toBeInTheDocument()
  })

  it('shows "Tout" button per chantier group in selection mode', async () => {
    const user = userEvent.setup()
    setupMocks()
    renderRoute('/besoins')

    await screen.findByText('Colle pour faïence 20kg')
    await user.click(screen.getByRole('button', { name: 'Sélectionner' }))

    const toutButtons = screen.getAllByRole('button', { name: 'Tout' })
    expect(toutButtons).toHaveLength(2) // One per chantier group
  })

  it('selects all besoins in a group when "Tout" is clicked', async () => {
    const user = userEvent.setup()
    setupMocks()
    renderRoute('/besoins')

    await screen.findByText('Colle pour faïence 20kg')
    await user.click(screen.getByRole('button', { name: 'Sélectionner' }))

    // Click first "Tout" (Résidence Les Oliviers)
    const toutButtons = screen.getAllByRole('button', { name: 'Tout' })
    await user.click(toutButtons[0])

    // Action bar shows count
    expect(screen.getByRole('button', { name: 'Passer en livraison (2)' })).toBeInTheDocument()
  })

  it('shows action bar with selected count', async () => {
    const user = userEvent.setup()
    setupMocks()
    renderRoute('/besoins')

    await screen.findByText('Colle pour faïence 20kg')
    await user.click(screen.getByRole('button', { name: 'Sélectionner' }))
    await user.click(screen.getByLabelText('Sélectionner Colle pour faïence 20kg'))

    expect(screen.getByRole('button', { name: 'Passer en livraison (1)' })).toBeInTheDocument()
  })

  it('calls bulk transform mutation on submit', async () => {
    const user = userEvent.setup()
    setupMocks()
    renderRoute('/besoins')

    await screen.findByText('Colle pour faïence 20kg')
    await user.click(screen.getByRole('button', { name: 'Sélectionner' }))
    await user.click(screen.getByLabelText('Sélectionner Colle pour faïence 20kg'))
    await user.click(screen.getByLabelText('Sélectionner Joint gris anthracite'))

    await user.click(screen.getByRole('button', { name: 'Passer en livraison (2)' }))

    expect(mockBulkTransformMutate).toHaveBeenCalledWith(
      {
        besoins: expect.arrayContaining([
          expect.objectContaining({ id: 'b1' }),
          expect.objectContaining({ id: 'b3' }),
        ]),
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    )
  })

  it('enters selection mode via long-press on a besoin', async () => {
    setupMocks()
    renderRoute('/besoins')

    const besoinText = await screen.findByText('Colle pour faïence 20kg')
    const card = besoinText.closest('.rounded-lg')!

    fireEvent.pointerDown(card)

    // Wait for 500ms long-press threshold + React state update
    await waitFor(
      () => {
        expect(screen.getByLabelText('Sélectionner Colle pour faïence 20kg')).toBeInTheDocument()
      },
      { timeout: 1500 },
    )

    // The long-pressed besoin should be pre-selected
    expect(screen.getByRole('button', { name: 'Passer en livraison (1)' })).toBeInTheDocument()
  })

  it('cancels long-press when pointer moves', async () => {
    setupMocks()
    renderRoute('/besoins')

    const besoinText = await screen.findByText('Colle pour faïence 20kg')
    const card = besoinText.closest('.rounded-lg')!

    fireEvent.pointerDown(card)
    fireEvent.pointerMove(card)

    // Wait a bit to confirm selection mode was NOT entered
    await new Promise((r) => setTimeout(r, 600))
    expect(screen.queryByLabelText('Sélectionner Colle pour faïence 20kg')).not.toBeInTheDocument()
  })

  it('shows cancel button in selection mode', async () => {
    const user = userEvent.setup()
    setupMocks()
    renderRoute('/besoins')

    await screen.findByText('Colle pour faïence 20kg')
    await user.click(screen.getByRole('button', { name: 'Sélectionner' }))

    expect(screen.getByRole('button', { name: 'Annuler' })).toBeInTheDocument()
  })
})
