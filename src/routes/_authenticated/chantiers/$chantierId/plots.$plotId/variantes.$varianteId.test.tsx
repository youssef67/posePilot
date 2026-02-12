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

const mockAddPieceMutate = vi.fn()
const mockDeletePieceMutate = vi.fn()
const mockDeleteVarianteMutate = vi.fn()
const mockAddDocumentMutate = vi.fn()
const mockDeleteDocumentMutate = vi.fn()
const mockToggleRequiredMutate = vi.fn()
const mockToastError = vi.fn()

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    error: (...args: unknown[]) => mockToastError(...args),
    success: vi.fn(),
  }),
}))

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

vi.mock('@/lib/mutations/useAddVariantePiece', () => ({
  useAddVariantePiece: () => ({
    mutate: mockAddPieceMutate,
    isPending: false,
  }),
}))

vi.mock('@/lib/mutations/useDeleteVariantePiece', () => ({
  useDeleteVariantePiece: () => ({
    mutate: mockDeletePieceMutate,
    isPending: false,
  }),
}))

vi.mock('@/lib/mutations/useDeleteVariante', () => ({
  useDeleteVariante: () => ({
    mutate: mockDeleteVarianteMutate,
    isPending: false,
  }),
}))

vi.mock('@/lib/mutations/useAddVarianteDocument', () => ({
  useAddVarianteDocument: () => ({
    mutate: mockAddDocumentMutate,
    isPending: false,
  }),
}))

vi.mock('@/lib/mutations/useDeleteVarianteDocument', () => ({
  useDeleteVarianteDocument: () => ({
    mutate: mockDeleteDocumentMutate,
    isPending: false,
  }),
}))

vi.mock('@/lib/mutations/useToggleDocumentRequired', () => ({
  useToggleDocumentRequired: () => ({
    mutate: mockToggleRequiredMutate,
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

const mockVariante = {
  id: 'var-1',
  plot_id: 'plot-1',
  nom: 'Type A',
  created_at: '2026-01-01T00:00:00Z',
  variante_pieces: [{ count: 2 }],
}

const mockPieces = [
  {
    id: 'piece-1',
    variante_id: 'var-1',
    nom: 'Séjour',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'piece-2',
    variante_id: 'var-1',
    nom: 'Chambre',
    created_at: '2026-01-02T00:00:00Z',
  },
]

const mockDocuments = [
  {
    id: 'doc-1',
    variante_id: 'var-1',
    nom: 'Plan de pose',
    is_required: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'doc-2',
    variante_id: 'var-1',
    nom: 'Fiche de choix',
    is_required: false,
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

function setupMockSupabase(pieces: typeof mockPieces, documents: typeof mockDocuments = mockDocuments) {
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
            order: vi.fn().mockResolvedValue({ data: [mockVariante], error: null }),
          }),
        }),
      } as never
    }
    if (table === 'variante_pieces') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: pieces, error: null }),
          }),
        }),
      } as never
    }
    if (table === 'variante_documents') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: documents, error: null }),
          }),
        }),
      } as never
    }
    return { select: vi.fn() } as never
  })
}

function renderVarianteRoute() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const auth = createMockAuth()
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({
      initialEntries: ['/chantiers/chantier-1/plots/plot-1/variantes/var-1'],
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

describe('VarianteDetailPage — displays pieces', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.channel).mockReturnValue({
      on: vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue({}),
      }),
    } as never)
  })

  it('shows variante name as heading', async () => {
    setupMockSupabase(mockPieces)
    renderVarianteRoute()

    expect(await screen.findByRole('heading', { name: 'Type A' })).toBeInTheDocument()
  })

  it('displays all pieces', async () => {
    setupMockSupabase(mockPieces)
    renderVarianteRoute()

    expect(await screen.findByText('Séjour')).toBeInTheDocument()
    expect(screen.getByText('Chambre')).toBeInTheDocument()
  })

  it('shows inherited task count for each piece', async () => {
    setupMockSupabase(mockPieces)
    renderVarianteRoute()

    await screen.findByText('Séjour')
    const taskLabels = screen.getAllByText('3 tâches héritées du plot')
    expect(taskLabels).toHaveLength(2)
  })

  it('shows empty state when no pieces exist', async () => {
    setupMockSupabase([])
    renderVarianteRoute()

    expect(await screen.findByText('Aucune pièce définie')).toBeInTheDocument()
  })

  it('shows add piece input and button', async () => {
    setupMockSupabase(mockPieces)
    renderVarianteRoute()

    expect(await screen.findByLabelText('Nouvelle pièce')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Ajouter' })[0]).toBeInTheDocument()
  })
})

