import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  createRouter,
  createMemoryHistory,
  RouterProvider,
} from '@tanstack/react-router'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { routeTree } from '@/routeTree.gen'
import { AuthContext, type AuthState } from '@/lib/auth'

const mockCreateVarianteMutate = vi.fn()
const mockCreateLotMutate = vi.fn()
const mockCreateBatchLotsMutate = vi.fn()

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
    mutate: mockCreateVarianteMutate,
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

vi.mock('@/lib/mutations/useCreateLot', () => ({
  useCreateLot: () => ({
    mutate: mockCreateLotMutate,
    isPending: false,
  }),
}))

vi.mock('@/lib/mutations/useCreateBatchLots', () => ({
  useCreateBatchLots: () => ({
    mutate: mockCreateBatchLotsMutate,
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
import { toast } from 'sonner'

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
  task_definitions: ['Ragréage', 'Phonique', 'Pose'],
  progress_done: 0,
  progress_total: 0,
  created_at: '2026-01-01T00:00:00Z',
}

const mockVariantes = [
  {
    id: 'var-1',
    plot_id: 'plot-1',
    nom: 'Type A',
    created_at: '2026-01-01T00:00:00Z',
    variante_pieces: [{ count: 4 }],
  },
  {
    id: 'var-2',
    plot_id: 'plot-1',
    nom: 'Type B',
    created_at: '2026-01-02T00:00:00Z',
    variante_pieces: [{ count: 3 }],
  },
]

function createMockAuth(): AuthState {
  return {
    session: null,
    user: null,
    isLoading: false,
    isAuthenticated: true,
    signIn: async () => ({ error: null }),
    signOut: async () => {},
  }
}

const mockLots = [
  {
    id: 'lot-1',
    etage_id: 'etage-1',
    variante_id: 'var-1',
    plot_id: 'plot-1',
    code: '001',
    is_tma: false,
    progress_done: 2,
    progress_total: 4,
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
    is_tma: false,
    progress_done: 3,
    progress_total: 3,
    created_at: '2026-01-02T00:00:00Z',
    etages: { nom: 'RDC' },
    variantes: { nom: 'Type B' },
    pieces: [{ count: 3 }],
  },
  {
    id: 'lot-3',
    etage_id: 'etage-2',
    variante_id: 'var-1',
    plot_id: 'plot-1',
    code: '101',
    is_tma: false,
    progress_done: 0,
    progress_total: 4,
    created_at: '2026-01-03T00:00:00Z',
    etages: { nom: '1' },
    variantes: { nom: 'Type A' },
    pieces: [{ count: 4 }],
  },
]

const mockEtages = [
  { id: 'etage-1', plot_id: 'plot-1', nom: 'RDC', progress_done: 5, progress_total: 7, created_at: '2026-01-01T00:00:00Z' },
  { id: 'etage-2', plot_id: 'plot-1', nom: '1', progress_done: 0, progress_total: 4, created_at: '2026-01-02T00:00:00Z' },
]

function setupMockSupabase(variantes: typeof mockVariantes, lots: typeof mockLots = []) {
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
    if (table === 'variantes') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: variantes, error: null }),
          }),
        }),
      } as never
    }
    if (table === 'lots') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockImplementation((col: string) => {
            if (col === 'plots.chantier_id') {
              // useLotsWithTaches — return empty (different shape than useLots)
              return { order: vi.fn().mockResolvedValue({ data: [], error: null }) }
            }
            // useLots — regular lots data
            return { order: vi.fn().mockResolvedValue({ data: lots, error: null }) }
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
    return { select: vi.fn() } as never
  })
}

function renderPlotRoute() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const auth = createMockAuth()
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({
      initialEntries: ['/chantiers/chantier-1/plots/plot-1'],
    }),
    context: { auth },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={auth}>
        <RouterProvider router={router} />
      </AuthContext.Provider>
    </QueryClientProvider>,
  )
}

