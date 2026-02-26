import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
    },
  },
}))

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn() }),
}))

vi.mock('@/lib/mutations/useCreateLivraison', () => ({
  useCreateLivraison: () => ({
    mutate: mockCreateMutate,
    isPending: false,
  }),
}))

vi.mock('@/lib/mutations/useUpdateLivraisonStatus', () => ({
  useUpdateLivraisonStatus: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}))

vi.mock('@/lib/mutations/useUpdateLivraison', () => ({
  useUpdateLivraison: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}))

vi.mock('@/lib/mutations/useDeleteLivraison', () => ({
  useDeleteLivraison: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}))

vi.mock('@/lib/mutations/useUploadLivraisonDocument', () => ({
  useUploadLivraisonDocument: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}))

const mockCreateMutate = vi.fn()

import { useLivraisonActions } from './useLivraisonActions'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useLivraisonActions — isDepot logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sets destination=depot and isDepot=true when chantier unique is depot', () => {
    const { result } = renderHook(() => useLivraisonActions(''), { wrapper: createWrapper() })

    // Set up: chantier unique mode with depot selected
    act(() => {
      result.current.setLivraisonChantierUnique(true)
      result.current.setLivraisonGlobalChantierId('__depot__')
      result.current.setLivraisonLines([
        { description: 'Colle', quantite: 10, montantUnitaire: '5', chantierId: '__depot__' },
      ])
    })

    act(() => {
      result.current.handleCreateLivraison()
    })

    expect(mockCreateMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        destination: 'depot',
        lines: expect.arrayContaining([
          expect.objectContaining({ isDepot: true, chantier_id: '' }),
        ]),
      }),
      expect.any(Object),
    )
  })

  it('sets destination=chantier with mixed isDepot flags for per-line selection', () => {
    const { result } = renderHook(() => useLivraisonActions(''), { wrapper: createWrapper() })

    // Set up: per-line mode (chantier unique off) with mixed destinations
    act(() => {
      result.current.setLivraisonChantierUnique(false)
      result.current.setLivraisonLines([
        { description: 'Colle', quantite: 5, montantUnitaire: '10', chantierId: 'ch1' },
        { description: 'Vis stock', quantite: 100, montantUnitaire: '0.1', chantierId: '__depot__' },
      ])
    })

    act(() => {
      result.current.handleCreateLivraison()
    })

    expect(mockCreateMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        destination: 'chantier',
        lines: expect.arrayContaining([
          expect.objectContaining({ description: 'Colle', isDepot: false, chantier_id: 'ch1' }),
          expect.objectContaining({ description: 'Vis stock', isDepot: true, chantier_id: '' }),
        ]),
      }),
      expect.any(Object),
    )
  })

  it('sets destination=depot when all per-line selections are depot', () => {
    const { result } = renderHook(() => useLivraisonActions(''), { wrapper: createWrapper() })

    act(() => {
      result.current.setLivraisonChantierUnique(false)
      result.current.setLivraisonLines([
        { description: 'Colle', quantite: 5, montantUnitaire: '10', chantierId: '__depot__' },
        { description: 'Vis', quantite: 100, montantUnitaire: '0.1', chantierId: '__depot__' },
      ])
    })

    act(() => {
      result.current.handleCreateLivraison()
    })

    expect(mockCreateMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        destination: 'depot',
      }),
      expect.any(Object),
    )
  })

  it('sets destination=chantier when chantier unique with a real chantier', () => {
    const { result } = renderHook(() => useLivraisonActions('ch1'), { wrapper: createWrapper() })

    act(() => {
      result.current.setLivraisonChantierUnique(true)
      result.current.setLivraisonGlobalChantierId('ch1')
      result.current.setLivraisonLines([
        { description: 'Colle', quantite: 5, montantUnitaire: '10', chantierId: 'ch1' },
      ])
    })

    act(() => {
      result.current.handleCreateLivraison()
    })

    expect(mockCreateMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        destination: 'chantier',
        lines: expect.arrayContaining([
          expect.objectContaining({ isDepot: false, chantier_id: 'ch1' }),
        ]),
      }),
      expect.any(Object),
    )
  })

  it('skips depot lines for chantier validation', () => {
    const { result } = renderHook(() => useLivraisonActions(''), { wrapper: createWrapper() })

    // Per-line mode: depot line has no chantier (should not trigger error)
    act(() => {
      result.current.setLivraisonChantierUnique(false)
      result.current.setLivraisonLines([
        { description: 'Vis stock', quantite: 100, montantUnitaire: '0.1', chantierId: '__depot__' },
      ])
    })

    act(() => {
      result.current.handleCreateLivraison()
    })

    // Should NOT show error — depot lines skip chantier validation
    expect(result.current.livraisonError).toBe('')
    expect(mockCreateMutate).toHaveBeenCalled()
  })

  it('shows error when non-depot line has no chantier selected', () => {
    const { result } = renderHook(() => useLivraisonActions(''), { wrapper: createWrapper() })

    act(() => {
      result.current.setLivraisonChantierUnique(false)
      result.current.setLivraisonLines([
        { description: 'Colle', quantite: 5, montantUnitaire: '10', chantierId: '' },
      ])
    })

    act(() => {
      result.current.handleCreateLivraison()
    })

    expect(result.current.livraisonError).toBe('Sélectionnez un chantier ou "Dépôt entreprise" pour chaque ligne')
    expect(mockCreateMutate).not.toHaveBeenCalled()
  })
})