describe('VarianteDetailPage — expand piece tasks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.channel).mockReturnValue({
      on: vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue({}),
      }),
    } as never)
  })

  it('expands piece to show inherited tasks on click', async () => {
    const user = userEvent.setup()
    setupMockSupabase(mockPieces)
    renderVarianteRoute()

    await screen.findByText('Séjour')
    await user.click(screen.getByLabelText('Déplier Séjour'))

    expect(screen.getByText('Ragréage')).toBeInTheDocument()
    expect(screen.getByText('Phonique')).toBeInTheDocument()
    expect(screen.getByText('Pose')).toBeInTheDocument()
  })
})

describe('VarianteDetailPage — add piece', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.channel).mockReturnValue({
      on: vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue({}),
      }),
    } as never)
  })

  it('calls addPiece with correct params', async () => {
    const user = userEvent.setup()
    setupMockSupabase(mockPieces)
    renderVarianteRoute()

    await screen.findByText('Séjour')
    const input = screen.getByLabelText('Nouvelle pièce')
    await user.type(input, 'SDB')
    await user.click(screen.getAllByRole('button', { name: 'Ajouter' })[0])

    expect(mockAddPieceMutate).toHaveBeenCalledWith({
      varianteId: 'var-1',
      nom: 'SDB',
      plotId: 'plot-1',
    })
  })
})

describe('VarianteDetailPage — delete piece', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.channel).mockReturnValue({
      on: vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue({}),
      }),
    } as never)
  })

  it('calls deletePiece when X button is clicked', async () => {
    const user = userEvent.setup()
    setupMockSupabase(mockPieces)
    renderVarianteRoute()

    await screen.findByText('Séjour')
    await user.click(screen.getByRole('button', { name: 'Supprimer Séjour' }))

    expect(mockDeletePieceMutate).toHaveBeenCalledWith({
      pieceId: 'piece-1',
      varianteId: 'var-1',
      plotId: 'plot-1',
    })
  })
})

describe('VarianteDetailPage — delete variante', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.channel).mockReturnValue({
      on: vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue({}),
      }),
    } as never)
  })

  it('shows delete dialog when "Supprimer la variante" is clicked', async () => {
    const user = userEvent.setup()
    setupMockSupabase(mockPieces)
    renderVarianteRoute()

    await screen.findByText('Type A')
    await user.click(screen.getByRole('button', { name: 'Options de la variante' }))
    await user.click(await screen.findByRole('menuitem', { name: /Supprimer la variante/i }))

    const dialog = await screen.findByRole('alertdialog')
    expect(dialog).toBeInTheDocument()
    expect(screen.getByText('Supprimer cette variante ?')).toBeInTheDocument()
    expect(screen.getByText(/Type A et toutes ses pièces et documents seront supprimés/)).toBeInTheDocument()
  })

  it('calls deleteVariante mutation when confirmed', async () => {
    const user = userEvent.setup()
    setupMockSupabase(mockPieces)
    renderVarianteRoute()

    await screen.findByText('Type A')
    await user.click(screen.getByRole('button', { name: 'Options de la variante' }))
    await user.click(await screen.findByRole('menuitem', { name: /Supprimer la variante/i }))

    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Supprimer' }))

    expect(mockDeleteVarianteMutate).toHaveBeenCalledWith(
      { varianteId: 'var-1', plotId: 'plot-1' },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    )
  })
})

