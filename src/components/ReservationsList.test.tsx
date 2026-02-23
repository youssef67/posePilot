import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReservationsList } from './ReservationsList'

const mockReservations = [
  {
    id: 'res-1',
    lot_id: 'lot-1',
    piece_id: 'piece-1',
    description: 'Fissure plafond',
    photo_url: null,
    status: 'ouvert' as const,
    resolved_at: null,
    created_by: 'user-1',
    created_by_email: 'test@test.fr',
    created_at: new Date().toISOString(),
    pieces: { nom: 'Séjour' },
  },
  {
    id: 'res-2',
    lot_id: 'lot-1',
    piece_id: 'piece-2',
    description: 'Joint silicone à refaire',
    photo_url: null,
    status: 'resolu' as const,
    resolved_at: new Date().toISOString(),
    created_by: 'user-1',
    created_by_email: 'test@test.fr',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    pieces: { nom: 'SDB' },
  },
  {
    id: 'res-3',
    lot_id: 'lot-1',
    piece_id: 'piece-1',
    description: 'Rayure sur parquet',
    photo_url: null,
    status: 'ouvert' as const,
    resolved_at: null,
    created_by: 'user-1',
    created_by_email: 'test@test.fr',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    pieces: { nom: 'Séjour' },
  },
]

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    storage: { from: vi.fn() },
  },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { supabase } from '@/lib/supabase'

function mockSupabaseSelect(data: unknown[] = mockReservations) {
  const mockOrder = vi.fn().mockResolvedValue({ data, error: null })
  const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
  vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as never)
}

function mockSupabaseSelectEmpty() {
  mockSupabaseSelect([])
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('ReservationsList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows "Aucune réserve" with empty data from placeholderData', () => {
    // placeholderData: [] means the component immediately gets an empty array
    mockSupabaseSelectEmpty()
    render(<ReservationsList lotId="lot-1" />, { wrapper: createWrapper() })
    expect(screen.getByText('Aucune réserve')).toBeInTheDocument()
  })

  it('shows "Aucune réserve" when no reservations', async () => {
    mockSupabaseSelectEmpty()
    render(<ReservationsList lotId="lot-1" />, { wrapper: createWrapper() })
    expect(await screen.findByText('Aucune réserve')).toBeInTheDocument()
  })

  it('renders filter tabs with correct counts', async () => {
    mockSupabaseSelect()
    render(<ReservationsList lotId="lot-1" />, { wrapper: createWrapper() })

    // 2 ouvertes, 3 toutes, 1 résolue
    expect(await screen.findByText('Ouvertes (2)')).toBeInTheDocument()
    expect(screen.getByText('Toutes (3)')).toBeInTheDocument()
    expect(screen.getByText('Résolues (1)')).toBeInTheDocument()
  })

  it('shows only open reservations by default', async () => {
    mockSupabaseSelect()
    render(<ReservationsList lotId="lot-1" />, { wrapper: createWrapper() })

    // Wait for data
    expect(await screen.findByText('Fissure plafond')).toBeInTheDocument()
    expect(screen.getByText('Rayure sur parquet')).toBeInTheDocument()
    // Resolved one should not be visible
    expect(screen.queryByText('Joint silicone à refaire')).not.toBeInTheDocument()
  })

  it('shows all reservations when "Toutes" tab is clicked', async () => {
    const user = userEvent.setup()
    mockSupabaseSelect()
    render(<ReservationsList lotId="lot-1" />, { wrapper: createWrapper() })

    await screen.findByText('Fissure plafond')
    await user.click(screen.getByText('Toutes (3)'))

    expect(screen.getByText('Fissure plafond')).toBeInTheDocument()
    expect(screen.getByText('Joint silicone à refaire')).toBeInTheDocument()
    expect(screen.getByText('Rayure sur parquet')).toBeInTheDocument()
  })

  it('shows only resolved reservations when "Résolues" tab is clicked', async () => {
    const user = userEvent.setup()
    mockSupabaseSelect()
    render(<ReservationsList lotId="lot-1" />, { wrapper: createWrapper() })

    await screen.findByText('Fissure plafond')
    await user.click(screen.getByText('Résolues (1)'))

    expect(screen.queryByText('Fissure plafond')).not.toBeInTheDocument()
    expect(screen.getByText('Joint silicone à refaire')).toBeInTheDocument()
    expect(screen.queryByText('Rayure sur parquet')).not.toBeInTheDocument()
  })

  it('renders tabs with correct aria attributes', async () => {
    mockSupabaseSelect()
    render(<ReservationsList lotId="lot-1" />, { wrapper: createWrapper() })

    await screen.findByText('Fissure plafond')

    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(3)

    // "Ouvertes" should be selected by default
    const ouvertesTab = tabs.find((t) => t.textContent?.includes('Ouvertes'))
    expect(ouvertesTab).toHaveAttribute('aria-selected', 'true')
  })
})
