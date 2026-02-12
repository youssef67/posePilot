import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import type { LotDocument } from '@/types/database'

// Mock mutations and utils
const mockUploadMutate = vi.fn()
const mockReplaceMutate = vi.fn()
const mockToggleRequiredMutate = vi.fn()
const mockGetDocumentSignedUrl = vi.fn()
const mockDownloadDocument = vi.fn()

let mockUploadIsPending = false
let mockReplaceIsPending = false

vi.mock('@/lib/mutations/useUploadLotDocument', () => ({
  useUploadLotDocument: () => ({ mutate: mockUploadMutate, isPending: mockUploadIsPending }),
}))
vi.mock('@/lib/mutations/useReplaceLotDocument', () => ({
  useReplaceLotDocument: () => ({ mutate: mockReplaceMutate, isPending: mockReplaceIsPending }),
}))
vi.mock('@/lib/mutations/useToggleLotDocumentRequired', () => ({
  useToggleLotDocumentRequired: () => ({ mutate: mockToggleRequiredMutate, isPending: false }),
}))
vi.mock('@/lib/utils/documentStorage', () => ({
  getDocumentSignedUrl: (...args: unknown[]) => mockGetDocumentSignedUrl(...args),
  downloadDocument: (...args: unknown[]) => mockDownloadDocument(...args),
}))
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { DocumentSlot } from './DocumentSlot'

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children)
}

const emptyDoc: LotDocument = {
  id: 'doc-1',
  lot_id: 'lot-1',
  nom: 'Plan de pose',
  is_required: true,
  file_url: null,
  file_name: null,
  created_at: '2026-01-01T00:00:00Z',
}

const filledDoc: LotDocument = {
  id: 'doc-2',
  lot_id: 'lot-1',
  nom: 'Fiche de choix',
  is_required: false,
  file_url: 'user-1/lot-1/doc-2_123.pdf',
  file_name: 'fiche-choix.pdf',
  created_at: '2026-01-01T00:00:00Z',
}

