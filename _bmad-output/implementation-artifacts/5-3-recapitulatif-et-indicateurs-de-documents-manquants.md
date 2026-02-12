# Story 5.3: Récapitulatif et indicateurs de documents manquants

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que utilisateur de posePilot,
Je veux voir un récapitulatif des documents obligatoires manquants et un indicateur visuel sur les lots,
Afin que je sache immédiatement quels lots nécessitent encore des documents avant intervention.

## Acceptance Criteria

1. **Given** un lot a des documents obligatoires sans PDF uploadé **When** l'utilisateur consulte la vue documents du lot **Then** un récapitulatif en haut liste les documents obligatoires manquants avec leur nom

2. **Given** un lot a des documents obligatoires manquants **When** l'utilisateur consulte la grille d'étage **Then** la StatusCard du lot affiche un indicateur visuel (icône document) signalant les manquants

3. **Given** tous les documents obligatoires d'un lot sont uploadés **When** l'utilisateur consulte la grille d'étage **Then** aucun indicateur de document manquant n'apparaît sur la carte

4. **Given** l'utilisateur veut voir tous les lots avec documents manquants **When** il utilise le filtre "Avec alertes" (implémenté dans Epic 3) **Then** les lots avec documents obligatoires manquants apparaissent dans les résultats filtrés

## Tasks / Subtasks

