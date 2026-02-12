import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthContext, type AuthState } from '@/lib/auth'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string; [key: string]: unknown }) => {
    return <a href={to} {...props}>{children}</a>
  },
  useRouterState: () => ({
    location: { pathname: '/' },
  }),
}))

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

import { supabase } from '@/lib/supabase'
import { BottomNavigation } from '@/components/BottomNavigation'

function createWrapper(userId = 'user-1') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const auth: AuthState = {
    session: null,
    user: userId ? { id: userId } as never : null,
    isLoading: false,
    isAuthenticated: true,
    signIn: async () => ({ error: null }),
    signOut: async () => {},
  }
  return ({ children }: { children: React.ReactNode }) =>
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(AuthContext.Provider, { value: auth }, children),
    )
}

function setupCountMock(activityCount: number, besoinsCount = 0) {
  vi.mocked(supabase.from).mockImplementation((table: string) => {
    if (table === 'activity_logs') {
      const mockNeq = vi.fn().mockResolvedValue({ count: activityCount, error: null })
      const mockGt = vi.fn().mockReturnValue({ neq: mockNeq })
      const mockSelect = vi.fn().mockReturnValue({ gt: mockGt })
      return { select: mockSelect } as never
    }
    if (table === 'besoins') {
      const mockIs = vi.fn().mockResolvedValue({ count: besoinsCount, error: null })
      const mockSelect = vi.fn().mockReturnValue({ is: mockIs })
      return { select: mockSelect } as never
    }
    return { select: vi.fn().mockReturnValue({ gt: vi.fn().mockReturnValue({ neq: vi.fn().mockResolvedValue({ count: 0, error: null }) }) }) } as never
  })
}

describe('BottomNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders 4 navigation tabs', () => {
    setupCountMock(0)
    render(<BottomNavigation />, { wrapper: createWrapper() })

    expect(screen.getByText('Chantiers')).toBeInTheDocument()
    expect(screen.getByText('Livraisons')).toBeInTheDocument()
    expect(screen.getByText('Activité')).toBeInTheDocument()
    expect(screen.getByText('Réglages')).toBeInTheDocument()
  })

  it('has role="navigation" with accessible label', () => {
    setupCountMock(0)
    render(<BottomNavigation />, { wrapper: createWrapper() })

    const nav = screen.getByRole('navigation', { name: 'Navigation principale' })
    expect(nav).toBeInTheDocument()
  })

  it('renders links to correct routes', () => {
    setupCountMock(0)
    render(<BottomNavigation />, { wrapper: createWrapper() })

    const links = screen.getAllByRole('link')
    const hrefs = links.map((link) => link.getAttribute('href'))

    expect(hrefs).toContain('/')
    expect(hrefs).toContain('/livraisons')
    expect(hrefs).toContain('/activite')
    expect(hrefs).toContain('/settings')
  })

  it('marks active tab with aria-current="page"', () => {
    setupCountMock(0)
    render(<BottomNavigation />, { wrapper: createWrapper() })

    const activeLink = screen.getByText('Chantiers').closest('a')
    expect(activeLink).toHaveAttribute('aria-current', 'page')
  })

  it('has lg:hidden class for desktop responsiveness', () => {
    setupCountMock(0)
    render(<BottomNavigation />, { wrapper: createWrapper() })

    const nav = screen.getByRole('navigation', { name: 'Navigation principale' })
    expect(nav.className).toContain('lg:hidden')
  })

  it('shows badge when unread count > 0', async () => {
    setupCountMock(3)
    render(<BottomNavigation />, { wrapper: createWrapper() })

    expect(await screen.findByText('3')).toBeInTheDocument()
  })

  it('does not show badge when unread count is 0', () => {
    setupCountMock(0)
    render(<BottomNavigation />, { wrapper: createWrapper() })

    // No badge number should appear
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('shows 99+ when unread count exceeds 99', async () => {
    setupCountMock(150)
    render(<BottomNavigation />, { wrapper: createWrapper() })

    expect(await screen.findByText('99+')).toBeInTheDocument()
  })

  it('adds aria-label with notification count to Activité link', async () => {
    setupCountMock(5)
    render(<BottomNavigation />, { wrapper: createWrapper() })

    const link = await screen.findByLabelText('Activité, 5 nouvelles notifications')
    expect(link).toBeInTheDocument()
  })

  // Besoins badge on Livraisons tab
  it('shows besoins badge on Livraisons tab when pending besoins > 0', async () => {
    setupCountMock(0, 3)
    render(<BottomNavigation />, { wrapper: createWrapper() })

    const livraisonsLink = await screen.findByLabelText('Livraisons, 3 besoins en attente')
    expect(within(livraisonsLink).getByText('3')).toBeInTheDocument()
  })

  it('does not show besoins badge when pending count is 0', () => {
    setupCountMock(0, 0)
    render(<BottomNavigation />, { wrapper: createWrapper() })

    // Only the tab labels should appear, no badge numbers
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('adds aria-label with besoins count to Livraisons link', async () => {
    setupCountMock(0, 5)
    render(<BottomNavigation />, { wrapper: createWrapper() })

    const link = await screen.findByLabelText('Livraisons, 5 besoins en attente')
    expect(link).toBeInTheDocument()
  })
})
