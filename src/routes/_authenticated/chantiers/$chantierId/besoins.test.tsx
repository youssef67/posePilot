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

const mockTransformBesoinMutate = vi.fn()
const mockUpdateBesoinMutate = vi.fn()
const mockDeleteBesoinMutate = vi.fn()
const mockCreateGroupedLivraisonMutate = vi.fn()

vi.mock('@/lib/mutations/useTransformBesoinToLivraison', () => ({
  useTransformBesoinToLivraison: () => ({
    mutate: mockTransformBesoinMutate,
    isPending: false,
  }),
}))

vi.mock('@/lib/mutations/useUpdateBesoin', () => ({
  useUpdateBesoin: () => ({
    mutate: mockUpdateBesoinMutate,
    isPending: false,
  }),
}))

vi.mock('@/lib/mutations/useDeleteBesoin', () => ({
  useDeleteBesoin: () => ({
    mutate: mockDeleteBesoinMutate,
    isPending: false,
  }),
}))

vi.mock('@/lib/mutations/useCreateGroupedLivraison', () => ({
  useCreateGroupedLivraison: () => ({
    mutate: mockCreateGroupedLivraisonMutate,
    isPending: false,
  }),
}))

vi.mock('@/lib/utils/formatRelativeTime', () => ({
  formatRelativeTime: () => 'il y a 2h',
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
    history: createMemoryHistory({ initialEntries: [`/chantiers/${chantierId}/besoins`] }),
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

function setupMocks(besoins: unknown[] = []) {
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
    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    } as never
  })
}

describe('BesoinsPage', () => {
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

    expect(await screen.findByRole('heading', { name: /Besoins — Les Oliviers/ })).toBeInTheDocument()
  })

  it('shows empty state when no besoins', async () => {
    setupMocks([])
    renderRoute('abc-123')

    expect(await screen.findByText('Aucun besoin en attente')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Créer un besoin' })).toBeInTheDocument()
  })

  it('shows besoins list', async () => {
    const mockBesoins = [
      {
        id: 'b1',
        chantier_id: 'abc-123',
        description: 'Joint gris 5kg',
        livraison_id: null,
        created_at: new Date().toISOString(),
        created_by: 'user-1',
      },
    ]
    setupMocks(mockBesoins)
    renderRoute('abc-123')

    expect(await screen.findByText('Joint gris 5kg')).toBeInTheDocument()
    expect(screen.getByText('Besoins en attente (1)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Commander' })).toBeInTheDocument()
  })

  it('shows FAB button', async () => {
    setupMocks()
    renderRoute('abc-123')

    await screen.findByRole('heading', { name: /Besoins — Les Oliviers/ })
    expect(screen.getByRole('button', { name: 'Ajouter' })).toBeInTheDocument()
  })

  it('has back link to chantier detail', async () => {
    setupMocks()
    renderRoute('abc-123')

    await screen.findByRole('heading', { name: /Besoins — Les Oliviers/ })
    expect(screen.getByRole('link', { name: 'Retour' })).toHaveAttribute(
      'href',
      '/chantiers/abc-123',
    )
  })
})

const mockBesoinsForActions = [
  {
    id: 'b1',
    chantier_id: 'abc-123',
    description: 'Colle pour faïence 20kg',
    livraison_id: null,
    created_at: '2026-02-10T10:00:00Z',
    created_by: 'user-1',
  },
]

