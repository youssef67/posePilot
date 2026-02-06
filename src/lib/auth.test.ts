import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { createElement } from 'react'
import { AuthContext, useAuth, type AuthState } from '@/lib/auth'

function createMockAuth(overrides: Partial<AuthState> = {}): AuthState {
  return {
    session: null,
    user: null,
    isLoading: false,
    isAuthenticated: false,
    signIn: async () => ({ error: null }),
    signOut: async () => {},
    ...overrides,
  }
}

function createWrapper(auth: AuthState) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(AuthContext.Provider, { value: auth }, children)
  }
}

describe('useAuth', () => {
  it('throws when used outside AuthProvider', () => {
    expect(() => {
      renderHook(() => useAuth())
    }).toThrow('useAuth doit être utilisé dans un AuthProvider')
  })

  it('returns initial unauthenticated state', () => {
    const mockAuth = createMockAuth()
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(mockAuth),
    })

    expect(result.current.session).toBeNull()
    expect(result.current.user).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('returns authenticated state when session exists', () => {
    const mockAuth = createMockAuth({
      isAuthenticated: true,
      user: { id: '123', email: 'test@example.com' } as AuthState['user'],
      session: { access_token: 'token' } as AuthState['session'],
    })
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(mockAuth),
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user?.email).toBe('test@example.com')
    expect(result.current.session).not.toBeNull()
  })

  it('exposes signIn and signOut functions', () => {
    const mockAuth = createMockAuth()
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(mockAuth),
    })

    expect(typeof result.current.signIn).toBe('function')
    expect(typeof result.current.signOut).toBe('function')
  })
})
