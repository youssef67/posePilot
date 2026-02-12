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

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: { getUser: vi.fn() },
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue({}),
      }),
    }),
    removeChannel: vi.fn(),
  },
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

function createMockAuth(): AuthState {
  return {
    session: null,
    user: { id: 'user-1', email: 'test@test.com' } as AuthState['user'],
    isLoading: false,
    isAuthenticated: true,
    signIn: async () => ({ error: null }),
    signOut: async () => {},
  }
}

function renderForm() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const auth = createMockAuth()
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/chantiers/nouveau'] }),
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

describe('NouveauChantierPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock supabase for useChantiers (loaded via parent route)
    const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)
    // Re-setup channel mock after clearAllMocks
    vi.mocked(supabase.channel).mockReturnValue({
      on: vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue({}),
      }),
    } as never)
  })

  it('renders form with name field and type selector', async () => {
    renderForm()

    expect(await screen.findByLabelText('Nom du chantier')).toBeInTheDocument()
    expect(screen.getByText('Complet')).toBeInTheDocument()
    expect(screen.getByText('Léger')).toBeInTheDocument()
  })

  it('renders the definitive choice warning', async () => {
    renderForm()

    expect(
      await screen.findByText('Ce choix est définitif et ne pourra pas être modifié'),
    ).toBeInTheDocument()
  })

  it('shows submit button', async () => {
    renderForm()

    expect(
      await screen.findByRole('button', { name: 'Créer le chantier' }),
    ).toBeInTheDocument()
  })

  it('shows error when name is empty on submit', async () => {
    const user = userEvent.setup()
    renderForm()

    const submitBtn = await screen.findByRole('button', { name: 'Créer le chantier' })
    await user.click(submitBtn)

    expect(await screen.findByText('Ce champ est requis')).toBeInTheDocument()
  })

  it('shows error when type is not selected on submit', async () => {
    const user = userEvent.setup()
    renderForm()

    const nameInput = await screen.findByLabelText('Nom du chantier')
    await user.type(nameInput, 'Mon chantier')

    const submitBtn = screen.getByRole('button', { name: 'Créer le chantier' })
    await user.click(submitBtn)

    expect(await screen.findByText('Choisissez un type de chantier')).toBeInTheDocument()
  })

  it('submits successfully with valid data and shows success toast', async () => {
    const user = userEvent.setup()

    const mockSingle = vi.fn().mockResolvedValue({
      data: { id: '1', nom: 'Mon chantier', type: 'complet', status: 'active' },
      error: null,
    })
    const mockSelectInsert = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelectInsert })
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-1' } },
    } as never)

    renderForm()

    const nameInput = await screen.findByLabelText('Nom du chantier')
    await user.type(nameInput, 'Mon chantier')

    const completRadio = screen.getByRole('radio', { name: /Complet/i })
    await user.click(completRadio)

    // Override mock for insert after form interaction
    vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never)

    const submitBtn = screen.getByRole('button', { name: 'Créer le chantier' })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Chantier créé')
    })
  })

  it('shows error toast on mutation failure', async () => {
    const user = userEvent.setup()

    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: new Error('Insert failed'),
    })
    const mockSelectInsert = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelectInsert })
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-1' } },
    } as never)

    renderForm()

    const nameInput = await screen.findByLabelText('Nom du chantier')
    await user.type(nameInput, 'Mon chantier')

    const completRadio = screen.getByRole('radio', { name: /Complet/i })
    await user.click(completRadio)

    vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as never)

    const submitBtn = screen.getByRole('button', { name: 'Créer le chantier' })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Impossible de créer le chantier')
    })
  })
})
