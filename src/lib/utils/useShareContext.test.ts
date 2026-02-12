import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

vi.mock('@tanstack/react-router', () => ({
  useMatches: vi.fn(),
}))

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: vi.fn(),
}))

import { useMatches } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useShareContext } from './useShareContext'

const mockUseMatches = useMatches as ReturnType<typeof vi.fn>
const mockUseQueryClient = useQueryClient as ReturnType<typeof vi.fn>

describe('useShareContext', () => {
  const mockGetQueryData = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseQueryClient.mockReturnValue({ getQueryData: mockGetQueryData })
  })

  it('returns full context on lot screen: "Chantier X — Plot Y — Lot Z"', () => {
    mockUseMatches.mockReturnValue([
      { staticData: {}, params: {}, pathname: '/' },
      { staticData: { breadcrumb: 'Chantier' }, params: { chantierId: 'c1' }, pathname: '/chantiers/c1' },
      { staticData: { breadcrumb: 'Plot' }, params: { chantierId: 'c1', plotId: 'p1' }, pathname: '/chantiers/c1/plots/p1' },
      { staticData: { breadcrumb: 'Étage' }, params: { chantierId: 'c1', plotId: 'p1', etageId: 'e1' }, pathname: '/chantiers/c1/plots/p1/e1' },
      { staticData: { breadcrumb: 'Lot' }, params: { chantierId: 'c1', plotId: 'p1', etageId: 'e1', lotId: 'l1' }, pathname: '/chantiers/c1/plots/p1/e1/l1' },
    ])
    mockGetQueryData.mockImplementation((key: string[]) => {
      if (key[0] === 'chantiers' && key[1] === 'c1') return { id: 'c1', nom: 'Les Oliviers' }
      if (key[0] === 'plots' && key[1] === 'c1') return [{ id: 'p1', nom: 'Plot A' }]
      if (key[0] === 'lots' && key[1] === 'p1') return [{ id: 'l1', code: '203' }]
      return undefined
    })

    const { result } = renderHook(() => useShareContext())
    expect(result.current).toBe('Chantier Les Oliviers — Plot A — Lot 203')
  })

  it('returns full context on piece screen: "Chantier X — Plot Y — Lot Z — Pièce W"', () => {
    mockUseMatches.mockReturnValue([
      { staticData: {}, params: {}, pathname: '/' },
      { staticData: { breadcrumb: 'Chantier' }, params: { chantierId: 'c1' }, pathname: '/chantiers/c1' },
      { staticData: { breadcrumb: 'Plot' }, params: { chantierId: 'c1', plotId: 'p1' }, pathname: '/chantiers/c1/plots/p1' },
      { staticData: { breadcrumb: 'Étage' }, params: { chantierId: 'c1', plotId: 'p1', etageId: 'e1' }, pathname: '/chantiers/c1/plots/p1/e1' },
      { staticData: { breadcrumb: 'Lot' }, params: { chantierId: 'c1', plotId: 'p1', etageId: 'e1', lotId: 'l1' }, pathname: '/chantiers/c1/plots/p1/e1/l1' },
      { staticData: { breadcrumb: 'Pièce' }, params: { chantierId: 'c1', plotId: 'p1', etageId: 'e1', lotId: 'l1', pieceId: 'pi1' }, pathname: '/chantiers/c1/plots/p1/e1/l1/pi1' },
    ])
    mockGetQueryData.mockImplementation((key: string[]) => {
      if (key[0] === 'chantiers' && key[1] === 'c1') return { id: 'c1', nom: 'Les Oliviers' }
      if (key[0] === 'plots' && key[1] === 'c1') return [{ id: 'p1', nom: 'Plot A' }]
      if (key[0] === 'lots' && key[1] === 'p1') return [{ id: 'l1', code: '203' }]
      if (key[0] === 'pieces' && key[1] === 'l1') return [{ id: 'pi1', nom: 'SDB' }]
      return undefined
    })

    const { result } = renderHook(() => useShareContext())
    expect(result.current).toBe('Chantier Les Oliviers — Plot A — Lot 203 — SDB')
  })

  it('returns partial context when cache is empty', () => {
    mockUseMatches.mockReturnValue([
      { staticData: { breadcrumb: 'Chantier' }, params: { chantierId: 'c1' }, pathname: '/chantiers/c1' },
      { staticData: { breadcrumb: 'Plot' }, params: { chantierId: 'c1', plotId: 'p1' }, pathname: '/chantiers/c1/plots/p1' },
    ])
    mockGetQueryData.mockReturnValue(undefined)

    const { result } = renderHook(() => useShareContext())
    expect(result.current).toBe('')
  })

  it('returns empty string when no breadcrumb matches exist', () => {
    mockUseMatches.mockReturnValue([
      { staticData: {}, params: {}, pathname: '/' },
    ])

    const { result } = renderHook(() => useShareContext())
    expect(result.current).toBe('')
  })

  it('skips étage from the context string (not user-meaningful)', () => {
    mockUseMatches.mockReturnValue([
      { staticData: { breadcrumb: 'Chantier' }, params: { chantierId: 'c1' }, pathname: '/chantiers/c1' },
      { staticData: { breadcrumb: 'Plot' }, params: { chantierId: 'c1', plotId: 'p1' }, pathname: '/chantiers/c1/plots/p1' },
      { staticData: { breadcrumb: 'Étage' }, params: { chantierId: 'c1', plotId: 'p1', etageId: 'e1' }, pathname: '/chantiers/c1/plots/p1/e1' },
      { staticData: { breadcrumb: 'Lot' }, params: { chantierId: 'c1', plotId: 'p1', etageId: 'e1', lotId: 'l1' }, pathname: '/chantiers/c1/plots/p1/e1/l1' },
    ])
    mockGetQueryData.mockImplementation((key: string[]) => {
      if (key[0] === 'chantiers' && key[1] === 'c1') return { id: 'c1', nom: 'Résidence Bleue' }
      if (key[0] === 'plots' && key[1] === 'c1') return [{ id: 'p1', nom: 'Plot B' }]
      if (key[0] === 'lots' && key[1] === 'p1') return [{ id: 'l1', code: '101' }]
      return undefined
    })

    const { result } = renderHook(() => useShareContext())
    // Étage is not included — it's an internal navigation level, not user-facing context
    expect(result.current).toBe('Chantier Résidence Bleue — Plot B — Lot 101')
  })
})
