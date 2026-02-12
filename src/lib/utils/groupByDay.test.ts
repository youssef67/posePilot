import { describe, it, expect, vi, afterEach } from 'vitest'
import { groupByDay } from './groupByDay'

describe('groupByDay', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('groups items into "Aujourd\'hui"', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-10T14:00:00Z'))

    const items = [
      { id: '1', created_at: '2026-02-10T12:00:00Z' },
      { id: '2', created_at: '2026-02-10T10:00:00Z' },
    ]

    const result = groupByDay(items)
    expect(result).toHaveLength(1)
    expect(result[0].label).toBe("Aujourd'hui")
    expect(result[0].entries).toHaveLength(2)
  })

  it('groups items into "Hier"', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-10T14:00:00Z'))

    const items = [
      { id: '1', created_at: '2026-02-09T12:00:00Z' },
    ]

    const result = groupByDay(items)
    expect(result).toHaveLength(1)
    expect(result[0].label).toBe('Hier')
  })

  it('groups older items with formatted date', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-10T14:00:00Z'))

    const items = [
      { id: '1', created_at: '2026-02-07T12:00:00Z' },
    ]

    const result = groupByDay(items)
    expect(result).toHaveLength(1)
    expect(result[0].label).toMatch(/7/)
    expect(result[0].label).toMatch(/février/)
    expect(result[0].label).toMatch(/2026/)
  })

  it('groups mixed days preserving order', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-10T14:00:00Z'))

    const items = [
      { id: '1', created_at: '2026-02-10T12:00:00Z' },
      { id: '2', created_at: '2026-02-10T10:00:00Z' },
      { id: '3', created_at: '2026-02-09T15:00:00Z' },
      { id: '4', created_at: '2026-02-07T12:00:00Z' },
    ]

    const result = groupByDay(items)
    expect(result).toHaveLength(3)
    expect(result[0].label).toBe("Aujourd'hui")
    expect(result[0].entries).toHaveLength(2)
    expect(result[1].label).toBe('Hier')
    expect(result[1].entries).toHaveLength(1)
    expect(result[2].label).toMatch(/7/)
    expect(result[2].entries).toHaveLength(1)
  })

  it('returns empty array for empty input', () => {
    const result = groupByDay([])
    expect(result).toEqual([])
  })

  it('preserves item properties in entries', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-10T14:00:00Z'))

    const items = [
      { id: '1', created_at: '2026-02-10T12:00:00Z', extra: 'value' },
    ]

    const result = groupByDay(items)
    expect(result[0].entries[0]).toEqual(items[0])
  })
})
