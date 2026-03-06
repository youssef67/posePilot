import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import {
  createRouter,
  createMemoryHistory,
  RouterProvider,
  createRootRoute,
  createRoute,
} from '@tanstack/react-router'
import type { MemoWithPhotos } from '@/lib/queries/useMemos'

const mockMemos: MemoWithPhotos[] = [
  {
    id: 'm1', chantier_id: null, etage_id: 'e-1',
    content: 'Dalle fragile hall',
    created_by_email: 'bruno@test.com',
    created_at: '2026-02-12T00:00:00Z', updated_at: '2026-02-12T00:00:00Z',
    memo_photos: [
      { id: 'ph-1', memo_id: 'm1', photo_url: 'https://example.com/a.jpg', position: 0, created_at: '2026-02-12T00:00:00Z' },
    ],
  },
  {
    id: 'm2', chantier_id: null, etage_id: 'e-1',
    content: 'Vérifier compteur',
    created_by_email: 'youssef@test.com',
    created_at: '2026-02-10T00:00:00Z', updated_at: '2026-02-10T00:00:00Z',
    memo_photos: [],
  },
  {
    id: 'm3', chantier_id: null, etage_id: 'e-2',
    content: 'Clé gardienne étage 1',
    created_by_email: 'bruno@test.com',
    created_at: '2026-02-11T00:00:00Z', updated_at: '2026-02-11T00:00:00Z',
    memo_photos: [],
  },
]

vi.mock('@/lib/queries/usePlotEtageMemos', () => ({
  usePlotEtageMemos: vi.fn(),
}))

import { usePlotEtageMemos } from '@/lib/queries/usePlotEtageMemos'
import { EtageMemosAccordion } from './EtageMemosAccordion'

const mockUsePlotEtageMemos = vi.mocked(usePlotEtageMemos)

const etages = [
  { id: 'e-1', nom: 'RDC' },
  { id: 'e-2', nom: 'Étage 1' },
  { id: 'e-3', nom: 'Étage 2' },
]

function renderWithProviders(memos: MemoWithPhotos[]) {
  mockUsePlotEtageMemos.mockReturnValue({
    data: memos,
    isLoading: false,
    error: null,
  } as ReturnType<typeof usePlotEtageMemos>)

  const rootRoute = createRootRoute()
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () =>
      createElement(EtageMemosAccordion, {
        etages,
        plotId: 'plot-1',
        chantierId: 'ch-1',
      }),
  })
  rootRoute.addChildren([indexRoute])
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(RouterProvider, { router } as never),
    ),
  )
}

describe('EtageMemosAccordion', () => {
  beforeEach(() => vi.clearAllMocks())

  it('displays section heading and etages with memos grouped by etage', async () => {
    renderWithProviders(mockMemos)
    expect(await screen.findByRole('heading', { name: 'Mémos' })).toBeInTheDocument()
    expect(screen.getByText('RDC')).toBeInTheDocument()
    expect(screen.getByText('Étage 1')).toBeInTheDocument()
    expect(screen.getByText('2 mémos')).toBeInTheDocument()
    expect(screen.getByText('1 mémo')).toBeInTheDocument()
  })

  it('shows memo content, author, date and photos within accordion', async () => {
    renderWithProviders(mockMemos)
    expect(await screen.findByText('Dalle fragile hall')).toBeInTheDocument()
    expect(screen.getByText('Vérifier compteur')).toBeInTheDocument()
    expect(screen.getByText('Clé gardienne étage 1')).toBeInTheDocument()
    expect(screen.getAllByText('bruno').length).toBe(2)
    // AC3: photos (miniatures) are displayed
    const photos = screen.getAllByAltText('Photo du mémo')
    expect(photos.length).toBe(1)
    expect(photos[0]).toHaveAttribute('src', 'https://example.com/a.jpg')
    // AC3: dates are displayed (formatRelativeTime output contains '·' separator)
    const dots = screen.getAllByText('·')
    expect(dots.length).toBeGreaterThanOrEqual(3)
  })

  it('hides etages without memos', async () => {
    renderWithProviders(mockMemos)
    await screen.findByText('RDC')
    expect(screen.queryByText('Étage 2')).not.toBeInTheDocument()
  })

  it('renders links to etage memos pages', async () => {
    renderWithProviders(mockMemos)
    await screen.findByText('Dalle fragile hall')
    const links = screen.getAllByRole('link')
    const memoLinks = links.filter((l) => l.getAttribute('href')?.includes('/memos'))
    expect(memoLinks.length).toBe(3)
    expect(memoLinks[0].getAttribute('href')).toContain('/e-1/memos')
  })

  it('returns null when no etage has memos', () => {
    renderWithProviders([])
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    expect(screen.queryByText('RDC')).not.toBeInTheDocument()
  })

  it('does not show edit/delete dropdown on memo cards', async () => {
    renderWithProviders(mockMemos)
    await screen.findByText('Dalle fragile hall')
    expect(screen.queryByLabelText('Options du mémo')).not.toBeInTheDocument()
  })
})
