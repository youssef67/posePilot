# Story 11.8: Réception matériaux — statut partiel et notes

Status: done
Story ID: 11.8
Story Key: 11-8-reception-materiaux-statut-partiel-et-notes
Epic: 11 — Suivi financier matériaux
Date: 2026-03-23
Dependencies: 11.2 (Réception matériaux par lot)

## Story

En tant que chef de chantier utilisant posePilot,
Je veux pouvoir indiquer un statut de réception plus précis (non reçu, partiel, reçu) et ajouter une note libre sur chaque lot,
Afin de savoir exactement quels matériaux manquent et de communiquer cette information à toute l'équipe.

## Contexte

Actuellement, `materiaux_recus` est un simple booléen sur la table `lots`. En pratique, il arrive fréquemment que seule une partie des matériaux soit livrée. L'utilisateur a besoin de :
- Distinguer 3 états : **non reçu**, **partiel** (il manque du matériel), **reçu** (tout est là)
- Ajouter une **note libre** pour préciser ce qui manque ou toute autre information
- Voir clairement sur la vue étage quels lots sont en état partiel (indicateur "manquant")
- Que cette note soit visible par tous les utilisateurs ayant accès au chantier

### Approche UX retenue

- **Bottom sheet** au clic sur l'icône matériaux (mobile-first) au lieu du toggle simple
- 3 choix radio : Non reçu / Partiel / Reçu
- Champ texte libre pour la note
- Bouton de validation
- **Feedback visuel au survol/focus** : `cursor-pointer` + transition sur l'icône

### Approche technique retenue

- **Migration** : renommer `materiaux_recus: boolean` → `materiaux_statut: text` (enum applicatif `'non_recu' | 'partiel' | 'recu'`, default `'non_recu'`) + ajout colonne `materiaux_note: text | null`
- Migration des données existantes : `true → 'recu'`, `false → 'non_recu'`
- **Suppression** de l'ancienne colonne `materiaux_recus` après migration
- **"Prêt à carreler"** : seul `materiaux_statut === 'recu'` qualifie

### Icônes

- `Package` (lucide) — non reçu → gris `text-muted-foreground`
- `PackageMinus` (lucide) — partiel → ambre `text-amber-600 dark:text-amber-400`
- `PackageCheck` (lucide) — reçu → vert `text-green-600 dark:text-green-400`

## Acceptance Criteria (BDD)

### AC1: Migration — colonne `materiaux_statut` et `materiaux_note`

**Given** la table `lots` avec la colonne `materiaux_recus` boolean
**When** la migration est appliquée
**Then** la colonne `materiaux_statut` (text, NOT NULL, default `'non_recu'`) existe
**And** les lots avec `materiaux_recus = true` ont `materiaux_statut = 'recu'`
**And** les lots avec `materiaux_recus = false` ont `materiaux_statut = 'non_recu'`
**And** la colonne `materiaux_note` (text, nullable) existe
**And** l'ancienne colonne `materiaux_recus` est supprimée

### AC2: Feedback visuel au survol du bouton matériaux

**Given** je suis sur la page étage (liste des lots)
**When** je survole ou focus le bouton matériaux d'un lot
**Then** le curseur passe en `pointer`
**And** l'icône a une transition visuelle (scale ou couleur) indiquant qu'il est cliquable

### AC3: Bottom sheet au clic sur l'icône matériaux

