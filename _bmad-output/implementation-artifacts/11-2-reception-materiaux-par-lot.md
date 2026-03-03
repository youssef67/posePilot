# Story 11.2: Réception matériaux par lot

Status: review
Story ID: 11.2
Story Key: 11-2-reception-materiaux-par-lot
Epic: 11 — Suivi financier matériaux
Date: 2026-03-03
Dependencies: Aucune

## Story

En tant qu'utilisateur de posePilot,
Je veux marquer rapidement, lot par lot depuis la vue étage, que les matériaux sont reçus sur site,
Afin de savoir quels lots sont réellement prêts à carreler (préparation terminée ET matériaux présents).

## Acceptance Criteria

### AC1: Colonne `materiaux_recus` sur les lots

**Given** la table `lots` en base de données
**When** la migration est appliquée
**Then** chaque lot possède un champ `materiaux_recus` (boolean, default `false`)

### AC2: Toggle "Matériaux reçus" sur la vue étage

**Given** je suis sur la page étage (liste des lots)
**When** j'affiche un lot dans la liste
**Then** un toggle compact (icône Package / PackageCheck) est visible sur chaque carte lot
**And** l'état reflète la valeur `materiaux_recus` du lot (grisé = false, vert = true)

### AC3: Basculer l'état au tap

**Given** je suis sur la page étage et je vois un lot avec le toggle matériaux
**When** je tape sur le toggle
**Then** la valeur `materiaux_recus` est inversée en base (mutation optimiste)
**And** le feedback visuel est immédiat (icône bascule entre Package grisé et PackageCheck vert)
**And** un toast confirme l'action ("Matériaux reçus ✓" ou "Matériaux retirés")

### AC4: Indicateur matériaux sur la carte lot

**Given** un lot a `materiaux_recus = true`
**When** j'affiche la page étage
**Then** l'icône PackageCheck verte est visible sur la carte du lot, clairement distincte des autres badges

### AC5: "Prêt à carreler" conditionné par matériaux reçus

**Given** un lot remplit les conditions actuelles de "prêt à carreler" (ragréage done + phonique done + pose not_started)
**When** `materiaux_recus` est `false`
**Then** ce lot n'apparaît PAS dans les indicateurs "prêt à carreler"

**Given** un lot remplit les conditions actuelles + `materiaux_recus = true`
**When** les indicateurs sont calculés
**Then** ce lot apparaît dans "prêt à carreler"

### AC6: Badge matériaux visible sur la fiche lot

**Given** je suis sur la page détail d'un lot
**When** le lot a `materiaux_recus = true`
**Then** un indicateur visuel (badge ou icône) confirme que les matériaux sont reçus

## Tasks / Subtasks