describe('BesoinsPage — Edit and Delete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.channel).mockReturnValue({
      on: vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue({}),
      }),
    } as never)
  })

  it('opens edit sheet with pre-filled description', async () => {
    const user = userEvent.setup()
    setupMocks(mockBesoinsForActions)
    renderRoute('abc-123')

    await screen.findByText('Colle pour faïence 20kg')
    const actionBtn = screen.getByRole('button', { name: 'Actions' })
    await user.click(actionBtn)
    await user.click(await screen.findByText('Modifier'))

    expect(await screen.findByText('Modifier le besoin')).toBeInTheDocument()
    const textarea = screen.getByLabelText('Description du besoin (édition)') as HTMLTextAreaElement
    expect(textarea.value).toBe('Colle pour faïence 20kg')
  })

  it('shows validation error when submitting empty description', async () => {
    const user = userEvent.setup()
    setupMocks(mockBesoinsForActions)
    renderRoute('abc-123')

    await screen.findByText('Colle pour faïence 20kg')
    const actionBtn = screen.getByRole('button', { name: 'Actions' })
    await user.click(actionBtn)
    await user.click(await screen.findByText('Modifier'))

    await screen.findByText('Modifier le besoin')
    const textarea = screen.getByLabelText('Description du besoin (édition)')
    await user.clear(textarea)
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))

    expect(await screen.findByText('La description est requise')).toBeInTheDocument()
    expect(mockUpdateBesoinMutate).not.toHaveBeenCalled()
  })

  it('calls useUpdateBesoin on valid edit submission', async () => {
    const user = userEvent.setup()
    setupMocks(mockBesoinsForActions)
    renderRoute('abc-123')

    await screen.findByText('Colle pour faïence 20kg')
    const actionBtn = screen.getByRole('button', { name: 'Actions' })
    await user.click(actionBtn)
    await user.click(await screen.findByText('Modifier'))

    await screen.findByText('Modifier le besoin')
    const textarea = screen.getByLabelText('Description du besoin (édition)')
    await user.clear(textarea)
    await user.type(textarea, 'Colle modifiée')
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))

    expect(mockUpdateBesoinMutate).toHaveBeenCalledWith(
      { id: 'b1', chantierId: 'abc-123', description: 'Colle modifiée' },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    )
  })

  it('shows delete confirmation dialog', async () => {
    const user = userEvent.setup()
    setupMocks(mockBesoinsForActions)
    renderRoute('abc-123')

    await screen.findByText('Colle pour faïence 20kg')
    const actionBtn = screen.getByRole('button', { name: 'Actions' })
    await user.click(actionBtn)
    await user.click(await screen.findByText('Supprimer'))

    expect(await screen.findByText('Supprimer ce besoin ?')).toBeInTheDocument()
  })

  it('calls useDeleteBesoin on delete confirmation', async () => {
    const user = userEvent.setup()
    setupMocks(mockBesoinsForActions)
    renderRoute('abc-123')

    await screen.findByText('Colle pour faïence 20kg')
    const actionBtn = screen.getByRole('button', { name: 'Actions' })
    await user.click(actionBtn)
    await user.click(await screen.findByText('Supprimer'))

    await screen.findByText('Supprimer ce besoin ?')
    // The AlertDialogAction button that says "Supprimer" inside the dialog
    const dialogButtons = screen.getAllByRole('button', { name: 'Supprimer' })
    const confirmBtn = dialogButtons[dialogButtons.length - 1]
    await user.click(confirmBtn)

    expect(mockDeleteBesoinMutate).toHaveBeenCalledWith(
      { id: 'b1', chantierId: 'abc-123' },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    )
  })
})

