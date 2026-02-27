import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoFormSheet } from './MemoFormSheet'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: 'm1' }, error: null }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'm1' }, error: null }),
          }),
        }),
      }),
    }),
  },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn() },
}))

vi.mock('@/lib/auth', () => ({
  useAuth: () => ({ user: { email: 'test@example.com' } }),
}))

function Wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('MemoFormSheet', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders creation form when no editMemo', () => {
    render(
      <Wrapper>
        <MemoFormSheet open={true} onOpenChange={vi.fn()} chantierId="ch-1" />
      </Wrapper>,
    )
    expect(screen.getByText('Nouveau mémo')).toBeInTheDocument()
    expect(screen.getByText('Ajouter')).toBeInTheDocument()
  })

  it('renders edit form when editMemo is provided', () => {
    const memo = { id: 'm1', chantier_id: 'ch-1', content: 'Test', created_by_email: 'a@b.com', created_at: '', updated_at: '' }
    render(
      <Wrapper>
        <MemoFormSheet open={true} onOpenChange={vi.fn()} chantierId="ch-1" editMemo={memo} />
      </Wrapper>,
    )
    expect(screen.getByText('Modifier le mémo')).toBeInTheDocument()
    expect(screen.getByText('Modifier')).toBeInTheDocument()
  })

  it('disables button when content is empty', () => {
    render(
      <Wrapper>
        <MemoFormSheet open={true} onOpenChange={vi.fn()} chantierId="ch-1" />
      </Wrapper>,
    )
    expect(screen.getByText('Ajouter')).toBeDisabled()
  })

  it('enables button when content is entered', async () => {
    render(
      <Wrapper>
        <MemoFormSheet open={true} onOpenChange={vi.fn()} chantierId="ch-1" />
      </Wrapper>,
    )
    await userEvent.type(screen.getByPlaceholderText('Écrire un mémo...'), 'Nouveau mémo test')
    expect(screen.getByText('Ajouter')).not.toBeDisabled()
  })
})
