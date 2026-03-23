import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MateriauxSheet } from './MateriauxSheet'

describe('MateriauxSheet', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    lotCode: '2A51',
    currentStatut: 'non_recu' as const,
    currentNote: null,
    onSubmit: vi.fn(),
  }

  it('renders title with lot code', () => {
    render(<MateriauxSheet {...defaultProps} />)
    expect(screen.getByText('Matériaux — Lot 2A51')).toBeInTheDocument()
  })

  it('renders 3 status options', () => {
    render(<MateriauxSheet {...defaultProps} />)
    expect(screen.getByText('Non reçu')).toBeInTheDocument()
    expect(screen.getByText('Partiel')).toBeInTheDocument()
    expect(screen.getByText('Reçu')).toBeInTheDocument()
  })

  it('pre-selects the current status', () => {
    render(<MateriauxSheet {...defaultProps} currentStatut="partiel" />)
    const partielBtn = screen.getByTestId('statut-partiel')
    expect(partielBtn.className).toContain('border-primary')
  })

  it('pre-fills the note', () => {
    render(<MateriauxSheet {...defaultProps} currentNote="Manque colle" />)
    const textarea = screen.getByTestId('materiaux-note') as HTMLTextAreaElement
    expect(textarea.value).toBe('Manque colle')
  })

  it('calls onSubmit with selected status and note on validate', () => {
    const onSubmit = vi.fn()
    render(<MateriauxSheet {...defaultProps} onSubmit={onSubmit} />)

    fireEvent.click(screen.getByTestId('statut-partiel'))
    fireEvent.change(screen.getByTestId('materiaux-note'), { target: { value: 'Manque joint' } })
    fireEvent.click(screen.getByTestId('materiaux-submit'))

    expect(onSubmit).toHaveBeenCalledWith('partiel', 'Manque joint')
  })

  it('submits null note when note is empty', () => {
    const onSubmit = vi.fn()
    render(<MateriauxSheet {...defaultProps} onSubmit={onSubmit} />)

    fireEvent.click(screen.getByTestId('statut-recu'))
    fireEvent.click(screen.getByTestId('materiaux-submit'))

    expect(onSubmit).toHaveBeenCalledWith('recu', null)
  })

  it('closes sheet on validate', () => {
    const onOpenChange = vi.fn()
    render(<MateriauxSheet {...defaultProps} onOpenChange={onOpenChange} />)

    fireEvent.click(screen.getByTestId('materiaux-submit'))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
