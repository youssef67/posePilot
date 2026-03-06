import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoCard } from './MemoCard'
import type { Memo } from '@/types/database'

const memo: Memo = {
  id: 'm1',
  chantier_id: 'ch-1',
  plot_id: null,
  etage_id: null,
  content: 'Clé chez la gardienne bât. B',
  created_by_email: 'youssef@example.com',
  photo_url: null,
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

  it('displays photo thumbnail when photo_url is present', () => {
    const memoWithPhoto: Memo = { ...memo, photo_url: 'https://example.com/photo.jpg' }
    render(<MemoCard memo={memoWithPhoto} onEdit={vi.fn()} onDelete={vi.fn()} />)
    const img = screen.getByAltText('Photo du mémo') as HTMLImageElement
    expect(img).toBeInTheDocument()
    expect(img.src).toBe('https://example.com/photo.jpg')
    expect(img.className).toContain('h-20')
  })

  it('does not display photo when photo_url is null', () => {
    render(<MemoCard memo={memo} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.queryByAltText('Photo du mémo')).not.toBeInTheDocument()
  })
})
