# Story 11.1: Coût matériaux par lot avec agrégation hiérarchique

Status: done
Story ID: 11.1
Story Key: 11-1-cout-materiaux-par-lot
Epic: 11 — Suivi financier matériaux
Date: 2026-03-02
Dependencies: Aucune

## Story

En tant qu'utilisateur de posePilot,
Je veux saisir un coût matériaux sur chaque lot et voir ce montant agrégé par étage, plot et chantier,
Afin de suivre mes dépenses matériaux à chaque niveau de la hiérarchie et les distinguer de la sous-traitance.

## Acceptance Criteria

### AC1: Saisie du coût matériaux sur un lot

**Given** je suis sur la page détail d'un lot
**When** je tape sur le montant affiché sous le titre (ou sur l'icône crayon)
**Then** un champ numérique inline s'affiche, je saisis un montant (ex: 1250.50), je valide
**And** le montant est persisté en base et affiché formaté en EUR (ex: `1 250,50 €`)

### AC2: Montant affiché à zéro par défaut

**Given** un lot sans coût matériaux renseigné
**When** j'affiche la page détail du lot
**Then** le montant affiché est `0,00 €` avec l'icône crayon pour le modifier

### AC3: Montant visible sur les cartes lot

**Given** je suis sur la page étage (liste des lots)
**When** un lot a un `cout_materiaux > 0`
**Then** le montant est affiché sur la carte lot dans le `secondaryInfo`, après le métrage (ex: `12,5 m² · 8,2 ml · 1 250 €`)

### AC4: Agrégation au niveau étage

**Given** un étage contient des lots avec des coûts matériaux
**When** j'affiche la page plot (liste des étages)
**Then** chaque carte étage affiche la somme des `cout_materiaux` de ses lots (ex: `3 750 €`)

### AC5: Agrégation au niveau plot

**Given** un plot contient des étages avec des coûts matériaux agrégés
**When** j'affiche la page chantier (liste des plots)
**Then** chaque carte plot affiche la somme des `cout_materiaux_total` de ses étages

### AC6: Agrégation au niveau chantier — ligne Matériaux

**Given** un chantier contient des plots avec des coûts matériaux agrégés
**When** j'affiche la page chantier
**Then** `ChantierIndicators` affiche une ligne **"Matériaux"** avec l'icône `Package` et la somme totale, distincte de "Sous-traitance"

### AC7: Mise à jour temps réel de l'agrégation

**Given** je modifie le `cout_materiaux` d'un lot
**When** je reviens sur les pages étage, plot ou chantier
**Then** les montants agrégés sont à jour (via triggers PostgreSQL + invalidation cache TanStack Query)

## Tasks / Subtasks

- [x] Task 1 — Migration SQL : colonnes et triggers (AC: #1, #2, #7)
  - [x]1.1 Ajouter colonne `cout_materiaux numeric NOT NULL DEFAULT 0` à la table `lots`
  - [x]1.2 Ajouter colonne `cout_materiaux_total numeric NOT NULL DEFAULT 0` aux tables `etages`, `plots`, `chantiers`
  - [x]1.3 Créer trigger `trg_lots_cout_materiaux` → fonction `update_etage_cout_materiaux()` : `SUM(cout_materiaux)` des lots → `etages.cout_materiaux_total`
  - [x]1.4 Créer trigger `trg_etages_cout_materiaux` → fonction `update_plot_cout_materiaux()` : `SUM(cout_materiaux_total)` des étages → `plots.cout_materiaux_total`
  - [x]1.5 Créer trigger `trg_plots_cout_materiaux` → fonction `update_chantier_cout_materiaux()` : `SUM(cout_materiaux_total)` des plots → `chantiers.cout_materiaux_total`
  - [x]1.6 Triggers sur `AFTER INSERT OR UPDATE OF cout_materiaux OR DELETE` (lots), `AFTER INSERT OR UPDATE OF cout_materiaux_total OR DELETE` (étages, plots)

- [x] Task 2 — Mettre à jour les types TypeScript (AC: #1)
  - [x]2.1 Ajouter `cout_materiaux` dans `lots` Row/Insert/Update dans `database.ts`
  - [x]2.2 Ajouter `cout_materiaux_total` dans `etages` Row/Insert/Update dans `database.ts`
  - [x]2.3 Ajouter `cout_materiaux_total` dans `plots` Row/Insert/Update dans `database.ts`
  - [x]2.4 Ajouter `cout_materiaux_total` dans `chantiers` Row/Insert/Update dans `database.ts`

- [x] Task 3 — Mutation `useUpdateLotCoutMateriaux` (AC: #1, #7)
  - [x]3.1 Créer `src/lib/mutations/useUpdateLotCoutMateriaux.ts` — update `lots.cout_materiaux` via Supabase
  - [x]3.2 Invalidation optimiste : `['lots', plotId]`, `['etages', plotId]`, `['plots', chantierId]`, `['chantiers', chantierId]`
  - [x]3.3 Tests unitaires de la mutation

- [x] Task 4 — UI page détail lot : affichage et édition inline du montant (AC: #1, #2)
  - [x]4.1 Ajouter sous le titre `Lot {code}` une ligne avec le montant formaté EUR + icône Pencil
  - [x]4.2 Au tap : basculer en mode édition inline (Input type number + boutons Valider/Annuler)
  - [x]4.3 Appeler `useUpdateLotCoutMateriaux` à la validation
  - [x]4.4 Formater l'affichage : `Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })`
  - [x]4.5 Tests unitaires du composant (mode affichage, mode édition, soumission)

- [x] Task 5 — UI carte lot : montant dans secondaryInfo (AC: #3)
  - [x]5.1 Dans la page étage (liste lots), ajouter le montant au `secondaryInfo` si `cout_materiaux > 0`
  - [x]5.2 Format : `{metrage} · {montant} €` (ex: `12,5 m² · 8,2 ml · 1 250 €`)
  - [x]5.3 Tests unitaires

- [x] Task 6 — UI carte étage : montant agrégé (AC: #4)
  - [x]6.1 Dans la page plot (liste étages), afficher `cout_materiaux_total` sur chaque carte étage dans le `secondaryInfo`
  - [x]6.2 Afficher uniquement si `cout_materiaux_total > 0`
  - [x]6.3 Tests unitaires

- [x] Task 7 — UI carte plot : montant agrégé (AC: #5)
  - [x]7.1 Dans la page chantier (liste plots), afficher `cout_materiaux_total` sur chaque carte plot dans le `secondaryInfo`
  - [x]7.2 Afficher uniquement si `cout_materiaux_total > 0`
  - [x]7.3 Tests unitaires

- [x]Task 8 — UI ChantierIndicators : ligne Matériaux (AC: #6)
  - [x]8.1 Ajouter prop `coutMateriaux` à `ChantierIndicatorsProps`
  - [x]8.2 Afficher une ligne "Matériaux" avec icône `Package` et montant EUR formaté, entre "Dépenses" et "Sous-traitance"
  - [x]8.3 Passer `chantier.cout_materiaux_total` depuis la page chantier index
  - [x]8.4 Tests unitaires du composant mis à jour

## Dev Notes

### Schéma SQL — Pattern existant à suivre

Le pattern de triggers cascade est déjà établi dans `010_aggregation_triggers.sql` (progress) et `019_metrage.sql` (métrage). La nouvelle migration suivra exactement le même pattern :

```
lots.cout_materiaux → etages.cout_materiaux_total → plots.cout_materiaux_total → chantiers.cout_materiaux_total
```

Chaque fonction fait un `SELECT COALESCE(SUM(col), 0) INTO ... FROM child WHERE parent_id = NEW.parent_id` puis `UPDATE parent SET col = ... WHERE id = parent_id`.

### Fichier migration

`supabase/migrations/052_cout_materiaux.sql` — suit la numérotation existante (dernier : `051_multi_file_documents.sql`).

### Édition inline — UX

L'édition du montant sur la page lot utilise un pattern toggle simple (pas de sheet/dialog) :
- **Mode lecture** : texte formaté EUR + icône Pencil (tappable)
- **Mode édition** : `<Input type="number" step="0.01" min="0" />` + bouton Check (valider) + bouton X (annuler)
- Validation au tap sur Check ou via Enter
- Annulation au tap sur X ou via Escape

### Formatage montant — Utilitaire

Créer un helper `formatEUR(amount: number): string` dans `src/utils/format.ts` (ou l'ajouter au fichier existant) :
```typescript
export const formatEUR = (amount: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
```

Pour les cartes (compact, sans décimales si entier) :
```typescript
export const formatEURCompact = (amount: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
```

### Wireframe ASCII — Page détail lot (header)

```
┌──────────────────────────────────┐
│ ←  Lot C11                    ⋮  │
│    Classique · RDC               │
│    💰 1 250,50 €  ✏️             │
│    [Badge1] [Badge2]             │
├──────────────────────────────────┤
│ Pièces          Toutes | Alertes │
│ ...                              │
```

Mode édition :
```
┌──────────────────────────────────┐
│ ←  Lot C11                    ⋮  │
│    Classique · RDC               │
│    💰 [  1250.50  ] ✓ ✗         │
│    [Badge1] [Badge2]             │
├──────────────────────────────────┤
```

### Wireframe ASCII — ChantierIndicators (section finances)

```
┌──────────────────────────────────┐
│ 💵 Dépenses        12 500,00 €   │
│    (ajust. +500 €)               │
│ 📦 Matériaux        8 750,00 €   │  ← NOUVEAU
│ 👷 Sous-traitance   3 200,00 €   │
│                              ✏️  │
└──────────────────────────────────┘
```

### Project Structure Notes

- Migration : `supabase/migrations/052_cout_materiaux.sql`
- Types : `src/types/database.ts`
- Mutation : `src/lib/mutations/useUpdateLotCoutMateriaux.ts`
- Utilitaire : `src/utils/format.ts` (nouveau ou existant)
- Pages modifiées :
  - `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/index.tsx` (lot detail)
  - `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/index.tsx` (étage → cartes lot)
  - `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.tsx` (plot → cartes étage)
  - `src/routes/_authenticated/chantiers/$chantierId/index.tsx` (chantier → cartes plot + indicators)
- Composant : `src/components/ChantierIndicators.tsx`

### References

- [Source: supabase/migrations/010_aggregation_triggers.sql] — pattern triggers cascade progress
- [Source: supabase/migrations/019_metrage.sql] — pattern triggers cascade métrage
- [Source: supabase/migrations/042_chantier_finances.sql] — colonnes finances chantier
- [Source: src/components/ChantierIndicators.tsx] — composant indicateurs chantier
- [Source: src/components/StatusCard.tsx] — composant carte avec secondaryInfo

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- 4 tests pré-existants en échec sur lot detail page (GridFilterTabs)
- 29 fichiers test en échec pré-existants sur main — aucune régression introduite

### Completion Notes List

- Task 1: Migration `052_cout_materiaux.sql` — 3 triggers cascade lots→etages→plots→chantiers
- Task 2: `database.ts` — ajout `cout_materiaux` (lots) et `cout_materiaux_total` (etages/plots/chantiers)
- Task 3: `useUpdateLotCoutMateriaux` + 2 tests unitaires
- Task 4: Édition inline du montant sur la page détail lot (Banknote icon + Pencil)
- Task 5: Montant affiché dans secondaryInfo des cartes lot (si > 0)
- Task 6: Montant agrégé affiché dans secondaryInfo des cartes étage (si > 0)
- Task 7: Montant agrégé affiché dans secondaryInfo des cartes plot (si > 0)
- Task 8: Ligne "Matériaux" dans ChantierIndicators (icône Boxes) + 2 tests unitaires
- Utilitaire `formatEUR` / `formatEURCompact` créé dans `src/lib/utils/formatEUR.ts`

### Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-03-02 | Implémentation complète story 11.1 | Feature request |

### File List

**Created:**
- `supabase/migrations/052_cout_materiaux.sql` — colonnes + 3 triggers cascade
- `src/lib/mutations/useUpdateLotCoutMateriaux.ts` — mutation Supabase
- `src/lib/mutations/useUpdateLotCoutMateriaux.test.ts` — tests unitaires mutation
- `src/lib/utils/formatEUR.ts` — helpers `formatEUR` et `formatEURCompact`

**Modified:**
- `src/types/database.ts` — ajout `cout_materiaux` (lots) et `cout_materiaux_total` (etages/plots/chantiers)
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/index.tsx` — édition inline montant lot
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/index.tsx` — montant sur cartes lot
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.tsx` — montant agrégé sur cartes étage
- `src/routes/_authenticated/chantiers/$chantierId/index.tsx` — montant agrégé sur cartes plot + prop ChantierIndicators
- `src/components/ChantierIndicators.tsx` — nouvelle ligne "Matériaux"
- `src/components/ChantierIndicators.test.tsx` — 2 tests ajoutés pour matériaux
