import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
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
    isAuthenticated: true,
    signIn: async () => ({ error: null }),
    signOut: async () => {},
    ...overrides,
  }
}

function renderWithProviders(auth: AuthState, initialEntry = '/') {
  const queryClient = new QueryClient()
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
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

describe('HomePage', () => {
  it('renders posePilot heading when authenticated', async () => {
    renderWithProviders(createMockAuth())
    expect(await screen.findByText('posePilot')).toBeInTheDocument()
  })

  it('redirects to /login when not authenticated', async () => {
    renderWithProviders(createMockAuth({ isAuthenticated: false }))
    expect(await screen.findByText('Se connecter')).toBeInTheDocument()
  })
})
