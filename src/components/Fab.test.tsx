import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Camera, MessageSquare } from 'lucide-react'
import { Fab, type FabMenuItem } from './Fab'

describe('Fab — single action mode', () => {
  it('renders a button with "Ajouter" label', () => {
    render(<Fab onClick={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Ajouter' })).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<Fab onClick={handleClick} />)
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('renders default Plus icon', () => {
    render(<Fab onClick={vi.fn()} />)
    const button = screen.getByRole('button', { name: 'Ajouter' })
    expect(button.querySelector('svg')).toBeInTheDocument()
  })

  it('renders custom icon when provided', () => {
    render(<Fab onClick={vi.fn()} icon={<span data-testid="custom-icon">X</span>} />)
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<Fab onClick={vi.fn()} className="bottom-32" />)
    // className is on the wrapper div
    const wrapper = container.querySelector('.bottom-32')
    expect(wrapper).toBeInTheDocument()
  })

  it('has fixed positioning and proper size for touch target', () => {
    render(<Fab onClick={vi.fn()} />)
    const button = screen.getByRole('button', { name: 'Ajouter' })
    expect(button.className).toContain('h-14')
    expect(button.className).toContain('w-14')
  })
})

describe('Fab — menu mode', () => {
  const menuItems: FabMenuItem[] = [
    { icon: MessageSquare, label: 'Note', onClick: vi.fn() },
    { icon: Camera, label: 'Photo', onClick: vi.fn() },
  ]

  function renderFabMenu() {
    const items = menuItems.map((item) => ({ ...item, onClick: vi.fn() }))
    const utils = render(<Fab menuItems={items} />)
    return { ...utils, items }
  }

  it('shows menu items when FAB is clicked', async () => {
    const user = userEvent.setup()
    const { items } = renderFabMenu()

    // Menu items not visible initially
    expect(screen.queryByText('Note')).not.toBeInTheDocument()
    expect(screen.queryByText('Photo')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Ajouter' }))

    // Menu items visible
    expect(screen.getByText('Note')).toBeInTheDocument()
    expect(screen.getByText('Photo')).toBeInTheDocument()

    // FAB label changes to "Fermer le menu"
    expect(screen.getByRole('button', { name: 'Fermer le menu' })).toBeInTheDocument()

    // Overlay visible
    expect(screen.getByTestId('fab-overlay')).toBeInTheDocument()

    // Items are not called yet
    expect(items[0].onClick).not.toHaveBeenCalled()
    expect(items[1].onClick).not.toHaveBeenCalled()
  })

  it('calls item onClick and closes menu when item clicked', async () => {
    const user = userEvent.setup()
    const { items } = renderFabMenu()

    await user.click(screen.getByRole('button', { name: 'Ajouter' }))
    await user.click(screen.getByText('Note'))

    expect(items[0].onClick).toHaveBeenCalledOnce()
    // Menu should close
    expect(screen.queryByText('Note')).not.toBeInTheDocument()
  })

  it('closes menu when overlay is clicked', async () => {
    const user = userEvent.setup()
    renderFabMenu()

    await user.click(screen.getByRole('button', { name: 'Ajouter' }))
    expect(screen.getByText('Note')).toBeInTheDocument()

    await user.click(screen.getByTestId('fab-overlay'))
    expect(screen.queryByText('Note')).not.toBeInTheDocument()
  })

  it('closes menu when X icon (FAB) is clicked', async () => {
    const user = userEvent.setup()
    renderFabMenu()

    await user.click(screen.getByRole('button', { name: 'Ajouter' }))
    expect(screen.getByText('Note')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Fermer le menu' }))
    expect(screen.queryByText('Note')).not.toBeInTheDocument()
  })

  it('does not call single onClick when menuItems is provided', async () => {
    const user = userEvent.setup()
    const singleClick = vi.fn()
    render(<Fab onClick={singleClick} menuItems={menuItems} />)

    await user.click(screen.getByRole('button', { name: 'Ajouter' }))
    expect(singleClick).not.toHaveBeenCalled()
  })
})