**Given** je suis sur la page étage
**When** je clique sur l'icône matériaux d'un lot
**Then** un bottom sheet s'ouvre avec :
- Le code du lot en titre
- 3 options radio : "Non reçu", "Partiel", "Reçu" (pré-sélectionnée selon l'état actuel)
- Un champ texte libre "Note" (pré-rempli si une note existe)
- Un bouton "Valider"
**And** le clic ne déclenche PAS la navigation vers le lot

### AC4: Mise à jour du statut et de la note

**Given** le bottom sheet est ouvert pour un lot
**When** je sélectionne un statut et/ou modifie la note, puis je clique "Valider"
**Then** le `materiaux_statut` et `materiaux_note` sont mis à jour en base
**And** un toast confirme l'action
**And** le bottom sheet se ferme
**And** l'icône sur la carte lot reflète immédiatement le nouveau statut

### AC5: Affichage 3 états sur la vue étage

**Given** je suis sur la page étage
**When** j'affiche les lots
**Then** chaque lot affiche l'icône correspondant à son statut :
- `non_recu` : `Package` gris
- `partiel` : `PackageMinus` ambre
- `recu` : `PackageCheck` vert

### AC6: Indicateur "manquant" sur les lots en état partiel

**Given** un lot a `materiaux_statut = 'partiel'`
**When** j'affiche la page étage
**Then** un indicateur visuel clair (badge ambre "Partiel") est affiché sur la carte du lot
**And** l'indicateur est visible sans ouvrir le lot

### AC7: Affichage de la note sur la vue étage

**Given** un lot a une `materiaux_note` non vide
**When** j'affiche la page étage
**Then** une icône `MessageSquareText` apparaît à côté de l'icône matériaux
**And** un tap sur cette icône (ou un hover sur desktop) révèle le contenu de la note

### AC8: Affichage du statut et de la note sur la fiche lot

**Given** je suis sur la page détail d'un lot
**When** le lot a `materiaux_statut` = `'partiel'` ou `'recu'`
**Then** un badge avec l'icône et le label correspondant est affiché ("Matériaux partiels" ambre ou "Matériaux reçus" vert)
**And** si une `materiaux_note` existe, elle est affichée en dessous du badge

### AC9: "Prêt à carreler" conditionné par `materiaux_statut = 'recu'`

**Given** un lot remplit les conditions de "prêt à carreler" (tâches bloquantes done + pose not_started)
**When** `materiaux_statut` est `'partiel'` ou `'non_recu'`
**Then** ce lot n'apparaît PAS dans les indicateurs "prêt à carreler"

**Given** un lot remplit les conditions + `materiaux_statut = 'recu'`
**When** les indicateurs sont calculés
**Then** ce lot apparaît dans "prêt à carreler"

## Tasks / Subtasks

- [x] Task 1 — Migration SQL : `materiaux_statut` + `materiaux_note` (AC: #1)
  - [x] 1.1 Créer `supabase/migrations/063_materiaux_statut_note.sql`
  - [x] 1.2 Ajouter colonne `materiaux_statut text NOT NULL DEFAULT 'non_recu'`
  - [x] 1.3 Migrer données : `UPDATE lots SET materiaux_statut = 'recu' WHERE materiaux_recus = true`
  - [x] 1.4 Ajouter colonne `materiaux_note text`
  - [x] 1.5 Supprimer colonne `materiaux_recus`
  - [x] 1.6 Ajouter contrainte CHECK : `materiaux_statut IN ('non_recu', 'partiel', 'recu')`

- [x] Task 2 — Mettre à jour les types TypeScript (AC: #1)
  - [x] 2.1 Dans `database.ts` : remplacer `materiaux_recus: boolean` par `materiaux_statut: string` + `materiaux_note: string | null` dans lots Row/Insert/Update
  - [x] 2.2 Créer un type applicatif `MateriauxStatut = 'non_recu' | 'partiel' | 'recu'` (dans un fichier types ou inline)

- [x] Task 3 — Mettre à jour la mutation (AC: #4)
  - [x] 3.1 Renommer/modifier `useUpdateLotMateriauxRecus` → `useUpdateLotMateriaux` pour accepter `{ lotId, plotId, materiaux_statut, materiaux_note }`
  - [x] 3.2 Update Supabase : `lots.materiaux_statut` + `lots.materiaux_note`
  - [x] 3.3 Mettre à jour les tests unitaires de la mutation

- [x] Task 4 — Mettre à jour `useLotsWithTaches` et `findLotsPretsACarreler` (AC: #9)
  - [x] 4.1 Dans `useLotsWithTaches.ts` : remplacer `materiaux_recus: boolean` par `materiaux_statut: string` + `materiaux_note: string | null` dans l'interface et le select
  - [x] 4.2 Dans `computeChantierIndicators.ts` : remplacer `lot.materiaux_recus === true` par `lot.materiaux_statut === 'recu'`
  - [x] 4.3 Mettre à jour les tests : lot partiel → exclu, lot recu → inclus, lot non_recu → exclu

- [x] Task 5 — Composant `MateriauxSheet` (AC: #3, #4)
  - [x] 5.1 Créer `src/components/MateriauxSheet.tsx` — bottom sheet avec :
    - Props : `open`, `onOpenChange`, `lotCode`, `currentStatut`, `currentNote`, `onSubmit`
    - 3 boutons radio : Non reçu / Partiel / Reçu
    - Textarea "Note (optionnelle)"
    - Bouton "Valider"
  - [x] 5.2 Tests unitaires du composant (rendu, sélection, soumission)

- [x] Task 6 — UI vue étage : bottom sheet + icônes 3 états + feedback survol (AC: #2, #3, #5, #6, #7)
  - [x] 6.1 Remplacer le toggle booléen par ouverture du `MateriauxSheet` au clic
  - [x] 6.2 Ajouter `cursor-pointer` et transition hover/focus sur le bouton (`hover:scale-110 transition-transform`)
  - [x] 6.3 Afficher l'icône selon `materiaux_statut` : Package (gris) / PackageMinus (ambre) / PackageCheck (vert)
  - [x] 6.4 Afficher un badge "Partiel" ambre quand `materiaux_statut === 'partiel'`
  - [x] 6.5 Afficher icône `MessageSquareText` si `materiaux_note` non vide, avec tooltip/popover au tap
  - [x] 6.6 Mettre à jour les tests unitaires existants + ajouter tests pour les 3 états, badge partiel, note

- [x] Task 7 — Indicateur sur la fiche lot (AC: #8)
  - [x] 7.1 Remplacer le badge booléen par un badge 3 états ("Matériaux reçus" vert / "Matériaux partiels" ambre)
  - [x] 7.2 Afficher la `materiaux_note` en dessous du badge si non vide
  - [x] 7.3 Mettre à jour les tests unitaires

## Dev Notes

### Migration SQL

Fichier : `supabase/migrations/063_materiaux_statut_note.sql` — suit la numérotation existante (dernier : `062_reservation_photos.sql`).

```sql
-- Ajout des nouvelles colonnes
ALTER TABLE lots ADD COLUMN materiaux_statut text NOT NULL DEFAULT 'non_recu';
ALTER TABLE lots ADD COLUMN materiaux_note text;

-- Migration des données existantes
UPDATE lots SET materiaux_statut = 'recu' WHERE materiaux_recus = true;

-- Suppression de l'ancienne colonne
ALTER TABLE lots DROP COLUMN materiaux_recus;

-- Contrainte de validation
ALTER TABLE lots ADD CONSTRAINT lots_materiaux_statut_check
  CHECK (materiaux_statut IN ('non_recu', 'partiel', 'recu'));
```

### Bottom Sheet — Pattern existant

Suivre le pattern de `MemoFormSheet.tsx` / `TransferSheet.tsx` :
- `Sheet` + `SheetContent side="bottom"` avec `className="max-h-[85vh] overflow-y-auto"`
- `SheetHeader` avec titre + description
- `SheetFooter` avec `Button className="w-full"`
- State : `open` + `onOpenChange` passés en props

### Icônes Lucide

- `Package` — non reçu → `text-muted-foreground`
- `PackageMinus` — partiel → `text-amber-600 dark:text-amber-400`
- `PackageCheck` — reçu → `text-green-600 dark:text-green-400`
- `MessageSquareText` — indicateur note présente

### Feedback hover

```tsx
className="shrink-0 p-2 rounded-md cursor-pointer hover:scale-110 active:scale-95 transition-transform"
```

### Impact sur `findLotsPretsACarreler`

Remplacer `lot.materiaux_recus === true` par `lot.materiaux_statut === 'recu'` dans `computeChantierIndicators.ts`.

### Project Structure Notes

- Migration : `supabase/migrations/063_materiaux_statut_note.sql`
- Types : `src/types/database.ts`
- Mutation : `src/lib/mutations/useUpdateLotMateriauxRecus.ts` → renommer `useUpdateLotMateriaux.ts`
- Nouveau composant : `src/components/MateriauxSheet.tsx`
- Pages modifiées :
  - `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/index.tsx` (vue étage — bottom sheet + icônes)
  - `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/index.tsx` (fiche lot — badge + note)
- Logique : `src/lib/utils/computeChantierIndicators.ts`
- Query : `src/lib/queries/useLotsWithTaches.ts`

### References

- [Source: story 11.2] — implémentation initiale du toggle matériaux
- [Source: src/components/MemoFormSheet.tsx] — pattern bottom sheet à suivre
- [Source: src/components/TransferSheet.tsx] — pattern bottom sheet à suivre
- [Source: src/lib/mutations/useUpdateLotMateriauxRecus.ts] — mutation à modifier
- [Source: src/lib/utils/computeChantierIndicators.ts] — logique prêt à carreler
- [Source: src/lib/queries/useLotsWithTaches.ts] — interface LotWithTaches

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- 4 tests pré-existants en échec sur lot detail page (GridFilterTabs) — identiques à story 11.2, aucune régression introduite
- 35 autres tests en échec pré-existants (PlotIndexPage variantes/batch, ChantierIndexPage complet, PWA, etc.) — non liés à cette story

### Completion Notes List

- Task 1: Migration `063_materiaux_statut_note.sql` — ajout `materiaux_statut` + `materiaux_note`, migration données, suppression `materiaux_recus`, contrainte CHECK
- Task 2: `database.ts` — remplacement `materiaux_recus: boolean` par `materiaux_statut: string` + `materiaux_note: string | null` dans lots Row/Insert/Update
- Task 3: `useUpdateLotMateriaux.ts` — nouvelle mutation acceptant statut + note, suppression ancien fichier + 3 tests unitaires
- Task 4: `useLotsWithTaches` interface + select mis à jour, `findLotsPretsACarreler` condition `materiaux_statut === 'recu'` + 3 tests (non_recu exclu, partiel exclu, recu inclus)
- Task 5: `MateriauxSheet.tsx` — bottom sheet avec 3 boutons toggle (non reçu/partiel/reçu) + textarea note + 7 tests unitaires
- Task 6: Vue étage — ouverture MateriauxSheet au clic, icônes 3 couleurs (Package/PackageMinus/PackageCheck), badge "Partiel" ambre, icône MessageSquareText pour note, hover:scale-110 + cursor-pointer + 6 tests
- Task 7: Fiche lot — badge "Matériaux reçus" vert / "Matériaux partiels" ambre + affichage note en texte + 4 tests

### Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-03-23 | Implémentation complète story 11.8 | Feature request — statut partiel + notes matériaux |

### File List

**Created:**
- `supabase/migrations/063_materiaux_statut_note.sql` — migration booléen → enum texte + note
- `src/lib/mutations/useUpdateLotMateriaux.ts` — mutation statut + note
- `src/lib/mutations/useUpdateLotMateriaux.test.ts` — 3 tests unitaires
- `src/components/MateriauxSheet.tsx` — bottom sheet 3 états + note
- `src/components/MateriauxSheet.test.tsx` — 7 tests unitaires

**Deleted:**
- `src/lib/mutations/useUpdateLotMateriauxRecus.ts` — remplacé par useUpdateLotMateriaux
- `src/lib/mutations/useUpdateLotMateriauxRecus.test.ts` — remplacé

**Modified:**
- `src/types/database.ts` — `materiaux_statut: string` + `materiaux_note: string | null` dans lots Row/Insert/Update
- `src/lib/queries/useLotsWithTaches.ts` — interface + select mis à jour
- `src/lib/queries/useLotsWithTaches.test.ts` — mock data mis à jour
- `src/lib/utils/computeChantierIndicators.ts` — condition `materiaux_statut === 'recu'`
- `src/lib/utils/computeChantierIndicators.test.ts` — 3 tests mis à jour (non_recu, partiel, recu)
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/index.tsx` — MateriauxSheet + icônes 3 états + badge partiel + note icon + hover
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/index.test.tsx` — 6 tests mis à jour
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/index.tsx` — badge 3 états + note texte
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/index.test.tsx` — 4 tests (recu, partiel, non_recu, note)
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.test.tsx` — mock data mis à jour
- `src/routes/_authenticated/chantiers/$chantierId/index.test.tsx` — mock data mis à jour
- `src/__tests__/etage-inventaire-page.test.tsx` — mock data mis à jour