describe('DocumentSlot', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUploadIsPending = false
    mockReplaceIsPending = false
  })

  it('renders empty slot with document name, "Aucun fichier", and Obligatoire badge', () => {
    render(<DocumentSlot document={emptyDoc} lotId="lot-1" />, { wrapper: createWrapper() })

    expect(screen.getByText('Plan de pose')).toBeInTheDocument()
    expect(screen.getByText('Aucun fichier')).toBeInTheDocument()
    expect(screen.getByText('Obligatoire')).toBeInTheDocument()
  })

  it('renders filled slot with file name and Optionnel badge', () => {
    render(<DocumentSlot document={filledDoc} lotId="lot-1" />, { wrapper: createWrapper() })

    expect(screen.getByText('Fiche de choix')).toBeInTheDocument()
    expect(screen.getByText('fiche-choix.pdf')).toBeInTheDocument()
    expect(screen.getByText('Optionnel')).toBeInTheDocument()
  })

  it('triggers file input on empty slot click', async () => {
    const user = userEvent.setup()
    render(<DocumentSlot document={emptyDoc} lotId="lot-1" />, { wrapper: createWrapper() })

    const slotButton = screen.getByText('Aucun fichier').closest('button')!
    const fileInput = document.querySelector(`[data-testid="file-input-${emptyDoc.id}"]`) as HTMLInputElement

    const clickSpy = vi.spyOn(fileInput, 'click')
    await user.click(slotButton)
    expect(clickSpy).toHaveBeenCalled()
  })

  it('calls useUploadLotDocument on file select for empty slot', async () => {
    render(<DocumentSlot document={emptyDoc} lotId="lot-1" />, { wrapper: createWrapper() })

    const fileInput = document.querySelector(`[data-testid="file-input-${emptyDoc.id}"]`) as HTMLInputElement
    const pdfFile = new File(['pdf'], 'plan.pdf', { type: 'application/pdf' })

    await userEvent.upload(fileInput, pdfFile)

    expect(mockUploadMutate).toHaveBeenCalledWith(
      expect.objectContaining({ file: pdfFile, documentId: 'doc-1', lotId: 'lot-1' }),
    )
  })

  it('opens PDF via signed URL on filled slot click (Safari-safe)', async () => {
    const user = userEvent.setup()
    mockGetDocumentSignedUrl.mockResolvedValue('https://signed.url/doc.pdf')
    const mockNewTab = { location: { href: '' }, close: vi.fn() }
    const mockWindowOpen = vi.spyOn(window, 'open').mockImplementation(() => mockNewTab as unknown as Window)

    render(<DocumentSlot document={filledDoc} lotId="lot-1" />, { wrapper: createWrapper() })

    const slotButton = screen.getByText('fiche-choix.pdf').closest('button')!
    await user.click(slotButton)

    // Window opened synchronously with about:blank to avoid Safari popup blocker
    expect(mockWindowOpen).toHaveBeenCalledWith('about:blank', '_blank')
    expect(mockGetDocumentSignedUrl).toHaveBeenCalledWith('user-1/lot-1/doc-2_123.pdf')
    await vi.waitFor(() => {
      expect(mockNewTab.location.href).toBe('https://signed.url/doc.pdf')
    })
    mockWindowOpen.mockRestore()
  })

  it('shows dropdown menu with 3 actions for filled slot', async () => {
    const user = userEvent.setup()
    render(<DocumentSlot document={filledDoc} lotId="lot-1" />, { wrapper: createWrapper() })

    const menuButton = screen.getByRole('button', { name: 'Actions document' })
    await user.click(menuButton)

    expect(screen.getByText('Ouvrir')).toBeInTheDocument()
    expect(screen.getByText('Remplacer')).toBeInTheDocument()
    expect(screen.getByText('Télécharger')).toBeInTheDocument()
  })

  it('does not show dropdown menu for empty slot', () => {
    render(<DocumentSlot document={emptyDoc} lotId="lot-1" />, { wrapper: createWrapper() })

    expect(screen.queryByRole('button', { name: 'Actions document' })).not.toBeInTheDocument()
  })

  it('calls downloadDocument when Télécharger is clicked', async () => {
    const user = userEvent.setup()
    mockDownloadDocument.mockResolvedValue(undefined)

    render(<DocumentSlot document={filledDoc} lotId="lot-1" />, { wrapper: createWrapper() })

    const menuButton = screen.getByRole('button', { name: 'Actions document' })
    await user.click(menuButton)

    const downloadItem = screen.getByText('Télécharger')
    await user.click(downloadItem)

    expect(mockDownloadDocument).toHaveBeenCalledWith('user-1/lot-1/doc-2_123.pdf', 'fiche-choix.pdf')
  })

  it('does not show progress bar when idle', () => {
    render(<DocumentSlot document={emptyDoc} lotId="lot-1" />, { wrapper: createWrapper() })
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('shows indeterminate progress bar when upload is pending', () => {
    mockUploadIsPending = true
    render(<DocumentSlot document={emptyDoc} lotId="lot-1" />, { wrapper: createWrapper() })
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('calls toggle mutation with inverted value when badge is tapped', async () => {
    const user = userEvent.setup()
    render(<DocumentSlot document={emptyDoc} lotId="lot-1" />, { wrapper: createWrapper() })

    const badge = screen.getByText('Obligatoire')
    const badgeButton = badge.closest('button')!
    await user.click(badgeButton)

    expect(mockToggleRequiredMutate).toHaveBeenCalledWith({
      docId: 'doc-1',
      isRequired: false,
      lotId: 'lot-1',
    })
  })

  it('shows correct badge text for optional document', () => {
    render(<DocumentSlot document={filledDoc} lotId="lot-1" />, { wrapper: createWrapper() })

    const badge = screen.getByText('Optionnel')
    const badgeButton = badge.closest('button')!
    expect(badgeButton).toBeInTheDocument()
    expect(badgeButton).toHaveAttribute('aria-pressed', 'false')
    expect(badgeButton).toHaveAttribute('aria-label', 'Basculer obligatoire')
  })

  it('has aria-pressed=true for required document', () => {
    render(<DocumentSlot document={emptyDoc} lotId="lot-1" />, { wrapper: createWrapper() })

    const badgeButton = screen.getByRole('button', { name: 'Basculer obligatoire' })
    expect(badgeButton).toHaveAttribute('aria-pressed', 'true')
  })

  it('badge click does not trigger parent slot action (stopPropagation)', async () => {
    const user = userEvent.setup()
    render(<DocumentSlot document={emptyDoc} lotId="lot-1" />, { wrapper: createWrapper() })

    const fileInput = document.querySelector(`[data-testid="file-input-${emptyDoc.id}"]`) as HTMLInputElement
    const clickSpy = vi.spyOn(fileInput, 'click')

    const badge = screen.getByText('Obligatoire')
    const badgeButton = badge.closest('button')!
    await user.click(badgeButton)

    // Badge click should NOT trigger file input (parent action)
    expect(clickSpy).not.toHaveBeenCalled()
    // But toggle should have been called
    expect(mockToggleRequiredMutate).toHaveBeenCalled()
  })
})
