import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BesoinLineForm, type BesoinLineValue } from './BesoinLineForm'

const chantiers = [
  { id: 'ch1', nom: 'Chantier Alpha' },
  { id: 'ch2', nom: 'Chantier Beta' },
]

const defaultValue: BesoinLineValue = {
  description: '',
  quantite: 1,
  chantierId: '',
}

describe('BesoinLineForm', () => {
  it('renders description and quantity inputs', () => {
    render(
      <BesoinLineForm
        value={defaultValue}
        onChange={vi.fn()}
        showChantierSelect={false}
        chantiers={chantiers}
        index={0}
      />,
    )
    expect(screen.getByLabelText('Description ligne 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Quantité ligne 1')).toBeInTheDocument()
  })

  it('calls onChange when description changes', async () => {
    const onChange = vi.fn()
    render(
      <BesoinLineForm
        value={defaultValue}
        onChange={onChange}
        showChantierSelect={false}
        chantiers={chantiers}
        index={0}
      />,
    )
    const input = screen.getByLabelText('Description ligne 1')
    await userEvent.type(input, 'Colle')
    expect(onChange).toHaveBeenCalled()
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(lastCall.description).toBe('e')
  })

  it('calls onChange when quantity changes', async () => {
    const onChange = vi.fn()
    render(
      <BesoinLineForm
        value={{ ...defaultValue, quantite: 1 }}
        onChange={onChange}
        showChantierSelect={false}
        chantiers={chantiers}
        index={0}
      />,
    )
    const input = screen.getByLabelText('Quantité ligne 1')
    await userEvent.clear(input)
    await userEvent.type(input, '5')
    expect(onChange).toHaveBeenCalled()
  })

  it('shows chantier select when showChantierSelect is true', () => {
    render(
      <BesoinLineForm
        value={defaultValue}
        onChange={vi.fn()}
        showChantierSelect={true}
        chantiers={chantiers}
        index={0}
      />,
    )
    expect(screen.getByLabelText('Chantier ligne 1')).toBeInTheDocument()
  })

  it('hides chantier select when showChantierSelect is false', () => {
    render(
      <BesoinLineForm
        value={defaultValue}
        onChange={vi.fn()}
        showChantierSelect={false}
        chantiers={chantiers}
        index={0}
      />,
    )
    expect(screen.queryByLabelText('Chantier ligne 1')).not.toBeInTheDocument()
  })

  it('shows remove button when onRemove is provided', () => {
    const onRemove = vi.fn()
    render(
      <BesoinLineForm
        value={defaultValue}
        onChange={vi.fn()}
        onRemove={onRemove}
        showChantierSelect={false}
        chantiers={chantiers}
        index={0}
      />,
    )
    expect(screen.getByLabelText('Supprimer ligne 1')).toBeInTheDocument()
  })

  it('does not show remove button when onRemove is not provided', () => {
    render(
      <BesoinLineForm
        value={defaultValue}
        onChange={vi.fn()}
        showChantierSelect={false}
        chantiers={chantiers}
        index={0}
      />,
    )
    expect(screen.queryByLabelText('Supprimer ligne 1')).not.toBeInTheDocument()
  })

  it('calls onRemove when delete button is clicked', async () => {
    const onRemove = vi.fn()
    render(
      <BesoinLineForm
        value={defaultValue}
        onChange={vi.fn()}
        onRemove={onRemove}
        showChantierSelect={false}
        chantiers={chantiers}
        index={0}
      />,
    )
    await userEvent.click(screen.getByLabelText('Supprimer ligne 1'))
    expect(onRemove).toHaveBeenCalledOnce()
  })
})
