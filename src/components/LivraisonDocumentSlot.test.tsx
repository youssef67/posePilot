import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import type { Livraison } from '@/types/database'

const mockUploadMutate = vi.fn()
const mockReplaceMutate = vi.fn()
const mockGetDocumentSignedUrl = vi.fn()
const mockDownloadDocument = vi.fn()

let mockUploadIsPending = false
let mockReplaceIsPending = false

vi.mock('@/lib/mutations/useUploadLivraisonDocument', () => ({
  useUploadLivraisonDocument: () => ({ mutate: mockUploadMutate, isPending: mockUploadIsPending }),
}))
vi.mock('@/lib/mutations/useReplaceLivraisonDocument', () => ({
  useReplaceLivraisonDocument: () => ({ mutate: mockReplaceMutate, isPending: mockReplaceIsPending }),
}))
vi.mock('@/lib/utils/documentStorage', () => ({
  getDocumentSignedUrl: (...args: unknown[]) => mockGetDocumentSignedUrl(...args),
  downloadDocument: (...args: unknown[]) => mockDownloadDocument(...args),
}))
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { LivraisonDocumentSlot } from './LivraisonDocumentSlot'

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children)
}

const emptyLivraison: Livraison = {
  id: 'liv-1',
  chantier_id: 'ch-1',
  description: 'Colle pour faïence',
  status: 'commande',
  date_prevue: null,
  bc_file_url: null,
  bc_file_name: null,
  bl_file_url: null,
  bl_file_name: null,
  created_at: '2026-02-10T10:00:00Z',
  created_by: 'user-1',
}

const filledLivraison: Livraison = {
  ...emptyLivraison,
  bc_file_url: 'user-1/liv-1/bc_123.pdf',
  bc_file_name: 'facture-2026.pdf',
  bl_file_url: 'user-1/liv-1/bl_456.jpg',
  bl_file_name: 'bl-reception.jpg',
  status: 'livre',
}

