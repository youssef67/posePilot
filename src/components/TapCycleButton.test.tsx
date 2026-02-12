import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TapCycleButton } from './TapCycleButton'

describe('TapCycleButton', () => {
  const onCycle = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // --- 3-state cycle (1.1) ---
  it('calls onCycle with in_progress when status is not_started', async () => {
    const user = userEvent.setup()
    render(<TapCycleButton status="not_started" onCycle={onCycle} />)
    await user.click(screen.getByRole('button'))
    expect(onCycle).toHaveBeenCalledWith('in_progress')
  })

  it('calls onCycle with done when status is in_progress', async () => {
    const user = userEvent.setup()
    render(<TapCycleButton status="in_progress" onCycle={onCycle} />)
    await user.click(screen.getByRole('button'))
    expect(onCycle).toHaveBeenCalledWith('done')
  })

  it('calls onCycle with not_started when status is done', async () => {
    const user = userEvent.setup()
    render(<TapCycleButton status="done" onCycle={onCycle} />)
    await user.click(screen.getByRole('button'))
    expect(onCycle).toHaveBeenCalledWith('not_started')
  })

  // --- Touch zone (1.2) ---
  it('has minimum 48px touch target', () => {
    render(<TapCycleButton status="not_started" onCycle={onCycle} />)
    const btn = screen.getByRole('button')
    expect(btn.className).toMatch(/min-h-12/)
    expect(btn.className).toMatch(/min-w-12/)
  })

  // --- Icons per status (1.3) ---
  it('renders Circle icon for not_started with theme token class', () => {
    render(<TapCycleButton status="not_started" onCycle={onCycle} />)
    const btn = screen.getByRole('button')
    const svg = btn.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveClass('text-tap-not-started')
  })

  it('renders Clock icon for in_progress with theme token class', () => {
    render(<TapCycleButton status="in_progress" onCycle={onCycle} />)
    const btn = screen.getByRole('button')
    const svg = btn.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveClass('text-tap-in-progress')
  })

  it('renders CheckCircle2 icon for done with theme token class', () => {
    render(<TapCycleButton status="done" onCycle={onCycle} />)
    const btn = screen.getByRole('button')
    const svg = btn.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveClass('text-tap-done')
  })

  // --- Animation (1.4) ---
  it('applies tap-cycle animation class on click', async () => {
    const user = userEvent.setup()
    render(<TapCycleButton status="not_started" onCycle={onCycle} />)
    await user.click(screen.getByRole('button'))
    expect(screen.getByRole('button').className).toMatch(/animate-tap-cycle/)
  })

  // --- Accessibility (1.7) ---
  it('has correct aria-label for not_started', () => {
    render(<TapCycleButton status="not_started" onCycle={onCycle} />)
    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      'Statut : pas commencé. Taper pour passer à en cours',
    )
  })

  it('has correct aria-label for in_progress', () => {
    render(<TapCycleButton status="in_progress" onCycle={onCycle} />)
    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      'Statut : en cours. Taper pour passer à fait',
    )
  })

  it('has correct aria-label for done', () => {
    render(<TapCycleButton status="done" onCycle={onCycle} />)
    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      'Statut : fait. Taper pour passer à pas commencé',
    )
  })

  // --- Keyboard support (1.7) ---
  it('triggers cycle on Enter key', () => {
    render(<TapCycleButton status="not_started" onCycle={onCycle} />)
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' })
    expect(onCycle).toHaveBeenCalledWith('in_progress')
  })

  it('triggers cycle on Space key', () => {
    render(<TapCycleButton status="not_started" onCycle={onCycle} />)
    fireEvent.keyDown(screen.getByRole('button'), { key: ' ' })
    expect(onCycle).toHaveBeenCalledWith('in_progress')
  })

  // --- Disabled state (1.8) ---
  it('does not call onCycle when disabled', async () => {
    const user = userEvent.setup()
    render(<TapCycleButton status="not_started" onCycle={onCycle} disabled />)
    await user.click(screen.getByRole('button'))
    expect(onCycle).not.toHaveBeenCalled()
  })

  it('sets aria-disabled when disabled', () => {
    render(<TapCycleButton status="not_started" onCycle={onCycle} disabled />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true')
  })

  // --- Haptic feedback (1.5) ---
  it('calls navigator.vibrate(10) on click when available', async () => {
    const vibrateMock = vi.fn()
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrateMock,
      writable: true,
      configurable: true,
    })
    const user = userEvent.setup()
    render(<TapCycleButton status="not_started" onCycle={onCycle} />)
    await user.click(screen.getByRole('button'))
    expect(vibrateMock).toHaveBeenCalledWith(10)
  })
})
