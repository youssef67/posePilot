import { describe, it, expect, vi, afterEach } from 'vitest'
import { isThisWeek } from './isThisWeek'

describe('isThisWeek', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns false for null', () => {
    expect(isThisWeek(null)).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isThisWeek('')).toBe(false)
  })

  it('returns true for a date within the current week (Wednesday)', () => {
    // Wednesday 2026-02-11 → week is Mon 2026-02-09 to Sun 2026-02-15
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-11T12:00:00'))

    expect(isThisWeek('2026-02-09')).toBe(true) // Monday
    expect(isThisWeek('2026-02-11')).toBe(true) // Wednesday (today)
    expect(isThisWeek('2026-02-15')).toBe(true) // Sunday
  })

  it('returns false for dates outside the current week', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-11T12:00:00'))

    expect(isThisWeek('2026-02-08')).toBe(false) // Previous Sunday
    expect(isThisWeek('2026-02-16')).toBe(false) // Next Monday
    expect(isThisWeek('2026-01-01')).toBe(false) // Different month
  })

  it('handles Sunday correctly (getDay === 0 edge case)', () => {
    // Sunday 2026-02-15 → week should still be Mon 2026-02-09 to Sun 2026-02-15
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-15T12:00:00'))

    expect(isThisWeek('2026-02-09')).toBe(true) // Monday of same week
    expect(isThisWeek('2026-02-15')).toBe(true) // Sunday (today)
    expect(isThisWeek('2026-02-16')).toBe(false) // Next Monday
    expect(isThisWeek('2026-02-08')).toBe(false) // Previous Sunday
  })

  it('handles Monday correctly (start of week)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-09T12:00:00'))

    expect(isThisWeek('2026-02-09')).toBe(true) // Monday (today)
    expect(isThisWeek('2026-02-15')).toBe(true) // Sunday
    expect(isThisWeek('2026-02-08')).toBe(false) // Previous Sunday
  })
})
