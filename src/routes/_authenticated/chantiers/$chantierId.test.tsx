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

const mockMutate = vi.fn()

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
    mutate: mockMutate,
    isPending: false,
  }),
}))

import { supabase } from '@/lib/supabase'

const mockChantier = {
  id: 'abc-123',
  nom: 'Résidence Alpha',
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

describe('ChantierPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.channel).mockReturnValue({
      on: vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue({}),
      }),
    } as never)
  })

  it('renders chantier name as heading', async () => {
    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockImplementation((_col: string, val: unknown) => {
          if (val === 'abc-123') {
            return { single: vi.fn().mockResolvedValue({ data: mockChantier, error: null }) }
          }
          return { order: vi.fn().mockResolvedValue({ data: [], error: null }) }
        }),
      }),
    }) as never)

    renderRoute('abc-123')

    expect(await screen.findByRole('heading', { name: 'Résidence Alpha' })).toBeInTheDocument()
  })

  it('displays badge type Complet', async () => {
    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockImplementation((_col: string, val: unknown) => {
          if (val === 'abc-123') {
            return { single: vi.fn().mockResolvedValue({ data: mockChantier, error: null }) }
          }
          return { order: vi.fn().mockResolvedValue({ data: [], error: null }) }
        }),
      }),
    }) as never)

    renderRoute('abc-123')

    await screen.findByRole('heading', { name: 'Résidence Alpha' })
    expect(screen.getByText('Complet')).toBeInTheDocument()
  })

  it('displays progress percentage for complet type', async () => {
    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockImplementation((_col: string, val: unknown) => {
          if (val === 'abc-123') {
            return { single: vi.fn().mockResolvedValue({ data: mockChantier, error: null }) }
          }
          return { order: vi.fn().mockResolvedValue({ data: [], error: null }) }
        }),
      }),
    }) as never)

    renderRoute('abc-123')

    expect(await screen.findByText('30%')).toBeInTheDocument()
  })

  it('displays badge Léger for leger type with empty besoins', async () => {
    const legerChantier = { ...mockChantier, type: 'leger' as const }

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'chantiers') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: legerChantier, error: null }),
            }),
          }),
        } as never
      }
      if (table === 'besoins') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              is: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
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

    renderRoute('abc-123')

    await screen.findByRole('heading', { name: 'Résidence Alpha' })
    expect(screen.getByText('Léger')).toBeInTheDocument()
    expect(screen.getByText('Aucun besoin en attente')).toBeInTheDocument()
  })

  it('shows "Chantier introuvable" on error', async () => {
    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockImplementation((_col: string, val: unknown) => {
          if (val === 'invalid-id') {
            return { single: vi.fn().mockResolvedValue({ data: null, error: new Error('Not found') }) }
          }
          return { order: vi.fn().mockResolvedValue({ data: [], error: null }) }
        }),
      }),
    }) as never)

    renderRoute('invalid-id')

    expect(await screen.findByText('Chantier introuvable')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: "Retour à l'accueil" })).toBeInTheDocument()
  })

  it('shows loading state', async () => {
    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockImplementation((_col: string, val: unknown) => {
          if (val === 'abc-123') {
            return { single: vi.fn().mockReturnValue(new Promise(() => {})) }
          }
          return { order: vi.fn().mockResolvedValue({ data: [], error: null }) }
        }),
      }),
    }) as never)

    renderRoute('abc-123')

    expect(await screen.findByText('Chargement...')).toBeInTheDocument()
  })

  it('shows back link to home', async () => {
    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockImplementation((_col: string, val: unknown) => {
          if (val === 'abc-123') {
            return { single: vi.fn().mockResolvedValue({ data: mockChantier, error: null }) }
          }
          return { order: vi.fn().mockResolvedValue({ data: [], error: null }) }
        }),
      }),
    }) as never)

    renderRoute('abc-123')

    await screen.findByRole('heading', { name: 'Résidence Alpha' })
    const backLink = screen.getByRole('link', { name: 'Retour' })
    expect(backLink).toHaveAttribute('href', '/')
  })

  it('shows options button', async () => {
    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockImplementation((_col: string, val: unknown) => {
          if (val === 'abc-123') {
            return { single: vi.fn().mockResolvedValue({ data: mockChantier, error: null }) }
          }
          return { order: vi.fn().mockResolvedValue({ data: [], error: null }) }
        }),
      }),
    }) as never)

    renderRoute('abc-123')

    await screen.findByRole('heading', { name: 'Résidence Alpha' })
    expect(screen.getByRole('button', { name: 'Options du chantier' })).toBeInTheDocument()
  })

  it('opens dropdown menu with "Marquer comme terminé" and "Supprimer" options', async () => {
    const user = userEvent.setup()

    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockImplementation((_col: string, val: unknown) => {
          if (val === 'abc-123') {
            return { single: vi.fn().mockResolvedValue({ data: mockChantier, error: null }) }
          }
          return { order: vi.fn().mockResolvedValue({ data: [], error: null }) }
        }),
      }),
    }) as never)

    renderRoute('abc-123')

    await screen.findByRole('heading', { name: 'Résidence Alpha' })
    await user.click(screen.getByRole('button', { name: 'Options du chantier' }))

    expect(await screen.findByRole('menuitem', { name: /Marquer comme terminé/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /Supprimer/i })).toBeInTheDocument()
  })

  it('shows "Terminer" AlertDialog when "Marquer comme terminé" is clicked', async () => {
    const user = userEvent.setup()

    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockImplementation((_col: string, val: unknown) => {
          if (val === 'abc-123') {
            return { single: vi.fn().mockResolvedValue({ data: mockChantier, error: null }) }
          }
          return { order: vi.fn().mockResolvedValue({ data: [], error: null }) }
        }),
      }),
    }) as never)

    renderRoute('abc-123')

    await screen.findByRole('heading', { name: 'Résidence Alpha' })
    await user.click(screen.getByRole('button', { name: 'Options du chantier' }))
    await user.click(await screen.findByRole('menuitem', { name: /Marquer comme terminé/i }))

    expect(await screen.findByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByText('Terminer ce chantier ?')).toBeInTheDocument()
    expect(screen.getByText(/sera archivé et disparaîtra de la vue active/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Annuler' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Terminer' })).toBeInTheDocument()
  })

  it('calls mutation with "termine" status when confirm terminer', async () => {
    const user = userEvent.setup()

    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockImplementation((_col: string, val: unknown) => {
          if (val === 'abc-123') {
            return { single: vi.fn().mockResolvedValue({ data: mockChantier, error: null }) }
          }
          return { order: vi.fn().mockResolvedValue({ data: [], error: null }) }
        }),
      }),
    }) as never)

    renderRoute('abc-123')

    await screen.findByRole('heading', { name: 'Résidence Alpha' })
    await user.click(screen.getByRole('button', { name: 'Options du chantier' }))
    await user.click(await screen.findByRole('menuitem', { name: /Marquer comme terminé/i }))
    await user.click(await screen.findByRole('button', { name: 'Terminer' }))

    expect(mockMutate).toHaveBeenCalledWith(
      { chantierId: 'abc-123', status: 'termine' },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    )
  })

  it('shows "Supprimer" AlertDialog when "Supprimer" is clicked', async () => {
    const user = userEvent.setup()

    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockImplementation((_col: string, val: unknown) => {
          if (val === 'abc-123') {
            return { single: vi.fn().mockResolvedValue({ data: mockChantier, error: null }) }
          }
          return { order: vi.fn().mockResolvedValue({ data: [], error: null }) }
        }),
      }),
    }) as never)

    renderRoute('abc-123')

    await screen.findByRole('heading', { name: 'Résidence Alpha' })
    await user.click(screen.getByRole('button', { name: 'Options du chantier' }))
    await user.click(await screen.findByRole('menuitem', { name: /Supprimer/i }))

    expect(await screen.findByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByText('Supprimer ce chantier ?')).toBeInTheDocument()
    expect(screen.getByText(/sera supprimé définitivement/)).toBeInTheDocument()
  })

  it('calls mutation with "supprime" status when confirm supprimer', async () => {
    const user = userEvent.setup()

    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockImplementation((_col: string, val: unknown) => {
          if (val === 'abc-123') {
            return { single: vi.fn().mockResolvedValue({ data: mockChantier, error: null }) }
          }
          return { order: vi.fn().mockResolvedValue({ data: [], error: null }) }
        }),
      }),
    }) as never)

    renderRoute('abc-123')

    await screen.findByRole('heading', { name: 'Résidence Alpha' })
    await user.click(screen.getByRole('button', { name: 'Options du chantier' }))
    await user.click(await screen.findByRole('menuitem', { name: /Supprimer/i }))

    // Find the Supprimer button in the dialog (not the menu item)
    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Supprimer' }))

    expect(mockMutate).toHaveBeenCalledWith(
      { chantierId: 'abc-123', status: 'supprime' },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    )
  })

  it('closes AlertDialog when cancel is clicked', async () => {
    const user = userEvent.setup()

    vi.mocked(supabase.from).mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockImplementation((_col: string, val: unknown) => {
          if (val === 'abc-123') {
            return { single: vi.fn().mockResolvedValue({ data: mockChantier, error: null }) }
          }
          return { order: vi.fn().mockResolvedValue({ data: [], error: null }) }
        }),
      }),
    }) as never)

    renderRoute('abc-123')

    await screen.findByRole('heading', { name: 'Résidence Alpha' })
    await user.click(screen.getByRole('button', { name: 'Options du chantier' }))
    await user.click(await screen.findByRole('menuitem', { name: /Marquer comme terminé/i }))

    expect(await screen.findByRole('alertdialog')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Annuler' }))

    // Dialog should close
    await vi.waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    })
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('shows SearchBar for complet chantier', async () => {
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
      // lots table for useChantierLots
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      } as never
    })

    renderRoute('abc-123')

    await screen.findByRole('heading', { name: 'Résidence Alpha' })
    expect(screen.getByRole('search')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Rechercher un lot...')).toBeInTheDocument()
  })

  it('displays besoins list for leger chantier', async () => {
    const legerChantier = { ...mockChantier, type: 'leger' as const }
    const mockBesoins = [
      {
        id: 'b1',
        chantier_id: 'abc-123',
        description: 'Colle pour faïence 20kg',
        livraison_id: null,
        created_at: new Date().toISOString(),
        created_by: 'user-1',
      },
    ]

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'chantiers') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: legerChantier, error: null }),
            }),
          }),
        } as never
      }
      if (table === 'besoins') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              is: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockBesoins, error: null }),
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

    renderRoute('abc-123')

    expect(await screen.findByText('Colle pour faïence 20kg')).toBeInTheDocument()
    expect(screen.getByText('Besoins en attente (1)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Commander' })).toBeInTheDocument()
  })

  it('shows FAB and empty state for leger chantier with no besoins', async () => {
    const legerChantier = { ...mockChantier, type: 'leger' as const }

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'chantiers') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: legerChantier, error: null }),
            }),
          }),
        } as never
      }
      if (table === 'besoins') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              is: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
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

    renderRoute('abc-123')

    await screen.findByRole('heading', { name: 'Résidence Alpha' })
    expect(screen.getByText('Aucun besoin en attente')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Créer un besoin' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ajouter' })).toBeInTheDocument()
  })

  it('does NOT show SearchBar for leger chantier', async () => {
    const legerChantier = { ...mockChantier, type: 'leger' as const }

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'chantiers') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: legerChantier, error: null }),
            }),
          }),
        } as never
      }
      if (table === 'besoins') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              is: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
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

    renderRoute('abc-123')

    await screen.findByRole('heading', { name: 'Résidence Alpha' })
    expect(screen.queryByRole('search')).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Rechercher un lot...')).not.toBeInTheDocument()
  })
})
