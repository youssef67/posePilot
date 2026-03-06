# Story 12.1: Attribution d'un intervenant de pose par lot

Status: done
Story ID: 12.1
Story Key: 12-1-attribution-intervenant-pose-par-lot
Epic: 12 — Attribution & traçabilité
Date: 2026-03-04
Dependencies: aucune

## Story

En tant que chef de chantier utilisant posePilot,
Je veux pouvoir attribuer optionnellement un intervenant (sous-traitant ou équipe interne) à chaque lot pour la phase de pose,
Afin de savoir rapidement qui a posé quoi et de filtrer les lots par intervenant.

## Contexte

Actuellement, aucune information ne permet de savoir qui a réalisé la pose d'un lot. En pratique, l'utilisateur travaille avec 3-4 sous-traitants récurrents + son équipe interne. Il a besoin de :
- Renseigner rapidement (en un tap) l'intervenant sur un lot — **optionnel**, pas obligatoire
- Consulter cette info sur la fiche lot
- Filtrer les lots par intervenant pour voir d'un coup d'œil qui a fait quoi

### Approche technique retenue

- **Table `intervenants`** globale (pas liée à un chantier) : `id`, `nom`, `created_by`, `created_at`
- **Colonne `intervenant_id`** nullable sur `lots` (FK vers `intervenants`)
- **Création inline** : lors de l'assignation sur un lot, l'utilisateur peut créer un nouvel intervenant à la volée (bouton "+" à côté du select)
- **Filtre par intervenant** sur la grille des lots (écran étage)

## Acceptance Criteria (BDD)

### AC1: Créer un intervenant inline

**Given** l'utilisateur est sur la fiche d'un lot
**When** il ouvre le sélecteur d'intervenant et tape un nom qui n'existe pas
**Then** une option "Créer [nom]" apparaît
**And** en la sélectionnant, l'intervenant est créé en base et assigné au lot

### AC2: Assigner un intervenant existant à un lot

**Given** des intervenants existent en base (ex: "A2M", "Martin", "Durand")
**When** l'utilisateur ouvre le sélecteur d'intervenant sur un lot
**Then** la liste des intervenants existants s'affiche
**And** en sélectionnant un intervenant, `lots.intervenant_id` est mis à jour

### AC3: Retirer l'intervenant d'un lot

**Given** un lot avec un intervenant assigné
**When** l'utilisateur sélectionne l'option "Aucun" / efface la sélection
**Then** `lots.intervenant_id` est mis à `null`
**And** le lot n'affiche plus d'intervenant

### AC4: Affichage de l'intervenant sur la fiche lot

**Given** un lot avec un intervenant assigné
**When** l'utilisateur consulte la fiche lot
**Then** le nom de l'intervenant est affiché de manière visible (badge ou ligne dédiée)

### AC5: Affichage de l'intervenant sur la carte lot (grille étage)

**Given** un lot avec un intervenant assigné
**When** l'utilisateur consulte la grille des lots d'un étage
**Then** le nom (ou initiales) de l'intervenant est visible sur la carte du lot

### AC6: Filtre par intervenant sur la grille des lots

**Given** l'utilisateur est sur l'écran d'un étage affichant la grille des lots
**When** il active le filtre par intervenant
**Then** seuls les lots assignés à l'intervenant sélectionné sont affichés
**And** une option "Non assigné" permet de voir les lots sans intervenant

### AC7: Suppression d'un intervenant

**Given** un intervenant qui n'est assigné à aucun lot (ou qui est assigné à des lots)
**When** l'utilisateur supprime cet intervenant (depuis le sélecteur ou gestion inline)
**Then** l'intervenant est supprimé de la base
**And** les lots qui lui étaient assignés passent à `intervenant_id = null`

### AC8: Optimistic updates

**Given** l'utilisateur assigne/retire un intervenant sur un lot
**When** la mutation est envoyée
**Then** le changement est reflété immédiatement dans l'UI (optimistic update)
**And** en cas d'erreur, l'état précédent est restauré avec un toast d'erreur

## Tasks / Subtasks

