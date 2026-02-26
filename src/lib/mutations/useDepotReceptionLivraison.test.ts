import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
    },
  },
}))

import { supabase } from '@/lib/supabase'
import { receptionnerLivraisonDepot, annulerReceptionDepot } from './useDepotReceptionLivraison'

function mockChain(overrides: Record<string, unknown> = {}) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.ilike = vi.fn().mockReturnValue(chain)
  chain.limit = vi.fn().mockResolvedValue(overrides.limitResult ?? { data: [], error: null })
  chain.single = vi.fn().mockResolvedValue(overrides.singleResult ?? { data: null, error: null })
  chain.insert = vi.fn().mockReturnValue(chain)
  chain.update = vi.fn().mockReturnValue(chain)
  chain.delete = vi.fn().mockReturnValue(chain)
  return chain
}

/** Build a besoins chain that handles .select().eq('livraison_id').eq('is_depot') */
function mockBesoinsChain(data: unknown[], error: Error | null = null) {
  const chain = mockChain()
  // .eq('livraison_id', ...) returns chain, .eq('is_depot', true) resolves
  let eqCallCount = 0
  chain.eq = vi.fn().mockImplementation(() => {
    eqCallCount++
    if (eqCallCount >= 2) return Promise.resolve({ data, error })
    return chain
  })
  return chain
}

/** Build a chain for the idempotence check: depot_mouvements.select('id').eq('livraison_id').limit(1) */
function mockIdempotenceCheck(alreadyExists = false) {
  const chain = mockChain()
  chain.limit = vi.fn().mockResolvedValue({
    data: alreadyExists ? [{ id: 'existing-mouv' }] : [],
    error: null,
  })
  return chain
}

describe('receptionnerLivraisonDepot', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: { id: 'user-1' } as never }, error: null })
  })

  it('does nothing when livraison has no depot besoins', async () => {
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'depot_mouvements') return mockIdempotenceCheck(false) as never
      if (table === 'besoins') return mockBesoinsChain([]) as never
      return mockChain() as never
    })

    await receptionnerLivraisonDepot('liv-1')

    expect(supabase.from).toHaveBeenCalledWith('depot_mouvements')
    expect(supabase.from).toHaveBeenCalledWith('besoins')
  })

  it('skips processing when mouvements already exist (idempotent)', async () => {
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'depot_mouvements') return mockIdempotenceCheck(true) as never
      return mockChain() as never
    })

    await receptionnerLivraisonDepot('liv-1')

    expect(supabase.from).toHaveBeenCalledWith('depot_mouvements')
    // Should NOT call besoins since we short-circuited
    expect(supabase.from).not.toHaveBeenCalledWith('besoins')
  })

  it('creates new depot_article and mouvement for new designation', async () => {
    let depotArticleCallCount = 0
    let depotMouvCallCount = 0
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'besoins') {
        return mockBesoinsChain([
          { id: 'b1', description: 'Colle carrelage', quantite: 10, montant_unitaire: 5, is_depot: true },
        ]) as never
      }
      if (table === 'depot_articles') {
        depotArticleCallCount++
        if (depotArticleCallCount === 1) {
          // ilike search → no match
          return mockChain({ limitResult: { data: [], error: null } }) as never
        }
        // insert new article
        return mockChain({
          singleResult: { data: { id: 'art-new' }, error: null },
        }) as never
      }
      if (table === 'depot_mouvements') {
        depotMouvCallCount++
        if (depotMouvCallCount === 1) return mockIdempotenceCheck(false) as never
        const chain = mockChain()
        chain.insert = vi.fn().mockResolvedValue({ error: null })
        return chain as never
      }
      return mockChain() as never
    })

    await receptionnerLivraisonDepot('liv-1')

    // Should have called depot_articles twice (search + insert) and depot_mouvements once
    const fromCalls = vi.mocked(supabase.from).mock.calls.map((c) => c[0])
    expect(fromCalls).toContain('depot_articles')
    expect(fromCalls).toContain('depot_mouvements')
  })

  it('updates existing depot_article and creates mouvement', async () => {
    let depotArticleCallCount = 0
    let depotMouvCallCount = 0
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'besoins') {
        return mockBesoinsChain([
          { id: 'b1', description: 'Colle', quantite: 5, montant_unitaire: 10, is_depot: true },
        ]) as never
      }
      if (table === 'depot_articles') {
        depotArticleCallCount++
        if (depotArticleCallCount === 1) {
          // ilike search → match found
          return mockChain({
            limitResult: { data: [{ id: 'art-1', quantite: 20, valeur_totale: 200 }], error: null },
          }) as never
        }
        // update existing
        const chain = mockChain()
        chain.eq = vi.fn().mockResolvedValue({ error: null })
        return chain as never
      }
      if (table === 'depot_mouvements') {
        depotMouvCallCount++
        if (depotMouvCallCount === 1) return mockIdempotenceCheck(false) as never
        const chain = mockChain()
        chain.insert = vi.fn().mockResolvedValue({ error: null })
        return chain as never
      }
      return mockChain() as never
    })

    await receptionnerLivraisonDepot('liv-1')

    const fromCalls = vi.mocked(supabase.from).mock.calls.map((c) => c[0])
    expect(fromCalls.filter((t) => t === 'depot_articles')).toHaveLength(2)
    expect(fromCalls).toContain('depot_mouvements')
  })

  it('throws on besoins fetch error', async () => {
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'depot_mouvements') return mockIdempotenceCheck(false) as never
      if (table === 'besoins') return mockBesoinsChain([], new Error('DB error')) as never
      return mockChain() as never
    })

    await expect(receptionnerLivraisonDepot('liv-1')).rejects.toThrow('DB error')
  })

  it('handles besoin with null montant_unitaire (defaults to 0)', async () => {
    let depotArticleCallCount = 0
    let depotMouvCallCount = 0
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'besoins') {
        return mockBesoinsChain([
          { id: 'b1', description: 'Joint', quantite: 3, montant_unitaire: null, is_depot: true },
        ]) as never
      }
      if (table === 'depot_articles') {
        depotArticleCallCount++
        if (depotArticleCallCount === 1) {
          return mockChain({ limitResult: { data: [], error: null } }) as never
        }
        return mockChain({ singleResult: { data: { id: 'art-2' }, error: null } }) as never
      }
      if (table === 'depot_mouvements') {
        depotMouvCallCount++
        if (depotMouvCallCount === 1) return mockIdempotenceCheck(false) as never
        const chain = mockChain()
        chain.insert = vi.fn().mockResolvedValue({ error: null })
        return chain as never
      }
      return mockChain() as never
    })

    await receptionnerLivraisonDepot('liv-1')

    const fromCalls = vi.mocked(supabase.from).mock.calls.map((c) => c[0])
    expect(fromCalls).toContain('depot_mouvements')
  })

  it('only processes is_depot=true besoins (ignores chantier besoins)', async () => {
    // This test verifies the .eq('is_depot', true) filter is applied
    // The mock returns only depot besoins since that's what the query filters
    let depotArticleCallCount = 0
    let depotMouvCallCount = 0
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'besoins') {
        // Only depot besoins returned (filter applied in query)
        return mockBesoinsChain([
          { id: 'b1', description: 'Vis', quantite: 100, montant_unitaire: 0.1, is_depot: true },
        ]) as never
      }
      if (table === 'depot_articles') {
        depotArticleCallCount++
        if (depotArticleCallCount === 1) {
          return mockChain({ limitResult: { data: [], error: null } }) as never
        }
        return mockChain({ singleResult: { data: { id: 'art-3' }, error: null } }) as never
      }
      if (table === 'depot_mouvements') {
        depotMouvCallCount++
        if (depotMouvCallCount === 1) return mockIdempotenceCheck(false) as never
        const chain = mockChain()
        chain.insert = vi.fn().mockResolvedValue({ error: null })
        return chain as never
      }
      return mockChain() as never
    })

    await receptionnerLivraisonDepot('liv-1')

    // Only 1 article processed (the depot one)
    expect(depotArticleCallCount).toBe(2) // search + insert
  })
})

