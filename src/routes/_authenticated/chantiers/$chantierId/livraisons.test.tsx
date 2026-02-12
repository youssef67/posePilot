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

const mockCreateMutate = vi.fn()
const mockUpdateStatusMutate = vi.fn()

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

vi.mock('@/lib/utils/formatRelativeTime', () => ({
  formatRelativeTime: () => 'il y a 2h',
}))

vi.mock('@/lib/mutations/useCreateLivraison', () => ({
  useCreateLivraison: () => ({
    mutate: mockCreateMutate,
    isPending: false,
  }),
}))

vi.mock('@/lib/mutations/useUpdateLivraisonStatus', () => ({
  useUpdateLivraisonStatus: () => ({
    mutate: mockUpdateStatusMutate,
    isPending: false,
  }),
}))

import { supabase } from '@/lib/supabase'

const mockChantier = {
  id: 'abc-123',
  nom: 'Les Oliviers',
  type: 'complet' as const,
  status: 'active' as const,
  progress_done: 3,
  progress_total: 10,
  created_at: '2026-01-01T00:00:00Z',
  created_by: 'user-1',
}

const mockLivraisons = [
  {
    id: 'liv1',
    chantier_id: 'abc-123',
    description: 'Colle pour faïence 20kg',
    status: 'commande',
    date_prevue: null,
    bc_file_url: null,
    bc_file_name: null,
    bl_file_url: null,
    bl_file_name: null,
    created_at: new Date().toISOString(),
    created_by: 'user-1',
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

function renderRoute(chantierId: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const auth = createMockAuth()
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [`/chantiers/${chantierId}/livraisons`] }),
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

function setupMocks(livraisons: unknown[] = []) {
  vi.mocked(supabase.from).mockImplementation((table: string) => {
    if (table === 'chantiers') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockChantier, error: null }),
          }),
        }),
      } as never
    }
    if (table === 'livraisons') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: livraisons, error: null }),
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
}

describe('LivraisonsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.channel).mockReturnValue({
      on: vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue({}),
      }),
    } as never)
  })

  it('renders heading with chantier name', async () => {
    setupMocks()
    renderRoute('abc-123')

    expect(await screen.findByRole('heading', { name: /Livraisons — Les Oliviers/ })).toBeInTheDocument()
  })

  it('shows empty state when no livraisons', async () => {
    setupMocks([])
    renderRoute('abc-123')

    expect(await screen.findByText('Aucune livraison')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Créer une livraison' })).toBeInTheDocument()
  })

  it('shows livraisons list', async () => {
    setupMocks(mockLivraisons)
    renderRoute('abc-123')

    expect(await screen.findByText('Colle pour faïence 20kg')).toBeInTheDocument()
    expect(screen.getByText('Livraisons (1)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Marquer prévu' })).toBeInTheDocument()
  })

  it('shows FAB button', async () => {
    setupMocks()
    renderRoute('abc-123')

    await screen.findByRole('heading', { name: /Livraisons — Les Oliviers/ })
    expect(screen.getByRole('button', { name: 'Ajouter' })).toBeInTheDocument()
  })

  it('has back link to chantier detail', async () => {
    setupMocks()
    renderRoute('abc-123')

    await screen.findByRole('heading', { name: /Livraisons — Les Oliviers/ })
    expect(screen.getByRole('link', { name: 'Retour' })).toHaveAttribute(
      'href',
      '/chantiers/abc-123',
    )
  })
})

describe('LivraisonsPage — sheet interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.channel).mockReturnValue({
      on: vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue({}),
      }),
    } as never)
  })

  it('opens creation sheet when FAB is clicked', async () => {
    const user = userEvent.setup()
    setupMocks([])
    renderRoute('abc-123')

    await screen.findByText('Aucune livraison')
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))

    expect(await screen.findByText('Nouvelle livraison')).toBeInTheDocument()
    expect(screen.getByLabelText('Description de la livraison')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Créer la livraison' })).toBeInTheDocument()
  })

  it('shows validation error when submitting empty description', async () => {
    const user = userEvent.setup()
    setupMocks([])
    renderRoute('abc-123')

    await screen.findByText('Aucune livraison')
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))
    await screen.findByText('Nouvelle livraison')
    await user.click(screen.getByRole('button', { name: 'Créer la livraison' }))

    expect(await screen.findByText('La description est requise')).toBeInTheDocument()
    expect(mockCreateMutate).not.toHaveBeenCalled()
  })

  it('calls createLivraison mutation with description', async () => {
    const user = userEvent.setup()
    setupMocks([])
    renderRoute('abc-123')

    await screen.findByText('Aucune livraison')
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))
    await screen.findByText('Nouvelle livraison')

    const textarea = screen.getByLabelText('Description de la livraison')
    await user.type(textarea, 'Colle pour faïence')
    await user.click(screen.getByRole('button', { name: 'Créer la livraison' }))

    expect(mockCreateMutate).toHaveBeenCalledWith(
      { chantierId: 'abc-123', description: 'Colle pour faïence' },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    )
  })

  it('opens date sheet when "Marquer prévu" is clicked', async () => {
    const user = userEvent.setup()
    setupMocks(mockLivraisons)
    renderRoute('abc-123')

    expect(await screen.findByText('Colle pour faïence 20kg')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Marquer prévu' }))

    expect(await screen.findByText('Date de livraison prévue')).toBeInTheDocument()
    expect(screen.getByLabelText('Date prévue')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Marquer comme prévu' })).toBeInTheDocument()
  })

  it('calls updateStatus mutation when confirming livraison', async () => {
    const user = userEvent.setup()
    const mockLivraisonsPrevu = [
      {
        ...mockLivraisons[0],
        status: 'prevu',
        date_prevue: '2026-02-15',
      },
    ]
    setupMocks(mockLivraisonsPrevu)
    renderRoute('abc-123')

    expect(await screen.findByText('Colle pour faïence 20kg')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Confirmer livraison' }))

    expect(mockUpdateStatusMutate).toHaveBeenCalledWith(
      { livraisonId: 'liv1', chantierId: 'abc-123', newStatus: 'livre' },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    )
  })
})
