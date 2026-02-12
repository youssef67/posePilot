import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLotSearchHistory } from './useLotSearchHistory'

const STORAGE_KEY = 'posepilot-lot-search-chantier-1'

describe('useLotSearchHistory', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('returns empty history when localStorage is empty', () => {
    const { result } = renderHook(() => useLotSearchHistory('chantier-1'))
    expect(result.current.history).toEqual([])
  })

  it('reads existing history from localStorage', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['101', '203']))

    const { result } = renderHook(() => useLotSearchHistory('chantier-1'))
    expect(result.current.history).toEqual(['101', '203'])
  })

  it('adds an entry to history', () => {
    const { result } = renderHook(() => useLotSearchHistory('chantier-1'))

    act(() => {
      result.current.addToHistory('101')
    })

    expect(result.current.history).toEqual(['101'])
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(['101'])
  })

  it('deduplicates by moving existing entry to front', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['101', '203', '301']))

    const { result } = renderHook(() => useLotSearchHistory('chantier-1'))

    act(() => {
      result.current.addToHistory('203')
    })

    expect(result.current.history).toEqual(['203', '101', '301'])
  })

  it('limits history to 5 entries (FIFO)', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(['105', '104', '103', '102', '101']),
    )

    const { result } = renderHook(() => useLotSearchHistory('chantier-1'))

    act(() => {
      result.current.addToHistory('106')
    })

    expect(result.current.history).toEqual([
      '106',
      '105',
      '104',
      '103',
      '102',
    ])
    expect(result.current.history).toHaveLength(5)
  })

  it('clears history', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['101', '203']))

    const { result } = renderHook(() => useLotSearchHistory('chantier-1'))

    act(() => {
      result.current.clearHistory()
    })

    expect(result.current.history).toEqual([])
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('scopes history by chantierId', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['101']))
    localStorage.setItem(
      'posepilot-lot-search-chantier-2',
      JSON.stringify(['999']),
    )

    const { result: result1 } = renderHook(() =>
      useLotSearchHistory('chantier-1'),
    )
    const { result: result2 } = renderHook(() =>
      useLotSearchHistory('chantier-2'),
    )

    expect(result1.current.history).toEqual(['101'])
    expect(result2.current.history).toEqual(['999'])
  })

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem(STORAGE_KEY, 'not-valid-json')

    const { result } = renderHook(() => useLotSearchHistory('chantier-1'))
    expect(result.current.history).toEqual([])
  })
})
