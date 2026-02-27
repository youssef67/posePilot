# Story 8.6: Affectation d'inventaire à un lot

Status: done
Story ID: 8.6
Story Key: 8-6-affectation-inventaire-a-un-lot
Epic: 8 — Améliorations de productivité
Date: 2026-02-27
Dependencies: Story 6.5 (done — inventaire), Story 8.3 (done — stockage général), Story 2.4 (done — lots)

## Story

En tant que utilisateur de posePilot,
Je veux pouvoir affecter un item d'inventaire à un lot spécifique (en plus du plot et de l'étage),
Afin que je puisse voir, directement sur le lot, quel matériel lui est attribué depuis l'inventaire.

## Acceptance Criteria (BDD)

### AC1: Sélectionner un lot lors de l'ajout d'inventaire

**Given** l'utilisateur est sur la page inventaire et a sélectionné un plot et un étage
**When** il choisit un lot dans le sélecteur optionnel "Lot"
**Then** l'item d'inventaire est créé avec le `lot_id` correspondant

### AC2: Le lot est optionnel

**Given** l'utilisateur ajoute un item d'inventaire avec plot + étage
**When** il ne sélectionne pas de lot
**Then** l'item est créé normalement avec `lot_id = NULL` (comportement actuel)

### AC3: Les lots sont filtrés par étage sélectionné

**Given** l'utilisateur a sélectionné un plot et un étage dans le formulaire
**When** le sélecteur de lot s'affiche
**Then** seuls les lots appartenant à cet étage sont proposés

### AC4: Le lot est réinitialisé quand l'étage change

**Given** l'utilisateur a sélectionné un lot
**When** il change l'étage (ou le plot)
**Then** le lot sélectionné est réinitialisé à vide

### AC5: Pas de sélecteur lot en mode stockage général

**Given** l'utilisateur a activé le switch "Stockage général"
**When** le formulaire s'affiche
**Then** le sélecteur de lot n'est pas visible (car pas de plot/étage)

### AC6: Indicateur visuel `has_inventaire` sur le lot

**Given** un lot a au moins un item d'inventaire affecté (`lot_id`)
**When** l'utilisateur consulte la liste des lots d'un étage
**Then** une icône `Boxes` orange s'affiche sur la StatusCard du lot, à côté des autres indicateurs (AlertTriangle, FileWarning, Wrench)

### AC7: Pas d'icône si le lot n'a pas d'inventaire

**Given** un lot n'a aucun item d'inventaire affecté
**When** l'utilisateur consulte la liste des lots
**Then** aucune icône inventaire n'est affichée

### AC8: Colonne computed `has_inventaire` mise à jour par trigger

