import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  createRouter,
  createMemoryHistory,
  RouterProvider,
} from '@tanstack/react-router'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { routeTree } from '@/routeTree.gen'
import { AuthContext, type AuthState } from '@/lib/auth'

const mockCreatePlotMutate = vi.fn()

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
    mutate: mockCreatePlotMutate,
    isPending: false,
  }),
  DEFAULT_TASK_DEFINITIONS: ['Ragréage', 'Phonique', 'Pose', 'Plinthes', 'Joints', 'Silicone'],
}))

vi.mock('@/lib/utils/formatRelativeTime', () => ({
  formatRelativeTime: () => 'il y a 2h',
}))

import { supabase } from '@/lib/supabase'

const mockChantierComplet = {
  id: 'chantier-1',
  nom: 'Les Oliviers',
  type: 'complet' as const,
  status: 'active' as const,
  progress_done: 0,
  progress_total: 0,
  created_at: '2026-01-01T00:00:00Z',
  created_by: 'user-1',
}

const mockChantierLeger = {
  ...mockChantierComplet,
  id: 'chantier-2',
  nom: 'Rénovation Duval',
  type: 'leger' as const,
}

const mockPlots = [
  {
    id: 'plot-1',
    chantier_id: 'chantier-1',
    nom: 'Plot A',
    task_definitions: ['Ragréage', 'Phonique', 'Pose', 'Plinthes', 'Joints', 'Silicone'],
    progress_done: 10,
    progress_total: 20,
    has_blocking_note: false,
    metrage_m2_total: 125,
    metrage_ml_total: 82,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'plot-2',
    chantier_id: 'chantier-1',
    nom: 'Plot B',
    task_definitions: ['Pose'],
    progress_done: 0,
    progress_total: 5,
    has_blocking_note: false,
    metrage_m2_total: 0,
    metrage_ml_total: 0,
    created_at: '2026-01-02T00:00:00Z',
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

const mockLivraisons = [
  {
    id: 'liv1',
    chantier_id: 'chantier-2',
    description: 'Colle pour faïence 20kg',
    status: 'commande' as const,
    date_prevue: null,
    bc_file_url: null,
    bc_file_name: null,
    bl_file_url: null,
    bl_file_name: null,
    created_at: '2026-02-10T10:00:00Z',
    created_by: 'user-1',
  },
  {
    id: 'liv2',
    chantier_id: 'chantier-2',
    description: 'Croisillons 3mm',
    status: 'prevu' as const,
    date_prevue: '2026-02-15',
    bc_file_url: null,
    bc_file_name: null,
    bl_file_url: null,
    bl_file_name: null,
    created_at: '2026-02-09T10:00:00Z',
    created_by: 'user-1',
  },
]

function setupMockSupabase(
  chantier: typeof mockChantierComplet,
  plots: typeof mockPlots,
  livraisons: typeof mockLivraisons = [],
  lotsWithTaches: unknown[] = [],
  inventaire: unknown[] = [],
  besoins: unknown[] = [],
) {
  vi.mocked(supabase.from).mockImplementation((table: string) => {
    if (table === 'chantiers') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockImplementation((_col: string, val: unknown) => {
            if (val === chantier.id) {
              return { single: vi.fn().mockResolvedValue({ data: chantier, error: null }) }
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
            order: vi.fn().mockResolvedValue({ data: plots, error: null }),
          }),
        }),
      } as never
    }
    if (table === 'besoins') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: besoins, error: null }),
            }),
          }),
        }),
      } as never
    }
    if (table === 'livraisons') {
      // Must support both useLivraisonsCount (.eq() awaitable) and
      // useLivraisons (.eq().order() awaitable) chains
      const countResult = { count: livraisons.length, error: null }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: livraisons, error: null }),
            then: (resolve: (v: unknown) => void) => resolve(countResult),
          }),
        }),
      } as never
    }
    if (table === 'lots') {
      // useLotsWithTaches: .select(...).eq('plots.chantier_id', id).order('code')
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: lotsWithTaches, error: null }),
          }),
        }),
      } as never
    }
    if (table === 'inventaire') {
      // useInventaire: .select(...).eq('chantier_id', id).order(...).order(...)
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
    return { select: vi.fn() } as never
  })
}

function renderRoute(chantierId: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const auth = createMockAuth()
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [`/chantiers/${chantierId}`] }),
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

