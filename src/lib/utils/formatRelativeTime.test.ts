import { describe, it, expect, vi, afterEach } from 'vitest'
import { formatRelativeTime } from './formatRelativeTime'

describe('formatRelativeTime', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('formats seconds ago', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-10T12:00:30Z'))

    const result = formatRelativeTime('2026-02-10T12:00:00Z')
    expect(result).toMatch(/30\s*secondes/)
  })

  it('formats minutes ago', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-10T12:05:00Z'))

    const result = formatRelativeTime('2026-02-10T12:00:00Z')
    expect(result).toMatch(/5\s*minutes/)
  })

  it('formats hours ago', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-10T14:00:00Z'))

    const result = formatRelativeTime('2026-02-10T12:00:00Z')
    expect(result).toMatch(/2\s*heures/)
  })

  it('formats days ago', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-13T12:00:00Z'))

    const result = formatRelativeTime('2026-02-10T12:00:00Z')
    expect(result).toMatch(/3\s*jours/)
  })

  it('formats "yesterday" for 1 day ago', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-11T12:00:00Z'))

    const result = formatRelativeTime('2026-02-10T12:00:00Z')
    expect(result).toMatch(/hier/)
  })

  it('formats "just now" for very recent times', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-10T12:00:00Z'))

    const result = formatRelativeTime('2026-02-10T12:00:00Z')
    expect(result).toMatch(/maintenant/)
  })

  it('returns a string for old dates', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-10T12:00:00Z'))

    const result = formatRelativeTime('2025-02-10T12:00:00Z')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})
