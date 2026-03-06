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

const mockCreateMutate = vi.fn()
vi.mock('@/lib/mutations/useCreateMemo', () => ({
  useCreateMemo: () => ({
    mutate: mockCreateMutate,
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

const mockChantier = {
  id: 'abc-123',
  nom: 'Résidence Alpha',
  type: 'complet' as const,
  status: 'active' as const,
  progress_done: 3,
  progress_total: 10,
  memo_count: 2,
  created_at: '2026-01-01T00:00:00Z',
  created_by: 'user-1',
}

const mockMemos = [
  {
    id: 'memo-1',
    chantier_id: 'abc-123',
    content: 'Attention au plancher fragile étage 3',
    created_by_email: 'jean@example.com',
    created_at: '2026-02-20T10:00:00Z',
    updated_at: '2026-02-20T10:00:00Z',
    memo_photos: [],
  },
  {
    id: 'memo-2',
    chantier_id: 'abc-123',
    content: 'Code portail: 4589B',
    created_by_email: 'paul@example.com',
    created_at: '2026-02-19T08:00:00Z',
    updated_at: '2026-02-19T08:00:00Z',
    memo_photos: [],
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
    history: createMemoryHistory({ initialEntries: ['/chantiers/abc-123/memos'] }),
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
    if (table === 'chantiers') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockChantier, error: null }),
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

describe('MemosPage', () => {
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

  it('displays chantier name as subtitle', async () => {
    mockSupabaseWith(mockMemos)
    renderRoute()

    expect(await screen.findByText('Résidence Alpha')).toBeInTheDocument()
  })

  it('renders memo cards with content', async () => {
    mockSupabaseWith(mockMemos)
    renderRoute()

    expect(await screen.findByText('Attention au plancher fragile étage 3')).toBeInTheDocument()
    expect(screen.getByText('Code portail: 4589B')).toBeInTheDocument()
  })

  it('shows empty state when no memos', async () => {
    mockSupabaseWith([])
    renderRoute()

    expect(await screen.findByText('Aucun mémo pour ce chantier')).toBeInTheDocument()
  })

  it('has a back link to chantier page', async () => {
    mockSupabaseWith(mockMemos)
    renderRoute()

    const backLink = await screen.findByRole('link', { name: 'Retour' })
    expect(backLink).toHaveAttribute('href', '/chantiers/abc-123')
  })

  it('opens delete confirmation dialog', async () => {
    const user = userEvent.setup()
    mockSupabaseWith(mockMemos)
    renderRoute()

    await screen.findByText('Attention au plancher fragile étage 3')

    // Open dropdown on first memo card
    const menuButtons = screen.getAllByRole('button', { name: 'Options du mémo' })
    await user.click(menuButtons[0])

    await user.click(await screen.findByRole('menuitem', { name: /Supprimer/i }))

    expect(await screen.findByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByText('Supprimer ce mémo ?')).toBeInTheDocument()
  })

  it('calls delete mutation when confirming deletion', async () => {
    const user = userEvent.setup()
    mockSupabaseWith(mockMemos)
    renderRoute()

    await screen.findByText('Attention au plancher fragile étage 3')

    const menuButtons = screen.getAllByRole('button', { name: 'Options du mémo' })
    await user.click(menuButtons[0])
    await user.click(await screen.findByRole('menuitem', { name: /Supprimer/i }))

    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Supprimer' }))

    expect(mockDeleteMutate).toHaveBeenCalledWith(
      expect.objectContaining({ memoId: 'memo-1', entityType: 'chantier', entityId: 'abc-123' }),
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    )
  })
})