- [x] Task 1 — Migration SQL : table `intervenants` et colonne `lots.intervenant_id` (AC: #1, #2, #3, #7)
  - [x] 1.1 Créer la table `intervenants` (id uuid PK default gen_random_uuid(), nom text NOT NULL, created_by uuid REFERENCES auth.users NOT NULL DEFAULT auth.uid(), created_at timestamptz DEFAULT now())
  - [x] 1.2 Ajouter colonne `intervenant_id uuid REFERENCES intervenants(id) ON DELETE SET NULL` sur `lots`
  - [x] 1.3 RLS policies sur `intervenants` : authenticated users CRUD
  - [x] 1.4 Index sur `lots.intervenant_id`
  - [x] 1.5 Mettre à jour `src/types/database.ts` avec les nouveaux types

- [x] Task 2 — Queries et mutations (AC: #1, #2, #3, #7, #8)
  - [x] 2.1 Hook `useIntervenants` : query pour récupérer tous les intervenants (triés par nom)
  - [x] 2.2 Hook `useCreateIntervenant` : mutation pour créer un intervenant (optimistic update)
  - [x] 2.3 Hook `useDeleteIntervenant` : mutation pour supprimer un intervenant
  - [x] 2.4 Hook `useUpdateLotIntervenant` : mutation pour assigner/retirer un intervenant sur un lot (optimistic update)
  - [x] 2.5 Tests unitaires pour les hooks

- [x] Task 3 — Composant sélecteur d'intervenant (AC: #1, #2, #3)
  - [x] 3.1 Composant `IntervenantCombobox` : combobox avec recherche, liste des intervenants, option "Créer [nom]", option "Aucun"
  - [x] 3.2 Tests du composant

- [x] Task 4 — Intégration fiche lot (AC: #2, #3, #4, #8)
  - [x] 4.1 Ajouter le `IntervenantCombobox` sur la fiche lot (section dédiée ou ligne inline)
  - [x] 4.2 Afficher le nom de l'intervenant quand assigné (mode lecture)
  - [x] 4.3 Tests d'intégration

- [x] Task 5 — Affichage sur la carte lot dans la grille étage (AC: #5)
  - [x] 5.1 Inclure `intervenant_id` + nom dans la query des lots
  - [x] 5.2 Afficher le nom ou initiales de l'intervenant sur la carte lot
  - [x] 5.3 Tests

- [x] Task 6 — Filtre par intervenant sur la grille des lots (AC: #6)
  - [x] 6.1 Ajouter un onglet/filtre "Intervenant" dans les filtres existants de la grille (GridFilterTabs ou équivalent)
  - [x] 6.2 Logique de filtrage côté client (incluant "Non assigné")
  - [x] 6.3 Tests du filtre

## Dev Notes

### Table `intervenants`

```sql
CREATE TABLE intervenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  created_by uuid REFERENCES auth.users NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE intervenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own intervenants"
  ON intervenants FOR ALL
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());
```

### Colonne sur lots

```sql
ALTER TABLE lots ADD COLUMN intervenant_id uuid REFERENCES intervenants(id) ON DELETE SET NULL;
CREATE INDEX idx_lots_intervenant_id ON lots (intervenant_id);
```

### UX — Combobox inline

Le composant `IntervenantCombobox` s'inspire du pattern shadcn/ui Combobox :
- Input de recherche filtrant la liste
- Items existants en suggestions
- Si le texte tapé ne match aucun intervenant → afficher "Créer «texte»"
- Sélection → mutation `useUpdateLotIntervenant`
- Création → mutation `useCreateIntervenant` puis assignation

### Affichage carte lot

Sur la carte lot (grille étage), afficher les initiales de l'intervenant dans un petit badge discret (ex: coin bas-droit). Si le nom est court (≤5 chars), afficher le nom complet.

### Filtre

Réutiliser le pattern `GridFilterTabs` existant ou ajouter un select/dropdown dédié dans la barre de filtres de l'étage.

## File List

### New Files
- `supabase/migrations/057_intervenants.sql` — Migration SQL: table intervenants + colonne lots.intervenant_id + RLS + index
- `src/lib/queries/useIntervenants.ts` — Query hook pour récupérer tous les intervenants
- `src/lib/queries/useIntervenants.test.ts` — Tests du hook useIntervenants (2 tests)
- `src/lib/mutations/useCreateIntervenant.ts` — Mutation avec optimistic update pour créer un intervenant
- `src/lib/mutations/useCreateIntervenant.test.ts` — Tests (4 tests)
- `src/lib/mutations/useDeleteIntervenant.ts` — Mutation avec optimistic update pour supprimer un intervenant
- `src/lib/mutations/useDeleteIntervenant.test.ts` — Tests (4 tests)
- `src/lib/mutations/useUpdateLotIntervenant.ts` — Mutation pour assigner/retirer un intervenant sur un lot
- `src/lib/mutations/useUpdateLotIntervenant.test.ts` — Tests (5 tests)
- `src/components/IntervenantCombobox.tsx` — Combobox Popover+Command avec recherche, création inline, sélection, suppression
- `src/components/IntervenantCombobox.test.tsx` — Tests du composant (3 tests)

### Modified Files
- `src/types/database.ts` — Ajout type `intervenants` table + `intervenant_id` sur lots Row/Insert/Update + type `Intervenant`
- `src/lib/queries/useLots.ts` — Ajout `intervenants(nom)` au select + type `intervenants` dans `LotWithRelations`
- `src/lib/queries/useLots.test.ts` — Mise à jour assertion select string
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/index.tsx` — Ajout IntervenantCombobox sur la fiche lot
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/index.test.tsx` — 4 nouveaux tests AC #2/#3/#4
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/index.tsx` — Badge intervenant sur carte lot + filtre Select par intervenant
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/index.test.tsx` — 5 nouveaux tests AC #5/#6

## Dev Agent Record

### Implementation Notes
- **Composant IntervenantCombobox** : basé sur le pattern Popover + Command (cmdk) de shadcn/ui, similaire au BadgeSelector existant. Inclut recherche, création inline, sélection, option "Aucun", et suppression avec bouton Trash2 sur chaque item.
- **Affichage carte lot** : initiales si nom > 5 chars (première lettre de chaque mot), nom complet sinon. Badge indigo `variant="outline"`.
- **Filtre intervenant** : Select dropdown ajouté à côté de GridFilterTabs. Options: "Tous les intervenants", "Non assigné", et chaque intervenant existant. Filtrage appliqué côté client via IIFE wrapping les lots déjà filtrés par GridFilterTabs.
- **Optimistic updates** : implémentés sur useCreateIntervenant (ajout temp dans cache), useDeleteIntervenant (retrait du cache), et useUpdateLotIntervenant (mise à jour intervenant_id dans cache lots). Toast d'erreur sur rollback de useUpdateLotIntervenant.
- **Tests** : 31 tests ajoutés/modifiés au total. 28 échecs pré-existants confirmés par stash test (non liés à cette story).
- **`placeholderData: []`** sur useIntervenants pour consistance avec les autres hooks (useLots, etc.).

### Code Review Fixes (AI — 2026-03-06)
- **[H1] Fix filtre intervenant cassé** : `$etageId/index.tsx:444` — `filteredLots.map` → `displayedLots.map` (le filtre ne filtrait pas le rendu)
- **[H2] Fix RLS trop restrictive** : `057_intervenants.sql` — policy changée de `created_by = auth.uid()` à `auth.uid() IS NOT NULL` (intervenants partagés entre utilisateurs)
- **[M1] Fix optimistic update incomplet** : `useUpdateLotIntervenant.ts` — ajout de `intervenantNom` à l'interface, mise à jour de la relation `intervenants: { nom }` dans le cache (badge grille étage se rafraîchit en optimistic)
- **[M3] Contrainte UNIQUE ajoutée** : `057_intervenants.sql` — `UNIQUE(nom)` pour empêcher les doublons d'intervenants
- **[L1] Toast d'erreur ajouté** : `useCreateIntervenant.ts` et `useDeleteIntervenant.ts` — feedback utilisateur cohérent sur erreur
- **Tests ajoutés** : 2 tests filtre intervenant AC6 dans `$etageId/index.test.tsx` (filtre par intervenant + filtre "Non assigné"), polyfills Radix Select ajoutés
- **Tests mis à jour** : mocks sonner sur useCreateIntervenant/useDeleteIntervenant, `intervenantNom` dans useUpdateLotIntervenant tests, assertion optimistic update sur relation `intervenants`
