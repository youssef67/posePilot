import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
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
