import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  createRouter,
  createMemoryHistory,
  RouterProvider,
} from '@tanstack/react-router'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { routeTree } from '@/routeTree.gen'
import { AuthContext, type AuthState } from '@/lib/auth'

const mockUpdateTasksMutate = vi.fn()
const mockDeletePlotMutate = vi.fn()

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
    mutate: mockUpdateTasksMutate,
    isPending: false,
  }),
}))

vi.mock('@/lib/mutations/useDeletePlot', () => ({
  useDeletePlot: () => ({
    mutate: mockDeletePlotMutate,
    isPending: false,
  }),
}))

vi.mock('@/lib/queries/useVariantes', () => ({
  useVariantes: () => ({
    data: [],
    isLoading: false,
    isSuccess: true,
  }),
}))

vi.mock('@/lib/mutations/useCreateVariante', () => ({
  useCreateVariante: () => ({
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
  task_definitions: ['Ragréage', 'Phonique', 'Pose'],
  created_at: '2026-01-01T00:00:00Z',
}

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

function setupMockSupabase(plots: typeof mockPlot[]) {
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
            order: vi.fn().mockResolvedValue({ data: plots, error: null }),
          }),
        }),
      } as never
    }
    return { select: vi.fn() } as never
  })
}

function renderPlotRoute(chantierId: string, plotId: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const auth = createMockAuth()
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({
      initialEntries: [`/chantiers/${chantierId}/plots/${plotId}`],
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

describe('PlotDetailPage — displays tasks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.channel).mockReturnValue({
      on: vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue({}),
      }),
    } as never)
  })

  it('shows plot name as heading', async () => {
    setupMockSupabase([mockPlot])
    renderPlotRoute('chantier-1', 'plot-1')

    expect(await screen.findByRole('heading', { name: 'Plot A' })).toBeInTheDocument()
  })

  it('displays all task definitions', async () => {
    setupMockSupabase([mockPlot])
    renderPlotRoute('chantier-1', 'plot-1')

    expect(await screen.findByText('Ragréage')).toBeInTheDocument()
    expect(screen.getByText('Phonique')).toBeInTheDocument()
    expect(screen.getByText('Pose')).toBeInTheDocument()
  })

  it('shows "Tâches disponibles" section heading', async () => {
    setupMockSupabase([mockPlot])
    renderPlotRoute('chantier-1', 'plot-1')

    expect(await screen.findByText('Tâches disponibles')).toBeInTheDocument()
  })

  it('shows add task input and button', async () => {
    setupMockSupabase([mockPlot])
    renderPlotRoute('chantier-1', 'plot-1')

    expect(await screen.findByLabelText('Nouvelle tâche')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ajouter' })).toBeInTheDocument()
  })
})

describe('PlotDetailPage — add task', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.channel).mockReturnValue({
      on: vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue({}),
      }),
    } as never)
  })

  it('calls updateTasks with new task when "Ajouter" is clicked', async () => {
    const user = userEvent.setup()
    setupMockSupabase([mockPlot])
    renderPlotRoute('chantier-1', 'plot-1')

    await screen.findByText('Ragréage')
    const input = screen.getByLabelText('Nouvelle tâche')
    await user.type(input, 'Nettoyage')
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))

    expect(mockUpdateTasksMutate).toHaveBeenCalledWith({
      plotId: 'plot-1',
      chantierId: 'chantier-1',
      taskDefinitions: ['Ragréage', 'Phonique', 'Pose', 'Nettoyage'],
    })
  })

  it('clears input after adding task', async () => {
    const user = userEvent.setup()
    setupMockSupabase([mockPlot])
    renderPlotRoute('chantier-1', 'plot-1')

    await screen.findByText('Ragréage')
    const input = screen.getByLabelText('Nouvelle tâche')
    await user.type(input, 'Nettoyage')
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))

    expect(input).toHaveValue('')
  })
})

describe('PlotDetailPage — remove task', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.channel).mockReturnValue({
      on: vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue({}),
      }),
    } as never)
  })

  it('calls updateTasks without the removed task', async () => {
    const user = userEvent.setup()
    setupMockSupabase([mockPlot])
    renderPlotRoute('chantier-1', 'plot-1')

    await screen.findByText('Ragréage')
    await user.click(screen.getByRole('button', { name: 'Supprimer Phonique' }))

    expect(mockUpdateTasksMutate).toHaveBeenCalledWith({
      plotId: 'plot-1',
      chantierId: 'chantier-1',
      taskDefinitions: ['Ragréage', 'Pose'],
    })
  })
})

describe('PlotDetailPage — delete plot', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.channel).mockReturnValue({
      on: vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue({}),
      }),
    } as never)
  })

  it('shows delete dialog when "Supprimer le plot" is clicked', async () => {
    const user = userEvent.setup()
    setupMockSupabase([mockPlot])
    renderPlotRoute('chantier-1', 'plot-1')

    await screen.findByText('Plot A')
    await user.click(screen.getByRole('button', { name: 'Options du plot' }))
    await user.click(await screen.findByRole('menuitem', { name: /Supprimer le plot/i }))

    const dialog = await screen.findByRole('alertdialog')
    expect(dialog).toBeInTheDocument()
    expect(screen.getByText('Supprimer ce plot ?')).toBeInTheDocument()
    expect(screen.getByText(/Plot A et toutes ses données seront supprimés/)).toBeInTheDocument()
  })

  it('calls deletePlot mutation when confirmed', async () => {
    const user = userEvent.setup()
    setupMockSupabase([mockPlot])
    renderPlotRoute('chantier-1', 'plot-1')

    await screen.findByText('Plot A')
    await user.click(screen.getByRole('button', { name: 'Options du plot' }))
    await user.click(await screen.findByRole('menuitem', { name: /Supprimer le plot/i }))

    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Supprimer' }))

    expect(mockDeletePlotMutate).toHaveBeenCalledWith(
      { plotId: 'plot-1', chantierId: 'chantier-1' },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    )
  })

  it('shows "Plot introuvable" for invalid plot id', async () => {
    setupMockSupabase([mockPlot])
    renderPlotRoute('chantier-1', 'nonexistent')

    expect(await screen.findByText('Plot introuvable')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retour au chantier' })).toBeInTheDocument()
  })
})
