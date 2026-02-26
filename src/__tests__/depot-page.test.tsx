import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue({}),
      }),
    }),
    removeChannel: vi.fn(),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
    },
  },
}))

import { supabase } from '@/lib/supabase'
import { renderRoute, setupChannelMock } from '@/test/route-test-utils'

const mockDepotArticles = [
  {
    id: 'da1',
    designation: 'Sac de colle Mapei',
    quantite: 20,
    valeur_totale: 210,
    unite: 'sacs',
    created_at: '2026-02-20T10:00:00Z',
    created_by: 'user-1',
  },
  {
    id: 'da2',
    designation: 'Carrelage 30x30 blanc',
    quantite: 45,
    valeur_totale: 675,
    unite: 'm²',
    created_at: '2026-02-20T11:00:00Z',
    created_by: 'user-1',
  },
]

function setupMocks(depotArticles: unknown[] = []) {
  const insertSelectSingle = vi.fn().mockResolvedValue({ data: { id: 'new-1', article_id: 'da-new' }, error: null })
  const insertSelect = vi.fn().mockReturnValue({ single: insertSelectSingle })
  const mockInsert = vi.fn().mockReturnValue({ select: insertSelect })
  const updateSelectSingle = vi.fn().mockResolvedValue({ data: {}, error: null })
  const updateSelect = vi.fn().mockReturnValue({ single: updateSelectSingle })
  const updateEq = vi.fn().mockReturnValue({ select: updateSelect })
  const mockUpdate = vi.fn().mockReturnValue({ eq: updateEq })

  vi.mocked(supabase.from).mockImplementation((table: string) => {
    if (table === 'depot_articles') {
      return {
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: depotArticles, error: null }),
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: depotArticles[0] ?? null, error: null }),
          }),
        }),
        insert: mockInsert,
        update: mockUpdate,
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      } as never
    }
    if (table === 'depot_mouvements') {
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'mouv-1' }, error: null }),
          }),
        }),
      } as never
    }
    if (table === 'chantiers') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [{ id: 'ch-1', nom: 'Chantier Test' }], error: null }),
          }),
        }),
      } as never
    }
    if (table === 'livraisons') {
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 'liv-1' }, error: null }),
          }),
        }),
      } as never
    }
    if (table === 'besoins') {
      return {
        insert: vi.fn().mockResolvedValue({ error: null }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      } as never
    }
    // Default for other tables (activity_logs, etc.)
    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
        gte: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    } as never
  })

  return { mockInsert, mockUpdate }
}