describe('ChantierIndexPage — complet with plots', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.channel).mockReturnValue({
      on: vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue({}),
      }),
    } as never)
  })

  it('displays plots as StatusCards for complet chantier', async () => {
    setupMockSupabase(mockChantierComplet, mockPlots)
    renderRoute('chantier-1')

    expect(await screen.findByText('Plot A')).toBeInTheDocument()
    expect(screen.getByText('Plot B')).toBeInTheDocument()
    expect(screen.getByText('6 tâches définies')).toBeInTheDocument()
    expect(screen.getByText('1 tâche définie')).toBeInTheDocument()
  })

  it('shows "Ajouter un plot" button when plots exist', async () => {
    setupMockSupabase(mockChantierComplet, mockPlots)
    renderRoute('chantier-1')

    expect(await screen.findByText('Plot A')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ajouter un plot/i })).toBeInTheDocument()
  })

  it('shows badge Complet and progress', async () => {
    setupMockSupabase(mockChantierComplet, mockPlots)
    renderRoute('chantier-1')

    await screen.findByText('Plot A')
    expect(screen.getByText('Complet')).toBeInTheDocument()
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('shows progress indicator X/Y on plot cards', async () => {
    setupMockSupabase(mockChantierComplet, mockPlots)
    renderRoute('chantier-1')

    expect(await screen.findByText('10/20')).toBeInTheDocument()
    expect(screen.getByText('0/5')).toBeInTheDocument()
  })

  it('shows "Plots" heading', async () => {
    setupMockSupabase(mockChantierComplet, mockPlots)
    renderRoute('chantier-1')

    expect(await screen.findByRole('heading', { name: 'Plots' })).toBeInTheDocument()
  })

  it('shows metrage on plot card when values > 0', async () => {
    setupMockSupabase(mockChantierComplet, mockPlots)
    renderRoute('chantier-1')

    await screen.findByText('Plot A')
    expect(screen.getByText('125 m² · 82 ML')).toBeInTheDocument()
  })

  it('hides metrage on plot card when both values are 0', async () => {
    setupMockSupabase(mockChantierComplet, mockPlots)
    renderRoute('chantier-1')

    await screen.findByText('Plot B')
    const plotBCard = screen.getByText('Plot B').closest('[class*="relative"]')!
    expect(plotBCard.textContent).not.toContain('m²')
    expect(plotBCard.textContent).not.toContain('ML')
  })
})

describe('ChantierIndexPage — complet empty state', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.channel).mockReturnValue({
      on: vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue({}),
      }),
    } as never)
  })

  it('shows "Aucun plot configuré" when no plots exist', async () => {
    setupMockSupabase(mockChantierComplet, [])
    renderRoute('chantier-1')

    expect(await screen.findByText('Aucun plot configuré')).toBeInTheDocument()
  })

  it('shows "Ajouter votre premier plot" button when empty', async () => {
    setupMockSupabase(mockChantierComplet, [])
    renderRoute('chantier-1')

    expect(await screen.findByText('Aucun plot configuré')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ajouter votre premier plot/i })).toBeInTheDocument()
  })
})

describe('ChantierIndexPage — léger', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.channel).mockReturnValue({
      on: vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue({}),
      }),
    } as never)
  })

  it('shows besoins empty state for léger chantier', async () => {
    setupMockSupabase(mockChantierLeger, [])
    renderRoute('chantier-2')

    expect(await screen.findByText('Aucun besoin en attente')).toBeInTheDocument()
  })

  it('does not show "Ajouter un plot" button for léger', async () => {
    setupMockSupabase(mockChantierLeger, [])
    renderRoute('chantier-2')

    await screen.findByText('Aucun besoin en attente')
    expect(screen.queryByRole('button', { name: /plot/i })).not.toBeInTheDocument()
  })

  it('shows badge Léger', async () => {
    setupMockSupabase(mockChantierLeger, [])
    renderRoute('chantier-2')

    await screen.findByText('Aucun besoin en attente')
    expect(screen.getByText('Léger')).toBeInTheDocument()
  })
})

const filterMockPlots = [
  ...mockPlots,
  {
    id: 'plot-3',
    chantier_id: 'chantier-1',
    nom: 'Plot C',
    task_definitions: ['Pose'],
    progress_done: 5,
    progress_total: 5,
    created_at: '2026-01-03T00:00:00Z',
  },
]