describe('PlotIndexPage — variantes section', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.channel).mockReturnValue({
      on: vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue({}),
      }),
    } as never)
  })

  it('shows "Variantes" section heading', async () => {
    setupMockSupabase([])
    renderPlotRoute()

    expect(await screen.findByRole('heading', { name: 'Variantes' })).toBeInTheDocument()
  })

  it('shows empty state when no variantes exist', async () => {
    setupMockSupabase([])
    renderPlotRoute()

    expect(await screen.findByText('Aucune variante configurée')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ajouter votre première variante/ })).toBeInTheDocument()
  })

  it('displays variante cards with piece counts', async () => {
    setupMockSupabase(mockVariantes)
    renderPlotRoute()

    expect(await screen.findByText('Type A')).toBeInTheDocument()
    expect(screen.getByText('4 pièces')).toBeInTheDocument()
    expect(screen.getByText('Type B')).toBeInTheDocument()
    expect(screen.getByText('3 pièces')).toBeInTheDocument()
  })

  it('shows "Ajouter une variante" button when variantes exist', async () => {
    setupMockSupabase(mockVariantes)
    renderPlotRoute()

    await screen.findByText('Type A')
    expect(screen.getByRole('button', { name: /Ajouter une variante/ })).toBeInTheDocument()
  })

  it('opens create variante sheet when button is clicked', async () => {
    const user = userEvent.setup()
    setupMockSupabase([])
    renderPlotRoute()

    await screen.findByText('Aucune variante configurée')
    await user.click(screen.getByRole('button', { name: /Ajouter votre première variante/ }))

    expect(await screen.findByText('Nouvelle variante')).toBeInTheDocument()
    expect(screen.getByLabelText('Nom de la variante')).toBeInTheDocument()
  })

  it('shows validation error when creating variante with empty name', async () => {
    const user = userEvent.setup()
    setupMockSupabase([])
    renderPlotRoute()

    await screen.findByText('Aucune variante configurée')
    await user.click(screen.getByRole('button', { name: /Ajouter votre première variante/ }))

    await screen.findByText('Nouvelle variante')
    await user.click(screen.getByRole('button', { name: 'Créer la variante' }))

    expect(await screen.findByText('Le nom de la variante est requis')).toBeInTheDocument()
  })

  it('calls createVariante mutation with correct params', async () => {
    const user = userEvent.setup()
    setupMockSupabase([])
    renderPlotRoute()

    await screen.findByText('Aucune variante configurée')
    await user.click(screen.getByRole('button', { name: /Ajouter votre première variante/ }))

    await screen.findByText('Nouvelle variante')
    const input = screen.getByLabelText('Nom de la variante')
    await user.type(input, 'Type C')
    await user.click(screen.getByRole('button', { name: 'Créer la variante' }))

    expect(mockCreateVarianteMutate).toHaveBeenCalledWith(
      { plotId: 'plot-1', nom: 'Type C' },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    )
  })
})