- [x] Task 1 — Migration SQL : colonne `has_missing_docs` + trigger sur `lot_documents` (AC: #2, #3, #4)
  - [x] 1.1 Créer `supabase/migrations/015_lot_missing_docs.sql`
  - [x] 1.2 Ajouter colonne `has_missing_docs BOOLEAN NOT NULL DEFAULT false` à `lots`
  - [x] 1.3 Créer la fonction trigger `update_lot_missing_docs()` qui recalcule `has_missing_docs` sur INSERT/UPDATE/DELETE de `lot_documents`
  - [x] 1.4 Créer le trigger `trg_lot_documents_missing` sur `lot_documents` AFTER INSERT OR UPDATE OF is_required, file_url OR DELETE
  - [x] 1.5 Backfill : UPDATE tous les lots existants avec la valeur calculée

- [x] Task 2 — Type TypeScript : ajouter `has_missing_docs` à `LotWithRelations` (AC: #2, #3, #4)
  - [x] 2.1 Ajouter `has_missing_docs: boolean` dans le type `LotWithRelations` dans `src/lib/queries/useLots.ts`

- [x] Task 3 — Récapitulatif documents manquants sur la page lot (AC: #1)
  - [x] 3.1 Modifier `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/index.tsx`
  - [x] 3.2 Calculer `missingDocs = documents.filter(d => d.is_required && !d.file_url)` à partir des données `useLotDocuments` déjà chargées
  - [x] 3.3 Afficher un bandeau d'alerte au-dessus de la liste de documents si `missingDocs.length > 0`
  - [x] 3.4 Le bandeau liste les noms des documents manquants (ex: "Plan de pose, Fiche de choix")
  - [x] 3.5 Icône `FileWarning` (lucide-react) + texte ambre (`text-amber-500`) + fond `bg-amber-500/10` + border `border-amber-500/20`
  - [x] 3.6 Si aucun document obligatoire manquant → ne rien afficher (pas de bandeau "tout est OK")
  - [x] 3.7 Ajouter les tests dans le fichier test existant de la page lot

- [x] Task 4 — Indicateur visuel sur StatusCard (AC: #2, #3)
  - [x] 4.1 Modifier `src/components/StatusCard.tsx`
  - [x] 4.2 Ajouter prop optionnelle `hasMissingDocs?: boolean`
  - [x] 4.3 Si `hasMissingDocs` est true, afficher une icône `FileWarning` ambre (`text-amber-500`, `size-4`) à côté du titre, après l'éventuelle icône AlertTriangle de `isBlocked`
  - [x] 4.4 L'icône a un `aria-label="Documents manquants"`
  - [x] 4.5 `hasMissingDocs` n'affecte PAS la couleur de la barre latérale (contrairement à `isBlocked` qui force rouge) — la barre reste selon le statut de progression
  - [x] 4.6 Ajouter les tests dans `src/components/StatusCard.test.tsx`

- [x] Task 5 — Étage index : passer l'indicateur + étendre le filtre "Avec alertes" (AC: #2, #3, #4)
  - [x] 5.1 Modifier `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/index.tsx`
  - [x] 5.2 Passer `hasMissingDocs={lot.has_missing_docs}` au composant `StatusCard` de chaque lot
  - [x] 5.3 Modifier `getAlerts` : `(lot) => lot.has_blocking_note === true || lot.has_missing_docs === true`
  - [x] 5.4 Ajouter les tests dans le fichier test existant de la page étage

- [x] Task 6 — Tests de régression (AC: #1-4)
  - [x] 6.1 Lancer `npm run test` — tous les tests existants + nouveaux passent
  - [x] 6.2 Lancer `npm run lint` — 0 nouvelles erreurs (ThemeProvider.tsx:64 pré-existante tolérée)
  - [x] 6.3 Lancer `npm run build` — build propre

## Dev Notes

### Vue d'ensemble — Stratégie d'implémentation

Cette story suit le pattern exact de `has_blocking_note` (story 4.1) : une colonne boolean sur `lots` maintenue par un trigger SQL, consommée côté client via `useLots` sans query supplémentaire.

**Pourquoi un trigger et pas un calcul client-side ?**
- Le filtre "Avec alertes" dans `GridFilterTabs` opère sur les données `useLots` qui ne joignent PAS `lot_documents`
- Ajouter un join `lot_documents` à `useLots` complexifierait la query (agrégation, comptes) et casserait le type existant
- Le trigger garantit la cohérence : tout changement de `is_required` (toggle, story 5.2) ou `file_url` (upload, story 5.1) recalcule automatiquement
- Pattern éprouvé : identique à `has_blocking_note` qui fonctionne parfaitement depuis 3 epics

**Pas de propagation en cascade au-delà de `lots` :**
- Contrairement à `has_blocking_note` qui cascade vers etages → plots → chantiers, `has_missing_docs` reste au niveau `lots` uniquement
- Les AC ne demandent pas d'indicateur au-dessus du niveau lot
- Si besoin futur, le pattern de cascade existe et peut être ajouté (cf. `011_notes.sql` lignes 100-212)

### Migration SQL — `015_lot_missing_docs.sql`

```sql
-- Story 5.3 : Récapitulatif et indicateurs de documents manquants
-- Colonne has_missing_docs sur lots + trigger sur lot_documents

-- =====================
-- COLONNE has_missing_docs
-- =====================
ALTER TABLE public.lots ADD COLUMN has_missing_docs boolean NOT NULL DEFAULT false;

-- =====================
-- TRIGGER FUNCTION — lot_documents → lots
-- =====================
-- Recalcule lots.has_missing_docs quand un lot_document est inséré/modifié/supprimé
-- Un lot a des documents manquants si au moins un lot_document a is_required=true ET file_url IS NULL

CREATE OR REPLACE FUNCTION update_lot_missing_docs()
RETURNS TRIGGER AS $$
DECLARE
  target_lot_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_lot_id := OLD.lot_id;
  ELSE
    target_lot_id := NEW.lot_id;
  END IF;

  -- Gérer le changement de lot_id (UPDATE)
  IF TG_OP = 'UPDATE' AND OLD.lot_id IS DISTINCT FROM NEW.lot_id THEN
    UPDATE public.lots SET
      has_missing_docs = EXISTS(
        SELECT 1 FROM public.lot_documents
        WHERE lot_id = OLD.lot_id AND is_required = true AND file_url IS NULL
      )
    WHERE id = OLD.lot_id;
  END IF;

  -- Recalculer le lot cible
  IF target_lot_id IS NOT NULL THEN
    UPDATE public.lots SET
      has_missing_docs = EXISTS(
        SELECT 1 FROM public.lot_documents
        WHERE lot_id = target_lot_id AND is_required = true AND file_url IS NULL
      )
    WHERE id = target_lot_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =====================
-- TRIGGER
-- =====================
-- Déclenché quand is_required OU file_url change (les 2 colonnes qui affectent has_missing_docs)
CREATE TRIGGER trg_lot_documents_missing
  AFTER INSERT OR UPDATE OF is_required, file_url OR DELETE ON public.lot_documents
  FOR EACH ROW EXECUTE FUNCTION update_lot_missing_docs();

-- =====================
-- BACKFILL lots existants
-- =====================
UPDATE public.lots SET
  has_missing_docs = EXISTS(
    SELECT 1 FROM public.lot_documents
    WHERE lot_documents.lot_id = lots.id AND is_required = true AND file_url IS NULL
  );
```

**Points critiques du trigger :**
- Déclenché sur `UPDATE OF is_required, file_url` — couvre les deux cas : toggle obligatoire (story 5.2) et upload fichier (story 5.1)
- Déclenché aussi sur `INSERT` (création d'un slot obligatoire sans fichier) et `DELETE` (suppression d'un slot obligatoire)
- Pattern identique à `update_lot_blocking_status()` dans `011_notes.sql` — structure éprouvée

### Type TypeScript — Modification minimale

```typescript
// src/lib/queries/useLots.ts — ajouter has_missing_docs
export type LotWithRelations = LotRow & {
  etages: { nom: string } | null
  variantes: { nom: string } | null
  pieces: { count: number }[]
  has_blocking_note: boolean
  has_missing_docs: boolean  // AJOUT
}
```

Le `.select('*')` dans `useLots` récupère déjà toutes les colonnes de `lots` — la nouvelle colonne `has_missing_docs` sera incluse automatiquement grâce au `*`. Le cast `as unknown as LotWithRelations[]` propagera le type.

### Récapitulatif documents manquants — Anatomie visuelle

```
PAGE LOT (section Documents) — AVEC documents manquants :
┌──────────────────────────────────────────────────┐
│ ⚠ 2 documents obligatoires manquants             │  ← bandeau ambre
│   Plan de pose, Fiche de choix                   │
└──────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────┐
│ 📄  Plan de pose            [Obligatoire]        │  ← slot vide
│     Aucun fichier                                │
├──────────────────────────────────────────────────┤
│ ✅  Notice technique        [Obligatoire]      ⋮│  ← slot rempli
│     notice-technique.pdf                         │
├──────────────────────────────────────────────────┤
│ 📄  Fiche de choix          [Obligatoire]        │  ← slot vide
│     Aucun fichier                                │
├──────────────────────────────────────────────────┤
│ 📄  Attestation             [Optionnel]          │  ← slot vide (pas dans le récap)
│     Aucun fichier                                │
└──────────────────────────────────────────────────┘

PAGE LOT — SANS documents manquants :
(pas de bandeau — rien n'est affiché)
┌──────────────────────────────────────────────────┐
│ ✅  Plan de pose            [Obligatoire]      ⋮│
│     plan-pose.pdf                                │
├──────────────────────────────────────────────────┤
│ ✅  Notice technique        [Obligatoire]      ⋮│
│     notice.pdf                                   │
└──────────────────────────────────────────────────┘
```

**Implémentation du bandeau :**
```tsx
// Dans la page lot, section Documents, AVANT la liste de DocumentSlot
const missingDocs = documents?.filter(d => d.is_required && !d.file_url) ?? []

{missingDocs.length > 0 && (
  <div className="flex items-start gap-2 p-3 mb-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
    <FileWarning className="size-5 shrink-0 text-amber-500 mt-0.5" />
    <div>
      <p className="text-sm font-medium text-amber-500">
        {missingDocs.length} document{missingDocs.length > 1 ? 's' : ''} obligatoire{missingDocs.length > 1 ? 's' : ''} manquant{missingDocs.length > 1 ? 's' : ''}
      </p>
      <p className="text-xs text-amber-500/80 mt-0.5">
        {missingDocs.map(d => d.nom).join(', ')}
      </p>
    </div>
  </div>
)}
```

**Icône lucide-react :** `FileWarning` — existe dans le package, pas besoin d'import nouveau (lucide-react déjà utilisé partout).

### StatusCard — Ajout de l'indicateur `hasMissingDocs`

```tsx
// Modification de StatusCard.tsx
interface StatusCardProps {
  // ... existants
  hasMissingDocs?: boolean  // AJOUT
}

// Dans le JSX, après l'icône AlertTriangle de isBlocked :
{hasMissingDocs && (
  <FileWarning className="size-4 shrink-0 text-amber-500" aria-label="Documents manquants" />
)}
```

**Règles de coexistence avec `isBlocked` :**
- Un lot peut avoir `isBlocked=true` ET `hasMissingDocs=true` simultanément
- Les deux icônes s'affichent côte à côte : AlertTriangle (rouge) + FileWarning (ambre)
- La barre latérale suit `isBlocked` (rouge si bloqué), pas `hasMissingDocs`
- `hasMissingDocs` est un indicateur informatif, pas bloquant

### Étage index — Modification du filtre "Avec alertes"

```typescript
// AVANT (current code, line 39-41) :
const getAlerts = useCallback(
  (lot: (typeof etageLots)[0]) => lot.has_blocking_note === true,
  [],
)

// APRÈS :
const getAlerts = useCallback(
  (lot: (typeof etageLots)[0]) => lot.has_blocking_note === true || lot.has_missing_docs === true,
  [],
)
```

**Impact :** Le filtre "Avec alertes" montrera désormais les lots qui ont soit une note bloquante, soit des documents obligatoires manquants. Le compteur dans le tab sera mis à jour automatiquement.

### Schéma DB — Récapitulatif des tables affectées

**Table `lots` (modification) :**
- Ajout `has_missing_docs BOOLEAN NOT NULL DEFAULT false` (migration 015)
- Colonnes existantes : `id`, `etage_id`, `variante_id`, `plot_id`, `code`, `is_tma`, `has_blocking_note`, `progress_done`, `progress_total`, `created_at`

**Table `lot_documents` (pas de modification) :**
- Colonnes existantes : `id`, `lot_id`, `nom`, `is_required`, `file_url`, `file_name`, `created_at`
- Nouveau trigger : `trg_lot_documents_missing` → `update_lot_missing_docs()`

### Project Structure Notes

**Nouveaux fichiers (1) :**
- `supabase/migrations/015_lot_missing_docs.sql` — Migration colonne + trigger + backfill

**Fichiers modifiés (4) :**
- `src/lib/queries/useLots.ts` — Ajout `has_missing_docs` au type `LotWithRelations`
- `src/components/StatusCard.tsx` — Ajout prop `hasMissingDocs` + icône `FileWarning`
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/index.tsx` — Passage `hasMissingDocs` + extension `getAlerts`
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/index.tsx` — Bandeau récapitulatif documents manquants

**Tests modifiés (3) :**
- `src/components/StatusCard.test.tsx` — Tests `hasMissingDocs` (icône visible/absente, coexistence avec isBlocked)
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/index.test.tsx` — Test filtre alertes incluant `has_missing_docs`
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/index.test.tsx` — Tests bandeau manquants (visible/absent)

### Tests — Patterns et mocks

**Test StatusCard — hasMissingDocs :**
```typescript
it('affiche l\'icône FileWarning quand hasMissingDocs est true', () => {
  render(<StatusCard title="Lot 101" statusColor="#64748B" hasMissingDocs />)
  expect(screen.getByLabelText('Documents manquants')).toBeInTheDocument()
})

it('n\'affiche pas l\'icône FileWarning quand hasMissingDocs est false', () => {
  render(<StatusCard title="Lot 101" statusColor="#64748B" hasMissingDocs={false} />)
  expect(screen.queryByLabelText('Documents manquants')).not.toBeInTheDocument()
})

it('affiche les deux icônes quand isBlocked et hasMissingDocs', () => {
  render(<StatusCard title="Lot 101" statusColor="#64748B" isBlocked hasMissingDocs />)
  expect(screen.getByLabelText('Bloqué')).toBeInTheDocument()
  expect(screen.getByLabelText('Documents manquants')).toBeInTheDocument()
})
```

**Test bandeau récapitulatif (page lot) :**
```typescript
// Mock useLotDocuments retournant des docs avec manquants
const mockDocuments = [
  { id: 'd1', lot_id: 'lot-1', nom: 'Plan de pose', is_required: true, file_url: null, file_name: null, created_at: '' },
  { id: 'd2', lot_id: 'lot-1', nom: 'Notice', is_required: true, file_url: 'path/to/file.pdf', file_name: 'notice.pdf', created_at: '' },
  { id: 'd3', lot_id: 'lot-1', nom: 'Fiche de choix', is_required: true, file_url: null, file_name: null, created_at: '' },
  { id: 'd4', lot_id: 'lot-1', nom: 'Attestation', is_required: false, file_url: null, file_name: null, created_at: '' },
]

// Vérifier : "2 documents obligatoires manquants"
// Vérifier : "Plan de pose, Fiche de choix" (pas "Attestation" car optionnel)
// Vérifier : "Notice" n'est pas listé (car fichier uploadé)
```

**Test filtre "Avec alertes" étendu (étage index) :**
```typescript
// Mock lots avec has_missing_docs
const lotsWithMissingDocs = [
  { ...baseLot, id: 'lot-1', has_blocking_note: false, has_missing_docs: true },
  { ...baseLot, id: 'lot-2', has_blocking_note: false, has_missing_docs: false },
  { ...baseLot, id: 'lot-3', has_blocking_note: true, has_missing_docs: false },
]

// Tab "Avec alertes" doit afficher lot-1 (missing docs) ET lot-3 (blocking note)
// lot-2 ne doit PAS apparaître dans le filtre alertes
```

### Prérequis et dépendances

- **Aucune dépendance npm externe à ajouter**
- **Tables existantes** : `lots` (007), `lot_documents` (007 + 014)
- **Stories prérequises** : 5.1 (upload PDF, `file_url` existe) et 5.2 (toggle `is_required` cliquable) — toutes deux `done`
- **Composants existants** : `StatusCard`, `GridFilterTabs`, `DocumentSlot`, `useLotDocuments`
- **Icône lucide-react** : `FileWarning` — déjà dans le package, pas d'import nouveau à ajouter au projet

### Risques et points d'attention

1. **Trigger doit couvrir `UPDATE OF is_required, file_url`** : Si le trigger ne couvre pas `is_required`, le toggle obligatoire/optionnel (story 5.2) ne recalculera pas `has_missing_docs`. Vérifier que le `UPDATE OF` liste bien les deux colonnes.

2. **Backfill nécessaire** : Les lots existants ont `has_missing_docs = false` par défaut. Le UPDATE de backfill dans la migration corrige ça. Si des lots ont déjà des docs obligatoires sans fichier, le backfill les détectera.

3. **Realtime** : `useRealtimeLots(plotId)` écoute déjà les changements sur la table `lots`. Quand le trigger met à jour `has_missing_docs`, le changement sera propagé en temps réel via Supabase Realtime — aucun code supplémentaire nécessaire.

4. **`useLotDocuments` déjà chargé** : Le récapitulatif sur la page lot utilise les données de `useLotDocuments` déjà présentes — pas de query supplémentaire. Le calcul `missingDocs.filter(...)` est client-side et instantané.

5. **Pas de `has_missing_docs` sur les niveaux supérieurs** : Contrairement à `has_blocking_note` qui cascade sur etages → plots → chantiers, `has_missing_docs` reste au niveau `lots`. Les AC ne demandent pas d'indicateur au-dessus. Si besoin futur, le pattern de cascade existe dans `011_notes.sql` (lignes 100-212).

6. **Pre-existing issues** : 16 test failures pré-existants (pwa-config 5, pwa-html 5, hasPointerCapture 6), lint error ThemeProvider.tsx:64 — ne pas s'en inquiéter.

### Learnings des stories précédentes (relevants)

- **Pattern trigger `has_blocking_note`** : `011_notes.sql` — `UPDATE OF` sur les colonnes spécifiques, EXISTS subquery, gestion UPDATE avec changement de parent. Reproduire ce pattern exactement.
- **Mock supabase chainable API** : `from → select → eq → order` chaque appel retourne un mock avec la méthode suivante. Pattern établi dans tous les tests.
- **`data as unknown as Type[]`** : Cast nécessaire car `Database.Tables` est `Record<string, never>`.
- **Route tests** : `createRouter` + `createMemoryHistory` + `RouterProvider` + `QueryClientProvider` + `AuthContext.Provider`.
- **Sonner toast** : `toast.success()` / `toast.error()` — le projet utilise sonner avec le theme provider custom.
- **Badge import** : `// eslint-disable-next-line react-refresh/only-export-components` si nécessaire (voir button.tsx).
- **useLayoutEffect dans GridFilterTabs** : Le filtre utilise `useLayoutEffect` pour éviter le flash visuel. Ne pas introduire de `useEffect` concurrent.
- **`getAlerts` callback stable** : Le callback `getAlerts` passé à `GridFilterTabs` doit être wrappé dans `useCallback` pour éviter les re-renders infinis.

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 5.3, Epic 5, FR41, FR42, FR43]
- [Source: _bmad-output/planning-artifacts/prd.md — FR41 (récapitulatif docs manquants), FR42 (indicateur visuel), FR43 (zéro contrainte par défaut)]
- [Source: _bmad-output/planning-artifacts/architecture.md — Supabase triggers, TanStack Query, Realtime subscriptions]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Couleurs alertes (ambre #F59E0B pour attention), zones tactiles 48px+, feedback patterns]
- [Source: supabase/migrations/011_notes.sql — Pattern has_blocking_note : colonne + trigger + cascade]
- [Source: supabase/migrations/007_lots.sql — Table lots + lot_documents, create_lot_with_inheritance]
- [Source: supabase/migrations/014_lot_documents_file.sql — Colonnes file_url/file_name]
- [Source: src/lib/queries/useLots.ts — Type LotWithRelations, select('*'), cast unknown]
- [Source: src/lib/queries/useLotDocuments.ts — Query hook existant, queryKey ['lot-documents', lotId]]
- [Source: src/components/StatusCard.tsx — isBlocked pattern, AlertTriangle icône]
- [Source: src/components/GridFilterTabs.tsx — getAlerts callback, filterFns alertes]
- [Source: src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/index.tsx — Étage page avec GridFilterTabs, getAlerts vérifie has_blocking_note]
- [Source: src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/index.tsx — Page lot, section Documents avec DocumentSlot]
- [Source: _bmad-output/implementation-artifacts/5-1-upload-visualisation-et-gestion-de-documents-pdf.md — DocumentSlot anatomy, Storage patterns, pre-existing issues]
- [Source: _bmad-output/implementation-artifacts/5-2-types-de-documents-personnalises-et-gestion-par-lot.md — Toggle is_required, mutation optimiste, patterns tests]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Test fix: `mockDocuments` in lot page test needed `file_url`/`file_name` fields to prevent banner from showing in unrelated tests
- Test fix: singular/plural banner text test used `getByLabelText` instead of `getByText` to avoid collision with DocumentSlot rendering same doc name
- Étage page: separated `isBlocked` (only `has_blocking_note`) from `getAlerts` (both flags) to correctly control status bar color vs filter

### Completion Notes List

- ✅ Task 1: Migration `015_lot_missing_docs.sql` — colonne `has_missing_docs` + trigger `update_lot_missing_docs()` + trigger `trg_lot_documents_missing` + backfill
- ✅ Task 2: `has_missing_docs: boolean` ajouté au type `LotWithRelations`
- ✅ Task 3: Bandeau ambre récapitulatif documents manquants sur page lot — 5 tests (pluriel, singulier, tous uploadés, optionnel seulement, icône aria-label)
- ✅ Task 4: Prop `hasMissingDocs` sur StatusCard avec icône `FileWarning` ambre — 5 tests (visible, false, undefined, coexistence isBlocked, pas d'override couleur barre)
- ✅ Task 5: Passage `hasMissingDocs` + extension filtre alertes sur page étage — 4 tests (filtre OR, compteur, icône visible, icône absente)
- ✅ Task 6: Régression 0 nouvelle erreur (648 pass, 16 pré-existants ; lint 0 nouvelle ; build TS pré-existant)

### Change Log

- 2026-02-11: Story 5.3 implémentée — récapitulatif documents manquants + indicateur visuel StatusCard + filtre alertes étendu
- 2026-02-11: Code review (Claude Opus 4.6) — 4 issues MEDIUM corrigées : (1) File List count 5→4, (2) IIFE→useMemo pour missingDocs, (3) mock data complétées avec has_blocking_note/has_missing_docs, (4) role="alert" sur le bandeau manquants

### File List

**Nouveaux fichiers (1) :**
- `supabase/migrations/015_lot_missing_docs.sql`

**Fichiers modifiés (4) :**
- `src/lib/queries/useLots.ts` — ajout `has_missing_docs` au type
- `src/components/StatusCard.tsx` — prop `hasMissingDocs` + icône FileWarning
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/index.tsx` — passage hasMissingDocs + extension getAlerts
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/index.tsx` — bandeau récapitulatif manquants

**Tests modifiés (3) :**
- `src/components/StatusCard.test.tsx` — +5 tests hasMissingDocs
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/index.test.tsx` — +4 tests has_missing_docs alertes
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/index.test.tsx` — +5 tests bandeau manquants