describe('ChantierIndexPage — GridFilterTabs on plots', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.channel).mockReturnValue({
      on: vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue({}),
      }),
    } as never)
  })

  it('shows filter tabs when complet chantier has plots', async () => {
    setupMockSupabase(mockChantierComplet, filterMockPlots)
    renderRoute('chantier-1')

    expect(await screen.findByRole('tablist')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Tous/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /En cours/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Terminés/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Avec alertes/i })).toBeInTheDocument()
  })

  it('shows correct counts on filter tabs', async () => {
    setupMockSupabase(mockChantierComplet, filterMockPlots)
    renderRoute('chantier-1')

    await screen.findByRole('tablist')
    expect(screen.getByRole('tab', { name: /Tous/i })).toHaveTextContent('(3)')
    expect(screen.getByRole('tab', { name: /En cours/i })).toHaveTextContent('(1)')
    expect(screen.getByRole('tab', { name: /Terminés/i })).toHaveTextContent('(1)')
    expect(screen.getByRole('tab', { name: /Avec alertes/i })).toHaveTextContent('(0)')
  })

  it('"En cours" filter shows only partially completed plots', async () => {
    const user = userEvent.setup()
    setupMockSupabase(mockChantierComplet, filterMockPlots)
    renderRoute('chantier-1')

    await screen.findByRole('tablist')
    await user.click(screen.getByRole('tab', { name: /En cours/i }))

    expect(screen.getByText('Plot A')).toBeInTheDocument()
    expect(screen.queryByText('Plot B')).not.toBeInTheDocument()
    expect(screen.queryByText('Plot C')).not.toBeInTheDocument()
  })

  it('does not show filter tabs for léger chantier', async () => {
    setupMockSupabase(mockChantierLeger, [])
    renderRoute('chantier-2')

    await screen.findByText('Aucun besoin en attente')
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
  })
})

describe('ChantierIndexPage — Sheet creation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.channel).mockReturnValue({
      on: vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue({}),
      }),
    } as never)
  })

  it('opens Sheet when "Ajouter un plot" is clicked', async () => {
    const user = userEvent.setup()
    setupMockSupabase(mockChantierComplet, [])
    renderRoute('chantier-1')

    await screen.findByText('Aucun plot configuré')
    await user.click(screen.getByRole('button', { name: /Ajouter votre premier plot/i }))

    expect(await screen.findByText('Nouveau plot')).toBeInTheDocument()
    expect(screen.getByLabelText('Nom du plot')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Créer le plot' })).toBeInTheDocument()
  })

  it('shows validation error when submitting empty name', async () => {
    const user = userEvent.setup()
    setupMockSupabase(mockChantierComplet, [])
    renderRoute('chantier-1')

    await screen.findByText('Aucun plot configuré')
    await user.click(screen.getByRole('button', { name: /Ajouter votre premier plot/i }))
    await screen.findByText('Nouveau plot')
    await user.click(screen.getByRole('button', { name: 'Créer le plot' }))

    expect(await screen.findByText('Le nom du plot est requis')).toBeInTheDocument()
    expect(mockCreatePlotMutate).not.toHaveBeenCalled()
  })

  it('calls createPlot mutation with correct params', async () => {
    const user = userEvent.setup()
    setupMockSupabase(mockChantierComplet, [])
    renderRoute('chantier-1')

    await screen.findByText('Aucun plot configuré')
    await user.click(screen.getByRole('button', { name: /Ajouter votre premier plot/i }))
    await screen.findByText('Nouveau plot')

    const input = screen.getByLabelText('Nom du plot')
    await user.type(input, 'Plot A')
    await user.click(screen.getByRole('button', { name: 'Créer le plot' }))

    expect(mockCreatePlotMutate).toHaveBeenCalledWith(
      { chantierId: 'chantier-1', nom: 'Plot A' },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    )
  })
})

describe('ChantierIndexPage — léger livraisons integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.channel).mockReturnValue({
      on: vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue({}),
      }),
    } as never)
  })

  it('shows livraisons heading with count for léger chantier', async () => {
    setupMockSupabase(mockChantierLeger, [], mockLivraisons)
    renderRoute('chantier-2')

    expect(await screen.findByText('Livraisons (2)')).toBeInTheDocument()
  })

  it('shows DeliveryCards with descriptions in léger chantier', async () => {
    setupMockSupabase(mockChantierLeger, [], mockLivraisons)
    renderRoute('chantier-2')

    expect(await screen.findByText('Colle pour faïence 20kg')).toBeInTheDocument()
    expect(screen.getByText('Croisillons 3mm')).toBeInTheDocument()
  })

  it('shows correct action buttons per livraison status', async () => {
    setupMockSupabase(mockChantierLeger, [], mockLivraisons)
    renderRoute('chantier-2')

    expect(await screen.findByText('Colle pour faïence 20kg')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Marquer prévu' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirmer livraison' })).toBeInTheDocument()
  })

  it('shows livraisons empty state when no livraisons in léger', async () => {
    setupMockSupabase(mockChantierLeger, [], [])
    renderRoute('chantier-2')

    await screen.findByText('Aucun besoin en attente')
    expect(screen.getByText('Aucune livraison')).toBeInTheDocument()
  })

  it('shows FAB with menu items in léger chantier', async () => {
    setupMockSupabase(mockChantierLeger, [], [])
    renderRoute('chantier-2')

    await screen.findByText('Aucun besoin en attente')
    expect(screen.getByRole('button', { name: 'Ajouter' })).toBeInTheDocument()
  })
})

