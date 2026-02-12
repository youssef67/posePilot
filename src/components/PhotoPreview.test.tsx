import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PhotoPreview } from './PhotoPreview'

describe('PhotoPreview', () => {
  const url = 'https://storage.example.com/note-photos/photo.jpg'

  it('renders thumbnail image with correct src and alt', () => {
    render(<PhotoPreview url={url} alt="Fissure" />)
    const img = screen.getByTestId('photo-thumbnail') as HTMLImageElement
    expect(img.src).toBe(url)
    expect(img.alt).toBe('Fissure')
  })

  it('shows skeleton before image loads', () => {
    render(<PhotoPreview url={url} />)
    expect(screen.getByTestId('photo-skeleton')).toBeInTheDocument()
  })

  it('hides skeleton after image loads', () => {
    render(<PhotoPreview url={url} />)
    const img = screen.getByTestId('photo-thumbnail')
    fireEvent.load(img)
    expect(screen.queryByTestId('photo-skeleton')).not.toBeInTheDocument()
  })

  it('has lazy loading attribute', () => {
    render(<PhotoPreview url={url} />)
    const img = screen.getByTestId('photo-thumbnail')
    expect(img.getAttribute('loading')).toBe('lazy')
  })

  it('opens fullscreen dialog when thumbnail is clicked', async () => {
    const user = userEvent.setup()
    render(<PhotoPreview url={url} />)

    // Simulate load first so image is visible
    fireEvent.load(screen.getByTestId('photo-thumbnail'))

    await user.click(screen.getByTestId('photo-thumbnail'))

    // Dialog should show the fullscreen image
    const images = screen.getAllByRole('img')
    const fullscreenImg = images.find((img) => img.className.includes('object-contain'))
    expect(fullscreenImg).toBeInTheDocument()
  })

  it('shows remove button when showRemove is true and image is loaded', () => {
    render(<PhotoPreview url={url} showRemove onRemove={vi.fn()} />)
    fireEvent.load(screen.getByTestId('photo-thumbnail'))
    expect(screen.getByRole('button', { name: 'Supprimer la photo' })).toBeInTheDocument()
  })

  it('does NOT show remove button when showRemove is false', () => {
    render(<PhotoPreview url={url} />)
    fireEvent.load(screen.getByTestId('photo-thumbnail'))
    expect(screen.queryByRole('button', { name: 'Supprimer la photo' })).not.toBeInTheDocument()
  })

  it('calls onRemove when remove button is clicked', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    render(<PhotoPreview url={url} showRemove onRemove={onRemove} />)
    fireEvent.load(screen.getByTestId('photo-thumbnail'))

    await user.click(screen.getByRole('button', { name: 'Supprimer la photo' }))
    expect(onRemove).toHaveBeenCalledOnce()
  })

  it('uses default alt text when not provided', () => {
    render(<PhotoPreview url={url} />)
    const img = screen.getByTestId('photo-thumbnail') as HTMLImageElement
    expect(img.alt).toBe('Photo')
  })

  it('shows share button in fullscreen when onShare is provided', async () => {
    const user = userEvent.setup()
    const onShare = vi.fn()
    render(<PhotoPreview url={url} onShare={onShare} />)

    fireEvent.load(screen.getByTestId('photo-thumbnail'))
    await user.click(screen.getByTestId('photo-thumbnail'))

    expect(screen.getByRole('button', { name: 'Partager la photo' })).toBeInTheDocument()
  })

  it('does NOT show share button in fullscreen when onShare is not provided', async () => {
    const user = userEvent.setup()
    render(<PhotoPreview url={url} />)

    fireEvent.load(screen.getByTestId('photo-thumbnail'))
    await user.click(screen.getByTestId('photo-thumbnail'))

    expect(screen.queryByRole('button', { name: 'Partager la photo' })).not.toBeInTheDocument()
  })

  it('calls onShare when share button in fullscreen is clicked', async () => {
    const user = userEvent.setup()
    const onShare = vi.fn()
    render(<PhotoPreview url={url} onShare={onShare} />)

    fireEvent.load(screen.getByTestId('photo-thumbnail'))
    await user.click(screen.getByTestId('photo-thumbnail'))
    await user.click(screen.getByRole('button', { name: 'Partager la photo' }))

    expect(onShare).toHaveBeenCalledOnce()
  })
})
