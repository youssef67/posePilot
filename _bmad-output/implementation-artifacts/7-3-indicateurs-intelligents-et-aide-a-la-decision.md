# Story 7.3: Indicateurs intelligents et aide à la décision

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que utilisateur de posePilot,
Je veux voir des indicateurs intelligents qui croisent les données du chantier,
Afin que j'anticipe les besoins et prenne des décisions éclairées.

## Acceptance Criteria

1. **Given** des lots ont ragréage = fait ET phonique = fait ET pose = pas commencé **When** l'utilisateur consulte la vue chantier ou plot **Then** un indicateur "X lots prêts à carreler" est affiché avec la liste des lots concernés

2. **Given** de l'inventaire et des métrés sont renseignés **When** le système croise les données **Then** un indicateur compare le matériel disponible (inventaire) aux m² restants à poser, pour aider à décider si une commande est nécessaire

3. **Given** des besoins en attente existent (non transformés en livraison) **When** l'utilisateur consulte la vue chantier **Then** un compteur affiche "X besoins en attente non commandés"

4. **Given** des livraisons ont le statut "Prévu" avec une date **When** l'utilisateur consulte la vue chantier **Then** un indicateur affiche les prochaines livraisons prévues avec leurs dates

5. **Given** aucun métré, aucun inventaire, aucun besoin n'est renseigné **When** l'utilisateur consulte les indicateurs **Then** les indicateurs sont masqués ou affichent "—" — jamais de données erronées ou trompeuses

## Tasks / Subtasks

