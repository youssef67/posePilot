import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { LivraisonsList } from './LivraisonsList'

vi.mock('@/lib/auth', () => ({
  useAuth: () => ({ user: { id: 'user-1', email: 'youssef@test.com' } }),
}))

vi.mock('@/lib/utils/formatRelativeTime', () => ({
  formatRelativeTime: () => 'il y a 2h',
}))

vi.mock('@/lib/mutations/useUploadLivraisonDocument', () => ({
  useUploadLivraisonDocument: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/mutations/useReplaceLivraisonDocument', () => ({
  useReplaceLivraisonDocument: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/lib/utils/documentStorage', () => ({
  getDocumentSignedUrl: vi.fn(),
  downloadDocument: vi.fn(),
}))
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children)
}

const mockLivraisons = [
  {
    id: 'liv1',
    chantier_id: 'ch1',
    description: 'Colle pour faïence 20kg',
    status: 'commande' as const,
    date_prevue: null,
    bc_file_url: null,
    bc_file_name: null,
    bl_file_url: null,
    bl_file_name: null,
    created_at: '2026-02-10T10:00:00Z',
    created_by: 'user-1',
  },
  {
    id: 'liv2',
    chantier_id: 'ch1',
    description: 'Croisillons 3mm',
    status: 'prevu' as const,
    date_prevue: '2026-02-15',
    bc_file_url: null,
    bc_file_name: null,
    bl_file_url: null,
    bl_file_name: null,
    created_at: '2026-02-09T10:00:00Z',
    created_by: 'user-1',
  },
]

describe('LivraisonsList', () => {
  it('renders loading skeletons when isLoading is true', () => {
    const { container } = render(
      <LivraisonsList
        livraisons={undefined}
        isLoading={true}
        chantierId="ch1"
        onOpenSheet={vi.fn()}
        onMarquerPrevu={vi.fn()}
        onConfirmerLivraison={vi.fn()}
      />,
    )
    const skeletons = container.querySelectorAll('[aria-hidden="true"]')
    expect(skeletons).toHaveLength(3)
  })

  it('renders empty state with icon and create button', () => {
    render(
      <LivraisonsList
        livraisons={[]}
        isLoading={false}
        chantierId="ch1"
        onOpenSheet={vi.fn()}
        onMarquerPrevu={vi.fn()}
        onConfirmerLivraison={vi.fn()}
      />,
    )
    expect(screen.getByText('Aucune livraison')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Créer une livraison' })).toBeInTheDocument()
  })

  it('calls onOpenSheet when empty state create button clicked', async () => {
    const user = userEvent.setup()
    const onOpenSheet = vi.fn()
    render(
      <LivraisonsList
        livraisons={[]}
        isLoading={false}
        chantierId="ch1"
        onOpenSheet={onOpenSheet}
        onMarquerPrevu={vi.fn()}
        onConfirmerLivraison={vi.fn()}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Créer une livraison' }))
    expect(onOpenSheet).toHaveBeenCalledOnce()
  })

  it('renders livraison cards when data is provided', () => {
    render(
      <LivraisonsList
        livraisons={mockLivraisons}
        isLoading={false}
        chantierId="ch1"
        onOpenSheet={vi.fn()}
        onMarquerPrevu={vi.fn()}
        onConfirmerLivraison={vi.fn()}
      />,
      { wrapper: createWrapper() },
    )
    expect(screen.getByText('Colle pour faïence 20kg')).toBeInTheDocument()
    expect(screen.getByText('Croisillons 3mm')).toBeInTheDocument()
  })

  it('renders correct action buttons per status', () => {
    render(
      <LivraisonsList
        livraisons={mockLivraisons}
        isLoading={false}
        chantierId="ch1"
        onOpenSheet={vi.fn()}
        onMarquerPrevu={vi.fn()}
        onConfirmerLivraison={vi.fn()}
      />,
      { wrapper: createWrapper() },
    )
    expect(screen.getByRole('button', { name: 'Marquer prévu' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirmer livraison' })).toBeInTheDocument()
  })

  it('renders empty state when livraisons is undefined and not loading', () => {
    render(
      <LivraisonsList
        livraisons={undefined}
        isLoading={false}
        chantierId="ch1"
        onOpenSheet={vi.fn()}
        onMarquerPrevu={vi.fn()}
        onConfirmerLivraison={vi.fn()}
      />,
    )
    expect(screen.getByText('Aucune livraison')).toBeInTheDocument()
  })
})