describe('BesoinsPage — Commander Sheet with fournisseur', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.channel).mockReturnValue({
      on: vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue({}),
      }),
    } as never)
  })

  it('opens Commander Sheet with fournisseur input', async () => {
    const user = userEvent.setup()
    setupMocks(mockBesoinsForActions)
    renderRoute('abc-123')

    await screen.findByText('Colle pour faïence 20kg')
    await user.click(screen.getByRole('button', { name: 'Commander' }))

    expect(await screen.findByText('Commander ce besoin')).toBeInTheDocument()
    expect(screen.getByLabelText('Fournisseur')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirmer la commande' })).toBeInTheDocument()
  })

  it('calls mutation without fournisseur when field is empty', async () => {
    const user = userEvent.setup()
    setupMocks(mockBesoinsForActions)
    renderRoute('abc-123')

    await screen.findByText('Colle pour faïence 20kg')
    await user.click(screen.getByRole('button', { name: 'Commander' }))
    await screen.findByText('Commander ce besoin')
    await user.click(screen.getByRole('button', { name: 'Confirmer la commande' }))

    expect(mockTransformBesoinMutate).toHaveBeenCalledWith(
      { besoin: mockBesoinsForActions[0], fournisseur: undefined },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    )
  })

  it('calls mutation with fournisseur when field is filled', async () => {
    const user = userEvent.setup()
    setupMocks(mockBesoinsForActions)
    renderRoute('abc-123')

    await screen.findByText('Colle pour faïence 20kg')
    await user.click(screen.getByRole('button', { name: 'Commander' }))
    await screen.findByText('Commander ce besoin')

    const fournisseurInput = screen.getByLabelText('Fournisseur')
    await user.type(fournisseurInput, 'Leroy Merlin')
    await user.click(screen.getByRole('button', { name: 'Confirmer la commande' }))

    expect(mockTransformBesoinMutate).toHaveBeenCalledWith(
      { besoin: mockBesoinsForActions[0], fournisseur: 'Leroy Merlin' },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    )
  })
})

const mockBesoinsForSelection = [
  {
    id: 'b1',
    chantier_id: 'abc-123',
    description: 'Colle pour faïence 20kg',
    livraison_id: null,
    created_at: '2026-02-10T10:00:00Z',
    created_by: 'user-1',
  },
  {
    id: 'b2',
    chantier_id: 'abc-123',
    description: 'Joint gris 5kg',
    livraison_id: null,
    created_at: '2026-02-10T11:00:00Z',
    created_by: 'user-1',
  },
  {
    id: 'b3',
    chantier_id: 'abc-123',
    description: 'Carrelage 60x60',
    livraison_id: null,
    created_at: '2026-02-10T12:00:00Z',
    created_by: 'user-1',
  },
]

