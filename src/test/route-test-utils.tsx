import { render } from '@testing-library/react'
import {
  createRouter,
  createMemoryHistory,
  RouterProvider,
} from '@tanstack/react-router'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { vi } from 'vitest'
import { routeTree } from '@/routeTree.gen'
import { AuthContext, type AuthState } from '@/lib/auth'

export function createMockAuth(): AuthState {
  return {
    session: null,
    user: null,
    isLoading: false,
    isAuthenticated: true,
    signIn: async () => ({ error: null }),
    signOut: async () => {},
  }
}

export function setupChannelMock(supabase: { channel: ReturnType<typeof vi.fn> }) {
  vi.mocked(supabase.channel).mockReturnValue({
    on: vi.fn().mockReturnValue({
      subscribe: vi.fn().mockReturnValue({}),
    }),
  } as never)
}

export function renderRoute(path: string, options?: QueryClient | { queryClient?: QueryClient; auth?: AuthState }) {
  const resolvedOptions = options instanceof QueryClient ? { queryClient: options } : options
  const qc = resolvedOptions?.queryClient ?? new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const auth = resolvedOptions?.auth ?? createMockAuth()
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
    context: { auth },
  })
  return render(
    <QueryClientProvider client={qc}>
      <AuthContext.Provider value={auth}>
        <RouterProvider router={router} />
      </AuthContext.Provider>
    </QueryClientProvider>,
  )
}
