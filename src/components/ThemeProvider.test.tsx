import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act } from '@testing-library/react'
import { renderHook } from '@testing-library/react'
import { createElement } from 'react'
import { ThemeProvider, useTheme } from '@/components/ThemeProvider'

const STORAGE_KEY = 'posepilot-theme'

function createWrapper({ defaultTheme = 'dark' as const }: { defaultTheme?: 'dark' | 'light' | 'system' } = {}) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(ThemeProvider, { defaultTheme, storageKey: STORAGE_KEY, children })
  }
}

function mockMatchMedia(prefersDark: boolean) {
  const listeners: Array<(e: MediaQueryListEvent) => void> = []
  const mql = {
    matches: prefersDark,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn((_event: string, cb: (e: MediaQueryListEvent) => void) => {
      listeners.push(cb)
    }),
    removeEventListener: vi.fn((_event: string, cb: (e: MediaQueryListEvent) => void) => {
      const idx = listeners.indexOf(cb)
      if (idx !== -1) listeners.splice(idx, 1)
    }),
    dispatchEvent: vi.fn(),
  }
  window.matchMedia = vi.fn().mockReturnValue(mql)
  return {
    triggerChange(newPrefersDark: boolean) {
      mql.matches = newPrefersDark
      listeners.forEach((cb) => cb({ matches: newPrefersDark } as MediaQueryListEvent))
    },
  }
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark', 'light')
    mockMatchMedia(false)
  })

  it('defaults to dark theme', () => {
    renderHook(() => useTheme(), { wrapper: createWrapper() })

    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('persists theme choice to localStorage', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: createWrapper() })

    act(() => {
      result.current.setTheme('light')
    })

    expect(localStorage.getItem(STORAGE_KEY)).toBe('light')
  })

  it('reads persisted theme from localStorage', () => {
    localStorage.setItem(STORAGE_KEY, 'light')

    renderHook(() => useTheme(), { wrapper: createWrapper() })

    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('toggles between dark and light', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: createWrapper() })

    expect(result.current.theme).toBe('dark')

    act(() => {
      result.current.setTheme('light')
    })

    expect(result.current.theme).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)

    act(() => {
      result.current.setTheme('dark')
    })

    expect(result.current.theme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('applies dark class on html element when dark theme is active', () => {
    renderHook(() => useTheme(), { wrapper: createWrapper({ defaultTheme: 'dark' }) })

    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('resolves system theme to dark when OS prefers dark', () => {
    mockMatchMedia(true)

    const { result } = renderHook(() => useTheme(), {
      wrapper: createWrapper({ defaultTheme: 'system' }),
    })

    expect(result.current.theme).toBe('system')
    expect(result.current.resolvedTheme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('resolves system theme to light when OS prefers light', () => {
    mockMatchMedia(false)

    const { result } = renderHook(() => useTheme(), {
      wrapper: createWrapper({ defaultTheme: 'system' }),
    })

    expect(result.current.theme).toBe('system')
    expect(result.current.resolvedTheme).toBe('light')
    expect(document.documentElement.classList.contains('light')).toBe(true)
  })

  it('reacts to OS theme change when in system mode', () => {
    const { triggerChange } = mockMatchMedia(false)

    const { result } = renderHook(() => useTheme(), {
      wrapper: createWrapper({ defaultTheme: 'system' }),
    })

    expect(result.current.resolvedTheme).toBe('light')

    act(() => {
      triggerChange(true)
    })

    expect(result.current.resolvedTheme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('exposes resolvedTheme matching actual theme for dark/light', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: createWrapper() })

    expect(result.current.resolvedTheme).toBe('dark')

    act(() => {
      result.current.setTheme('light')
    })

    expect(result.current.resolvedTheme).toBe('light')
  })
})

describe('useTheme', () => {
  beforeEach(() => {
    mockMatchMedia(false)
  })

  it('throws when used outside ThemeProvider', () => {
    expect(() => {
      renderHook(() => useTheme())
    }).toThrow('useTheme doit être utilisé dans un ThemeProvider')
  })

  it('returns theme, resolvedTheme and setTheme', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: createWrapper() })

    expect(result.current.theme).toBeDefined()
    expect(result.current.resolvedTheme).toBeDefined()
    expect(typeof result.current.setTheme).toBe('function')
  })
})