- [x] Task 1 — Migration SQL : colonne `materiaux_recus` (AC: #1)
  - [x] 1.1 Créer `supabase/migrations/053_materiaux_recus.sql`
  - [x] 1.2 Ajouter colonne `materiaux_recus boolean NOT NULL DEFAULT false` à la table `lots`
  - [x] 1.3 Ajouter policy RLS (si applicable — vérifier le pattern existant)

- [x] Task 2 — Mettre à jour les types TypeScript (AC: #1)
  - [x] 2.1 Ajouter `materiaux_recus: boolean` dans `lots` Row/Insert/Update dans `database.ts`

- [x] Task 3 — Mutation `useUpdateLotMateriauxRecus` (AC: #3)
  - [x] 3.1 Créer `src/lib/mutations/useUpdateLotMateriauxRecus.ts` — update `lots.materiaux_recus` via Supabase
  - [x] 3.2 Invalidation optimiste du cache TanStack Query : `['lots', plotId]`
  - [x] 3.3 Tests unitaires de la mutation

- [x] Task 4 — UI vue étage : toggle matériaux sur chaque carte lot (AC: #2, #3, #4)
  - [x] 4.1 Ajouter un bouton icône compact sur chaque carte lot dans la page étage (`$etageId/index.tsx`)
  - [x] 4.2 Icône : `Package` (lucide) grisé quand `false`, `PackageCheck` (lucide) vert quand `true`
  - [x] 4.3 Au tap : appeler `useUpdateLotMateriauxRecus` avec la valeur inversée
  - [x] 4.4 Toast de confirmation : "Matériaux reçus ✓" / "Matériaux retirés"
  - [x] 4.5 Le toggle ne doit PAS déclencher la navigation vers le lot (stopPropagation)
  - [x] 4.6 Tests unitaires (rendu icône selon état, tap bascule, pas de navigation)

- [x] Task 5 — Mettre à jour `findLotsPretsACarreler` (AC: #5)
  - [x] 5.1 Dans `computeChantierIndicators.ts`, ajouter la condition `materiaux_recus === true` au filtre
  - [x] 5.2 Mettre à jour l'interface ou le type `LotWithTaches` si nécessaire pour inclure `materiaux_recus`
  - [x] 5.3 Tests unitaires : lot éligible sans matériaux → exclu, lot éligible avec matériaux → inclus

- [x] Task 6 — Indicateur sur la fiche lot (AC: #6)
  - [x] 6.1 Dans la page détail lot (`$lotId/index.tsx`), afficher un badge/icône "Matériaux reçus" si `materiaux_recus === true`
  - [x] 6.2 Tests unitaires

## Dev Notes

### Migration SQL

Fichier : `supabase/migrations/053_materiaux_recus.sql` — suit la numérotation existante (dernier : `052_cout_materiaux.sql`).

```sql
ALTER TABLE lots ADD COLUMN materiaux_recus boolean NOT NULL DEFAULT false;
```

Pas de trigger cascade nécessaire — c'est un booléen local au lot, pas d'agrégation vers étage/plot/chantier.

### Pattern du toggle — UX terrain

Le toggle doit être **ultra rapide** à utiliser sur le terrain. L'utilisateur parcourt la liste des lots sur la vue étage et tape lot par lot.

```
┌──────────────────────────────────────────┐
│ Lot 2A51              3/8    📦          │
│ Classique · 3 pièces         ← grisé    │
│ 12,5 m² · 1 250 €                       │
├──────────────────────────────────────────┤
│ Lot 2A52              5/8    📦✓         │
│ Classique · 3 pièces         ← vert     │
│ 14,0 m² · 980 €                         │
└──────────────────────────────────────────┘
```

L'icône est positionnée **à droite de l'indicateur de progression** (ou dans la zone badge), visible sans ouvrir le lot.

### Impact sur `findLotsPretsACarreler`

Ligne 40 de `computeChantierIndicators.ts` — ajouter au `return` :

```typescript
return (
  ragreage.every((t) => t.status === 'done') &&
  phonique.every((t) => t.status === 'done') &&
  pose.every((t) => t.status === 'not_started') &&
  lot.materiaux_recus === true  // ← NOUVEAU
)
```

### Mutation — Pattern existant

Suivre le pattern de `useUpdateLotCoutMateriaux.ts` : mutation Supabase + invalidation optimiste `['lots', plotId]`.

### Icônes Lucide

- `Package` — matériaux non reçus (grisé, `text-muted-foreground`)
- `PackageCheck` — matériaux reçus (vert, `text-green-600 dark:text-green-400`)

### Project Structure Notes

- Migration : `supabase/migrations/053_materiaux_recus.sql`
- Types : `src/types/database.ts`
- Mutation : `src/lib/mutations/useUpdateLotMateriauxRecus.ts`
- Pages modifiées :
  - `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/index.tsx` (vue étage — toggle)
  - `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/index.tsx` (fiche lot — badge lecture)
- Logique : `src/lib/utils/computeChantierIndicators.ts` (condition prêt à carreler)
- Tests : `src/lib/utils/computeChantierIndicators.test.ts`

### References

- [Source: src/lib/utils/computeChantierIndicators.ts] — logique `findLotsPretsACarreler`
- [Source: src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/index.tsx] — vue étage actuelle
- [Source: src/lib/queries/useLots.ts] — query lots avec relations
- [Source: src/lib/mutations/useUpdateLotCoutMateriaux.ts] — pattern mutation à suivre
- [Source: supabase/migrations/052_cout_materiaux.sql] — dernière migration

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- 4 tests pré-existants en échec sur lot detail page (GridFilterTabs) — identiques à story 11.1, aucune régression introduite

### Completion Notes List

- Task 1: Migration `053_materiaux_recus.sql` — `ALTER TABLE lots ADD COLUMN materiaux_recus boolean NOT NULL DEFAULT false`
- Task 2: `database.ts` — ajout `materiaux_recus: boolean` dans lots Row/Insert/Update
- Task 3: `useUpdateLotMateriauxRecus` — mutation Supabase + invalidation `['lots', plotId]` + 3 tests unitaires
- Task 4: Toggle Package/PackageCheck sur vue étage — bouton à droite de chaque carte lot, stopPropagation, toast, masqué en mode sélection + 4 tests unitaires
- Task 5: `findLotsPretsACarreler` — ajout condition `materiaux_recus === true` + `LotWithTaches` interface + select query mis à jour + 2 tests unitaires
- Task 6: Badge "Matériaux reçus" (PackageCheck vert + texte) sur fiche lot quand `materiaux_recus === true` + 2 tests unitaires

### Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-03-03 | Implémentation complète story 11.2 | Feature request |

### File List

**Created:**
- `supabase/migrations/053_materiaux_recus.sql` — colonne booléenne
- `src/lib/mutations/useUpdateLotMateriauxRecus.ts` — mutation Supabase
- `src/lib/mutations/useUpdateLotMateriauxRecus.test.ts` — 3 tests unitaires

**Modified:**
- `src/types/database.ts` — ajout `materiaux_recus` dans lots Row/Insert/Update
- `src/lib/queries/useLotsWithTaches.ts` — ajout `materiaux_recus` dans interface + select
- `src/lib/utils/computeChantierIndicators.ts` — condition `materiaux_recus === true` dans `findLotsPretsACarreler`
- `src/lib/utils/computeChantierIndicators.test.ts` — 2 tests ajoutés pour materiaux_recus
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/index.tsx` — toggle matériaux sur cartes lot
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/index.test.tsx` — 4 tests ajoutés pour toggle
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/index.tsx` — badge "Matériaux reçus"
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/index.test.tsx` — 2 tests ajoutés pour badge