describe('BesoinsPage — Grouped selection mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.channel).mockReturnValue({
      on: vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue({}),
      }),
    } as never)
  })

  it('shows "Sélectionner" button when 2+ besoins exist', async () => {
    setupMocks(mockBesoinsForSelection)
    renderRoute('abc-123')

    await screen.findByText('Colle pour faïence 20kg')
    expect(screen.getByRole('button', { name: 'Sélectionner' })).toBeInTheDocument()
  })

  it('does not show "Sélectionner" button with only 1 besoin', async () => {
    setupMocks([mockBesoinsForSelection[0]])
    renderRoute('abc-123')

    await screen.findByText('Colle pour faïence 20kg')
    expect(screen.queryByRole('button', { name: 'Sélectionner' })).not.toBeInTheDocument()
  })

  it('enters selection mode and shows checkboxes when "Sélectionner" is clicked', async () => {
    const user = userEvent.setup()
    setupMocks(mockBesoinsForSelection)
    renderRoute('abc-123')

    await screen.findByText('Colle pour faïence 20kg')
    await user.click(screen.getByRole('button', { name: 'Sélectionner' }))

    // Header changes to selection mode
    expect(await screen.findByRole('heading', { name: /0 sélectionné/ })).toBeInTheDocument()
    // Checkboxes appear
    expect(screen.getByLabelText('Sélectionner Colle pour faïence 20kg')).toBeInTheDocument()
    // Individual Commander buttons hidden
    expect(screen.queryByRole('button', { name: 'Commander' })).not.toBeInTheDocument()
  })

  it('shows selection bar with counter and "Commander (N)" button', async () => {
    const user = userEvent.setup()
    setupMocks(mockBesoinsForSelection)
    renderRoute('abc-123')

    await screen.findByText('Colle pour faïence 20kg')
    await user.click(screen.getByRole('button', { name: 'Sélectionner' }))

    await screen.findByRole('heading', { name: /0 sélectionné/ })

    // Click checkboxes to select 2 besoins
    await user.click(screen.getByLabelText('Sélectionner Colle pour faïence 20kg'))
    await user.click(screen.getByLabelText('Sélectionner Joint gris 5kg'))

    // Counter updates (heading + selection bar both show count)
    expect(screen.getByRole('heading', { name: '2 sélectionnés' })).toBeInTheDocument()
    // Commander button shows count
    expect(screen.getByRole('button', { name: 'Commander (2)' })).toBeInTheDocument()
  })

  it('cancels selection mode when "Annuler" is clicked', async () => {
    const user = userEvent.setup()
    setupMocks(mockBesoinsForSelection)
    renderRoute('abc-123')

    await screen.findByText('Colle pour faïence 20kg')
    await user.click(screen.getByRole('button', { name: 'Sélectionner' }))

    await screen.findByRole('heading', { name: /0 sélectionné/ })
    // Click Annuler in the selection bar
    await user.click(screen.getByRole('button', { name: 'Annuler' }))

    // Back to normal mode
    expect(await screen.findByRole('heading', { name: /Besoins — Les Oliviers/ })).toBeInTheDocument()
    // Individual Commander buttons visible again
    expect(screen.getAllByRole('button', { name: 'Commander' }).length).toBeGreaterThanOrEqual(1)
  })

  it('opens grouped sheet when "Commander (N)" is clicked and validates empty intitulé', async () => {
    const user = userEvent.setup()
    setupMocks(mockBesoinsForSelection)
    renderRoute('abc-123')

    await screen.findByText('Colle pour faïence 20kg')
    await user.click(screen.getByRole('button', { name: 'Sélectionner' }))

    await screen.findByRole('heading', { name: /0 sélectionné/ })
    await user.click(screen.getByLabelText('Sélectionner Colle pour faïence 20kg'))

    await user.click(screen.getByRole('button', { name: 'Commander (1)' }))

    // Grouped sheet opens
    expect(await screen.findByText(/Commander 1 besoin/)).toBeInTheDocument()
    expect(screen.getByLabelText('Intitulé de la commande')).toBeInTheDocument()

    // Submit with empty intitulé → validation error
    await user.click(screen.getByRole('button', { name: 'Confirmer la commande' }))
    expect(await screen.findByText("L'intitulé de la commande est requis")).toBeInTheDocument()
    expect(mockCreateGroupedLivraisonMutate).not.toHaveBeenCalled()
  })

  it('calls useCreateGroupedLivraison with correct params on valid submission', async () => {
    const user = userEvent.setup()
    setupMocks(mockBesoinsForSelection)
    renderRoute('abc-123')

    await screen.findByText('Colle pour faïence 20kg')
    await user.click(screen.getByRole('button', { name: 'Sélectionner' }))

    await screen.findByRole('heading', { name: /0 sélectionné/ })
    await user.click(screen.getByLabelText('Sélectionner Colle pour faïence 20kg'))
    await user.click(screen.getByLabelText('Sélectionner Joint gris 5kg'))

    await user.click(screen.getByRole('button', { name: 'Commander (2)' }))
    await screen.findByText(/Commander 2 besoins/)

    // Fill intitulé
    const textarea = screen.getByLabelText('Intitulé de la commande')
    await user.type(textarea, 'Commande carrelage T2')

    // Fill fournisseur
    const fournisseurInput = screen.getByLabelText('Fournisseur')
    await user.type(fournisseurInput, 'Point P')

    // Summary shows selected besoins
    expect(screen.getByText('• Colle pour faïence 20kg')).toBeInTheDocument()
    expect(screen.getByText('• Joint gris 5kg')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Confirmer la commande' }))

    expect(mockCreateGroupedLivraisonMutate).toHaveBeenCalledWith(
      {
        chantierId: 'abc-123',
        besoinIds: expect.arrayContaining(['b1', 'b2']),
        description: 'Commande carrelage T2',
        fournisseur: 'Point P',
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    )
  })
})