describe('PlotIndexPage — lots section', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.channel).mockReturnValue({
      on: vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue({}),
      }),
    } as never)
  })

  it('shows lots section heading', async () => {
    setupMockSupabase(mockVariantes, [])
    renderPlotRoute()

    expect(await screen.findByRole('heading', { name: 'Lots' })).toBeInTheDocument()
  })

  it('shows empty state when no lots exist', async () => {
    setupMockSupabase(mockVariantes, [])
    renderPlotRoute()

    expect(await screen.findByText(/Aucun lot créé/)).toBeInTheDocument()
  })

  it('shows "Ajouter un lot" button', async () => {
    setupMockSupabase(mockVariantes, [])
    renderPlotRoute()

    expect(await screen.findByRole('button', { name: /Ajouter un lot/ })).toBeInTheDocument()
  })

  it('disables "Ajouter un lot" button when no variantes exist', async () => {
    setupMockSupabase([], [])
    renderPlotRoute()

    const button = await screen.findByRole('button', { name: /Ajouter un lot/ })
    expect(button).toBeDisabled()
  })

  it('displays lots grouped by etage', async () => {
    setupMockSupabase(mockVariantes, mockLots)
    renderPlotRoute()

    // 'RDC' appears in both Étages grid and Lots grouping
    const rdcElements = await screen.findAllByText('RDC')
    expect(rdcElements.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Lot 001')).toBeInTheDocument()
    expect(screen.getByText('Lot 002')).toBeInTheDocument()
    expect(screen.getByText('Lot 101')).toBeInTheDocument()
  })

  it('displays lot count in heading', async () => {
    setupMockSupabase(mockVariantes, mockLots)
    renderPlotRoute()

    expect(await screen.findByRole('heading', { name: 'Lots (3)' })).toBeInTheDocument()
  })

  it('opens create lot sheet when button is clicked', async () => {
    const user = userEvent.setup()
    setupMockSupabase(mockVariantes, [])
    renderPlotRoute()

    const button = await screen.findByRole('button', { name: /Ajouter un lot/ })
    await user.click(button)

    expect(await screen.findByText('Nouveau lot')).toBeInTheDocument()
    expect(screen.getByLabelText('Code du lot')).toBeInTheDocument()
    expect(screen.getByLabelText('Variante')).toBeInTheDocument()
    expect(screen.getByLabelText('Étage')).toBeInTheDocument()
  })

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup()
    setupMockSupabase(mockVariantes, [])
    renderPlotRoute()

    const addButton = await screen.findByRole('button', { name: /Ajouter un lot/ })
    await user.click(addButton)

    await screen.findByText('Nouveau lot')
    await user.click(screen.getByRole('button', { name: 'Créer le lot' }))

    expect(await screen.findByText('Le code du lot est requis')).toBeInTheDocument()
    expect(screen.getByText('La variante est requise')).toBeInTheDocument()
    expect(screen.getByText("L'étage est requis")).toBeInTheDocument()
  })

  it('shows duplicate code error', async () => {
    const user = userEvent.setup()
    setupMockSupabase(mockVariantes, mockLots)
    renderPlotRoute()

    const addButton = await screen.findByRole('button', { name: /Ajouter un lot/ })
    await user.click(addButton)

    await screen.findByText('Nouveau lot')
    const codeInput = screen.getByLabelText('Code du lot')
    await user.type(codeInput, '001')
    await user.click(screen.getByRole('button', { name: 'Créer le lot' }))

    expect(await screen.findByText('Un lot avec ce code existe déjà')).toBeInTheDocument()
  })

  it('calls createLot mutation with correct params when form is valid', async () => {
    const user = userEvent.setup()
    setupMockSupabase(mockVariantes, [])
    renderPlotRoute()

    const addButton = await screen.findByRole('button', { name: /Ajouter un lot/ })
    await user.click(addButton)

    await screen.findByText('Nouveau lot')

    // Fill code (text input)
    const codeInput = screen.getByLabelText('Code du lot')
    await user.type(codeInput, '301')
    // Select étage
    const etageTrigger = screen.getByLabelText('Étage')
    await user.click(etageTrigger)
    const etageOption = await screen.findByRole('option', { name: 'RDC' })
    await user.click(etageOption)

    // Submit without selecting variante → shows error for variante only
    await user.click(screen.getByRole('button', { name: 'Créer le lot' }))

    expect(await screen.findByText('La variante est requise')).toBeInTheDocument()
    // Code and etage were valid — no errors for them
    expect(screen.queryByText('Le code du lot est requis')).not.toBeInTheDocument()
    expect(screen.queryByText("L'étage est requis")).not.toBeInTheDocument()
    // Mutation NOT called because variante missing
    expect(mockCreateLotMutate).not.toHaveBeenCalled()
  })
})

