import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import type { LotPhoto } from '@/types/database'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    storage: { from: vi.fn() },
  },
}))

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}))

vi.mock('@/lib/utils/sharePhoto', () => ({
  sharePhoto: vi.fn().mockResolvedValue('shared'),
}))

import { LotPhotoGallery } from './LotPhotoGallery'

const mockPhotos: LotPhoto[] = [
  {
    id: 'photo-1',
    lot_id: 'lot-1',
    photo_url: 'https://storage.example.com/photo1.jpg',
    created_by: 'user-1',
    created_at: '2026-02-19T10:00:00Z',
  },
  {
    id: 'photo-2',
    lot_id: 'lot-1',
    photo_url: 'https://storage.example.com/photo2.jpg',
    created_by: 'user-1',
    created_at: '2026-02-19T09:00:00Z',
  },
]

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children)
}

describe('LotPhotoGallery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders empty state when no photos', () => {
    render(<LotPhotoGallery photos={[]} lotId="lot-1" />, { wrapper: createWrapper() })
    expect(screen.getByText('Aucune photo')).toBeInTheDocument()
  })

  it('renders photo thumbnails', () => {
    render(<LotPhotoGallery photos={mockPhotos} lotId="lot-1" />, { wrapper: createWrapper() })
    const thumbnails = screen.getAllByTestId('photo-thumbnail')
    expect(thumbnails).toHaveLength(2)
  })

  it('shows upload indicator when isUploading', () => {
    render(
      <LotPhotoGallery photos={mockPhotos} lotId="lot-1" isUploading uploadProgress={45} />,
      { wrapper: createWrapper() },
    )
    expect(screen.getByTestId('upload-indicator')).toBeInTheDocument()
    expect(screen.getByText('45%')).toBeInTheDocument()
  })

  it('does not show empty state when uploading with no photos', () => {
    render(
      <LotPhotoGallery photos={[]} lotId="lot-1" isUploading />,
      { wrapper: createWrapper() },
    )
    expect(screen.queryByText('Aucune photo')).not.toBeInTheDocument()
    expect(screen.getByTestId('upload-indicator')).toBeInTheDocument()
  })

  it('shows delete confirmation dialog when remove button clicked', async () => {
    const user = userEvent.setup()
    render(<LotPhotoGallery photos={mockPhotos} lotId="lot-1" />, { wrapper: createWrapper() })

    // Load the first image, then click remove
    const thumbnails = screen.getAllByTestId('photo-thumbnail')
    fireEvent.load(thumbnails[0])

    const removeButtons = screen.getAllByRole('button', { name: 'Supprimer la photo' })
    await user.click(removeButtons[0])

    expect(screen.getByText('Supprimer cette photo ?')).toBeInTheDocument()
    expect(screen.getByText('Cette photo sera supprimée définitivement.')).toBeInTheDocument()
  })

  it('renders each photo with a remove button', () => {
    render(<LotPhotoGallery photos={mockPhotos} lotId="lot-1" />, { wrapper: createWrapper() })

    // Load all images
    const thumbnails = screen.getAllByTestId('photo-thumbnail')
    thumbnails.forEach((t) => fireEvent.load(t))

    const removeButtons = screen.getAllByRole('button', { name: 'Supprimer la photo' })
    expect(removeButtons).toHaveLength(2)
  })
})