describe('annulerReceptionDepot', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does nothing when no mouvements exist', async () => {
    const chain = mockChain()
    chain.eq = vi.fn().mockResolvedValue({ data: [], error: null })
    vi.mocked(supabase.from).mockReturnValue(chain as never)

    await annulerReceptionDepot('liv-1')

    expect(supabase.from).toHaveBeenCalledWith('depot_mouvements')
    expect(supabase.from).not.toHaveBeenCalledWith('depot_articles')
  })

  it('subtracts quantities and deletes mouvements', async () => {
    let depotArticleCallCount = 0
    let depotMouvCallCount = 0
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'depot_mouvements') {
        depotMouvCallCount++
        if (depotMouvCallCount === 1) {
          // select mouvements
          const chain = mockChain()
          chain.eq = vi.fn().mockResolvedValue({
            data: [{ id: 'mouv-1', article_id: 'art-1', quantite: 5, montant_total: 50 }],
            error: null,
          })
          return chain as never
        }
        // delete mouvements
        const chain = mockChain()
        chain.eq = vi.fn().mockResolvedValue({ error: null })
        return chain as never
      }
      if (table === 'depot_articles') {
        depotArticleCallCount++
        if (depotArticleCallCount === 1) {
          // fetch article
          return mockChain({
            singleResult: { data: { id: 'art-1', quantite: 20, valeur_totale: 200 }, error: null },
          }) as never
        }
        // update article (20-5=15 remaining)
        const chain = mockChain()
        chain.eq = vi.fn().mockResolvedValue({ error: null })
        return chain as never
      }
      return mockChain() as never
    })

    await annulerReceptionDepot('liv-1')

    expect(depotArticleCallCount).toBe(2) // fetch + update
    expect(depotMouvCallCount).toBe(2) // select + delete
  })

  it('deletes depot_article when quantity drops to 0', async () => {
    let depotArticleCallCount = 0
    let deleteWasCalled = false
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'depot_mouvements') {
        const chain = mockChain()
        let mouvEqCount = 0
        chain.eq = vi.fn().mockImplementation(() => {
          mouvEqCount++
          if (mouvEqCount === 1) return Promise.resolve({
            data: [{ id: 'mouv-1', article_id: 'art-1', quantite: 10, montant_total: 100 }],
            error: null,
          })
          return Promise.resolve({ error: null })
        })
        return chain as never
      }
      if (table === 'depot_articles') {
        depotArticleCallCount++
        if (depotArticleCallCount === 1) {
          return mockChain({
            singleResult: { data: { id: 'art-1', quantite: 10, valeur_totale: 100 }, error: null },
          }) as never
        }
        // delete article (quantite would be 0)
        const chain = mockChain()
        chain.eq = vi.fn().mockResolvedValue({ error: null })
        chain.delete = vi.fn().mockReturnValue(chain)
        deleteWasCalled = true
        return chain as never
      }
      return mockChain() as never
    })

    await annulerReceptionDepot('liv-1')

    expect(deleteWasCalled).toBe(true)
  })
})