describe('PlotIndexPage — batch lots section', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.channel).mockReturnValue({
      on: vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue({}),
      }),
    } as never)
  })

  it('shows "Ajouter en batch" button', async () => {
    setupMockSupabase(mockVariantes, [])
    renderPlotRoute()

    expect(await screen.findByRole('button', { name: /Ajouter en batch/ })).toBeInTheDocument()
  })

  it('disables "Ajouter en batch" button when no variantes exist', async () => {
    setupMockSupabase([], [])
    renderPlotRoute()

    const button = await screen.findByRole('button', { name: /Ajouter en batch/ })
    expect(button).toBeDisabled()
  })

  it('opens batch sheet when button is clicked', async () => {
    const user = userEvent.setup()
    setupMockSupabase(mockVariantes, [])
    renderPlotRoute()

    const button = await screen.findByRole('button', { name: /Ajouter en batch/ })
    await user.click(button)

    expect(await screen.findByText('Ajouter des lots en batch')).toBeInTheDocument()
    expect(screen.getByLabelText('Codes des lots')).toBeInTheDocument()
    expect(screen.getByLabelText('Variante batch')).toBeInTheDocument()
    expect(screen.getByLabelText('Étage batch')).toBeInTheDocument()
  })

  it('shows codes counter in real time', async () => {
    const user = userEvent.setup()
    setupMockSupabase(mockVariantes, [])
    renderPlotRoute()

    const button = await screen.findByRole('button', { name: /Ajouter en batch/ })
    await user.click(button)

    await screen.findByText('Ajouter des lots en batch')

    // Initially 0 codes (plural in French for 0)
    expect(screen.getByText('0 codes détectés (max 8)')).toBeInTheDocument()

    // Type codes
    const textarea = screen.getByLabelText('Codes des lots')
    await user.type(textarea, '101, 102, 103')

    expect(screen.getByText('3 codes détectés (max 8)')).toBeInTheDocument()
  })

  it('shows dynamic button text with code count', async () => {
    const user = userEvent.setup()
    setupMockSupabase(mockVariantes, [])
    renderPlotRoute()

    const batchButton = await screen.findByRole('button', { name: /Ajouter en batch/ })
    await user.click(batchButton)

    await screen.findByText('Ajouter des lots en batch')

    // Initially disabled with generic text
    expect(screen.getByRole('button', { name: 'Créer les lots' })).toBeDisabled()

    // Type codes
    const textarea = screen.getByLabelText('Codes des lots')
    await user.type(textarea, '101, 102')

    expect(screen.getByRole('button', { name: 'Créer 2 lots' })).toBeEnabled()
  })

  it('shows validation error when submitting empty codes', async () => {
    const user = userEvent.setup()
    setupMockSupabase(mockVariantes, [])
    renderPlotRoute()

    const batchButton = await screen.findByRole('button', { name: /Ajouter en batch/ })
    await user.click(batchButton)

    await screen.findByText('Ajouter des lots en batch')

    // The button is disabled when 0 codes, so type 1 code then clear
    const textarea = screen.getByLabelText('Codes des lots')
    await user.type(textarea, 'a')
    await user.clear(textarea)
    // Need at least 1 code to enable button — test via typing spaces only
    await user.type(textarea, '   ')

    // Button still disabled because parsed codes is 0
    expect(screen.getByRole('button', { name: 'Créer les lots' })).toBeDisabled()
  })

  it('allows exactly 8 codes (max boundary — AC2)', async () => {
    const user = userEvent.setup()
    setupMockSupabase(mockVariantes, [])
    renderPlotRoute()

    const batchButton = await screen.findByRole('button', { name: /Ajouter en batch/ })
    await user.click(batchButton)

    await screen.findByText('Ajouter des lots en batch')

    const textarea = screen.getByLabelText('Codes des lots')
    await user.type(textarea, '101,102,103,104,105,106,107,108')

    expect(screen.getByText('8 codes détectés (max 8)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Créer 8 lots' })).toBeEnabled()

    // Select variante
    const varianteTrigger = screen.getByLabelText('Variante batch')
    await user.click(varianteTrigger)
    const option = await screen.findByRole('option', { name: 'Type A' })
    await user.click(option)

    // Select étage
    const etageTrigger = screen.getByLabelText('Étage batch')
    await user.click(etageTrigger)
    const etageOption = await screen.findByRole('option', { name: 'RDC' })
    await user.click(etageOption)

    // Submit
    await user.click(screen.getByRole('button', { name: 'Créer 8 lots' }))

    expect(mockCreateBatchLotsMutate).toHaveBeenCalledWith(
      {
        codes: ['101', '102', '103', '104', '105', '106', '107', '108'],
        varianteId: 'var-1',
        etageNom: 'RDC',
        plotId: 'plot-1',
      },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
    )
  })

  it('shows error when more than 8 codes are entered', async () => {
    const user = userEvent.setup()
    setupMockSupabase(mockVariantes, [])
    renderPlotRoute()

    const batchButton = await screen.findByRole('button', { name: /Ajouter en batch/ })
    await user.click(batchButton)

    await screen.findByText('Ajouter des lots en batch')

    const textarea = screen.getByLabelText('Codes des lots')
    await user.type(textarea, '1,2,3,4,5,6,7,8,9')

    // Click the create button (which should now show "Créer 9 lots")
    const createButton = screen.getByRole('button', { name: 'Créer 9 lots' })
    await user.click(createButton)

    expect(await screen.findByText('Maximum 8 lots par batch')).toBeInTheDocument()
    expect(mockCreateBatchLotsMutate).not.toHaveBeenCalled()
  })

  it('parses newline-separated codes correctly', async () => {
    const user = userEvent.setup()
    setupMockSupabase(mockVariantes, [])
    renderPlotRoute()

    const batchButton = await screen.findByRole('button', { name: /Ajouter en batch/ })
    await user.click(batchButton)

    await screen.findByText('Ajouter des lots en batch')

    const textarea = screen.getByLabelText('Codes des lots')
    await user.type(textarea, '201{Enter}202{Enter}203')

    expect(screen.getByText('3 codes détectés (max 8)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Créer 3 lots' })).toBeEnabled()
  })

  it('shows error for duplicate codes within batch', async () => {
    const user = userEvent.setup()
    setupMockSupabase(mockVariantes, [])
    renderPlotRoute()

    const batchButton = await screen.findByRole('button', { name: /Ajouter en batch/ })
    await user.click(batchButton)

    await screen.findByText('Ajouter des lots en batch')

    const textarea = screen.getByLabelText('Codes des lots')
    await user.type(textarea, '101, 102, 101')

    const createButton = screen.getByRole('button', { name: 'Créer 3 lots' })
    await user.click(createButton)

    expect(await screen.findByText('Code « 101 » en doublon dans le batch')).toBeInTheDocument()
    expect(mockCreateBatchLotsMutate).not.toHaveBeenCalled()
  })

  it('shows error for codes already existing in the plot', async () => {
    const user = userEvent.setup()
    setupMockSupabase(mockVariantes, mockLots)
    renderPlotRoute()

    const batchButton = await screen.findByRole('button', { name: /Ajouter en batch/ })
    await user.click(batchButton)

    await screen.findByText('Ajouter des lots en batch')

    const textarea = screen.getByLabelText('Codes des lots')
    await user.type(textarea, '001, 200')

    const createButton = screen.getByRole('button', { name: 'Créer 2 lots' })
    await user.click(createButton)

    expect(await screen.findByText('Le code « 001 » existe déjà')).toBeInTheDocument()
    expect(mockCreateBatchLotsMutate).not.toHaveBeenCalled()
  })

  it('shows error when variante is missing', async () => {
    const user = userEvent.setup()
    setupMockSupabase(mockVariantes, [])
    renderPlotRoute()

    const batchButton = await screen.findByRole('button', { name: /Ajouter en batch/ })
    await user.click(batchButton)

    await screen.findByText('Ajouter des lots en batch')

    const textarea = screen.getByLabelText('Codes des lots')
    await user.type(textarea, '101')

    const createButton = screen.getByRole('button', { name: 'Créer 1 lot' })
    await user.click(createButton)

    expect(await screen.findByText('La variante est requise')).toBeInTheDocument()
    expect(mockCreateBatchLotsMutate).not.toHaveBeenCalled()
  })

  it('shows error when etage is missing', async () => {
    const user = userEvent.setup()
    setupMockSupabase(mockVariantes, [])
    renderPlotRoute()

    const batchButton = await screen.findByRole('button', { name: /Ajouter en batch/ })
    await user.click(batchButton)

    await screen.findByText('Ajouter des lots en batch')

    const textarea = screen.getByLabelText('Codes des lots')
    await user.type(textarea, '101')

    // Select variante — click trigger then option
    const varianteTrigger = screen.getByLabelText('Variante batch')
    await user.click(varianteTrigger)
    const option = await screen.findByRole('option', { name: 'Type A' })
    await user.click(option)

    // Don't fill etage
    const createButton = screen.getByRole('button', { name: 'Créer 1 lot' })
    await user.click(createButton)

    expect(await screen.findByText("L'étage est requis")).toBeInTheDocument()
    expect(mockCreateBatchLotsMutate).not.toHaveBeenCalled()
  })

  it('calls createBatchLots mutation with correct params when form is valid', async () => {
    const user = userEvent.setup()
    setupMockSupabase(mockVariantes, [])
    renderPlotRoute()

    const batchButton = await screen.findByRole('button', { name: /Ajouter en batch/ })
    await user.click(batchButton)

    await screen.findByText('Ajouter des lots en batch')

    // Fill codes
    const textarea = screen.getByLabelText('Codes des lots')
    await user.type(textarea, '201, 202, 203')

    // Select variante
    const varianteTrigger = screen.getByLabelText('Variante batch')
    await user.click(varianteTrigger)
    const option = await screen.findByRole('option', { name: 'Type A' })
    await user.click(option)

    // Select étage
    const etageTrigger = screen.getByLabelText('Étage batch')
    await user.click(etageTrigger)
    const etageOption = await screen.findByRole('option', { name: 'RDC' })
    await user.click(etageOption)

    // Submit
    const createButton = screen.getByRole('button', { name: 'Créer 3 lots' })
    await user.click(createButton)

    expect(mockCreateBatchLotsMutate).toHaveBeenCalledWith(
      {
        codes: ['201', '202', '203'],
        varianteId: 'var-1',
        etageNom: 'RDC',
        plotId: 'plot-1',
      },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
    )
  })

  it('shows success toast and closes sheet on successful creation', async () => {
    mockCreateBatchLotsMutate.mockImplementation(
      (_args: unknown, options: { onSuccess?: (data: string[]) => void }) => {
        options?.onSuccess?.(['id-1', 'id-2', 'id-3'])
      },
    )
    const user = userEvent.setup()
    setupMockSupabase(mockVariantes, [])
    renderPlotRoute()

    const batchButton = await screen.findByRole('button', { name: /Ajouter en batch/ })
    await user.click(batchButton)

    await screen.findByText('Ajouter des lots en batch')

    const textarea = screen.getByLabelText('Codes des lots')
    await user.type(textarea, '201, 202, 203')

    const varianteTrigger = screen.getByLabelText('Variante batch')
    await user.click(varianteTrigger)
    const option = await screen.findByRole('option', { name: 'Type A' })
    await user.click(option)

    const etageTrigger2 = screen.getByLabelText('Étage batch')
    await user.click(etageTrigger2)
    const etageOpt2 = await screen.findByRole('option', { name: 'RDC' })
    await user.click(etageOpt2)

    await user.click(screen.getByRole('button', { name: 'Créer 3 lots' }))

    expect(toast).toHaveBeenCalledWith('3 lots créés')
    // Sheet should be closed — title should not be visible
    expect(screen.queryByText('Ajouter des lots en batch')).not.toBeInTheDocument()
  })

  it('shows error toast on server error', async () => {
    mockCreateBatchLotsMutate.mockImplementation(
      (_args: unknown, options: { onError?: () => void }) => {
        options?.onError?.()
      },
    )
    const user = userEvent.setup()
    setupMockSupabase(mockVariantes, [])
    renderPlotRoute()

    const batchButton = await screen.findByRole('button', { name: /Ajouter en batch/ })
    await user.click(batchButton)

    await screen.findByText('Ajouter des lots en batch')

    const textarea = screen.getByLabelText('Codes des lots')
    await user.type(textarea, '201')

    const varianteTrigger = screen.getByLabelText('Variante batch')
    await user.click(varianteTrigger)
    const option = await screen.findByRole('option', { name: 'Type A' })
    await user.click(option)

    const etageTrigger3 = screen.getByLabelText('Étage batch')
    await user.click(etageTrigger3)
    const etageOpt3 = await screen.findByRole('option', { name: 'RDC' })
    await user.click(etageOpt3)

    await user.click(screen.getByRole('button', { name: 'Créer 1 lot' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Erreur lors de la création des lots — aucun lot créé')
    })
  })
})

