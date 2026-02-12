import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { PhotoCapture, type PhotoCaptureHandle } from './PhotoCapture'

describe('PhotoCapture', () => {
  it('renders a hidden file input with capture="environment"', () => {
    render(<PhotoCapture onPhotoSelected={vi.fn()} />)
    const input = screen.getByTestId('photo-capture-input') as HTMLInputElement
    expect(input).toBeInTheDocument()
    expect(input.type).toBe('file')
    expect(input.accept).toBe('image/*')
    expect(input.getAttribute('capture')).toBe('environment')
    expect(input.className).toContain('hidden')
  })

  it('calls onPhotoSelected when a valid image is selected', async () => {
    const user = userEvent.setup()
    const onPhotoSelected = vi.fn()
    render(<PhotoCapture onPhotoSelected={onPhotoSelected} />)

    const input = screen.getByTestId('photo-capture-input')
    const file = new File(['photo-content'], 'photo.jpg', { type: 'image/jpeg' })

    await user.upload(input, file)

    expect(onPhotoSelected).toHaveBeenCalledWith(file)
  })

  it('does NOT call onPhotoSelected for non-image files', async () => {
    const user = userEvent.setup()
    const onPhotoSelected = vi.fn()
    render(<PhotoCapture onPhotoSelected={onPhotoSelected} />)

    const input = screen.getByTestId('photo-capture-input')
    const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' })

    await user.upload(input, file)

    expect(onPhotoSelected).not.toHaveBeenCalled()
  })

  it('trigger() opens the file picker (clicks the input)', () => {
    const ref = createRef<PhotoCaptureHandle>()
    render(<PhotoCapture ref={ref} onPhotoSelected={vi.fn()} />)

    const input = screen.getByTestId('photo-capture-input') as HTMLInputElement
    const clickSpy = vi.spyOn(input, 'click')

    ref.current!.trigger()

    expect(clickSpy).toHaveBeenCalledOnce()
  })

  it('disables the input when disabled prop is true', () => {
    render(<PhotoCapture onPhotoSelected={vi.fn()} disabled />)
    const input = screen.getByTestId('photo-capture-input') as HTMLInputElement
    expect(input.disabled).toBe(true)
  })
})
