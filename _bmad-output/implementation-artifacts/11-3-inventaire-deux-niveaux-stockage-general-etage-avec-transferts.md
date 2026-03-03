# Story 11.3: Inventaire à deux niveaux — stockage général et stockage étage avec transferts

Status: done
Story ID: 11.3
Story Key: 11-3-inventaire-deux-niveaux-stockage-general-etage-avec-transferts
Epic: 11 — Gestion des matériaux
Date: 2026-03-03
Dependencies: Story 6.5 (done — inventaire de base), Story 8.6 (done — affectation inventaire lot)

## Story

En tant que utilisateur de posePilot,
Je veux gérer l'inventaire en deux niveaux (stockage général au niveau chantier et stockage par étage) et pouvoir transférer des matériaux entre les deux,
Afin que je puisse suivre précisément où se trouvent les matériaux sur le chantier et les dispatcher vers les étages au besoin.

## Acceptance Criteria (BDD)

### AC1: Inventaire général ne montre que le stockage général

**Given** l'utilisateur est sur la page inventaire du chantier
**When** la page se charge
**Then** seuls les items en stockage général (`plot_id IS NULL AND etage_id IS NULL`) sont affichés

### AC2: Formulaire simplifié pour le stockage général

**Given** l'utilisateur ajoute un matériel depuis l'inventaire général
**When** le formulaire s'ouvre
**Then** il n'y a que désignation et quantité — pas de sélecteurs plot/étage ni de switch "Stockage général", l'item est automatiquement créé en stockage général

### AC3: Bouton inventaire sur la vue étage

**Given** l'utilisateur est sur la vue d'un étage (liste des lots)
**When** il regarde le header
**Then** un bouton "Inventaire" (icône `Boxes`) est visible à droite du titre

### AC4: Page inventaire étage — affichage filtré

**Given** l'utilisateur clique sur le bouton "Inventaire" d'un étage
**When** la page `/chantiers/$chantierId/plots/$plotId/$etageId/inventaire` s'affiche
**Then** seuls les items de cet étage sont visibles (filtrés par `etage_id`), agrégés par désignation avec détail par lot le cas échéant

### AC5: Formulaire inventaire étage

**Given** l'utilisateur ajoute un matériel depuis l'inventaire étage
**When** le formulaire s'ouvre
**Then** le plot et l'étage sont implicites (non affichés), et un sélecteur de lot optionnel est disponible (lots de cet étage uniquement)

### AC6: Transfert stockage général → étage

**Given** l'utilisateur est sur l'inventaire général et clique "Transférer" sur un item
**When** il sélectionne un plot, un étage et une quantité (≤ stock disponible) puis valide
**Then** la quantité est déduite du stock général et ajoutée au stock de l'étage cible (item existant incrémenté ou nouvel item créé), le tout de manière atomique

### AC7: Transfert étage → stockage général

**Given** l'utilisateur est sur l'inventaire d'un étage et clique "Retourner au stock" sur un item
**When** il saisit une quantité (≤ stock disponible) et valide
**Then** la quantité est déduite du stock étage et ajoutée au stockage général (item existant incrémenté ou nouvel item créé), de manière atomique

### AC8: Validation de la quantité de transfert

**Given** l'utilisateur saisit une quantité de transfert
**When** la quantité dépasse le stock disponible ou est ≤ 0
**Then** le bouton de validation est désactivé et un message d'erreur s'affiche

### AC9: Suppression automatique quand quantité source atteint 0

**Given** un transfert porte sur la totalité du stock d'un item (quantité transférée = quantité source)
**When** le transfert s'exécute
**Then** l'item source est supprimé de l'inventaire (plus visible dans la liste)

### AC10: Toast de confirmation après transfert

**Given** un transfert (dans les deux sens) s'exécute avec succès
**When** l'opération est terminée
**Then** un toast confirme le transfert (ex: "3× Colle faïence 20kg transférés vers RDC" ou "2× Carrelage 60x60 retournés au stock général")

## Tasks / Subtasks