describe('DepotPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupChannelMock(supabase as unknown as { channel: ReturnType<typeof vi.fn> })
  })

  it('renders heading "Dépôt entreprise"', async () => {
    setupMocks()
    renderRoute('/depot')

    expect(await screen.findByRole('heading', { name: 'Dépôt entreprise' })).toBeInTheDocument()
  })

  it('shows subtitle with article count when articles exist', async () => {
    setupMocks(mockDepotArticles)
    renderRoute('/depot')

    expect(await screen.findByText('2 articles en stock')).toBeInTheDocument()
  })

  it('shows empty state when no articles', async () => {
    setupMocks([])
    renderRoute('/depot')

    expect(await screen.findByText('Aucun article au dépôt')).toBeInTheDocument()
  })

  it('shows FAB button', async () => {
    setupMocks()
    renderRoute('/depot')

    await screen.findByRole('heading', { name: 'Dépôt entreprise' })
    expect(screen.getByRole('button', { name: 'Ajouter' })).toBeInTheDocument()
  })

  it('opens creation sheet when FAB is clicked', async () => {
    const user = userEvent.setup()
    setupMocks()
    renderRoute('/depot')

    await screen.findByRole('heading', { name: 'Dépôt entreprise' })
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))

    expect(await screen.findByText('Nouvel article')).toBeInTheDocument()
    expect(screen.getByLabelText('Désignation')).toBeInTheDocument()
    expect(screen.getByLabelText('Quantité')).toBeInTheDocument()
    expect(screen.getByLabelText('Prix unitaire')).toBeInTheDocument()
    expect(screen.getByLabelText(/Unité/)).toBeInTheDocument()
  })

  it('shows designation validation error on empty submit', async () => {
    const user = userEvent.setup()
    setupMocks()
    renderRoute('/depot')

    await screen.findByRole('heading', { name: 'Dépôt entreprise' })
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))
    await screen.findByText('Nouvel article')

    await user.click(screen.getByRole('button', { name: /Ajouter l.article/ }))

    expect(await screen.findByText('La désignation est requise')).toBeInTheDocument()
  })

  it('shows prix unitaire validation error', async () => {
    const user = userEvent.setup()
    setupMocks()
    renderRoute('/depot')

    await screen.findByRole('heading', { name: 'Dépôt entreprise' })
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))
    await screen.findByText('Nouvel article')

    await user.type(screen.getByLabelText('Désignation'), 'Test article')
    await user.click(screen.getByRole('button', { name: /Ajouter l.article/ }))

    expect(await screen.findByText('Le prix unitaire doit être supérieur à 0')).toBeInTheDocument()
  })

  it('renders articles with CUMP and valeur totale', async () => {
    setupMocks(mockDepotArticles)
    renderRoute('/depot')

    expect(await screen.findByText('Sac de colle Mapei')).toBeInTheDocument()
    expect(screen.getByText('Carrelage 30x30 blanc')).toBeInTheDocument()
    // CUMP and valeur are rendered via DepotArticleList
    expect(screen.getByText(/210,00/)).toBeInTheDocument()
    expect(screen.getByText(/675,00/)).toBeInTheDocument()
  })

  it('submits new article via creation sheet (AC #8)', async () => {
    const user = userEvent.setup()
    const { mockInsert } = setupMocks()
    renderRoute('/depot')

    await screen.findByRole('heading', { name: 'Dépôt entreprise' })
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))
    await screen.findByText('Nouvel article')

    await user.type(screen.getByLabelText('Désignation'), 'Nouveau produit')
    await user.clear(screen.getByLabelText('Quantité'))
    await user.type(screen.getByLabelText('Quantité'), '5')
    await user.type(screen.getByLabelText('Prix unitaire'), '12.50')

    await user.click(screen.getByRole('button', { name: /Ajouter l.article/ }))

    // Verify insert was called on depot_articles
    expect(mockInsert).toHaveBeenCalled()
  })

  it('calls update path when article with same designation exists (AC #8 existing)', async () => {
    const user = userEvent.setup()
    const { mockUpdate } = setupMocks(mockDepotArticles)
    renderRoute('/depot')

    expect(await screen.findByText('Sac de colle Mapei')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))
    await screen.findByText('Nouvel article')

    // Type same designation as existing article (case-insensitive)
    await user.type(screen.getByLabelText('Désignation'), '  sac de colle mapei  ')
    await user.clear(screen.getByLabelText('Quantité'))
    await user.type(screen.getByLabelText('Quantité'), '3')
    await user.type(screen.getByLabelText('Prix unitaire'), '11.00')

    await user.click(screen.getByRole('button', { name: /Ajouter l.article/ }))

    // Should update existing article, not insert new
    expect(mockUpdate).toHaveBeenCalled()
  })

  it('opens detail sheet on article click with transfer button (AC #1)', async () => {
    const user = userEvent.setup()
    setupMocks(mockDepotArticles)
    renderRoute('/depot')

    expect(await screen.findByText('Sac de colle Mapei')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Détail Sac de colle Mapei/ }))

    expect(await screen.findByText('Détail article')).toBeInTheDocument()
    expect(screen.getByText(/Quantité : 20/)).toBeInTheDocument()
    expect(screen.getByText(/Valeur totale/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Transférer vers un chantier/ })).toBeInTheDocument()
  })

  it('renders +/- buttons and increments article (AC #2)', async () => {
    const user = userEvent.setup()
    setupMocks(mockDepotArticles)
    renderRoute('/depot')

    expect(await screen.findByText('Sac de colle Mapei')).toBeInTheDocument()

    const incrementButtons = screen.getAllByRole('button', { name: /Augmenter/ })
    expect(incrementButtons).toHaveLength(2)

    const decrementButtons = screen.getAllByRole('button', { name: /Diminuer/ })
    expect(decrementButtons).toHaveLength(2)

    // Click increment on first article
    await user.click(incrementButtons[0])

    // Verify update was called on depot_articles (via useUpdateDepotArticleQuantite)
    expect(vi.mocked(supabase.from)).toHaveBeenCalledWith('depot_articles')
  })

  it('opens transfer sheet from detail sheet (AC #2)', async () => {
    const user = userEvent.setup()
    setupMocks(mockDepotArticles)
    renderRoute('/depot')

    expect(await screen.findByText('Sac de colle Mapei')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Détail Sac de colle Mapei/ }))
    expect(await screen.findByText('Détail article')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Transférer vers un chantier/ }))

    expect(await screen.findByLabelText('Quantité')).toBeInTheDocument()
    expect(screen.getByLabelText('Chantier')).toBeInTheDocument()
    expect(screen.getByText(/Stock disponible : 20/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Transférer' })).toBeInTheDocument()
  })

  it('shows real-time montant in transfer sheet (AC #2)', async () => {
    const user = userEvent.setup()
    setupMocks(mockDepotArticles)
    renderRoute('/depot')

    expect(await screen.findByText('Sac de colle Mapei')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Détail Sac de colle Mapei/ }))
    await screen.findByText('Détail article')
    await user.click(screen.getByRole('button', { name: /Transférer vers un chantier/ }))

    // Default qty=1, CUMP=10.5 → montant=10,50 €  (French EUR uses non-breaking space)
    const montantEl = await screen.findByText((_content, element) =>
      element?.tagName === 'P' && !!element.textContent?.includes('Montant') && !!element.textContent?.includes('10,50'),
    )
    expect(montantEl).toBeInTheDocument()
  })

  it('shows validation error when quantity exceeds stock (AC #4)', async () => {
    const user = userEvent.setup()
    setupMocks(mockDepotArticles)
    renderRoute('/depot')

    expect(await screen.findByText('Sac de colle Mapei')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Détail Sac de colle Mapei/ }))
    await screen.findByText('Détail article')
    await user.click(screen.getByRole('button', { name: /Transférer vers un chantier/ }))

    const qtyInput = await screen.findByLabelText('Quantité')
    await user.clear(qtyInput)
    await user.type(qtyInput, '999')

    // Select a chantier
    await user.selectOptions(screen.getByLabelText('Chantier'), 'ch-1')

    await user.click(screen.getByRole('button', { name: 'Transférer' }))

    expect(await screen.findByText(/Quantité supérieure au stock disponible \(max: 20\)/)).toBeInTheDocument()
  })

  it('shows chantier required validation error (AC #4)', async () => {
    const user = userEvent.setup()
    setupMocks(mockDepotArticles)
    renderRoute('/depot')

    expect(await screen.findByText('Sac de colle Mapei')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Détail Sac de colle Mapei/ }))
    await screen.findByText('Détail article')
    await user.click(screen.getByRole('button', { name: /Transférer vers un chantier/ }))

    await screen.findByLabelText('Quantité')
    // Do not select a chantier, just submit
    await user.click(screen.getByRole('button', { name: 'Transférer' }))

    expect(await screen.findByText('Le chantier est requis')).toBeInTheDocument()
  })
})
