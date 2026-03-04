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
 * Identifie les lots "prêts à carreler" en se basant sur la position des tâches.
 * Les tâches sont triées par position (prérequis → pose → finitions).
 *
 * Pour chaque pièce :
 * - Toutes les tâches AVANT la première "pose" → done
 * - Toutes les tâches "pose" → not_started
 * - Tâches APRÈS la dernière "pose" → ignorées
 *
 * Le lot est prêt si toutes ses pièces satisfont cette condition,
 * qu'il a au moins 1 tâche "pose", et que materiaux_recus === true.
 */
export function findLotsPretsACarreler(lots: LotWithTaches[]): LotPretACarreler[] {
  return lots
    .filter((lot) => {
      if (lot.pieces.length === 0) return false
      if (lot.materiaux_recus !== true) return false

      for (const piece of lot.pieces) {
        const taches = piece.taches
        const firstPoseIdx = taches.findIndex((t) => isPose(t.nom))

        // Fix AC5: every piece must have at least one pose task
        if (firstPoseIdx === -1) return false

        // AC4: only check bloquant_pose tasks before the first pose
        const prePose = taches.slice(0, firstPoseIdx)
        if (!prePose.filter((t) => t.bloquant_pose).every((t) => t.status === 'done'))
          return false

        // All pose tasks must be not_started
        const poseTaches = taches.filter((t) => isPose(t.nom))
        if (!poseTaches.every((t) => t.status === 'not_started')) return false

        // Tasks after the last pose are ignored
      }

      return true
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

/** Word boundary regex pour "pose" — évite les faux positifs (ex: "Repose"). */
const POSE_PATTERN = /\bpose\b/

/**
 * Vérifie si un nom de tâche correspond à "pose" (insensible à la casse et aux accents).
 */
function isPose(nom: string): boolean {
  const normalized = nom
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  return POSE_PATTERN.test(normalized)
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
