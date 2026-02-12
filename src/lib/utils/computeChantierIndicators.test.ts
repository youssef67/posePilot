import { describe, it, expect } from 'vitest'
import { findLotsPretsACarreler, computeMetrageVsInventaire } from './computeChantierIndicators'
import type { LotWithTaches } from '@/lib/queries/useLotsWithTaches'
import type { PlotRow } from '@/lib/queries/usePlots'
import type { InventaireWithLocation } from '@/lib/queries/useInventaire'

function makeLot(overrides: Partial<LotWithTaches> = {}): LotWithTaches {
  return {
    id: 'lot-1',
    code: '101',
    plot_id: 'plot-1',
    etage_id: 'etage-1',
    metrage_m2_total: 12.5,
    metrage_ml_total: 8.2,
    plots: { nom: 'Plot A' },
    etages: { nom: 'É1' },
    pieces: [
      {
        id: 'piece-1',
        nom: 'Séjour',
        taches: [
          { id: 't-1', nom: 'Ragréage', status: 'done' },
          { id: 't-2', nom: 'Phonique', status: 'done' },
          { id: 't-3', nom: 'Pose', status: 'not_started' },
        ],
      },
    ],
    ...overrides,
  }
}

describe('findLotsPretsACarreler', () => {
  it('identifies lot with all ragréage+phonique done and pose not_started', () => {
    const result = findLotsPretsACarreler([makeLot()])
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      id: 'lot-1',
      code: '101',
      plotId: 'plot-1',
      etageId: 'etage-1',
      plotNom: 'Plot A',
      etageNom: 'É1',
    })
  })

  it('excludes lot where pose is in_progress', () => {
    const lot = makeLot({
      pieces: [
        {
          id: 'p-1',
          nom: 'Séjour',
          taches: [
            { id: 't-1', nom: 'Ragréage', status: 'done' },
            { id: 't-2', nom: 'Phonique', status: 'done' },
            { id: 't-3', nom: 'Pose', status: 'in_progress' },
          ],
        },
      ],
    })
    expect(findLotsPretsACarreler([lot])).toHaveLength(0)
  })

  it('excludes lot without ragréage tasks', () => {
    const lot = makeLot({
      pieces: [
        {
          id: 'p-1',
          nom: 'Séjour',
          taches: [
            { id: 't-2', nom: 'Phonique', status: 'done' },
            { id: 't-3', nom: 'Pose', status: 'not_started' },
          ],
        },
      ],
    })
    expect(findLotsPretsACarreler([lot])).toHaveLength(0)
  })

  it('excludes lot without phonique tasks', () => {
    const lot = makeLot({
      pieces: [
        {
          id: 'p-1',
          nom: 'Séjour',
          taches: [
            { id: 't-1', nom: 'Ragréage', status: 'done' },
            { id: 't-3', nom: 'Pose', status: 'not_started' },
          ],
        },
      ],
    })
    expect(findLotsPretsACarreler([lot])).toHaveLength(0)
  })

  it('excludes lot without pose tasks', () => {
    const lot = makeLot({
      pieces: [
        {
          id: 'p-1',
          nom: 'Séjour',
          taches: [
            { id: 't-1', nom: 'Ragréage', status: 'done' },
            { id: 't-2', nom: 'Phonique', status: 'done' },
          ],
        },
      ],
    })
    expect(findLotsPretsACarreler([lot])).toHaveLength(0)
  })

  it('handles accent variants in task names', () => {
    const lot = makeLot({
      pieces: [
        {
          id: 'p-1',
          nom: 'Séjour',
          taches: [
            { id: 't-1', nom: 'ragreage', status: 'done' },
            { id: 't-2', nom: 'PHONIQUE', status: 'done' },
            { id: 't-3', nom: 'Pose carrelage', status: 'not_started' },
          ],
        },
      ],
    })
    expect(findLotsPretsACarreler([lot])).toHaveLength(1)
  })

  it('does not false-positive on task names containing keywords as substrings', () => {
    const lot = makeLot({
      pieces: [
        {
          id: 'p-1',
          nom: 'Séjour',
          taches: [
            { id: 't-1', nom: 'Ragréage', status: 'done' },
            { id: 't-2', nom: 'Phonique', status: 'done' },
            { id: 't-3', nom: 'Repose', status: 'not_started' },
          ],
        },
      ],
    })
    // "Repose" should NOT match "pose" — no real pose task exists
    expect(findLotsPretsACarreler([lot])).toHaveLength(0)
  })

  it('returns empty array for empty lots', () => {
    expect(findLotsPretsACarreler([])).toEqual([])
  })

  it('returns empty array when no pieces', () => {
    const lot = makeLot({ pieces: [] })
    expect(findLotsPretsACarreler([lot])).toEqual([])
  })

  it('handles lot with null etages', () => {
    const lot = makeLot({ etages: null })
    const result = findLotsPretsACarreler([lot])
    expect(result).toHaveLength(1)
    expect(result[0].etageNom).toBeNull()
  })
})

describe('computeMetrageVsInventaire', () => {
  const makePlot = (overrides: Partial<PlotRow> = {}): PlotRow => ({
    id: 'plot-1',
    chantier_id: 'ch-1',
    nom: 'Plot A',
    task_definitions: [],
    progress_done: 0,
    progress_total: 0,
    has_blocking_note: false,
    metrage_m2_total: 100,
    metrage_ml_total: 50,
    created_at: '2026-01-01',
    ...overrides,
  })

  const makeInventaire = (overrides: Partial<InventaireWithLocation> = {}): InventaireWithLocation => ({
    id: 'inv-1',
    chantier_id: 'ch-1',
    plot_id: 'plot-1',
    etage_id: 'etage-1',
    designation: 'Colle',
    quantite: 10,
    created_at: '2026-01-01',
    created_by: null,
    plots: { nom: 'Plot A' },
    etages: { nom: 'RDC' },
    ...overrides,
  })

  it('sums m² and ML across plots', () => {
    const plots = [
      makePlot({ metrage_m2_total: 100, metrage_ml_total: 50 }),
      makePlot({ id: 'plot-2', metrage_m2_total: 200, metrage_ml_total: 80 }),
    ]
    const result = computeMetrageVsInventaire(plots, [])
    expect(result.totalM2).toBe(300)
    expect(result.totalML).toBe(130)
  })

  it('aggregates inventory by designation', () => {
    const inventaire = [
      makeInventaire({ designation: 'Colle', quantite: 10 }),
      makeInventaire({ id: 'inv-2', designation: 'Colle', quantite: 5 }),
      makeInventaire({ id: 'inv-3', designation: 'Joint', quantite: 3 }),
    ]
    const result = computeMetrageVsInventaire([], inventaire)
    expect(result.inventaireCount).toBe(2)
    expect(result.inventaireDesignations).toEqual([
      { designation: 'Colle', totalQuantite: 15 },
      { designation: 'Joint', totalQuantite: 3 },
    ])
  })

  it('returns zeros for empty data', () => {
    const result = computeMetrageVsInventaire([], [])
    expect(result.totalM2).toBe(0)
    expect(result.totalML).toBe(0)
    expect(result.inventaireCount).toBe(0)
    expect(result.inventaireDesignations).toEqual([])
  })
})
