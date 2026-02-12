import type { LotWithTaches } from '@/lib/queries/useLotsWithTaches'
import type { PlotRow } from '@/lib/queries/usePlots'
import type { InventaireWithLocation } from '@/lib/queries/useInventaire'

export interface LotPretACarreler {
  id: string
  code: string
  plotId: string
  etageId: string
  plotNom: string
  etageNom: string | null
}

export interface MetrageVsInventaire {
  totalM2: number
  totalML: number
  inventaireCount: number
  inventaireDesignations: { designation: string; totalQuantite: number }[]
}

/**
 * Identifie les lots "prêts à carreler" :
 * - TOUTES les tâches "ragréage" → done
 * - TOUTES les tâches "phonique" → done
 * - TOUTES les tâches "pose" → not_started
 * - Le lot doit avoir au moins 1 tâche de chaque type
 */
export function findLotsPretsACarreler(lots: LotWithTaches[]): LotPretACarreler[] {
  return lots
    .filter((lot) => {
      const allTaches = lot.pieces.flatMap((p) => p.taches)
      if (allTaches.length === 0) return false

      const ragreage = allTaches.filter((t) => matchTaskName(t.nom, 'ragreage'))
      const phonique = allTaches.filter((t) => matchTaskName(t.nom, 'phonique'))
      const pose = allTaches.filter((t) => matchTaskName(t.nom, 'pose'))

      if (ragreage.length === 0 || phonique.length === 0 || pose.length === 0) return false

      return (
        ragreage.every((t) => t.status === 'done') &&
        phonique.every((t) => t.status === 'done') &&
        pose.every((t) => t.status === 'not_started')
      )
    })
    .map((lot) => ({
      id: lot.id,
      code: lot.code,
      plotId: lot.plot_id,
      etageId: lot.etage_id,
      plotNom: lot.plots.nom,
      etageNom: lot.etages?.nom ?? null,
    }))
}

/**
 * RegExps pré-compilées pour le matching des noms de tâches.
 * Word boundaries (\b) évitent les faux positifs (ex: "Repose" ne matche pas "pose").
 */
const TASK_PATTERNS = {
  ragreage: /\bragreage\b/,
  phonique: /\bphonique\b/,
  pose: /\bpose\b/,
} as const

/**
 * Matching insensible à la casse et aux accents.
 * Normalise en supprimant les diacritiques (NFD + remplacement).
 */
function matchTaskName(nom: string, keyword: keyof typeof TASK_PATTERNS): boolean {
  const normalized = nom
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  return TASK_PATTERNS[keyword].test(normalized)
}

/**
 * Calcule le résumé métrés vs inventaire pour aide à la décision.
 */
export function computeMetrageVsInventaire(
  plots: PlotRow[],
  inventaire: InventaireWithLocation[],
): MetrageVsInventaire {
  const totalM2 = plots.reduce((sum, p) => sum + (p.metrage_m2_total ?? 0), 0)
  const totalML = plots.reduce((sum, p) => sum + (p.metrage_ml_total ?? 0), 0)

  const byDesignation = new Map<string, number>()
  for (const item of inventaire) {
    const current = byDesignation.get(item.designation) ?? 0
    byDesignation.set(item.designation, current + item.quantite)
  }

  const inventaireDesignations = Array.from(byDesignation.entries())
    .map(([designation, totalQuantite]) => ({ designation, totalQuantite }))
    .sort((a, b) => a.designation.localeCompare(b.designation, 'fr'))

  return {
    totalM2,
    totalML,
    inventaireCount: inventaireDesignations.length,
    inventaireDesignations,
  }
}