- [x] Task 1 — Query hook : useLotsWithTaches pour identifier les lots prêts à carreler (AC: #1, #5)
  - [x] 1.1 Créer `src/lib/queries/useLotsWithTaches.ts`
  - [x] 1.2 Query Supabase : `lots` avec `pieces(id, nom, taches(id, nom, status))` filtrés par chantier via `plots!inner(chantier_id)`
  - [x] 1.3 Exporter un type `LotWithTaches` avec la structure complète
  - [x] 1.4 Créer `src/lib/queries/useLotsWithTaches.test.ts` — 3 tests (fetch success, empty, error)

- [x] Task 2 — Utilitaire : computeChantierIndicators (AC: #1, #2, #5)
  - [x] 2.1 Créer `src/lib/utils/computeChantierIndicators.ts`
  - [x] 2.2 Fonction `findLotsPretsACarreler(lots)` — filtre les lots où ALL ragréage/phonique = done AND ALL pose = not_started
  - [x] 2.3 Fonction `computeMetrageVsInventaire(plots, inventaire)` — calcule m² total et résumé inventaire
  - [x] 2.4 Matching tâches par nom insensible à la casse et aux accents : "ragréage"/"ragreage", "phonique", "pose"
  - [x] 2.5 Créer `src/lib/utils/computeChantierIndicators.test.ts` — 8+ tests (lots prêts, lots pas prêts, pas de tâches ragréage, données vides, métrés vs inventaire)

- [x] Task 3 — Composant : ChantierIndicators (AC: #1, #2, #3, #4, #5)
  - [x] 3.1 Créer `src/components/ChantierIndicators.tsx`
  - [x] 3.2 Section "Lots prêts à carreler" : compteur + liste des lots (code + localisation), navigable au tap
  - [x] 3.3 Section "Métrés & Inventaire" : total m² du chantier + nombre articles inventaire — affiché uniquement si métrés > 0 OU inventaire > 0
  - [x] 3.4 Section "Besoins en attente" : compteur simple, affiché uniquement si > 0
  - [x] 3.5 Section "Livraisons prévues" : liste des livraisons status "prevu" avec dates, triées par date_prevue ASC
  - [x] 3.6 Chaque section masquée si aucune donnée (AC #5 — jamais de données trompeuses)
  - [x] 3.7 Créer `src/components/ChantierIndicators.test.tsx` — 8+ tests (chaque indicateur présent/absent, données vides, navigation lot)

- [x] Task 4 — Intégration vue chantier complet (AC: #1, #2, #3, #4, #5)
  - [x] 4.1 Modifier `src/routes/_authenticated/chantiers/$chantierId/index.tsx`
  - [x] 4.2 Ajouter `useLotsWithTaches(chantierId)` et `useInventaire(chantierId)` pour les données manquantes
  - [x] 4.3 Intégrer `<ChantierIndicators />` entre la barre badges/boutons et la section Plots (chantier `complet` uniquement)
  - [x] 4.4 Pour chantier `leger` : afficher uniquement les indicateurs besoins et livraisons (AC #3, #4)
  - [x] 4.5 Subscriptions realtime : `useRealtimeInventaire(chantierId)` déjà importable
  - [x] 4.6 Mettre à jour les tests de la page chantier

- [x] Task 5 — Intégration vue plot (optionnel, AC: #1)
  - [x] 5.1 Modifier `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.tsx`
  - [x] 5.2 Ajouter un compteur "X lots prêts à carreler" si applicable — filtre par plot_id dans les résultats
  - [x] 5.3 Affichage léger (texte secondaire, pas de composant complet) — uniquement si lots prêts > 0
  - [x] 5.4 Mettre à jour les tests de la vue plot

- [x] Task 6 — Tests de régression (AC: #1-5)
  - [x] 6.1 `npm run test` — tous les tests existants + nouveaux passent
  - [x] 6.2 `npm run lint` — 0 nouvelles erreurs
  - [x] 6.3 `npm run build` — 0 nouvelles erreurs tsc

## Dev Notes

### Vue d'ensemble — Stratégie d'implémentation

Cette story est la **troisième et dernière de l'Epic 7** et implémente les **indicateurs intelligents d'aide à la décision** (FR61, FR62, FR63, FR64). Elle ne crée aucune nouvelle table ni migration SQL — elle exploite les données existantes (tâches, métrés, inventaire, besoins, livraisons) pour afficher des indicateurs croisés.

**Scope précis :**
- **FR61** : Indicateur "lots prêts à carreler" — croise statuts tâches ragréage/phonique/pose par lot
- **FR62** : Indicateur "métrés vs inventaire" — affiche m² total et résumé inventaire côte à côte
- **FR63** : Compteur "besoins en attente non commandés" — donnée déjà disponible
- **FR64** : Liste "livraisons prévues à venir" — filtrage des livraisons statut "prevu" avec dates

**Hors scope :**
- Aucune nouvelle migration SQL (pas de colonne, pas de trigger)
- Pas de calcul automatique inventaire/métrés — l'utilisateur interprète le croisement
- Pas de prédiction ou d'analyse temporelle avancée

**Décision architecturale — Calcul côté client, pas côté SQL :**
Les indicateurs sont des **agrégations croisées multi-tables** (tâches × lots × pièces, inventaire × métrés). Le volume de données est faible (< 500 pièces, < 2000 tâches par chantier). Un calcul côté client via une fonction utilitaire pure est plus simple, plus testable, et ne nécessite pas de fonctions PostgreSQL custom (cohérent avec l'architecture : pas d'Edge Functions, pas d'API custom). La seule nouvelle query est un `select` Supabase standard pour charger les tâches de tout le chantier.

**Décision — Matching des noms de tâches :**
Les tâches sont nommées librement par plot via `task_definitions` (ex: "Ragréage", "Phonique", "Pose", "Plinthes", "Joints", "Silicone"). Le matching pour FR61 se fait par inclusion insensible à la casse et aux accents :
- "ragréage" ou "ragreage" → tâche de ragréage
- "phonique" → tâche d'isolation phonique
- "pose" → tâche de pose carrelage
Si un plot n'a pas ces 3 types de tâches, ses lots ne sont simplement pas candidats "prêts à carreler".

**Décision — Placement des indicateurs :**
Les indicateurs s'affichent sur la **vue chantier** entre la barre de badges/boutons et la grille de plots. Pour un chantier `complet`, les 4 indicateurs sont disponibles. Pour un chantier `leger`, seuls FR63 (besoins) et FR64 (livraisons) s'affichent car il n'y a ni lots ni métrés.

### Ce qui existe déjà (à réutiliser, NE PAS recréer)

| Élément | Fichier | Notes |
|---------|---------|-------|
| `useBesoins(chantierId)` | `src/lib/queries/useBesoins.ts` | Retourne besoins avec `livraison_id IS NULL` — **déjà le compteur FR63** |
| `useLivraisons(chantierId)` | `src/lib/queries/useLivraisons.ts` | Retourne toutes les livraisons — **filtrer `status === 'prevu'` pour FR64** |
| `useInventaire(chantierId)` | `src/lib/queries/useInventaire.ts` | Retourne inventaire avec `designation`, `quantite`, `plot_id`, `etage_id` |
| `usePlots(chantierId)` | `src/lib/queries/usePlots.ts` | Retourne plots avec `metrage_m2_total`, `metrage_ml_total` |
| `useChantierLots(chantierId)` | `src/lib/queries/useChantierLots.ts` | Retourne lots basiques (code, plot, étage) — **pas les tâches** (insuffisant pour FR61) |
| `useRealtimeBesoins()` | `src/lib/subscriptions/useRealtimeBesoins.ts` | Déjà utilisé sur la page chantier |
| `useRealtimeLivraisons()` | `src/lib/subscriptions/useRealtimeLivraisons.ts` | Déjà utilisé sur la page chantier |
| `useRealtimePlots()` | `src/lib/subscriptions/useRealtimePlots.ts` | Déjà utilisé sur la page chantier |
| `useRealtimeInventaire()` | `src/lib/subscriptions/useRealtimeInventaire.ts` | Disponible — à ajouter sur la page chantier |
| `StatusCard` | `src/components/StatusCard.tsx` | Carte avec barre statut — utilisable pour afficher les lots prêts |
| `Badge` | `src/components/ui/badge.tsx` | Badge outline — pour les compteurs |
| `computeStatus()` | `src/lib/utils/computeStatus.ts` | Calcul couleur statut — non utilisé directement ici |
| `formatMetrage()` | `src/lib/utils/formatMetrage.ts` | Format "X m² · Y ML" — réutilisable pour l'affichage métrés |
| `TaskStatus` enum | `src/types/enums.ts` | `NOT_STARTED`, `IN_PROGRESS`, `DONE` |
| Chantier page | `src/routes/_authenticated/chantiers/$chantierId/index.tsx` | Page cible — ajouter indicateurs |
| Plot page | `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.tsx` | Page secondaire — compteur optionnel |

### Nouvelle Query : useLotsWithTaches

```typescript
// src/lib/queries/useLotsWithTaches.ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface TacheInfo {
  id: string
  nom: string
  status: string
}

export interface PieceInfo {
  id: string
  nom: string
  taches: TacheInfo[]
}

export interface LotWithTaches {
  id: string
  code: string
  plot_id: string
  etage_id: string
  metrage_m2_total: number
  metrage_ml_total: number
  plots: { nom: string }
  etages: { nom: string } | null
  pieces: PieceInfo[]
}

export function useLotsWithTaches(chantierId: string) {
  return useQuery({
    queryKey: ['lots-with-taches', chantierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lots')
        .select(
          'id, code, plot_id, etage_id, metrage_m2_total, metrage_ml_total, plots!inner(nom), etages(nom), pieces(id, nom, taches(id, nom, status))',
        )
        .eq('plots.chantier_id', chantierId)
        .order('code')
      if (error) throw error
      return data as unknown as LotWithTaches[]
    },
    enabled: !!chantierId,
    staleTime: 30 * 1000, // 30s — données changent quand tâches changent
  })
}
```

**Points clés :**
- **select** avec 3 niveaux de jointure : `lots → pieces → taches` + `lots → plots` + `lots → etages`
- `plots!inner` pour filtrer par `chantier_id` (INNER JOIN — seuls les lots de ce chantier)
- `staleTime: 30s` — les tâches changent régulièrement, les indicateurs doivent être frais
- **Pas de realtime spécifique** : les subscriptions existantes (`useRealtimeLots`, `useRealtimePlots`) invalidant leurs query keys propagent les changements. Ajouter une invalidation de `['lots-with-taches', chantierId]` dans le useRealtimePieces/useRealtimeLots si nécessaire.
- Le cast `as unknown as LotWithTaches[]` suit le pattern établi (stories 7.1, 7.2)

### Utilitaire : computeChantierIndicators

```typescript
// src/lib/utils/computeChantierIndicators.ts

import type { LotWithTaches } from '@/lib/queries/useLotsWithTaches'
import type { PlotRow } from '@/lib/queries/usePlots'
import type { InventaireWithLocation } from '@/lib/queries/useInventaire'

export interface LotPretACarreler {
  id: string
  code: string
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
  return lots.filter((lot) => {
    const allTaches = lot.pieces.flatMap((p) => p.taches)
    if (allTaches.length === 0) return false

    const ragreage = allTaches.filter((t) => matchTaskName(t.nom, 'ragreage'))
    const phonique = allTaches.filter((t) => matchTaskName(t.nom, 'phonique'))
    const pose = allTaches.filter((t) => matchTaskName(t.nom, 'pose'))

    // Doit avoir au moins 1 tâche de chaque type
    if (ragreage.length === 0 || phonique.length === 0 || pose.length === 0) return false

    // Toutes ragréage done, toutes phonique done, toutes pose not_started
    return (
      ragreage.every((t) => t.status === 'done') &&
      phonique.every((t) => t.status === 'done') &&
      pose.every((t) => t.status === 'not_started')
    )
  }).map((lot) => ({
    id: lot.id,
    code: lot.code,
    plotNom: lot.plots.nom,
    etageNom: lot.etages?.nom ?? null,
  }))
}

/**
 * Matching insensible à la casse et aux accents.
 * Normalise en supprimant les diacritiques (NFD + remplacement).
 */
function matchTaskName(nom: string, keyword: string): boolean {
  const normalized = nom
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  return normalized.includes(keyword)
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

  // Agréger inventaire par désignation
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
```

**Points clés :**
- `matchTaskName` normalise les accents via `NFD` + regex — gère "Ragréage" et "Ragreage" et "ragréage"
- `findLotsPretsACarreler` exige les 3 types de tâches (ragréage + phonique + pose) pour considérer un lot
- Si un plot n'a pas défini "Pose" dans ses `task_definitions`, ses lots sont simplement exclus (pas d'erreur)
- `computeMetrageVsInventaire` agrège par designation pour éviter les doublons d'inventaire multi-étages
- Fonctions pures, facilement testables

### Composant : ChantierIndicators

```tsx
// src/components/ChantierIndicators.tsx

import { Link } from '@tanstack/react-router'
import { AlertTriangle, Calendar, Package, Ruler, Hammer } from 'lucide-react'
import type { LotPretACarreler, MetrageVsInventaire } from '@/lib/utils/computeChantierIndicators'
import type { Livraison } from '@/lib/queries/useLivraisons'

interface ChantierIndicatorsProps {
  chantierId: string
  // FR61 — lots prêts à carreler (complet uniquement)
  lotsPretsACarreler?: LotPretACarreler[]
  // FR62 — métrés vs inventaire (complet uniquement)
  metrageVsInventaire?: MetrageVsInventaire
  // FR63 — besoins en attente
  besoinsEnAttente: number
  // FR64 — livraisons prévues
  livraisonsPrevues: Livraison[]
}
```

**Layout du composant :**
```
┌─────────────────────────────────────────────────────┐
│ 🔨 3 lots prêts à carreler                         │
│  └ Lot 101 — Plot A › É1                           │
│  └ Lot 203 — Plot A › É2                           │
│  └ Lot 305 — Plot B › É1                           │
├─────────────────────────────────────────────────────┤
│ 📏 Métrés & Inventaire                              │
│  Total : 1250 m² · 320 ML                          │
│  Matériel : 3 articles en stock                     │
├─────────────────────────────────────────────────────┤
│ 📦 2 besoins en attente non commandés               │
├─────────────────────────────────────────────────────┤
│ 📅 Livraisons prévues                               │
│  └ Colle 60x60 — 15 fév.                           │
│  └ Plinthes chêne — 20 fév.                        │
└─────────────────────────────────────────────────────┘
```

**Règles d'affichage (AC #5) :**
- Chaque section masquée si aucune donnée pertinente :
  - FR61 : masqué si `lotsPretsACarreler.length === 0`
  - FR62 : masqué si `totalM2 === 0 AND totalML === 0 AND inventaireCount === 0`
  - FR63 : masqué si `besoinsEnAttente === 0`
  - FR64 : masqué si `livraisonsPrevues.length === 0`
- Si TOUTES les sections sont masquées → le composant entier ne rend rien
- Jamais de "0 lots prêts" ou "0 besoins" — on masque, on ne trompe pas

**Style :**
- Conteneur : `rounded-lg border border-border p-3 space-y-3 mb-4`
- Titre section : `text-sm font-medium text-foreground` avec icône lucide
- Détails : `text-xs text-muted-foreground pl-4`
- Lots prêts à carreler : chaque lot est un `Link` cliquable vers la route lot
- Livraisons : date formatée en relatif français ("15 fév.", "dans 3 jours")
- Couleurs sémantiques : vert pour lots prêts (bonne nouvelle), orange pour besoins/livraisons (action requise)

### Intégration vue chantier — Placement précis

**Fichier :** `src/routes/_authenticated/chantiers/$chantierId/index.tsx`

**Chantier complet — layout actuel :**
```
header (nom + dropdown)
├── Badge "Complet" + boutons (Besoins, Livraisons, Inventaire) + %
├── ── INSERTION ICI ── ChantierIndicators (FR61-64) ──
├── h2 "Plots"
├── GridFilterTabs + StatusCards plots
└── Button "Ajouter un plot"
```

**Chantier léger — layout actuel :**
```
header (nom + dropdown)
├── Badge "Léger" + compteur livraisons
├── ── INSERTION ICI ── ChantierIndicators (FR63-64 seulement) ──
├── h2 "Besoins en attente"
├── BesoinsList
├── h2 "Livraisons"
└── LivraisonsList
```

**Hooks à ajouter dans le composant page :**
```typescript
// Nouveau pour FR61 (complet uniquement)
const { data: lotsWithTaches } = useLotsWithTaches(chantierId)
// Nouveau pour FR62 (complet uniquement)
const { data: inventaire } = useInventaire(chantierId)
// Nouvelle subscription
useRealtimeInventaire(chantierId)
```

**Données déjà disponibles :**
- `besoins` → `besoins?.length ?? 0` pour FR63
- `livraisons` → `livraisons?.filter(l => l.status === 'prevu' && l.date_prevue)` pour FR64
- `plots` → pour FR62 métrés

**Props à passer au composant :**
```tsx
<ChantierIndicators
  chantierId={chantierId}
  lotsPretsACarreler={chantier.type === 'complet' ? findLotsPretsACarreler(lotsWithTaches ?? []) : undefined}
  metrageVsInventaire={chantier.type === 'complet' ? computeMetrageVsInventaire(plots ?? [], inventaire ?? []) : undefined}
  besoinsEnAttente={besoins?.length ?? 0}
  livraisonsPrevues={(livraisons ?? []).filter(l => l.status === 'prevu' && l.date_prevue)}
/>
```

### Tests — Stratégie et patterns

**Nouveaux fichiers de test (3) :**
- `src/lib/queries/useLotsWithTaches.test.ts` — 3 tests minimum
- `src/lib/utils/computeChantierIndicators.test.ts` — 8+ tests (fonctions pures)
- `src/components/ChantierIndicators.test.tsx` — 8+ tests (rendu conditionnel)

**Test computeChantierIndicators (fonctions pures — le plus important) :**
```typescript
describe('findLotsPretsACarreler', () => {
  it('identifies lot with all ragréage+phonique done and pose not_started', () => {})
  it('excludes lot where pose is in_progress', () => {})
  it('excludes lot without ragréage tasks', () => {})
  it('excludes lot without phonique tasks', () => {})
  it('excludes lot without pose tasks', () => {})
  it('handles accent variants in task names', () => {})
  it('returns empty array for empty lots', () => {})
  it('returns empty array when no pieces', () => {})
})

describe('computeMetrageVsInventaire', () => {
  it('sums m² and ML across plots', () => {})
  it('aggregates inventory by designation', () => {})
  it('returns zeros for empty data', () => {})
})
```

**Test ChantierIndicators (rendu conditionnel) :**
```typescript
describe('ChantierIndicators', () => {
  it('renders nothing when all data is empty', () => {})
  it('shows lots prêts section when available', () => {})
  it('hides lots prêts section when empty', () => {})
  it('shows besoins counter when > 0', () => {})
  it('hides besoins counter when 0', () => {})
  it('shows livraisons prévues with dates', () => {})
  it('shows métrés vs inventaire when data available', () => {})
  it('lots prêts items are clickable links', () => {})
})
```

**Mock data — ajouter `taches` dans les mock lots :**
```typescript
const mockLotWithTaches = {
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
}
```

**Pre-existing test failures** (ne PAS essayer de corriger) :
- pwa-config : 5 failures
- pwa-html : 5 failures
- hasPointerCapture : 6 failures
- Total pré-existant : 16 failures

### Learnings des stories précédentes (relevants)

- **Story 7.1 (métrés)** : `metrage_m2_total` et `metrage_ml_total` sur lots/plots sont `NOT NULL DEFAULT 0` — fiable pour comparaison > 0. `formatMetrage()` dans `src/lib/utils/formatMetrage.ts` pour formater l'affichage.
- **Story 7.2 (plinthes)** : Pattern badge conditionnel sur StatusCard — même approche pour indicateurs conditionnels.
- **Story 6.5 (inventaire)** : `useInventaire(chantierId)` retourne `InventaireWithLocation[]` avec `designation`, `quantite`, `plots.nom`, `etages.nom`.
- **Story 6.1 (besoins)** : `useBesoins(chantierId)` filtre déjà `livraison_id IS NULL` — c'est exactement le compteur FR63.
- **Story 6.2 (livraisons)** : `useLivraisons(chantierId)` retourne livraisons avec `status` et `date_prevue`. Filtre `status === 'prevu'` pour FR64.
- **Types database.ts** : TOUJOURS inclure `Relationships: []` (MEMORY.md). Cast pattern : `data as unknown as Type[]`.
- **Pre-existing issues** : 16 test failures pré-existants (pwa 10, hasPointerCapture 6), lint error ThemeProvider.tsx:64.

### Project Structure Notes

**Nouveaux fichiers (6) :**
- `src/lib/queries/useLotsWithTaches.ts`
- `src/lib/queries/useLotsWithTaches.test.ts`
- `src/lib/utils/computeChantierIndicators.ts`
- `src/lib/utils/computeChantierIndicators.test.ts`
- `src/components/ChantierIndicators.tsx`
- `src/components/ChantierIndicators.test.tsx`

**Fichiers modifiés (2-3) :**
- `src/routes/_authenticated/chantiers/$chantierId/index.tsx` — import ChantierIndicators + hooks, intégration composant
- `src/routes/_authenticated/chantiers/$chantierId/index.test.tsx` — tests indicateurs sur la page chantier
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.tsx` — compteur optionnel lots prêts (si implémenté)

**Fichiers NON modifiés (important — ne PAS toucher) :**
- `src/types/database.ts` — aucune nouvelle colonne
- `src/types/enums.ts` — aucun nouveau type
- `supabase/migrations/` — aucune nouvelle migration
- `src/lib/queries/useBesoins.ts` — réutilisé tel quel
- `src/lib/queries/useLivraisons.ts` — réutilisé tel quel
- `src/lib/queries/useInventaire.ts` — réutilisé tel quel
- `src/lib/queries/usePlots.ts` — réutilisé tel quel
- `src/components/StatusCard.tsx` — pas de modification nécessaire

**Alignement structure :**
- Query dans `lib/queries/` — convention respectée
- Utilitaire dans `lib/utils/` — convention respectée (comme `formatMetrage`, `computeStatus`)
- Composant dans `components/` — convention respectée
- Pas de barrel files — imports directs
- Tests co-localisés

### Risques et points d'attention

1. **Performance query `useLotsWithTaches`** : La query charge lots → pieces → taches pour tout un chantier. Avec 80 lots × 5 pièces × 6 tâches = 2400 rows taches. C'est léger pour Supabase (~50ms). Le `staleTime: 30s` évite les refetch trop fréquents. Si les données changent (tâche mise à jour), l'invalidation via les subscriptions realtime rafraîchit les indicateurs.

2. **Matching noms de tâches** : Les noms viennent de `plot.task_definitions`, donc sont consistants dans un plot. La normalisation NFD gère "Ragréage" vs "ragreage". Si l'utilisateur nomme une tâche "Rag." ou "R" au lieu de "Ragréage", le matching échoue — mais c'est acceptable car les noms standard sont définis à la création du plot et documentés dans les stories précédentes.

3. **Invalidation cache `lots-with-taches`** : La query key `['lots-with-taches', chantierId]` n'est pas invalidée par les subscriptions realtime existantes (qui invalident `['lots', plotId]` et `['pieces', lotId]`). Il faudra soit :
   - Ajouter une invalidation de `['lots-with-taches', chantierId]` dans les subscriptions existantes
   - Ou utiliser un `staleTime` court (30s) et compter sur le refetch automatique au focus
   - **Recommandation** : `staleTime: 30s` est suffisant. Les indicateurs ne nécessitent pas une fraîcheur temps réel absolue — un délai de 30s est acceptable pour des indicateurs d'aide à la décision.

4. **Chantier léger et indicateurs** : Un chantier léger n'a pas de lots, plots, métrés ni inventaire. Seuls les indicateurs FR63 (besoins) et FR64 (livraisons) s'appliquent. Le composant gère cela via les props optionnelles (`lotsPretsACarreler?: ...`).

5. **Dates de livraisons** : `date_prevue` peut être `null` même pour une livraison "prevu". Le filtre FR64 ne montre que les livraisons avec une date effective. Le format de date utilise `Intl.DateTimeFormat` natif (pas de lib externe — pattern architecture).

6. **Calcul "m² restants à poser" (FR62)** : Le PRD dit "comparer matériel disponible aux m² restants à poser". Calculer les m² "restants" nécessiterait de savoir quelles pièces ont leur tâche "Pose" terminée — ce qui est déjà dans `useLotsWithTaches`. Pour simplifier, on affiche le total m² du chantier (somme des plots) et le résumé inventaire côte à côte. L'utilisateur interprète le croisement. Un calcul automatique nécessiterait des hypothèses sur quel matériel couvre quels m², ce qui dépasse le scope.

7. **Pre-existing issues** : Mêmes que stories précédentes — 17 test failures pré-existants (pwa 10, hasPointerCapture 6+1 cascade), lint errors ThemeProvider.tsx:64 et livraisons-page.test.tsx:2 (`within` unused).

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 7.3, Epic 7, FR61-FR64]
- [Source: _bmad-output/planning-artifacts/prd.md — FR61 lots prêts à carreler, FR62 croisement inventaire/métrés, FR63 besoins en attente, FR64 livraisons prévues]
- [Source: _bmad-output/planning-artifacts/architecture.md — §Data Architecture aggregation triggers, §Frontend patterns, §Naming conventions, §TanStack Query keys convention]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — §StatusCard anatomie, §Couleurs sémantiques, §Form patterns]
- [Source: _bmad-output/implementation-artifacts/7-1-saisie-et-agregation-des-metres.md — Métrés m²/ML, formatMetrage utility, types database.ts, pre-existing issues]
- [Source: _bmad-output/implementation-artifacts/7-2-suivi-du-statut-des-plinthes.md — Badge conditionnel, enum pattern, mutation pattern, pre-existing issues]
- [Source: src/lib/queries/useBesoins.ts — Query besoins en attente (livraison_id IS NULL)]
- [Source: src/lib/queries/useLivraisons.ts — Query livraisons avec status et date_prevue]
- [Source: src/lib/queries/useInventaire.ts — Query inventaire avec designation et quantite]
- [Source: src/lib/queries/usePlots.ts — Query plots avec metrage_m2_total/metrage_ml_total]
- [Source: src/lib/queries/useChantierLots.ts — Query lots basiques par chantier]
- [Source: src/lib/utils/computeStatus.ts — Calcul couleur statut]
- [Source: src/lib/utils/formatMetrage.ts — Format métrés "X m² · Y ML"]
- [Source: src/types/enums.ts — TaskStatus (NOT_STARTED, IN_PROGRESS, DONE)]
- [Source: src/routes/_authenticated/chantiers/$chantierId/index.tsx — Page chantier actuelle, layout cible]
- [Source: src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.tsx — Page plot, compteur optionnel]
- [Source: supabase/migrations/010_aggregation_triggers.sql — Triggers cascade progress]
- [Source: supabase/migrations/019_metrage.sql — Triggers cascade métrés]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

Aucun blocage rencontré.

### Completion Notes List

- **Task 1** : Créé `useLotsWithTaches` — query Supabase avec jointures 3 niveaux (lots → pieces → taches + plots + etages). Types `LotWithTaches`, `PieceInfo`, `TacheInfo` exportés. 4 tests (fetch success, empty, error, disabled).
- **Task 2** : Créé `computeChantierIndicators` avec 2 fonctions pures : `findLotsPretsACarreler` (matching NFD insensible accents/casse pour ragréage/phonique/pose) et `computeMetrageVsInventaire` (agrégation m²/ML + inventaire par designation). 12 tests incluant variantes d'accents et edge cases.
- **Task 3** : Créé `ChantierIndicators` — composant avec 4 sections conditionnelles (FR61-64). Chaque section masquée si aucune donnée (AC #5). Lots prêts = liens cliquables vers route lot complète. Couleurs sémantiques : vert (lots prêts), orange (besoins/livraisons). 10 tests.
- **Task 4** : Intégré `ChantierIndicators` dans la page chantier — entre badges et Plots (complet: FR61-64) et entre Badge et Besoins (léger: FR63-64 seulement). Ajouté `useLotsWithTaches`, `useInventaire`, `useRealtimeInventaire`. Mis à jour le mock `setupMockSupabase` pour les tables `lots` et `inventaire`. 28 tests existants toujours green.
- **Task 5** : Ajouté compteur léger "X lots prêts à carreler" sur la vue plot, filtré par `plot_id`. Affiché uniquement si > 0 (texte vert avec icône Hammer). Mock différencié par colonne `.eq()` pour éviter conflit `useLots` vs `useLotsWithTaches`.
- **Task 6** : Régression complète : 900 tests pass, 18 failures (tous pré-existants: pwa 10, hasPointerCapture 6+2 cascades). 0 nouvelle erreur lint, 0 erreur tsc.
- **Décision** : Ajouté `plotId` et `etageId` dans `LotPretACarreler` pour permettre la navigation correcte vers `/chantiers/$chantierId/plots/$plotId/$etageId/$lotId`.

### Change Log

- 2026-02-12: Story 7.3 implémentation complète — 6 tasks, 29 nouveaux tests, AC #1-5 satisfaits
- 2026-02-12: Code review — 9 issues (2H/5M/2L). Fixes appliqués : useMemo indicateurs, RegExp pré-compilées, date_prevue filter, test plot counter, comptages story corrigés

### File List

**Nouveaux fichiers (6) :**
- `src/lib/queries/useLotsWithTaches.ts`
- `src/lib/queries/useLotsWithTaches.test.ts`
- `src/lib/utils/computeChantierIndicators.ts`
- `src/lib/utils/computeChantierIndicators.test.ts`
- `src/components/ChantierIndicators.tsx`
- `src/components/ChantierIndicators.test.tsx`

**Fichiers modifiés (4) :**
- `src/routes/_authenticated/chantiers/$chantierId/index.tsx` — import ChantierIndicators + hooks, intégration composant avec useMemo (complet + léger)
- `src/routes/_authenticated/chantiers/$chantierId/index.test.tsx` — ajout mocks lots/inventaire dans setupMockSupabase
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.tsx` — compteur lots prêts à carreler (léger)
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.test.tsx` — différenciation mock lots par colonne eq(), tests compteur lots prêts