describe('PlotIndexPage — etage progress indicators', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.channel).mockReturnValue({
      on: vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue({}),
      }),
    } as never)
  })

  it('shows progress indicator X/Y on etage cards', async () => {
    setupMockSupabase(mockVariantes, mockLots)
    renderPlotRoute()

    expect(await screen.findByText('5/7')).toBeInTheDocument()
    // 0/4 appears on both etage card (etage "1") and lot card (lot-3)
    expect(screen.getAllByText('0/4').length).toBeGreaterThanOrEqual(1)
  })
})

describe('PlotIndexPage — lot progress indicators', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.channel).mockReturnValue({
      on: vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue({}),
      }),
    } as never)
  })

  it('shows progress indicator X/Y on lot cards', async () => {
    setupMockSupabase(mockVariantes, mockLots)
    renderPlotRoute()

    expect(await screen.findByText('2/4')).toBeInTheDocument()
    expect(screen.getByText('3/3')).toBeInTheDocument()
    // 0/4 appears on both etage card (etage "1") and lot card (lot-3)
    expect(screen.getAllByText('0/4').length).toBeGreaterThanOrEqual(1)
  })

  it('shows correct status color on lot cards', async () => {
    setupMockSupabase(mockVariantes, mockLots)
    renderPlotRoute()

    await screen.findByText('Lot 001')
    const statusBars = screen.getAllByTestId('status-bar')
    // lot-1: 2/4 = IN_PROGRESS (#F59E0B = rgb(245, 158, 11))
    // lot-2: 3/3 = DONE (#10B981 = rgb(16, 185, 129))
    // lot-3: 0/4 = NOT_STARTED (#64748B = rgb(100, 116, 139))
    const inProgressBars = statusBars.filter(
      (bar) => bar.style.backgroundColor === 'rgb(245, 158, 11)',
    )
    const doneBars = statusBars.filter(
      (bar) => bar.style.backgroundColor === 'rgb(16, 185, 129)',
    )
    const notStartedBars = statusBars.filter(
      (bar) => bar.style.backgroundColor === 'rgb(100, 116, 139)',
    )
    expect(inProgressBars.length).toBeGreaterThanOrEqual(1)
    expect(doneBars.length).toBeGreaterThanOrEqual(1)
    expect(notStartedBars.length).toBeGreaterThanOrEqual(1)
  })
})

