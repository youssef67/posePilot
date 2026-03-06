import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

vi.mock('@/lib/supabase', () => ({
  supabase: { from: vi.fn() },
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}))

vi.mock('@/lib/queries/useIntervenants', () => ({
  useIntervenants: () => ({
    data: [
      { id: 'i1', nom: 'A2M', created_by: 'u1', created_at: '2026-03-01T00:00:00Z' },
      { id: 'i2', nom: 'Martin', created_by: 'u1', created_at: '2026-03-01T00:00:00Z' },
    ],
  }),
}))

const mockUpdateMutate = vi.fn()
vi.mock('@/lib/mutations/useUpdateLotIntervenant', () => ({
  useUpdateLotIntervenant: () => ({ mutate: mockUpdateMutate }),
}))

const mockCreateMutateAsync = vi.fn().mockResolvedValue({ id: 'i-new', nom: 'Durand' })
vi.mock('@/lib/mutations/useCreateIntervenant', () => ({
  useCreateIntervenant: () => ({ mutateAsync: mockCreateMutateAsync }),
}))

const mockDeleteMutate = vi.fn()
vi.mock('@/lib/mutations/useDeleteIntervenant', () => ({
  useDeleteIntervenant: () => ({ mutate: mockDeleteMutate }),
}))

import { IntervenantCombobox } from './IntervenantCombobox'

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('IntervenantCombobox', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders placeholder when no intervenant assigned', () => {
    render(
      <IntervenantCombobox lotId="lot-1" plotId="p1" currentIntervenantId={null} />,
      { wrapper: createWrapper() },
    )

    expect(screen.getByRole('combobox')).toHaveTextContent('Intervenant...')
  })

  it('renders current intervenant name when assigned', () => {
    render(
      <IntervenantCombobox lotId="lot-1" plotId="p1" currentIntervenantId="i1" />,
      { wrapper: createWrapper() },
    )

    expect(screen.getByRole('combobox')).toHaveTextContent('A2M')
  })

  it('renders combobox trigger with correct aria attributes', () => {
    render(
      <IntervenantCombobox lotId="lot-1" plotId="p1" currentIntervenantId={null} />,
      { wrapper: createWrapper() },
    )

    const combobox = screen.getByRole('combobox')
    expect(combobox).toHaveAttribute('aria-expanded', 'false')
  })
})