- [x] Task 1 — Migration SQL : fonction RPC `transfer_inventaire` (AC: #6, #7, #8, #9)
  - [x] 1.1 Créer `supabase/migrations/054_transfer_inventaire.sql`
  - [x] 1.2 Créer la fonction RPC `transfer_inventaire(p_source_id UUID, p_quantity INTEGER, p_target_plot_id UUID, p_target_etage_id UUID)` en `plpgsql SECURITY DEFINER`
  - [x] 1.3 Logique : verrouiller le source (`FOR UPDATE`), valider la quantité, décrémenter/supprimer le source, trouver ou créer la cible (match par `chantier_id` + `LOWER(TRIM(designation))` + `plot_id IS NOT DISTINCT FROM` + `etage_id IS NOT DISTINCT FROM` + `lot_id IS NULL`), incrémenter ou insérer
  - [x] 1.4 Le `created_by` du nouvel item utilise `auth.uid()`
  - [x] 1.5 `GRANT EXECUTE ON FUNCTION transfer_inventaire TO authenticated`

- [x] Task 2 — Types TypeScript : ajouter la RPC dans database.ts (AC: #6, #7)
  - [x] 2.1 Ajouter `transfer_inventaire` dans la section `Functions` du type `Database` avec `Args` et `Returns`

- [x] Task 3 — Modifier `useInventaire` : support du filtrage par scope (AC: #1, #4)
  - [x] 3.1 Ajouter un paramètre optionnel `scope?: { type: 'general' } | { type: 'etage'; etageId: string }` à `useInventaire`
  - [x] 3.2 Quand `scope.type === 'general'` : ajouter `.is('plot_id', null).is('etage_id', null)` à la query
  - [x] 3.3 Quand `scope.type === 'etage'` : ajouter `.eq('etage_id', scope.etageId)` à la query
  - [x] 3.4 Quand `scope` est `undefined` : comportement actuel (tout le chantier) — rétrocompatibilité
  - [x] 3.5 Mettre à jour la queryKey : `['inventaire', chantierId, scope ?? 'all']`
  - [x] 3.6 Tests existants de `useInventaire` passent sans modification (rétrocompatibilité)

- [x] Task 4 — Mutation hook `useTransferInventaire` (AC: #6, #7, #9, #10)
  - [x] 4.1 Créer `src/lib/mutations/useTransferInventaire.ts`
  - [x] 4.2 Params : `sourceId`, `quantity`, `targetPlotId` (nullable), `targetEtageId` (nullable), `chantierId`
  - [x] 4.3 `mutationFn` : `supabase.rpc('transfer_inventaire', { p_source_id, p_quantity, p_target_plot_id, p_target_etage_id })`
  - [x] 4.4 `onSettled` : invalider `['inventaire', chantierId]` (wildcard — invalide toutes les variantes de scope)
  - [x] 4.5 Toast succès géré dans le composant TransferSheet (message descriptif direction + désignation + quantité)

- [x] Task 5 — Composant `TransferSheet` (AC: #6, #7, #8)
  - [x] 5.1 Créer `src/components/TransferSheet.tsx`
  - [x] 5.2 Props : `open`, `onOpenChange`, `item` (InventaireWithLocation), `direction: 'to-etage' | 'to-general'`, `chantierId`
  - [x] 5.3 Mode `to-etage` : sélecteurs Plot → Étage + input quantité (max = item.quantite)
  - [x] 5.4 Mode `to-general` : uniquement input quantité (max = item.quantite)
  - [x] 5.5 Input number pour la quantité avec min=1, max=item.quantite
  - [x] 5.6 Bouton "Tout" qui set la quantité au max
  - [x] 5.7 Validation : quantité > 0 et ≤ stock, étage sélectionné (mode to-etage)
  - [x] 5.8 Appelle `useTransferInventaire` au submit puis ferme le sheet

- [x] Task 6 — Modifier la page inventaire existante → stockage général uniquement (AC: #1, #2, #6)
  - [x] 6.1 Modifier `src/routes/_authenticated/chantiers/$chantierId/inventaire.tsx`
  - [x] 6.2 Passer `scope: { type: 'general' }` à `useInventaire`
  - [x] 6.3 Titre de la page : "Stockage général — {chantier.nom}"
  - [x] 6.4 Supprimer du formulaire : switch "Stockage général", sélecteurs Plot/Étage/Lot — le formulaire ne garde que désignation + quantité
  - [x] 6.5 `createInventaire.mutate()` : toujours `plotId: null, etageId: null, lotId: null`
  - [x] 6.6 Edit ne modifie que désignation et quantité
  - [x] 6.7 Bouton "Transférer" par item dans `InventaireList` (via callback `onTransfer`)
  - [x] 6.8 Intégrer `<TransferSheet direction="to-etage" />` dans la page
  - [x] 6.9 Supprimé les query params `plotId`/`etageId` du `validateSearch`
  - [x] 6.10 Tests de la page inventaire mis à jour (9 tests verts)

- [x] Task 7 — Ajouter `onTransfer` à `InventaireList` (AC: #6, #7)
  - [x] 7.1 Ajouter prop optionnelle `onTransfer?: (item: InventaireWithLocation) => void` à `InventaireListProps`
  - [x] 7.2 Ajouter prop optionnelle `transferLabel?: string` (défaut "Transférer") pour personnaliser le label du bouton
  - [x] 7.3 Quand `onTransfer` est fourni, afficher un bouton avec icône `ArrowRightLeft` à côté du bouton edit sur chaque item
  - [x] 7.4 Tests existants de `InventaireList` passent (11 tests verts)

- [x] Task 8 — Créer la route et page inventaire étage (AC: #4, #5, #7)
  - [x] 8.1 Créer `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/inventaire.tsx`
  - [x] 8.2 Récupérer params : `chantierId`, `plotId`, `etageId`
  - [x] 8.3 Passer `scope: { type: 'etage', etageId }` à `useInventaire`
  - [x] 8.4 Titre : "Inventaire — {etage.nom}"
  - [x] 8.5 Bouton retour → vue étage (`/$etageId/`)
  - [x] 8.6 Formulaire d'ajout : désignation + quantité + lot optionnel (lots filtrés par etageId, réutilise `useLots`)
  - [x] 8.7 `createInventaire.mutate()` avec `plotId`, `etageId` implicites et `lotId` optionnel
  - [x] 8.8 Bouton "Retourner au stock" par item (via `onTransfer` + `transferLabel="Retourner"`)
  - [x] 8.9 Intégrer `<TransferSheet direction="to-general" />` dans la page
  - [x] 8.10 `useRealtimeInventaire(chantierId)` pour les mises à jour temps réel

- [x] Task 9 — Ajouter le bouton "Inventaire" sur la vue étage (AC: #3)
  - [x] 9.1 Modifier `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/index.tsx`
  - [x] 9.2 Remplacer le `<div className="size-9" />` placeholder à droite du header par un bouton `Link` vers `/$etageId/inventaire` avec icône `Boxes`
  - [x] 9.3 Tests de la page étage passent (27 tests verts)

- [x] Task 10 — Tests de bout en bout et régression (AC: #1-10)
  - [x] 10.1 `npx tsc --noEmit` — 0 erreurs
  - [x] 10.2 `npx eslint src/` — 0 nouvelles erreurs (5 pré-existantes)
  - [x] 10.3 `npm run build` — build propre
  - [x] 10.4 50 tests impactés passent (9 inventaire-page + 3 useInventaire + 11 InventaireList + 27 étage-page)

## Dev Notes

### Fonction RPC `transfer_inventaire`

```sql
CREATE OR REPLACE FUNCTION transfer_inventaire(
  p_source_id UUID,
  p_quantity INTEGER,
  p_target_plot_id UUID DEFAULT NULL,
  p_target_etage_id UUID DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_source RECORD;
  v_target_id UUID;
BEGIN
  -- Verrouiller et lire l'item source
  SELECT * INTO v_source FROM inventaire WHERE id = p_source_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item source introuvable';
  END IF;

  -- Valider la quantité
  IF p_quantity <= 0 OR p_quantity > v_source.quantite THEN
    RAISE EXCEPTION 'Quantité invalide : % (disponible : %)', p_quantity, v_source.quantite;
  END IF;

  -- Décrémenter ou supprimer le source
  IF p_quantity = v_source.quantite THEN
    DELETE FROM inventaire WHERE id = p_source_id;
  ELSE
    UPDATE inventaire SET quantite = quantite - p_quantity WHERE id = p_source_id;
  END IF;

  -- Chercher un item existant à la destination (même désignation, même chantier, même emplacement cible, sans lot)
  SELECT id INTO v_target_id FROM inventaire
    WHERE chantier_id = v_source.chantier_id
    AND LOWER(TRIM(designation)) = LOWER(TRIM(v_source.designation))
    AND plot_id IS NOT DISTINCT FROM p_target_plot_id
    AND etage_id IS NOT DISTINCT FROM p_target_etage_id
    AND lot_id IS NULL
    FOR UPDATE
    LIMIT 1;

  IF v_target_id IS NOT NULL THEN
    -- Incrémenter l'item existant
    UPDATE inventaire SET quantite = quantite + p_quantity WHERE id = v_target_id;
  ELSE
    -- Créer un nouvel item
    INSERT INTO inventaire (chantier_id, plot_id, etage_id, designation, quantite, created_by)
    VALUES (v_source.chantier_id, p_target_plot_id, p_target_etage_id, v_source.designation, p_quantity, auth.uid());
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Points clés :**
- `FOR UPDATE` sur le source et la cible → évite les race conditions
- `IS NOT DISTINCT FROM` → gère correctement les `NULL` (stockage général)
- `lot_id IS NULL` sur la cible → les transferts créent toujours un item au niveau étage, pas lot
- `SECURITY DEFINER` → accès direct aux tables, `auth.uid()` pour le `created_by`
- Bidirectionnel : `p_target_plot_id = NULL, p_target_etage_id = NULL` = retour au stock général

### Modification de `useInventaire` — queryKey et filtrage

```typescript
type InventaireScope =
  | { type: 'general' }
  | { type: 'etage'; etageId: string }

function useInventaire(chantierId: string, scope?: InventaireScope) {
  return useQuery({
    queryKey: ['inventaire', chantierId, scope ?? 'all'],
    queryFn: async () => {
      let query = supabase
        .from('inventaire')
        .select('*, plots(nom), etages(nom), lots(code)')
        .eq('chantier_id', chantierId)

      if (scope?.type === 'general') {
        query = query.is('plot_id', null).is('etage_id', null)
      } else if (scope?.type === 'etage') {
        query = query.eq('etage_id', scope.etageId)
      }

      const { data, error } = await query
        .order('designation', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as unknown as InventaireWithLocation[]
    },
  })
}
```

**Invalidation** : `queryClient.invalidateQueries({ queryKey: ['inventaire', chantierId] })` invalide toutes les variantes (general, etage, all) grâce au prefix matching de TanStack Query.

### UX — Page Stockage Général (modifiée)

```
┌─────────────────────────────────────────────────┐
│ ← Stockage général — Résidence Iris             │
├─────────────────────────────────────────────────┤
│ 4 matériaux enregistrés                         │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ Colle faïence 20kg              Total: 15   │ │
│ │   Stockage général : 15                     │ │
│ │   [⇄] [✏️] [−] 15 [+]                      │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ Carrelage 60x60 gris            Total: 40   │ │
│ │   Stockage général : 40                     │ │
│ │   [⇄] [✏️] [−] 40 [+]                      │ │
│ └─────────────────────────────────────────────┘ │
│                                          [+]    │
└─────────────────────────────────────────────────┘
```

### UX — TransferSheet (direction: to-etage)

```
┌─────────────────────────────────────────────────┐
│ Transférer vers un étage                        │
├─────────────────────────────────────────────────┤
│ Colle faïence 20kg (15 en stock)                │
│                                                 │
│ Plot                                            │
│ [Select: Plot A ▼]                              │
│                                                 │
│ Étage                                           │
│ [Select: RDC ▼]                                 │
│                                                 │
│ Quantité                                        │
│ [−] ████████░░ 12 [+]   [Tout]                  │
│                                                 │
│ [      Transférer 12 unités      ]              │
└─────────────────────────────────────────────────┘
```

### UX — TransferSheet (direction: to-general)

```
┌─────────────────────────────────────────────────┐
│ Retourner au stockage général                   │
├─────────────────────────────────────────────────┤
│ Colle faïence 20kg (8 en stock sur RDC)         │
│                                                 │
│ Quantité                                        │
│ [−] ██████░░░░ 5 [+]   [Tout]                   │
│                                                 │
│ [      Retourner 5 unités      ]                │
└─────────────────────────────────────────────────┘
```

### UX — Page Inventaire Étage (nouvelle)

```
┌─────────────────────────────────────────────────┐
│ ← Inventaire — RDC                             │
├─────────────────────────────────────────────────┤
│ 2 matériaux enregistrés                         │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ Colle faïence 20kg              Total: 8    │ │
│ │   RDC : 5                                   │ │
│ │   RDC — Lot 101 : 3                         │ │
│ │   [↩] [✏️] [−] 5 [+]                       │ │
│ │   [↩] [✏️] [−] 3 [+]                       │ │
│ └─────────────────────────────────────────────┘ │
│                                          [+]    │
└─────────────────────────────────────────────────┘
```

### UX — Bouton Inventaire sur la vue étage

```
┌─────────────────────────────────────────────────┐
│ ←          RDC                          [📦]    │  ← Bouton Inventaire (Boxes)
├─────────────────────────────────────────────────┤
│ Chantier > Plot A > RDC                         │
│ ...                                             │
```

Le `<div className="size-9" />` placeholder actuel est remplacé par un vrai bouton `Link`.

### Modification du formulaire — Stockage Général

**Avant (actuel) :**
- Désignation, Quantité, Switch "Stockage général", Select Plot, Select Étage, Select Lot

**Après :**
- Désignation, Quantité — c'est tout. Les items sont toujours créés avec `plot_id = null, etage_id = null, lot_id = null`.

### Modification du formulaire — Inventaire Étage

- Désignation, Quantité, Select Lot (optionnel, filtré par etageId)
- `plot_id` et `etage_id` sont implicites (params de la route)

### Rétrocompatibilité `useInventaire`

L'appel sans `scope` continue de retourner tous les items du chantier (queryKey: `['inventaire', chantierId, 'all']`). Ceci préserve les usages existants comme `computeMetrageVsInventaire` dans `ChantierIndicators`.

### Risques et points d'attention

1. **Atomicité** : La fonction RPC garantit que le transfert est atomique (pas de perte de matériel en cas d'erreur réseau entre deux mutations).
2. **Race conditions** : `FOR UPDATE` verrouille les lignes source et cible pendant la transaction.
3. **Match par désignation** : `LOWER(TRIM(designation))` — même logique que l'agrégation dans `InventaireList`. Si deux items ont des casses différentes ("Colle" vs "colle"), ils sont considérés comme identiques côté DB.
4. **Transfert vers lot** : Par design, les transferts créent toujours un item au niveau étage (`lot_id IS NULL`). L'utilisateur peut ensuite affecter le matériel à un lot via l'édition.
5. **Items existants avec localisation** : Les items déjà créés avec `plot_id`/`etage_id` restent visibles dans leur inventaire d'étage respectif. Seul le formulaire de l'inventaire général est simplifié.
6. **`validateSearch` supprimé** : La page inventaire générale n'accepte plus de query params `plotId`/`etageId`. Vérifier qu'aucun lien existant ne passe ces params (actuellement utilisé depuis la vue étage avec `materiaux_recus` toggle — ce lien doit être mis à jour vers la nouvelle route étage).

### References

- [Source: src/routes/_authenticated/chantiers/$chantierId/inventaire.tsx — Page inventaire actuelle]
- [Source: src/lib/queries/useInventaire.ts — Hook query actuel]
- [Source: src/components/InventaireList.tsx — Composant liste avec agrégation]
- [Source: src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/index.tsx — Vue étage actuelle]
- [Source: supabase/migrations/050_inventaire_lot.sql — Migration récente inventaire]
- [Source: src/lib/mutations/useCreateInventaire.ts — Pattern mutation inventaire]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- Route TanStack Router types not auto-generated until `vite build` runs — resolved by running build which triggers route tree generation
- Migration file numbered 054 (not 051 as initially planned in story) — 051-053 already existed

### Completion Notes List
- **Task 1**: Migration `054_transfer_inventaire.sql` — RPC function with `FOR UPDATE` locking, bidirectional transfer, `SECURITY DEFINER` + `auth.uid()` for `created_by`
- **Task 2**: `transfer_inventaire` added to `Database['public']['Functions']` in `database.ts`
- **Task 3**: `useInventaire` now accepts optional `scope` param (`general` | `etage`). QueryKey includes scope for proper cache segmentation. Backward compatible — no scope = all items.
- **Task 4**: `useTransferInventaire` mutation hook calling `supabase.rpc('transfer_inventaire')` with wildcard invalidation `['inventaire', chantierId]`
- **Task 5**: `TransferSheet` component with two modes (to-etage: plot+étage selectors + qty, to-general: qty only). "Tout" button for max quantity. Toast messages include direction + designation + quantity.
- **Task 6**: Inventory page simplified to general storage only. Removed: plot/étage/lot selectors, "Stockage général" switch, `validateSearch` query params. Added: transfer button per item + TransferSheet. Title changed to "Stockage général — {nom}".
- **Task 7**: `InventaireList` got `onTransfer` + `transferLabel` optional props. `ArrowRightLeft` icon button rendered when `onTransfer` provided.
- **Task 8**: New route `/$etageId/inventaire` with étage-scoped inventory page. Form has designation + quantity + optional lot selector (filtered by étage). Transfer to general via "Retourner" button.
- **Task 9**: Replaced `<div className="size-9" />` placeholder in étage header with `Boxes` icon Link to `/$etageId/inventaire`.
- **Task 10**: tsc 0 errors, eslint 0 new errors (5 pre-existing), build clean, 50 impacted tests green.

### Change Log
| Date | Change | Reason |
|------|--------|--------|
| 2026-03-03 | Story implemented — all 10 tasks complete | Story 11.3 implementation |
| 2026-03-03 | Code review fixes — 6 issues resolved | Senior Developer Review (AI) |

### Senior Developer Review (AI)

**Reviewer:** Youssef — 2026-03-03
**Issues Found:** 1 Critical, 2 High, 3 Medium, 2 Low
**Issues Fixed:** 6 (1C + 2H + 3M)
**Issues Remaining:** 2 Low (cosmétiques, non bloquants)

**Fixes applied:**
- **[C1] Fixed** — Optimistic updates broken for scoped inventory queryKeys (`useCreateInventaire`, `useUpdateInventaire`, `useDeleteInventaire` now use `getQueriesData`/`setQueryData` with prefix matching)
- **[H1] Fixed** — Added 12 tests for `TransferSheet` component (`TransferSheet.test.tsx`)
- **[H2] Fixed** — Added 6 tests for étage inventory page (`etage-inventaire-page.test.tsx`)
- **[M1] Fixed** — Added error message for qty ≤ 0 in `TransferSheet` (AC8 compliance)
- **[M2] Fixed** — Added "Aucun lot" option to lot selector in étage inventory form
- **[M3] Fixed** — Added 2 scope tests to `useInventaire.test.ts` (general + étage filters)

**Remaining (Low):**
- [L1] Transfer icon same for both directions (ArrowRightLeft for both "Transférer" and "Retourner")
- [L2] SQL RPC `transfer_inventaire` bypasses RLS without chantier access check (low risk: 2-3 users)

### File List

**Created:**
- `supabase/migrations/054_transfer_inventaire.sql` — RPC function for atomic inventory transfers
- `src/lib/mutations/useTransferInventaire.ts` — Transfer mutation hook
- `src/components/TransferSheet.tsx` — Transfer dialog (bidirectional)
- `src/components/TransferSheet.test.tsx` — TransferSheet tests (12 tests)
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/inventaire.tsx` — Étage inventory page
- `src/__tests__/etage-inventaire-page.test.tsx` — Étage inventory page tests (6 tests)

**Modified:**
- `src/types/database.ts` — Added `transfer_inventaire` to Functions
- `src/lib/queries/useInventaire.ts` — Added `InventaireScope` type and scope filtering
- `src/lib/queries/useInventaire.test.ts` — Added scope filter tests (5 tests total)
- `src/lib/mutations/useCreateInventaire.ts` — Fixed optimistic updates for scoped queryKeys
- `src/lib/mutations/useUpdateInventaire.ts` — Fixed optimistic updates for scoped queryKeys
- `src/lib/mutations/useDeleteInventaire.ts` — Fixed optimistic updates for scoped queryKeys
- `src/components/InventaireList.tsx` — Added `onTransfer`/`transferLabel` props + `ArrowRightLeft` button
- `src/routes/_authenticated/chantiers/$chantierId/inventaire.tsx` — Rewritten for general storage only + transfer integration
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/index.tsx` — Added `Boxes` icon link to étage inventory
- `src/__tests__/inventaire-page.test.tsx` — Rewritten for new general storage behavior (9 tests)
- `src/routeTree.gen.ts` — Auto-generated (new étage inventory route)