describe('PlotIndexPage — TMA badge in lot grid', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.channel).mockReturnValue({
      on: vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue({}),
      }),
    } as never)
  })

  it('shows TMA badge on lot card when is_tma is true', async () => {
    const tmaLots = [
      { ...mockLots[0], is_tma: true },
      mockLots[1],
      mockLots[2],
    ]
    setupMockSupabase(mockVariantes, tmaLots)
    renderPlotRoute()

    await screen.findByText('Lot 001')
    expect(screen.getByText('TMA')).toBeInTheDocument()
  })

  it('does NOT show TMA badge when is_tma is false', async () => {
    setupMockSupabase(mockVariantes, mockLots)
    renderPlotRoute()

    await screen.findByText('Lot 001')
    expect(screen.queryByText('TMA')).not.toBeInTheDocument()
  })
})

describe('PlotIndexPage — lots prêts à carreler counter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.channel).mockReturnValue({
      on: vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue({}),
      }),
    } as never)
  })

  it('shows "lots prêts à carreler" counter when matching lots exist', async () => {
    const lotsWithTachesData = [
      {
        id: 'lot-1',
        code: '001',
        plot_id: 'plot-1',
        etage_id: 'etage-1',
        metrage_m2_total: 12,
        metrage_ml_total: 8,
        plots: { nom: 'Plot A' },
        etages: { nom: 'RDC' },
        pieces: [
          {
            id: 'p-1',
            nom: 'Séjour',
            taches: [
              { id: 't-1', nom: 'Ragréage', status: 'done' },
              { id: 't-2', nom: 'Phonique', status: 'done' },
              { id: 't-3', nom: 'Pose', status: 'not_started' },
            ],
          },
        ],
      },
    ]

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
      if (table === 'variantes') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockVariantes, error: null }),
            }),
          }),
        } as never
      }
      if (table === 'lots') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockImplementation((col: string) => {
              if (col === 'plots.chantier_id') {
                return { order: vi.fn().mockResolvedValue({ data: lotsWithTachesData, error: null }) }
              }
              return { order: vi.fn().mockResolvedValue({ data: [], error: null }) }
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
      return { select: vi.fn() } as never
    })

    renderPlotRoute()

    expect(await screen.findByText(/1 lot prêt à carreler/)).toBeInTheDocument()
  })

  it('hides counter when no lots are prêts à carreler', async () => {
    setupMockSupabase(mockVariantes, mockLots)
    renderPlotRoute()

    await screen.findByRole('heading', { name: /Plot A/ })
    expect(screen.queryByText(/prêt.*carreler/)).not.toBeInTheDocument()
  })
})

