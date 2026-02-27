import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoCard } from './MemoCard'
import type { ChantierMemo } from '@/types/database'

const memo: ChantierMemo = {
  id: 'm1',
  chantier_id: 'ch-1',
  content: 'Clé chez la gardienne bât. B',
  created_by_email: 'youssef@example.com',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

describe('MemoCard', () => {
  it('renders memo content and author', () => {
    render(<MemoCard memo={memo} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Clé chez la gardienne bât. B')).toBeInTheDocument()
    expect(screen.getByText('youssef')).toBeInTheDocument()
  })

  it('has blue left border', () => {
    const { container } = render(<MemoCard memo={memo} onEdit={vi.fn()} onDelete={vi.fn()} />)
    const card = container.firstChild as HTMLElement
    expect(card.className).toContain('border-l-[#3B82F6]')
  })

  it('calls onEdit when "Modifier" is clicked', async () => {
    const onEdit = vi.fn()
    render(<MemoCard memo={memo} onEdit={onEdit} onDelete={vi.fn()} />)
    await userEvent.click(screen.getByLabelText('Options du mémo'))
    await userEvent.click(screen.getByText('Modifier'))
    expect(onEdit).toHaveBeenCalledWith(memo)
  })

  it('calls onDelete when "Supprimer" is clicked', async () => {
    const onDelete = vi.fn()
    render(<MemoCard memo={memo} onEdit={vi.fn()} onDelete={onDelete} />)
    await userEvent.click(screen.getByLabelText('Options du mémo'))
    await userEvent.click(screen.getByText('Supprimer'))
    expect(onDelete).toHaveBeenCalledWith(memo)
  })
})
