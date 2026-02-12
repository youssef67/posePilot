import { describe, it, expect } from 'vitest'
import { computeStatus } from './computeStatus'

describe('computeStatus', () => {
  it('returns NOT_STARTED when total is 0', () => {
    expect(computeStatus(0, 0)).toBe('NOT_STARTED')
  })

  it('returns NOT_STARTED when done is 0 and total > 0', () => {
    expect(computeStatus(0, 5)).toBe('NOT_STARTED')
  })

  it('returns IN_PROGRESS when done > 0 and done < total', () => {
    expect(computeStatus(3, 5)).toBe('IN_PROGRESS')
  })

  it('returns IN_PROGRESS when done is 1 and total > 1', () => {
    expect(computeStatus(1, 10)).toBe('IN_PROGRESS')
  })

  it('returns DONE when done equals total and total > 0', () => {
    expect(computeStatus(5, 5)).toBe('DONE')
  })

  it('returns DONE when done equals total of 1', () => {
    expect(computeStatus(1, 1)).toBe('DONE')
  })
})