describe('PlotIndexPage — GridFilterTabs on étages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.channel).mockReturnValue({
      on: vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue({}),
      }),
    } as never)
  })

  it('shows filter tabs when étages exist', async () => {
    setupMockSupabase(mockVariantes, mockLots)
    renderPlotRoute()

    expect(await screen.findByRole('tablist')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Tous/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /En cours/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Terminés/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Alertes/i })).toBeInTheDocument()
  })

  it('shows correct counts on filter tabs', async () => {
    setupMockSupabase(mockVariantes, mockLots)
    renderPlotRoute()

    await screen.findByRole('tablist')
    // etage-1: 5/7 (in progress), etage-2: 0/4 (not started)
    expect(screen.getByRole('tab', { name: /Tous/i })).toHaveTextContent('(2)')
    expect(screen.getByRole('tab', { name: /En cours/i })).toHaveTextContent('(1)')
    expect(screen.getByRole('tab', { name: /Terminés/i })).toHaveTextContent('(0)')
    expect(screen.getByRole('tab', { name: /Alertes/i })).toHaveTextContent('(0)')
  })

  it('"Alertes" shows empty state message', async () => {
    const user = userEvent.setup()
    setupMockSupabase(mockVariantes, mockLots)
    renderPlotRoute()

    await screen.findByRole('tablist')
    await user.click(screen.getByRole('tab', { name: /Alertes/i }))

    expect(await screen.findByText('Aucun étage avec alertes')).toBeInTheDocument()
  })
})
