import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement } from 'react'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ThemeToggle } from '@/components/ThemeToggle'

function renderWithTheme(defaultTheme: 'dark' | 'light' = 'dark') {
  return render(
    createElement(
      ThemeProvider,
      { defaultTheme, storageKey: 'posepilot-theme', children: createElement(ThemeToggle) },
    ),
  )
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark', 'light')
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      media: '(prefers-color-scheme: dark)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
  })

  it('renders a button with accessible label', () => {
    renderWithTheme()

    const button = screen.getByRole('button', { name: /thème/i })
    expect(button).toBeInTheDocument()
  })

  it('toggles from dark to light on click', async () => {
    const user = userEvent.setup()
    renderWithTheme('dark')

    const button = screen.getByRole('button', { name: /thème/i })
    await user.click(button)

    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('toggles from light to dark on click', async () => {
    const user = userEvent.setup()
    renderWithTheme('light')

    const button = screen.getByRole('button', { name: /thème/i })
    await user.click(button)

    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('has minimum 48x48px touch target', () => {
    renderWithTheme()

    const button = screen.getByRole('button', { name: /thème/i })
    expect(button.className).toMatch(/min-w-\[48px\]|w-12|h-12/)
  })
})
