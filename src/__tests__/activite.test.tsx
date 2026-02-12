import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderRoute, createMockAuth, setupChannelMock } from '@/test/route-test-utils'

vi.mock('sonner', () => {
  const toast = vi.fn() as ReturnType<typeof vi.fn> & { error: ReturnType<typeof vi.fn> }
  toast.error = vi.fn()
  return { toast }
})

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

// Mock all mutations that routes in the route tree may import
vi.mock('@/lib/mutations/useUpdateChantierStatus', () => ({
  useUpdateChantierStatus: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useCreatePlot', () => ({
  useCreatePlot: () => ({ mutate: vi.fn(), isPending: false }),
  DEFAULT_TASK_DEFINITIONS: ['Ragréage'],
}))
vi.mock('@/lib/mutations/useUpdatePlotTasks', () => ({
  useUpdatePlotTasks: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useDeletePlot', () => ({
  useDeletePlot: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useCreateVariante', () => ({
  useCreateVariante: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useDeleteVariante', () => ({
  useDeleteVariante: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useAddVariantePiece', () => ({
  useAddVariantePiece: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useDeleteVariantePiece', () => ({
  useDeleteVariantePiece: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useCreateLot', () => ({
  useCreateLot: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useCreateBatchLots', () => ({
  useCreateBatchLots: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useToggleLotTma', () => ({
  useToggleLotTma: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useAddLotPiece', () => ({
  useAddLotPiece: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useAddLotTask', () => ({
  useAddLotTask: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useAddLotDocument', () => ({
  useAddLotDocument: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useToggleDocumentRequired', () => ({
  useToggleDocumentRequired: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useDeleteVarianteDocument', () => ({
  useDeleteVarianteDocument: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useAddVarianteDocument', () => ({
  useAddVarianteDocument: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useUpdateTaskStatus', () => ({
  useUpdateTaskStatus: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useCreateChantier', () => ({
  useCreateChantier: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useCreateNote', () => ({
  useCreateNote: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useUploadNotePhoto', () => ({
  useUploadNotePhoto: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

import { supabase } from '@/lib/supabase'

const mockLogs = [
  {
    id: 'log-1',
    event_type: 'task_status_changed',
    actor_id: 'user-2',
    actor_email: 'bruno@test.fr',
    chantier_id: 'chantier-1',
    target_type: 'piece',
    target_id: 'piece-1',
    metadata: { piece_nom: 'Séjour', lot_code: '203', old_status: 'in_progress', new_status: 'done' },
    created_at: '2026-02-10T12:00:00Z',
  },
]

function createAuthWithUser() {
  const auth = createMockAuth()
  auth.user = { id: 'user-1', email: 'youssef@test.fr' } as never
  return auth
}

function setupMocks() {
  setupChannelMock(supabase as unknown as { channel: ReturnType<typeof vi.fn> })

  // Mock activity_logs select chains
  const mockLimit = vi.fn().mockResolvedValue({ data: mockLogs, error: null })
  const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit })
  const mockNeq = vi.fn().mockReturnValue({ order: mockOrder })

  const mockCountNeq = vi.fn().mockResolvedValue({ count: 0, error: null })
  const mockGt = vi.fn().mockReturnValue({ neq: mockCountNeq })

  vi.mocked(supabase.from).mockImplementation((table: string) => {
    if (table === 'activity_logs') {
      return {
        select: vi.fn().mockImplementation((...args: unknown[]) => {
          if (args.length > 1) {
            return { gt: mockGt }
          }
          return { neq: mockNeq }
        }),
      } as never
    }
    const mockEmpty = vi.fn().mockResolvedValue({ data: [], error: null })
    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: mockEmpty,
          eq: vi.fn().mockReturnValue({ order: mockEmpty }),
        }),
        neq: vi.fn().mockReturnValue({ order: vi.fn().mockReturnValue({ limit: mockEmpty }) }),
        order: mockEmpty,
      }),
    } as never
  })
}

describe('ActivitePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    setupMocks()
  })

  it('renders the Activité heading', async () => {
    renderRoute('/activite', { auth: createAuthWithUser() })

    const heading = await screen.findByRole('heading', { name: 'Activité' })
    expect(heading).toBeInTheDocument()
  })

  it('renders the activity feed with entries', async () => {
    renderRoute('/activite', { auth: createAuthWithUser() })

    expect(await screen.findByRole('feed')).toBeInTheDocument()
    expect(await screen.findByText('Bruno a terminé Séjour')).toBeInTheDocument()
  })

  it('updates lastSeenAt in localStorage on mount', async () => {
    localStorage.setItem('posePilot_lastActivitySeenAt', '2026-02-09T00:00:00Z')

    renderRoute('/activite', { auth: createAuthWithUser() })

    await screen.findByRole('heading', { name: 'Activité' })

    const stored = localStorage.getItem('posePilot_lastActivitySeenAt')
    expect(stored).toBeTruthy()
    expect(stored).not.toBe('2026-02-09T00:00:00Z')
  })

  it('marks entries as Nouveau when after lastSeenAt', async () => {
    localStorage.setItem('posePilot_lastActivitySeenAt', '2026-02-09T00:00:00Z')

    renderRoute('/activite', { auth: createAuthWithUser() })

    expect(await screen.findByText('Nouveau')).toBeInTheDocument()
  })
})
