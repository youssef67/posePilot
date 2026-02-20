import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChantierLivraisonCard, ChantierLivraisonCardSkeleton } from './ChantierLivraisonCard'

describe('ChantierLivraisonCard', () => {
  const defaultProps = {
    chantierNom: 'Résidence Les Oliviers',
    compteurs: { a_traiter: 2, en_cours: 3, termine: 1, total: 6 },
    onClick: vi.fn(),
  }

  it('renders chantier name', () => {
    render(<ChantierLivraisonCard {...defaultProps} />)
    expect(screen.getByText('Résidence Les Oliviers')).toBeInTheDocument()
  })

  it('renders total count', () => {
    render(<ChantierLivraisonCard {...defaultProps} />)
    expect(screen.getByText('6')).toBeInTheDocument()
  })

  it('renders compteurs with correct labels', () => {
    render(<ChantierLivraisonCard {...defaultProps} />)
    expect(screen.getByText('2 à traiter')).toBeInTheDocument()
    expect(screen.getByText('3 en cours')).toBeInTheDocument()
    expect(screen.getByText('1 terminé')).toBeInTheDocument()
  })

  it('uses plural "terminés" when count > 1', () => {
    render(
      <ChantierLivraisonCard
        {...defaultProps}
        compteurs={{ a_traiter: 0, en_cours: 0, termine: 5, total: 5 }}
      />,
    )
    expect(screen.getByText('5 terminés')).toBeInTheDocument()
  })

  it('calls onClick when card is clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<ChantierLivraisonCard {...defaultProps} onClick={onClick} />)

    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('hides zero compteurs', () => {
    render(
      <ChantierLivraisonCard
        {...defaultProps}
        compteurs={{ a_traiter: 0, en_cours: 3, termine: 0, total: 3 }}
      />,
    )
    expect(screen.queryByText(/à traiter/)).not.toBeInTheDocument()
    expect(screen.getByText('3 en cours')).toBeInTheDocument()
    expect(screen.queryByText(/terminé/)).not.toBeInTheDocument()
  })

  it('applies correct colors to compteur badges', () => {
    render(<ChantierLivraisonCard {...defaultProps} />)
    const aTraiter = screen.getByText('2 à traiter')
    const enCours = screen.getByText('3 en cours')
    const termine = screen.getByText('1 terminé')
    // Check that inline styles with the correct colors are applied
    expect(aTraiter).toHaveStyle({ color: '#F59E0B' })
    expect(enCours).toHaveStyle({ color: '#3B82F6' })
    expect(termine).toHaveStyle({ color: '#10B981' })
  })
})

describe('ChantierLivraisonCardSkeleton', () => {
  it('renders with animate-pulse', () => {
    const { container } = render(<ChantierLivraisonCardSkeleton />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })
})