describe('LivraisonDocumentSlot', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUploadIsPending = false
    mockReplaceIsPending = false
  })

  it('renders empty BC slot with label and "Ajouter un fichier"', () => {
    render(
      <LivraisonDocumentSlot type="bc" livraison={emptyLivraison} chantierId="ch-1" />,
      { wrapper: createWrapper() },
    )

    expect(screen.getByText('Bon de commande')).toBeInTheDocument()
    expect(screen.getByText('Ajouter un fichier')).toBeInTheDocument()
  })

  it('renders empty BL slot with correct label', () => {
    render(
      <LivraisonDocumentSlot type="bl" livraison={emptyLivraison} chantierId="ch-1" />,
      { wrapper: createWrapper() },
    )

    expect(screen.getByText('Bon de livraison')).toBeInTheDocument()
    expect(screen.getByText('Ajouter un fichier')).toBeInTheDocument()
  })

  it('renders filled BC slot with file name', () => {
    render(
      <LivraisonDocumentSlot type="bc" livraison={filledLivraison} chantierId="ch-1" />,
      { wrapper: createWrapper() },
    )

    expect(screen.getByText('Bon de commande')).toBeInTheDocument()
    expect(screen.getByText('facture-2026.pdf')).toBeInTheDocument()
  })

  it('renders filled BL slot with file name', () => {
    render(
      <LivraisonDocumentSlot type="bl" livraison={filledLivraison} chantierId="ch-1" />,
      { wrapper: createWrapper() },
    )

    expect(screen.getByText('Bon de livraison')).toBeInTheDocument()
    expect(screen.getByText('bl-reception.jpg')).toBeInTheDocument()
  })

  it('triggers file input on empty slot click', async () => {
    const user = userEvent.setup()
    render(
      <LivraisonDocumentSlot type="bc" livraison={emptyLivraison} chantierId="ch-1" />,
      { wrapper: createWrapper() },
    )

    const slotButton = screen.getByText('Ajouter un fichier').closest('button')!
    const fileInput = document.querySelector('[data-testid="file-input-bc-liv-1"]') as HTMLInputElement

    const clickSpy = vi.spyOn(fileInput, 'click')
    await user.click(slotButton)
    expect(clickSpy).toHaveBeenCalled()
  })

  it('does not trigger file input when disabled', async () => {
    const user = userEvent.setup()
    render(
      <LivraisonDocumentSlot type="bl" livraison={emptyLivraison} chantierId="ch-1" disabled />,
      { wrapper: createWrapper() },
    )

    const slotButton = screen.getByText('Ajouter un fichier').closest('button')!
    expect(slotButton).toBeDisabled()
    const fileInput = document.querySelector('[data-testid="file-input-bl-liv-1"]') as HTMLInputElement

    const clickSpy = vi.spyOn(fileInput, 'click')
    await user.click(slotButton)
    expect(clickSpy).not.toHaveBeenCalled()
  })

  it('calls useUploadLivraisonDocument on file select for empty slot', async () => {
    render(
      <LivraisonDocumentSlot type="bc" livraison={emptyLivraison} chantierId="ch-1" />,
      { wrapper: createWrapper() },
    )

    const fileInput = document.querySelector('[data-testid="file-input-bc-liv-1"]') as HTMLInputElement
    const pdfFile = new File(['pdf'], 'facture.pdf', { type: 'application/pdf' })

    await userEvent.upload(fileInput, pdfFile)

    expect(mockUploadMutate).toHaveBeenCalledWith(
      expect.objectContaining({ livraisonId: 'liv-1', chantierId: 'ch-1', file: pdfFile, documentType: 'bc' }),
    )
  })

  it('opens document via signed URL on filled slot click (Safari-safe)', async () => {
    const user = userEvent.setup()
    mockGetDocumentSignedUrl.mockResolvedValue('https://signed.url/doc.pdf')
    const mockNewTab = { location: { href: '' }, close: vi.fn() }
    const mockWindowOpen = vi.spyOn(window, 'open').mockImplementation(() => mockNewTab as unknown as Window)

    render(
      <LivraisonDocumentSlot type="bc" livraison={filledLivraison} chantierId="ch-1" />,
      { wrapper: createWrapper() },
    )

    const slotButton = screen.getByText('facture-2026.pdf').closest('button')!
    await user.click(slotButton)

    expect(mockWindowOpen).toHaveBeenCalledWith('about:blank', '_blank')
    expect(mockGetDocumentSignedUrl).toHaveBeenCalledWith('user-1/liv-1/bc_123.pdf')
    await vi.waitFor(() => {
      expect(mockNewTab.location.href).toBe('https://signed.url/doc.pdf')
    })
    mockWindowOpen.mockRestore()
  })

  it('shows dropdown menu with 3 actions for filled slot', async () => {
    const user = userEvent.setup()
    render(
      <LivraisonDocumentSlot type="bc" livraison={filledLivraison} chantierId="ch-1" />,
      { wrapper: createWrapper() },
    )

    const menuButton = screen.getByRole('button', { name: 'Actions document' })
    await user.click(menuButton)

    expect(screen.getByText('Ouvrir')).toBeInTheDocument()
    expect(screen.getByText('Télécharger')).toBeInTheDocument()
    expect(screen.getByText('Remplacer')).toBeInTheDocument()
  })

  it('does not show dropdown menu for empty slot', () => {
    render(
      <LivraisonDocumentSlot type="bc" livraison={emptyLivraison} chantierId="ch-1" />,
      { wrapper: createWrapper() },
    )

    expect(screen.queryByRole('button', { name: 'Actions document' })).not.toBeInTheDocument()
  })

  it('calls downloadDocument when Télécharger is clicked', async () => {
    const user = userEvent.setup()
    mockDownloadDocument.mockResolvedValue(undefined)

    render(
      <LivraisonDocumentSlot type="bc" livraison={filledLivraison} chantierId="ch-1" />,
      { wrapper: createWrapper() },
    )

    const menuButton = screen.getByRole('button', { name: 'Actions document' })
    await user.click(menuButton)

    const downloadItem = screen.getByText('Télécharger')
    await user.click(downloadItem)

    expect(mockDownloadDocument).toHaveBeenCalledWith('user-1/liv-1/bc_123.pdf', 'facture-2026.pdf')
  })

  it('does not show progress bar when idle', () => {
    render(
      <LivraisonDocumentSlot type="bc" livraison={emptyLivraison} chantierId="ch-1" />,
      { wrapper: createWrapper() },
    )
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('shows indeterminate progress bar when upload is pending', () => {
    mockUploadIsPending = true
    render(
      <LivraisonDocumentSlot type="bc" livraison={emptyLivraison} chantierId="ch-1" />,
      { wrapper: createWrapper() },
    )
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('calls useReplaceLivraisonDocument when replacing via dropdown', async () => {
    const user = userEvent.setup()
    render(
      <LivraisonDocumentSlot type="bc" livraison={filledLivraison} chantierId="ch-1" />,
      { wrapper: createWrapper() },
    )

    const menuButton = screen.getByRole('button', { name: 'Actions document' })
    await user.click(menuButton)

    const replaceItem = screen.getByText('Remplacer')
    await user.click(replaceItem)

    const fileInput = document.querySelector('[data-testid="file-input-bc-liv-1"]') as HTMLInputElement
    const newFile = new File(['new pdf'], 'new-facture.pdf', { type: 'application/pdf' })
    await userEvent.upload(fileInput, newFile)

    expect(mockReplaceMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        livraisonId: 'liv-1',
        chantierId: 'ch-1',
        file: newFile,
        documentType: 'bc',
        oldFileUrl: 'user-1/liv-1/bc_123.pdf',
      }),
    )
  })

  it('accepts file input with correct accept attribute', () => {
    render(
      <LivraisonDocumentSlot type="bc" livraison={emptyLivraison} chantierId="ch-1" />,
      { wrapper: createWrapper() },
    )

    const fileInput = document.querySelector('[data-testid="file-input-bc-liv-1"]') as HTMLInputElement
    expect(fileInput.accept).toBe('application/pdf,image/jpeg,image/png,image/heic')
  })
})
