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

const mockDeleteMutate = vi.fn()
vi.mock('@/lib/mutations/useDeleteMemo', () => ({
  useDeleteMemo: () => ({
    mutate: mockDeleteMutate,
    isPending: false,
  }),
}))

vi.mock('@/lib/mutations/useCreateMemo', () => ({
  useCreateMemo: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}))

vi.mock('@/lib/mutations/useUpdateMemo', () => ({
  useUpdateMemo: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}))

vi.mock('@/lib/mutations/useUploadMemoPhoto', () => ({
  useUploadMemoPhoto: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}))

import { supabase } from '@/lib/supabase'

const mockEtages = [
  {
    id: 'etage-1',
    plot_id: 'plot-1',
    nom: 'RDC',
    progress_done: 0,
    progress_total: 0,
    has_blocking_note: false,
    has_open_reservation: false,
    metrage_m2_total: 0,
    metrage_ml_total: 0,
    cout_materiaux_total: 0,
    memo_count: 1,
    created_at: '2026-01-01T00:00:00Z',
  },
]

const mockMemos = [
  {
    id: 'memo-1',
    chantier_id: null,
    plot_id: null,
    etage_id: 'etage-1',
    content: 'Attention humidité couloir est',
    created_by_email: 'bruno@example.com',
    memo_photos: [],
    created_at: '2026-02-15T10:00:00Z',
    updated_at: '2026-02-15T10:00:00Z',
  },
  {
    id: 'memo-2',
    chantier_id: null,
    plot_id: null,
    etage_id: 'etage-1',
    content: 'Ragréage terminé côté nord',
    created_by_email: 'youssef@example.com',
    memo_photos: [],
    created_at: '2026-02-14T08:00:00Z',
    updated_at: '2026-02-14T08:00:00Z',
  },
]

function createMockAuth(): AuthState {
  return {
    session: null,
    user: { email: 'test@example.com' } as never,
    isLoading: false,
    isAuthenticated: true,
    signIn: async () => ({ error: null }),
    signOut: async () => {},
  }
}

function renderRoute() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const auth = createMockAuth()
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/chantiers/ch-1/plots/plot-1/etage-1/memos'] }),
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

function mockSupabaseWith(memos: typeof mockMemos) {
  vi.mocked(supabase.from).mockImplementation((table: string) => {
    if (table === 'etages') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockEtages, error: null }),
          }),
        }),
      } as never
    }
    if (table === 'memos') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: memos, error: null }),
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

describe('EtageMemosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.channel).mockReturnValue({
      on: vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue({}),
      }),
    } as never)
  })

  it('renders page heading "Mémos"', async () => {
    mockSupabaseWith(mockMemos)
    renderRoute()
    expect(await screen.findByRole('heading', { name: 'Mémos' })).toBeInTheDocument()
  })

  it('displays etage name as subtitle', async () => {
    mockSupabaseWith(mockMemos)
    renderRoute()
    expect(await screen.findByText('RDC')).toBeInTheDocument()
  })

  it('renders memo cards with content', async () => {
    mockSupabaseWith(mockMemos)
    renderRoute()
    expect(await screen.findByText('Attention humidité couloir est')).toBeInTheDocument()
    expect(screen.getByText('Ragréage terminé côté nord')).toBeInTheDocument()
  })

  it('shows empty state when no memos', async () => {
    mockSupabaseWith([])
    renderRoute()
    expect(await screen.findByText('Aucun mémo pour cet étage')).toBeInTheDocument()
  })

  it('has a back link to etage page', async () => {
    mockSupabaseWith(mockMemos)
    renderRoute()
    const backLink = await screen.findByRole('link', { name: 'Retour' })
    expect(backLink).toHaveAttribute('href', '/chantiers/ch-1/plots/plot-1/etage-1')
  })

  it('calls delete mutation when confirming deletion', async () => {
    const user = userEvent.setup()
    mockSupabaseWith(mockMemos)
    renderRoute()

    await screen.findByText('Attention humidité couloir est')
    const menuButtons = screen.getAllByRole('button', { name: 'Options du mémo' })
    await user.click(menuButtons[0])
    await user.click(await screen.findByRole('menuitem', { name: /Supprimer/i }))

    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Supprimer' }))

    expect(mockDeleteMutate).toHaveBeenCalledWith(
      expect.objectContaining({ memoId: 'memo-1', entityType: 'etage', entityId: 'etage-1' }),
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    )
  })
})