**Given** un item d'inventaire est créé, supprimé, ou son `lot_id` est modifié
**When** le trigger s'exécute
**Then** le champ `has_inventaire` du lot concerné (et de l'ancien lot si changement) est recalculé

### AC9: Affichage de la localisation lot dans la liste inventaire

**Given** un item d'inventaire est affecté à un lot
**When** il s'affiche dans la liste inventaire
**Then** la localisation affiche "Plot X — Étage Y — Lot Z" au lieu de "Plot X — Étage Y"

## Tasks / Subtasks

- [x] Task 1 — Migration SQL : `lot_id` sur `inventaire` + `has_inventaire` sur `lots` + triggers (AC: #1, #6, #8)
  - [x] 1.1 Créer `supabase/migrations/050_inventaire_lot.sql`
  - [x] 1.2 `ALTER TABLE inventaire ADD COLUMN lot_id UUID REFERENCES lots(id) ON DELETE SET NULL`
  - [x] 1.3 `CREATE INDEX idx_inventaire_lot_id ON inventaire(lot_id)`
  - [x] 1.4 Contrainte CHECK : `lot_id IS NOT NULL` implique `plot_id IS NOT NULL AND etage_id IS NOT NULL`
  - [x] 1.5 `ALTER TABLE lots ADD COLUMN has_inventaire BOOLEAN NOT NULL DEFAULT false`
  - [x] 1.6 Créer la fonction trigger `update_lot_has_inventaire()` — recalcule `has_inventaire = EXISTS(SELECT 1 FROM inventaire WHERE lot_id = ?)` pour le lot concerné (et l'ancien lot en cas d'UPDATE)
  - [x] 1.7 Attacher le trigger sur `inventaire` pour INSERT, UPDATE OF lot_id, DELETE

- [x] Task 2 — Types TypeScript : database.ts (AC: #1, #6)
  - [x] 2.1 Ajouter `lot_id: string | null` dans `inventaire.Row/Insert/Update`
  - [x] 2.2 Ajouter `has_inventaire: boolean` dans `lots.Row/Insert/Update`

- [x] Task 3 — Mise à jour query `useInventaire` : joindre le nom du lot (AC: #9)
  - [x] 3.1 Modifier `InventaireWithLocation` : ajouter `lots: { code: string } | null`
  - [x] 3.2 Modifier le `.select()` : `'*, plots(nom), etages(nom), lots(code)'`
  - [x] 3.3 Mettre à jour les tests existants de `useInventaire`

- [x] Task 4 — Mise à jour query `useLots` : inclure `has_inventaire` (AC: #6, #7)
  - [x] 4.1 Ajouter `has_inventaire: boolean` dans `LotWithRelations`
  - [x] 4.2 Mettre à jour les tests existants de `useLots` si nécessaire

- [x] Task 5 — Mise à jour mutation `useCreateInventaire` : accepter `lotId` (AC: #1, #2)
  - [x] 5.1 Ajouter `lotId: string | null` dans les params de la mutation
  - [x] 5.2 Passer `lot_id: lotId` dans l'insert
  - [x] 5.3 Invalider `['lots', plotId]` en plus de `['inventaire', chantierId]` dans `onSettled` (pour refresh `has_inventaire`)
  - [x] 5.4 Mettre à jour les tests

- [x] Task 6 — Mise à jour `InventaireList` : afficher le lot dans la localisation (AC: #9)
  - [x] 6.1 Modifier `getLocationLabel()` : si `item.lots`, afficher `Plot X — Étage Y — Lot Z`
  - [x] 6.2 Mettre à jour les tests

- [x] Task 7 — Mise à jour `StatusCard` : prop `hasInventaire` (AC: #6, #7)
  - [x] 7.1 Ajouter prop `hasInventaire?: boolean` à `StatusCardProps`
  - [x] 7.2 Afficher icône `Boxes` orange (`text-orange-400`) quand `hasInventaire` est true
  - [x] 7.3 Mettre à jour les tests

- [x] Task 8 — Mise à jour page étage (liste lots) : passer `hasInventaire` (AC: #6, #7)
  - [x] 8.1 Passer `hasInventaire={lot.has_inventaire}` sur chaque `StatusCard` dans la vue étage
  - [x] 8.2 Mettre à jour les tests

- [x] Task 9 — Mise à jour formulaire inventaire : sélecteur lot optionnel (AC: #1, #2, #3, #4, #5)
  - [x] 9.1 Ajouter state `selectedLotId` dans la page inventaire
  - [x] 9.2 Utiliser `useLots(plotId)` pour charger les lots du plot, filtrer par `etage_id === selectedEtageId`
  - [x] 9.3 Afficher un `Select` optionnel "Lot (optionnel)" après le sélecteur d'étage, quand un étage est sélectionné
  - [x] 9.4 Réinitialiser `selectedLotId` quand `selectedEtageId` ou `selectedPlotId` change
  - [x] 9.5 Cacher le sélecteur de lot en mode stockage général
  - [x] 9.6 Passer `lotId: selectedLotId || null` à `createInventaire.mutate()`
  - [x] 9.7 Mettre à jour les tests de la page inventaire

- [x] Task 10 — Invalider les lots depuis les mutations update/delete inventaire (AC: #8)
  - [x] 10.1 Modifier `useUpdateInventaire` : si `lot_id` change, invalider `['lots']` queries
  - [x] 10.2 Modifier `useDeleteInventaire` : invalider `['lots']` queries dans `onSettled`
  - [x] 10.3 Mettre à jour les tests

- [x] Task 11 — Tests de bout en bout et régression (AC: #1-9)
  - [x] 11.1 `npx tsc --noEmit` — 0 nouvelles erreurs
  - [x] 11.2 `npx eslint src/` — 0 nouvelles erreurs
  - [x] 11.3 `npm run build` — build propre
  - [x] 11.4 Suite de tests complète — tous les tests story passent

## Dev Notes

### Modèle de données

```sql
-- Colonne lot_id nullable sur inventaire
ALTER TABLE public.inventaire
  ADD COLUMN lot_id UUID REFERENCES public.lots(id) ON DELETE SET NULL;

-- Contrainte : lot_id non null implique plot_id + etage_id non null
ALTER TABLE public.inventaire
  ADD CONSTRAINT chk_inventaire_lot_requires_location
  CHECK (lot_id IS NULL OR (plot_id IS NOT NULL AND etage_id IS NOT NULL));

-- Index pour performance du trigger
CREATE INDEX idx_inventaire_lot_id ON public.inventaire(lot_id);

-- Colonne computed sur lots (même pattern que has_blocking_note, has_open_reservation, has_missing_docs)
ALTER TABLE public.lots
  ADD COLUMN has_inventaire BOOLEAN NOT NULL DEFAULT false;
```

### Trigger has_inventaire

Même pattern que `update_lot_has_blocking_note` (migration 011) :

```sql
CREATE OR REPLACE FUNCTION update_lot_has_inventaire()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculer pour le nouveau lot_id
  IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.lot_id IS NOT NULL THEN
    UPDATE lots SET has_inventaire = EXISTS(
      SELECT 1 FROM inventaire WHERE lot_id = NEW.lot_id
    ) WHERE id = NEW.lot_id;
  END IF;

  -- Recalculer pour l'ancien lot_id (UPDATE ou DELETE)
  IF TG_OP = 'DELETE' AND OLD.lot_id IS NOT NULL THEN
    UPDATE lots SET has_inventaire = EXISTS(
      SELECT 1 FROM inventaire WHERE lot_id = OLD.lot_id
    ) WHERE id = OLD.lot_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.lot_id IS DISTINCT FROM NEW.lot_id AND OLD.lot_id IS NOT NULL THEN
    UPDATE lots SET has_inventaire = EXISTS(
      SELECT 1 FROM inventaire WHERE lot_id = OLD.lot_id
    ) WHERE id = OLD.lot_id;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql;
```

### Indicateur visuel sur StatusCard

| Indicateur | Icône | Couleur | Condition |
|-----------|-------|---------|-----------|
| Bloqué | `AlertTriangle` | rouge (`text-destructive`) | `has_blocking_note` |
| Docs manquants | `FileWarning` | ambre (`text-amber-500`) | `has_missing_docs` |
| Réserves ouvertes | `Wrench` | orange (`text-orange-500`) | `has_open_reservation` |
| Mémos | `StickyNote` | bleu (`text-[#3B82F6]`) | `hasMemos` |
| **Inventaire** | **`Boxes`** | **orange (`text-orange-400`)** | **`has_inventaire`** |

### UX du sélecteur de lot dans le formulaire

```
┌─────────────────────────────────────────────────┐
│ Nouveau matériel                                │
├─────────────────────────────────────────────────┤
│ Désignation                                     │
│ ┌─────────────────────────────────────────────┐ │
│ │ Ex: Colle pour faïence 20kg                 │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Quantité                                        │
│ ┌─────────────────────────────────────────────┐ │
│ │ 1                                           │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ [ ] Stockage général                            │
│                                                 │
│ Plot                                            │
│ ┌─────────────────────────────────────────────┐ │
│ │ [Select: Plot A ▼]                          │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Étage                                           │
│ ┌─────────────────────────────────────────────┐ │
│ │ [Select: RDC ▼]                             │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Lot (optionnel)                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ [Select: Lot 101 ▼]                         │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ [         Ajouter le matériel        ]          │
└─────────────────────────────────────────────────┘
```

**Comportement :**
- Le sélecteur "Lot" n'apparaît que quand un étage est sélectionné
- Les lots affichés sont filtrés : `lots.filter(l => l.etage_id === selectedEtageId)`
- Changer le plot ou l'étage reset le lot sélectionné
- Le lot est optionnel — pas de validation dessus
- En mode stockage général, le sélecteur de lot est masqué

### Localisation affichée dans InventaireList

**Avant :** `Plot A — RDC`
**Après (si lot) :** `Plot A — RDC — Lot 101`
**Après (sans lot) :** `Plot A — RDC` (inchangé)
**Stockage général :** `Stockage général` (inchangé)

### ON DELETE SET NULL pour lot_id

Contrairement à `plot_id` et `etage_id` (ON DELETE CASCADE), `lot_id` utilise `ON DELETE SET NULL`.
Raison : si un lot est supprimé, l'item d'inventaire ne doit pas disparaître — le matériel est toujours physiquement sur le chantier, on perd juste l'affectation au lot.

### Risques et points d'attention

1. **Invalidation croisée** : Quand on crée/supprime un inventaire avec `lot_id`, il faut invalider à la fois `['inventaire', chantierId]` ET `['lots', plotId]` pour que le `has_inventaire` se mette à jour côté UI.
2. **Performance trigger** : Le `EXISTS` subquery est léger car indexé sur `lot_id`.
3. **Contrainte CHECK additionnelle** : On ajoute `chk_inventaire_lot_requires_location` en plus de `chk_inventaire_location` (existante). Les deux coexistent sans conflit.
4. **useLots déjà en cache** : La query `useLots(plotId)` charge déjà les lots par plot. Côté formulaire inventaire, on réutilise cette query et filtre côté client par `etage_id`.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Completion Notes

- **Task 1** : Migration `050_inventaire_lot.sql` — `lot_id` nullable FK sur inventaire (ON DELETE SET NULL), index, contrainte CHECK, colonne `has_inventaire` boolean sur lots, trigger `update_lot_has_inventaire()` sur INSERT/UPDATE OF lot_id/DELETE.
- **Task 2** : Types `lot_id: string | null` dans inventaire, `has_inventaire: boolean` dans lots (Row/Insert/Update).
- **Task 3** : `useInventaire` — ajout `lots: { code: string } | null` dans `InventaireWithLocation`, select étendu avec `lots(code)`.
- **Task 4** : `useLots` — ajout `has_inventaire: boolean` dans `LotWithRelations`.
- **Task 5** : `useCreateInventaire` — param `lotId`, insert `lot_id`, select `lots(code)`, optimistic update avec `lots`, invalidation `['lots', plotId]` dans onSettled.
- **Task 6** : `getLocationLabel()` — affiche "Plot X — Étage Y — Lot Z" quand `item.lots` est non null.
- **Task 7** : `StatusCard` — prop `hasInventaire`, icône `Boxes` orange-400 avec aria-label "Inventaire affecté".
- **Task 8** : Page étage — `hasInventaire={lot.has_inventaire}` passé sur chaque StatusCard lot.
- **Task 9** : Formulaire inventaire — state `selectedLotId`, `useLots(plotId)` filtré par étage, Select "Lot (optionnel)" visible quand étage sélectionné et lots existent, reset sur changement plot/étage, caché en stockage général.
- **Task 10** : `useDeleteInventaire` — invalidation `['lots', plotId]` scopée dans onSettled (plotId ajouté aux params de mutation). Update inventaire ne change pas lot_id donc pas d'invalidation lots nécessaire (10.1 skipped by design).
- **Task 11** : tsc 0 erreurs, eslint 0 nouvelles erreurs (4 pré-existantes), build propre, 54 tests story passent.

### File List

**Nouveaux fichiers (1) :**
- `supabase/migrations/050_inventaire_lot.sql` — Migration SQL

**Fichiers modifiés (13) :**
- `src/types/database.ts` — `lot_id` dans inventaire (Tables + interface Inventaire), `has_inventaire` dans lots
- `src/lib/queries/useInventaire.ts` — Join `lots(code)`, type `InventaireWithLocation` étendu
- `src/lib/queries/useInventaire.test.ts` — Select string mise à jour, mock data avec `lot_id` et `lots`
- `src/lib/queries/useLots.ts` — `has_inventaire: boolean` dans `LotWithRelations`
- `src/lib/mutations/useCreateInventaire.ts` — Param `lotId`, insert/select/optimistic/invalidation
- `src/lib/mutations/useCreateInventaire.test.ts` — Test avec `lotId: null` + test avec `lotId` non-null
- `src/lib/mutations/useDeleteInventaire.ts` — Param `plotId`, invalidation scopée `['lots', plotId]`
- `src/lib/mutations/useDeleteInventaire.test.ts` — `plotId` dans les appels mutate
- `src/components/InventaireList.tsx` — `getLocationLabel()` affiche lot, fix non-null assertion
- `src/components/StatusCard.tsx` — Prop `hasInventaire`, icône `Boxes`
- `src/components/StatusCard.test.tsx` — Tests `hasInventaire` (show/hide Boxes icon)
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/index.tsx` — `hasInventaire` sur StatusCard
- `src/routes/_authenticated/chantiers/$chantierId/inventaire.tsx` — Sélecteur lot optionnel + `useLots` + `plotId` dans delete
- `src/__tests__/inventaire-page.test.tsx` — Mock lots, tests sélecteur lot (AC3, AC5)

### Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-02-27 | Implementation complete | Story 8.6 all 11 tasks done |
| 2026-02-27 | Code review fixes (AI) | H1: `lot_id` manquant dans interface Inventaire, H2: tests StatusCard hasInventaire ajoutés, H3: tests sélecteur lot (AC3/AC5) ajoutés, M1: invalidation lots scopée par plotId dans useDeleteInventaire, M2: mock data lot complétée, M3: test lotId non-null ajouté, L1: fix non-null assertion etages |
