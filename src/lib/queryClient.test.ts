import { describe, it, expect } from 'vitest'
import { queryClient } from '@/lib/queryClient'

describe('queryClient', () => {
  it('is a QueryClient instance', () => {
    expect(queryClient).toBeDefined()
    expect(queryClient.getDefaultOptions().queries?.staleTime).toBe(1000 * 60 * 5)
    expect(queryClient.getDefaultOptions().queries?.retry).toBe(3)
  })
})
