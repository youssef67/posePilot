import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  createRouter,
  createMemoryHistory,
  RouterProvider,
} from '@tanstack/react-router'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { routeTree } from '../routeTree.gen'
import { AuthContext, type AuthState } from '@/lib/auth'

function createMockAuth(overrides: Partial<AuthState> = {}): AuthState {
  return {
    session: null,
    user: null,
    isLoading: false,
    isAuthenticated: false,
    signIn: async () => ({ error: null }),
    signOut: async () => {},
    ...overrides,
  }
}

function renderLogin(auth: AuthState) {
  const queryClient = new QueryClient()
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/login'] }),
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

describe('LoginPage', () => {
  it('renders email and password fields', async () => {
    renderLogin(createMockAuth())

    expect(await screen.findByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument()
  })

  it('renders submit button with "Se connecter"', async () => {
    renderLogin(createMockAuth())

    expect(
      await screen.findByRole('button', { name: 'Se connecter' }),
    ).toBeInTheDocument()
  })

  it('renders posePilot title', async () => {
    renderLogin(createMockAuth())

    expect(await screen.findByText('posePilot')).toBeInTheDocument()
  })

  it('shows error message on failed login', async () => {
    const user = userEvent.setup()
    const mockSignIn = vi.fn().mockResolvedValue({
      error: new Error('Invalid credentials'),
    })
    renderLogin(createMockAuth({ signIn: mockSignIn }))

    const emailInput = await screen.findByLabelText('Email')
    const passwordInput = screen.getByLabelText('Mot de passe')
    const submitButton = screen.getByRole('button', { name: 'Se connecter' })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    expect(
      await screen.findByText('Email ou mot de passe incorrect'),
    ).toBeInTheDocument()
    expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'wrongpassword')
  })

  it('shows loading state during submission', async () => {
    const user = userEvent.setup()
    let resolveSignIn: (value: { error: null }) => void
    const mockSignIn = vi.fn(
      () => new Promise<{ error: null }>((resolve) => {
        resolveSignIn = resolve
      }),
    )
    renderLogin(createMockAuth({ signIn: mockSignIn }))

    const emailInput = await screen.findByLabelText('Email')
    const passwordInput = screen.getByLabelText('Mot de passe')

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(screen.getByRole('button', { name: 'Se connecter' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Connexion...' })).toBeDisabled()
    })

    await act(async () => {
      resolveSignIn!({ error: null })
    })
  })
})