describe('VarianteDetailPage — documents section', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.channel).mockReturnValue({
      on: vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue({}),
      }),
    } as never)
  })

  it('displays "Documents par défaut" heading', async () => {
    setupMockSupabase(mockPieces)
    renderVarianteRoute()

    expect(await screen.findByRole('heading', { name: 'Documents par défaut' })).toBeInTheDocument()
  })

  it('shows empty state when no documents', async () => {
    setupMockSupabase(mockPieces, [])
    renderVarianteRoute()

    expect(
      await screen.findByText('Aucun document requis — Les lots hériteront de zéro contrainte documentaire.'),
    ).toBeInTheDocument()
  })

  it('displays all documents with names', async () => {
    setupMockSupabase(mockPieces)
    renderVarianteRoute()

    expect(await screen.findByText('Plan de pose')).toBeInTheDocument()
    expect(screen.getByText('Fiche de choix')).toBeInTheDocument()
  })

  it('shows "Obligatoire" label for required documents', async () => {
    setupMockSupabase(mockPieces)
    renderVarianteRoute()

    await screen.findByText('Plan de pose')
    expect(screen.getByText('Obligatoire')).toBeInTheDocument()
  })

  it('shows "Optionnel" label for optional documents', async () => {
    setupMockSupabase(mockPieces)
    renderVarianteRoute()

    await screen.findByText('Fiche de choix')
    expect(screen.getByText('Optionnel')).toBeInTheDocument()
  })

  it('shows add document input and button', async () => {
    setupMockSupabase(mockPieces)
    renderVarianteRoute()

    expect(await screen.findByLabelText('Nouveau document')).toBeInTheDocument()
  })

  it('calls addDocument with correct params', async () => {
    const user = userEvent.setup()
    setupMockSupabase(mockPieces)
    renderVarianteRoute()

    await screen.findByText('Plan de pose')
    const input = screen.getByLabelText('Nouveau document')
    await user.type(input, 'Relevé acoustique')
    // Find the Ajouter button in the documents section (second one on page)
    const buttons = screen.getAllByRole('button', { name: 'Ajouter' })
    await user.click(buttons[1])

    expect(mockAddDocumentMutate).toHaveBeenCalledWith({
      varianteId: 'var-1',
      nom: 'Relevé acoustique',
    })
  })

  it('calls deleteDocument when X button is clicked', async () => {
    const user = userEvent.setup()
    setupMockSupabase(mockPieces)
    renderVarianteRoute()

    await screen.findByText('Plan de pose')
    await user.click(screen.getByRole('button', { name: 'Supprimer Plan de pose' }))

    expect(mockDeleteDocumentMutate).toHaveBeenCalledWith({
      docId: 'doc-1',
      varianteId: 'var-1',
    })
  })

  it('calls toggleRequired when switch is toggled', async () => {
    const user = userEvent.setup()
    setupMockSupabase(mockPieces)
    renderVarianteRoute()

    await screen.findByText('Plan de pose')
    // Plan de pose is required (checked), toggle it off
    await user.click(screen.getByRole('switch', { name: 'Obligatoire Plan de pose' }))

    expect(mockToggleRequiredMutate).toHaveBeenCalledWith({
      docId: 'doc-1',
      isRequired: false,
      varianteId: 'var-1',
    })
  })
})

describe('VarianteDetailPage — document duplicate prevention', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.channel).mockReturnValue({
      on: vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue({}),
      }),
    } as never)
  })

  it('prevents adding a duplicate document (case-insensitive) and shows toast error', async () => {
    const user = userEvent.setup()
    setupMockSupabase(mockPieces)
    renderVarianteRoute()

    await screen.findByText('Plan de pose')
    const input = screen.getByLabelText('Nouveau document')
    await user.type(input, 'plan de pose')
    const buttons = screen.getAllByRole('button', { name: 'Ajouter' })
    await user.click(buttons[1])

    expect(mockAddDocumentMutate).not.toHaveBeenCalled()
    expect(mockToastError).toHaveBeenCalledWith('Ce document existe déjà')
  })
})
