import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ActivityFeed } from './ActivityFeed'
import type { ActivityLog } from '@/types/database'

vi.mock('@/lib/utils/formatRelativeTime', () => ({
  formatRelativeTime: (dateString: string) => `il y a (${dateString})`,
}))

const mockEntries: ActivityLog[] = [
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
  {
    id: 'log-2',
    event_type: 'note_added',
    actor_id: 'user-2',
    actor_email: 'bruno@test.fr',
    chantier_id: 'chantier-1',
    target_type: 'piece',
    target_id: 'piece-2',
    metadata: { content_preview: 'Fissure au plaf...', lot_code: '205', piece_nom: 'SDB' },
    created_at: '2026-02-10T08:00:00Z',
  },
  {
    id: 'log-3',
    event_type: 'photo_added',
    actor_id: 'user-3',
    actor_email: 'alice@test.fr',
    chantier_id: 'chantier-1',
    target_type: 'piece',
    target_id: 'piece-1',
    metadata: { lot_code: '203', piece_nom: 'Séjour' },
    created_at: '2026-02-09T15:00:00Z',
  },
  {
    id: 'log-4',
    event_type: 'blocking_noted',
    actor_id: 'user-3',
    actor_email: 'alice@test.fr',
    chantier_id: 'chantier-1',
    target_type: 'piece',
    target_id: 'piece-3',
    metadata: { content_preview: 'Support fissuré...', lot_code: '207', piece_nom: 'SDB' },
    created_at: '2026-02-09T10:00:00Z',
  },
]

describe('ActivityFeed', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders feed container with role="feed"', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-10T14:00:00Z'))

    render(<ActivityFeed entries={mockEntries} lastSeenAt="2026-02-09T00:00:00Z" />)

    expect(screen.getByRole('feed')).toBeInTheDocument()
  })

  it('groups entries by day', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-10T14:00:00Z'))

    render(<ActivityFeed entries={mockEntries} lastSeenAt="2026-02-09T00:00:00Z" />)

    expect(screen.getByText("Aujourd'hui")).toBeInTheDocument()
    expect(screen.getByText('Hier')).toBeInTheDocument()
  })

  it('renders each entry as an article', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-10T14:00:00Z'))

    render(<ActivityFeed entries={mockEntries} lastSeenAt="2026-02-09T00:00:00Z" />)

    const articles = screen.getAllByRole('article')
    expect(articles).toHaveLength(4)
  })

  it('displays activity descriptions correctly', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-10T14:00:00Z'))

    render(<ActivityFeed entries={mockEntries} lastSeenAt="2026-02-09T00:00:00Z" />)

    expect(screen.getByText('Bruno a terminé Séjour')).toBeInTheDocument()
    expect(screen.getByText('Bruno a ajouté une note')).toBeInTheDocument()
    expect(screen.getByText('Alice a ajouté une photo')).toBeInTheDocument()
    expect(screen.getByText('Alice a signalé un blocage')).toBeInTheDocument()
  })

  it('shows author initials', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-10T14:00:00Z'))

    render(<ActivityFeed entries={mockEntries} lastSeenAt="2026-02-09T00:00:00Z" />)

    const initials = screen.getAllByText('B')
    expect(initials.length).toBeGreaterThanOrEqual(2)
    const aInitials = screen.getAllByText('A')
    expect(aInitials.length).toBeGreaterThanOrEqual(2)
  })

  it('marks entries as "Nouveau" when after lastSeenAt', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-10T14:00:00Z'))

    render(<ActivityFeed entries={mockEntries} lastSeenAt="2026-02-10T00:00:00Z" />)

    const newBadges = screen.getAllByText('Nouveau')
    // log-1 (12:00) and log-2 (08:00) are today, but only log-1 is after lastSeen 00:00 today
    // log-2 (08:00) is also after 00:00 so both should be "Nouveau"
    expect(newBadges).toHaveLength(2)
  })

  it('does not show "Nouveau" for entries before lastSeenAt', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-10T14:00:00Z'))

    // All entries are before this lastSeenAt
    render(<ActivityFeed entries={mockEntries} lastSeenAt="2026-02-11T00:00:00Z" />)

    expect(screen.queryByText('Nouveau')).not.toBeInTheDocument()
  })

  it('shows empty state when no entries', () => {
    render(<ActivityFeed entries={[]} lastSeenAt="2026-02-10T00:00:00Z" />)

    expect(screen.getByText('Rien de nouveau')).toBeInTheDocument()
  })

  it('shows skeleton loading state', () => {
    render(<ActivityFeed entries={[]} lastSeenAt="" isLoading />)

    expect(screen.getByTestId('activity-feed-skeleton')).toBeInTheDocument()
  })

  it('displays target line with lot code and piece name', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-10T14:00:00Z'))

    render(<ActivityFeed entries={[mockEntries[0]]} lastSeenAt="2026-02-09T00:00:00Z" />)

    // Target line: "Lot 203 · il y a (...)" — piece_nom is in description only
    expect(screen.getByText(/Lot 203 · il y a/)).toBeInTheDocument()
  })

  it('handles task_status_changed to in_progress', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-10T14:00:00Z'))

    const entry: ActivityLog = {
      ...mockEntries[0],
      id: 'log-ip',
      metadata: { piece_nom: 'Cuisine', lot_code: '201', old_status: 'not_started', new_status: 'in_progress' },
    }

    render(<ActivityFeed entries={[entry]} lastSeenAt="2026-02-09T00:00:00Z" />)
    expect(screen.getByText('Bruno a commencé Cuisine')).toBeInTheDocument()
  })

  it('handles task_status_changed to not_started', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-10T14:00:00Z'))

    const entry: ActivityLog = {
      ...mockEntries[0],
      id: 'log-ns',
      metadata: { piece_nom: 'Cuisine', lot_code: '201', old_status: 'done', new_status: 'not_started' },
    }

    render(<ActivityFeed entries={[entry]} lastSeenAt="2026-02-09T00:00:00Z" />)
    expect(screen.getByText('Bruno a réinitialisé Cuisine')).toBeInTheDocument()
  })

  it('handles besoin_added event', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-10T14:00:00Z'))

    const entry: ActivityLog = {
      id: 'log-ba',
      event_type: 'besoin_added',
      actor_id: 'user-2',
      actor_email: 'bruno@test.fr',
      chantier_id: 'chantier-1',
      target_type: 'besoin',
      target_id: 'besoin-1',
      metadata: { description: 'Colle pour faïence' },
      created_at: '2026-02-10T11:00:00Z',
    }

    render(<ActivityFeed entries={[entry]} lastSeenAt="2026-02-09T00:00:00Z" />)
    expect(screen.getByText('Bruno a ajouté un besoin')).toBeInTheDocument()
    expect(screen.getByText(/Colle pour faïence/)).toBeInTheDocument()
  })

  it('handles besoin_ordered event', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-10T14:00:00Z'))

    const entry: ActivityLog = {
      id: 'log-bo',
      event_type: 'besoin_ordered',
      actor_id: 'user-3',
      actor_email: 'alice@test.fr',
      chantier_id: 'chantier-1',
      target_type: 'besoin',
      target_id: 'besoin-2',
      metadata: { description: 'Joint gris 5kg' },
      created_at: '2026-02-10T10:00:00Z',
    }

    render(<ActivityFeed entries={[entry]} lastSeenAt="2026-02-09T00:00:00Z" />)
    expect(screen.getByText('Alice a commandé un besoin')).toBeInTheDocument()
    expect(screen.getByText(/Joint gris 5kg/)).toBeInTheDocument()
  })
})
