import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PaginationDots } from './PaginationDots'

describe('PaginationDots', () => {
  it('renders correct number of dots', () => {
    render(<PaginationDots total={3} current={0} />)
    const dots = screen.getByRole('status').children
    expect(dots).toHaveLength(3)
  })

  it('applies active style to current dot', () => {
    render(<PaginationDots total={3} current={1} />)
    const dots = screen.getByRole('status').children
    expect(dots[1]).toHaveClass('bg-foreground')
    expect(dots[0]).toHaveClass('bg-muted-foreground/40')
    expect(dots[2]).toHaveClass('bg-muted-foreground/40')
  })

  it('has correct aria-label', () => {
    render(<PaginationDots total={5} current={2} />)
    expect(screen.getByRole('status')).toHaveAttribute(
      'aria-label',
      'Pièce 3 sur 5',
    )
  })

  it('renders first dot as active when current is 0', () => {
    render(<PaginationDots total={4} current={0} />)
    const dots = screen.getByRole('status').children
    expect(dots[0]).toHaveClass('bg-foreground')
    expect(dots[1]).toHaveClass('bg-muted-foreground/40')
  })

  it('renders nothing when total is 0', () => {
    const { container } = render(<PaginationDots total={0} current={0} />)
    expect(container.innerHTML).toBe('')
  })

  it('clamps negative current to 0', () => {
    render(<PaginationDots total={3} current={-1} />)
    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-label', 'Pièce 1 sur 3')
    expect(status.children[0]).toHaveClass('bg-foreground')
  })
})
