import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoCard } from './MemoCard'
import type { MemoWithPhotos } from '@/lib/queries/useMemos'

const memo: MemoWithPhotos = {
  id: 'm1',
  chantier_id: 'ch-1',
  plot_id: null,
  etage_id: null,
  content: 'Clé chez la gardienne bât. B',
  created_by_email: 'youssef@example.com',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  memo_photos: [],
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

  it('displays multiple photo thumbnails (AC #6)', () => {
    const memoWithPhotos: MemoWithPhotos = {
      ...memo,
      memo_photos: [
        { id: 'ph-1', memo_id: 'm1', photo_url: 'https://example.com/a.jpg', position: 0, created_at: '' },
        { id: 'ph-2', memo_id: 'm1', photo_url: 'https://example.com/b.jpg', position: 1, created_at: '' },
      ],
    }
    render(<MemoCard memo={memoWithPhotos} onEdit={vi.fn()} onDelete={vi.fn()} />)
    const imgs = screen.getAllByAltText('Photo du mémo')
    expect(imgs).toHaveLength(2)
    expect((imgs[0] as HTMLImageElement).src).toBe('https://example.com/a.jpg')
    expect((imgs[1] as HTMLImageElement).src).toBe('https://example.com/b.jpg')
  })

  it('does not display photos when memo_photos is empty', () => {
    render(<MemoCard memo={memo} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.queryByAltText('Photo du mémo')).not.toBeInTheDocument()
  })
})