describe('ChantierIndexPage — complet livraisons button', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.channel).mockReturnValue({
      on: vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue({}),
      }),
    } as never)
  })

  it('shows "Livraisons" button in complet chantier header', async () => {
    setupMockSupabase(mockChantierComplet, mockPlots)
    renderRoute('chantier-1')

    await screen.findByText('Plot A')
    expect(screen.getByRole('link', { name: /Livraisons/i })).toBeInTheDocument()
  })

  it('Livraisons link points to correct route', async () => {
    setupMockSupabase(mockChantierComplet, mockPlots)
    renderRoute('chantier-1')

    await screen.findByText('Plot A')
    expect(screen.getByRole('link', { name: /Livraisons/i })).toHaveAttribute(
      'href',
      '/chantiers/chantier-1/livraisons',
    )
  })
})

describe('ChantierIndexPage — complet inventaire button', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.channel).mockReturnValue({
      on: vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue({}),
      }),
    } as never)
  })

  it('shows "Inventaire" button in complet chantier header', async () => {
    setupMockSupabase(mockChantierComplet, mockPlots)
    renderRoute('chantier-1')

    await screen.findByText('Plot A')
    expect(screen.getByRole('link', { name: /Inventaire/i })).toBeInTheDocument()
  })

  it('Inventaire link points to correct route', async () => {
    setupMockSupabase(mockChantierComplet, mockPlots)
    renderRoute('chantier-1')

    await screen.findByText('Plot A')
    expect(screen.getByRole('link', { name: /Inventaire/i })).toHaveAttribute(
      'href',
      '/chantiers/chantier-1/inventaire',
    )
  })
})

describe('ChantierIndexPage — ChantierIndicators integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.channel).mockReturnValue({
      on: vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue({}),
      }),
    } as never)
  })

  const mockLotsWithTaches = [
    {
      id: 'lot-1',
      code: '101',
      plot_id: 'plot-1',
      etage_id: 'etage-1',
      metrage_m2_total: 12.5,
      metrage_ml_total: 8.2,
      plots: { nom: 'Plot A' },
      etages: { nom: 'RDC' },
      pieces: [
        {
          id: 'piece-1',
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

  const mockBesoins = [
    { id: 'b-1', chantier_id: 'chantier-1', description: 'Colle 20kg', livraison_id: null, created_at: '2026-02-01', created_by: null },
  ]

  it('shows indicators when data is available for complet chantier', async () => {
    setupMockSupabase(mockChantierComplet, mockPlots, [], mockLotsWithTaches, [], mockBesoins)
    renderRoute('chantier-1')

    expect(await screen.findByTestId('chantier-indicators')).toBeInTheDocument()
    expect(screen.getByText(/1 lot prêt à carreler/)).toBeInTheDocument()
    expect(screen.getByText(/1 besoin en attente/)).toBeInTheDocument()
  })

  it('shows only besoins and livraisons indicators for léger chantier', async () => {
    const mockLivraisonsPrevu = [
      {
        id: 'liv-1',
        chantier_id: 'chantier-2',
        description: 'Plinthes chêne',
        status: 'prevu' as const,
        date_prevue: '2026-02-20',
        bc_file_url: null,
        bc_file_name: null,
        bl_file_url: null,
        bl_file_name: null,
        created_at: '2026-02-01',
        created_by: null,
      },
    ]
    setupMockSupabase(mockChantierLeger, [], mockLivraisonsPrevu, [], [], mockBesoins)
    renderRoute('chantier-2')

    expect(await screen.findByTestId('chantier-indicators')).toBeInTheDocument()
    expect(screen.getByText(/1 besoin en attente/)).toBeInTheDocument()
    expect(screen.getByText(/Livraisons prévues/)).toBeInTheDocument()
    // No "lots prêts" for léger
    expect(screen.queryByText(/lot.*prêt.*carreler/)).not.toBeInTheDocument()
  })
})
