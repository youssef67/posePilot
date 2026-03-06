# Story 11.6: Transfert inventaire étage vers lot avec traçabilité

Status: dev-complete
Story ID: 11.6
Story Key: 11-6-transfert-inventaire-etage-vers-lot
Epic: 11 — Gestion des matériaux
Date: 2026-03-06
Dependencies: Story 11.3 (done — transferts général/étage), Story 8.6 (done — affectation inventaire lot)

## Story

En tant que utilisateur de posePilot,
Je veux pouvoir transférer des matériaux depuis l'inventaire d'un étage directement vers un lot de cet étage, et voir dans le lot que ces matériaux proviennent du stock,
Afin de dispatcher les matériaux reçus en stock vers les lots sans passer par l'édition manuelle, tout en gardant la traçabilité de l'origine.

## Contexte

- Aujourd'hui, depuis l'inventaire d'étage, la seule action de transfert disponible est "Retourner au stock général". Il est impossible de transférer vers un lot.
- Le workflow naturel est : Général → Étage → Lot. L'étape Étage → Lot manque.
- L'utilisateur doit actuellement éditer manuellement un item pour lui assigner un lot — ce n'est pas intuitif et ne gère pas le fractionnement de quantité.
- On ajoute aussi un indicateur de provenance sur les items transférés vers un lot, pour que l'utilisateur sache que ces matériaux viennent du stock (et non d'une saisie directe).

## Acceptance Criteria (BDD)

### AC1: Bouton "Transférer vers un lot" sur l'inventaire étage

**Given** l'utilisateur est sur l'inventaire d'un étage
**When** il regarde les actions disponibles sur un item sans lot (`lot_id IS NULL`)
**Then** un bouton "Transférer" est visible (en plus du bouton "Retourner" existant)

### AC2: Sheet de transfert vers lot

**Given** l'utilisateur clique sur "Transférer" sur un item de l'inventaire étage (sans lot)
**When** le sheet s'ouvre
**Then** il voit un sélecteur de lot (lots de cet étage uniquement), un champ quantité (max = stock disponible) et un bouton "Tout"

### AC3: Exécution atomique du transfert étage → lot

**Given** l'utilisateur sélectionne un lot et une quantité valide puis valide
**When** le transfert s'exécute
**Then** la quantité est déduite de l'item étage (sans lot) et ajoutée à un item du lot cible (item existant incrémenté ou nouvel item créé), de manière atomique

### AC4: Suppression automatique quand quantité source atteint 0

**Given** un transfert porte sur la totalité du stock d'un item étage
**When** le transfert s'exécute
**Then** l'item source est supprimé de l'inventaire

### AC5: Validation de la quantité de transfert

**Given** l'utilisateur saisit une quantité de transfert vers lot
**When** la quantité dépasse le stock disponible ou est <= 0
**Then** le bouton de validation est désactivé et un message d'erreur s'affiche

### AC6: Toast de confirmation après transfert vers lot

**Given** un transfert vers lot s'exécute avec succès
**When** l'opération est terminée
**Then** un toast confirme le transfert (ex: "3x Colle faience 20kg transférés vers Lot 101")

### AC7: Indicateur de provenance "stock" sur les items transférés

**Given** un item a été transféré vers un lot (via transfert, pas saisie directe)
**When** l'utilisateur visualise l'inventaire de l'étage ou le détail du lot
**Then** un badge "Stock" est visible sur cet item pour indiquer qu'il provient d'un transfert

### AC8: Le transfert vers lot met à jour `has_inventaire`

**Given** un lot n'avait pas d'inventaire (`has_inventaire = false`)
**When** un transfert y ajoute des matériaux
**Then** `has_inventaire` passe à `true` (trigger existant)

### AC9: Pas de transfert vers lot pour les items déjà dans un lot

**Given** un item d'inventaire est déjà assigné à un lot
**When** l'utilisateur regarde les actions disponibles
**Then** le bouton "Transférer" (vers lot) n'est PAS affiché — seul "Retourner" (vers stock général) reste disponible

## Tasks / Subtasks

- [x] Task 1 — Migration SQL : colonne `source` + extension RPC `transfer_inventaire` (AC: #3, #4, #7, #8)
  - [x]1.1 Créer `supabase/migrations/060_transfer_inventaire_lot.sql`
  - [x]1.2 Ajouter la colonne `source text DEFAULT NULL` à la table `inventaire` (valeurs possibles : `NULL` = saisie directe, `'transfer'` = provient d'un transfert)
  - [x]1.3 `CREATE OR REPLACE FUNCTION transfer_inventaire` : ajouter le paramètre `p_target_lot_id UUID DEFAULT NULL`
  - [x]1.4 Mettre à jour la recherche de cible : inclure `lot_id IS NOT DISTINCT FROM p_target_lot_id` (remplace `lot_id IS NULL`)
  - [x]1.5 Mettre à jour l'INSERT cible : inclure `lot_id = p_target_lot_id` et `source = 'transfer'`
  - [x]1.6 Quand un item cible existant est trouvé et incrémenté, s'assurer que `source` reste inchangé (il garde sa valeur d'origine)
  - [x]1.7 Vérifier que les contraintes existantes sont respectées : `chk_inventaire_lot_requires_location` (lot_id nécessite plot_id + etage_id)

- [x] Task 2 — Types TypeScript : mettre à jour database.ts (AC: #3, #7)
  - [x]2.1 Ajouter `source: string | null` au type `Inventaire` (Row/Insert/Update)
  - [x]2.2 Ajouter `p_target_lot_id` aux Args de la RPC `transfer_inventaire`

- [x] Task 3 — Mutation hook : étendre `useTransferInventaire` (AC: #3)
  - [x]3.1 Ajouter `targetLotId: string | null` aux params de la mutation
  - [x]3.2 Passer `p_target_lot_id: targetLotId` à `supabase.rpc('transfer_inventaire', ...)`

- [x] Task 4 — Composant `TransferSheet` : ajouter la direction `to-lot` (AC: #1, #2, #5, #6)
  - [x]4.1 Étendre le type `direction` : `'to-etage' | 'to-general' | 'to-lot'`
  - [x]4.2 Ajouter les props optionnelles `plotId?: string` et `etageId?: string` (nécessaires pour le mode `to-lot` — récupérer les lots de l'étage)
  - [x]4.3 Mode `to-lot` : afficher un sélecteur de lot (lots de l'étage, via `useLots(plotId)` filtré par `etageId`) + champ quantité + bouton "Tout"
  - [x]4.4 Titre du sheet : "Transférer vers un lot"
  - [x]4.5 Description : "{designation} ({maxQty} en stock sur {etageName})"
  - [x]4.6 Validation : quantité > 0 et <= stock, lot sélectionné
  - [x]4.7 Bouton : "Transférer {qty} unité(s) vers Lot {code}"
  - [x]4.8 `handleSubmit` mode `to-lot` : appeler `transfer.mutate` avec `targetPlotId` = plotId courant, `targetEtageId` = etageId courant, `targetLotId` = lot sélectionné
  - [x]4.9 Toast succès : "{qty}x {designation} transférés vers Lot {code}"

- [x] Task 5 — Page inventaire étage : intégrer le transfert vers lot (AC: #1, #9)
  - [x]5.1 Modifier `src/routes/.../inventaire.tsx` (étage) : ajouter un state `transferDirection: 'to-general' | 'to-lot'`
  - [x]5.2 Dans `InventaireList`, passer un callback `onTransfer` qui ouvre le TransferSheet en mode `to-general` (comme actuellement)
  - [x]5.3 Ajouter un second callback `onTransferToLot` dans `InventaireList` pour les items sans lot
  - [x]5.4 `InventaireList` : afficher le bouton "Transférer" (icône `MoveRight` ou `PackagePlus`) uniquement sur les items où `lot_id IS NULL`
  - [x]5.5 Intégrer le `<TransferSheet direction={transferDirection} plotId={plotId} etageId={etageId} />` avec la direction dynamique

- [x] Task 6 — `InventaireList` : ajouter le callback `onTransferToLot` et le badge "Stock" (AC: #1, #7, #9)
  - [x]6.1 Ajouter la prop optionnelle `onTransferToLot?: (item: InventaireWithLocation) => void`
  - [x]6.2 Quand `onTransferToLot` est fourni ET `item.lot_id === null` : afficher un bouton "Transférer" (icône distincte du "Retourner")
  - [x]6.3 Ajouter la prop optionnelle `showSourceBadge?: boolean` (défaut `false`)
  - [x]6.4 Quand `showSourceBadge` est `true` ET `item.source === 'transfer'` : afficher un `<Badge variant="outline">Stock</Badge>` à côté de la désignation

- [x] Task 7 — Mettre à jour `InventaireWithLocation` (AC: #7)
  - [x]7.1 Ajouter `source: string | null` à l'interface `InventaireWithLocation` (déjà couvert par le type `Inventaire` si `database.ts` est à jour)
  - [x]7.2 Vérifier que le select `'*, plots(nom), etages(nom), lots(code)'` retourne bien le champ `source`

- [x] Task 8 — Tests (AC: #1-9)
  - [x]8.1 Tests `TransferSheet` : ajouter les cas pour `direction="to-lot"` (sélecteur lot, validation, submit)
  - [x]8.2 Tests page inventaire étage : vérifier que le bouton "Transférer" apparaît sur les items sans lot et pas sur ceux avec lot
  - [x]8.3 Tests `InventaireList` : vérifier le badge "Stock" quand `source === 'transfer'` et `showSourceBadge === true`
  - [x]8.4 Tests `InventaireList` : vérifier que `onTransferToLot` n'est appelé que pour les items sans lot

- [x] Task 9 — Validation finale (AC: #1-9)
  - [x]9.1 `npx tsc --noEmit` — 0 erreurs
  - [x]9.2 `npx eslint src/` — 0 nouvelles erreurs
  - [x]9.3 `npm run build` — build propre
  - [x]9.4 Tous les tests impactés passent

## Dev Notes

### Extension de la RPC `transfer_inventaire`

La fonction actuelle ne gère que les transferts entre général et étage (toujours `lot_id IS NULL` côté cible). On l'étend avec un paramètre `p_target_lot_id` :

```sql
CREATE OR REPLACE FUNCTION transfer_inventaire(
  p_source_id UUID,
  p_quantity INTEGER,
  p_target_plot_id UUID DEFAULT NULL,
  p_target_etage_id UUID DEFAULT NULL,
  p_target_lot_id UUID DEFAULT NULL        -- NOUVEAU
) RETURNS void AS $$
DECLARE
  v_source RECORD;
  v_target_id UUID;
BEGIN
  SELECT * INTO v_source FROM inventaire WHERE id = p_source_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item source introuvable';
  END IF;

  IF p_quantity <= 0 OR p_quantity > v_source.quantite THEN
    RAISE EXCEPTION 'Quantite invalide : % (disponible : %)', p_quantity, v_source.quantite;
  END IF;

  IF p_quantity = v_source.quantite THEN
    DELETE FROM inventaire WHERE id = p_source_id;
  ELSE
    UPDATE inventaire SET quantite = quantite - p_quantity WHERE id = p_source_id;
  END IF;

  -- Recherche cible : maintenant avec lot_id
  SELECT id INTO v_target_id FROM inventaire
    WHERE chantier_id = v_source.chantier_id
    AND LOWER(TRIM(designation)) = LOWER(TRIM(v_source.designation))
    AND plot_id IS NOT DISTINCT FROM p_target_plot_id
    AND etage_id IS NOT DISTINCT FROM p_target_etage_id
    AND lot_id IS NOT DISTINCT FROM p_target_lot_id    -- MODIFIE
    FOR UPDATE
    LIMIT 1;

  IF v_target_id IS NOT NULL THEN
    UPDATE inventaire SET quantite = quantite + p_quantity WHERE id = v_target_id;
  ELSE
    INSERT INTO inventaire (chantier_id, plot_id, etage_id, lot_id, designation, quantite, source, created_by)
    VALUES (v_source.chantier_id, p_target_plot_id, p_target_etage_id, p_target_lot_id, v_source.designation, p_quantity,
            CASE WHEN p_target_lot_id IS NOT NULL THEN 'transfer' ELSE NULL END,
            auth.uid());
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Points clés :**
- `lot_id IS NOT DISTINCT FROM p_target_lot_id` remplace `lot_id IS NULL` — rétrocompatible (NULL IS NOT DISTINCT FROM NULL = true)
- `source = 'transfer'` uniquement quand on transfère vers un lot (`p_target_lot_id IS NOT NULL`) — les transferts général/étage ne marquent pas la source
- Le trigger `update_lot_has_inventaire` existant gère déjà l'INSERT avec `lot_id` non null

### Colonne `source` sur la table `inventaire`

```sql
ALTER TABLE inventaire ADD COLUMN source text DEFAULT NULL;
```

Valeurs :
- `NULL` — saisie directe (comportement par défaut, rétrocompatible)
- `'transfer'` — item créé via un transfert depuis le stock étage

Pas de contrainte CHECK car on pourrait ajouter d'autres sources à l'avenir (ex: `'depot'` pour les transferts depuis le dépôt).

### UX — TransferSheet (direction: to-lot)

```
+---------------------------------------------------+
| Transferer vers un lot                            |
+---------------------------------------------------+
| Colle faience 20kg (8 en stock sur RDC)           |
|                                                   |
| Lot                                               |
| [Select: Lot 101 v]                               |
|                                                   |
| Quantite                                          |
| [-] ██████░░░░ 5 [+]   [Tout]                    |
|                                                   |
| [   Transferer 5 unites vers Lot 101   ]          |
+---------------------------------------------------+
```

### UX — Badge "Stock" dans InventaireList

```
+---------------------------------------------+
| Colle faience 20kg              Total: 8    |
|   RDC : 5                                   |
|   RDC - Lot 101 : 3  [Stock]               |  <-- Badge "Stock"
|   [<-] [->] [ed] [-] 5 [+]                 |  <-- items sans lot : Retourner + Transferer
|   [<-]      [ed] [-] 3 [+]                 |  <-- items avec lot : Retourner seulement
+---------------------------------------------+
```

- `[<-]` = Retourner au stock général (existant)
- `[->]` = Transférer vers un lot (nouveau, uniquement sur items sans lot)
- `[Stock]` = Badge provenance (nouveau, uniquement sur items avec `source = 'transfer'`)

### Rétrocompatibilité

- Les transferts existants (général <-> étage) continuent de fonctionner : `p_target_lot_id` a un défaut `NULL`
- Le hook `useTransferInventaire` ajoute `targetLotId` mais les appels existants passent `null`
- Les items existants ont `source = NULL` — pas de badge affiché
- La recherche de cible `lot_id IS NOT DISTINCT FROM NULL` est équivalente à `lot_id IS NULL`

### Choix de design : deux boutons distincts

Sur la page inventaire étage, un item sans lot a deux actions de transfert :
1. **Retourner** (existant) — renvoie au stock général
2. **Transférer** (nouveau) — envoie vers un lot de l'étage

On utilise deux callbacks séparés (`onTransfer` pour retourner, `onTransferToLot` pour envoyer vers lot) plutôt qu'un menu car c'est plus rapide (un tap au lieu de deux).

### References

- [Source: supabase/migrations/054_transfer_inventaire.sql — RPC actuelle]
- [Source: src/components/TransferSheet.tsx — Composant transfert actuel]
- [Source: src/components/InventaireList.tsx — Liste inventaire avec agrégation]
- [Source: src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/inventaire.tsx — Page inventaire étage]
- [Source: src/lib/mutations/useTransferInventaire.ts — Hook mutation transfert]
- [Source: src/lib/queries/useInventaire.ts — Hook query inventaire]
- [Source: supabase/migrations/050_inventaire_lot.sql — Migration lot + trigger has_inventaire]

## File List

### New Files
- `supabase/migrations/060_transfer_inventaire_lot.sql` — Migration : colonne `source` + extension RPC

### Modified Files
- `src/types/database.ts` — Ajout `source` au type Inventaire (Row/Insert/Update + mirror) + `p_target_lot_id` aux Args RPC
- `src/lib/mutations/useTransferInventaire.ts` — Ajout param `targetLotId`
- `src/lib/mutations/useCreateInventaire.ts` — Ajout `source: null` à l'optimistic update
- `src/components/TransferSheet.tsx` — Direction `to-lot` avec sélecteur de lot, title/description/button dynamiques
- `src/components/InventaireList.tsx` — Callback `onTransferToLot` (PackagePlus) + badge "Stock" (`showSourceBadge`)
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/inventaire.tsx` — Intégration transfert vers lot (direction dynamique, plotId/etageId/etageName)
- `src/components/TransferSheet.test.tsx` — 5 tests ajoutés pour direction `to-lot`
- `src/__tests__/etage-inventaire-page.test.tsx` — 4 tests ajoutés (bouton transfert lot, badge Stock)

## Dev Agent Record

### Implementation Summary
- **Task 1**: Created `060_transfer_inventaire_lot.sql` — `source text` column + extended `transfer_inventaire` RPC with `p_target_lot_id UUID DEFAULT NULL`. Target search uses `IS NOT DISTINCT FROM` for full retrocompatibility. `source = 'transfer'` only set when `p_target_lot_id IS NOT NULL`.
- **Task 2**: Updated `database.ts` — added `source: string | null` to Inventaire Row/Insert/Update and mirror interface. Added `p_target_lot_id` to RPC Args.
- **Task 3**: Extended `useTransferInventaire` — added optional `targetLotId` param, passed as `p_target_lot_id` to RPC.
- **Task 4**: Extended `TransferSheet` with `direction: 'to-lot'` — lot selector (filtered by etageId), dynamic title/description/button text, toast with lot code.
- **Task 5**: Updated étage inventaire page — added `transferDirection` state, `handleTransferToLot` callback, passed `plotId/etageId/etageName` to TransferSheet.
- **Task 6**: Extended `InventaireList` — `onTransferToLot` callback (PackagePlus icon, only on items without lot), `showSourceBadge` prop (Badge "Stock" when `source === 'transfer'`).
- **Task 7**: `InventaireWithLocation` inherits `source` from updated `Inventaire` interface. Select `'*'` returns it automatically.
- **Task 8**: Added 5 new TransferSheet tests (to-lot direction), 4 new etage-inventaire-page tests (transfer button visibility, stock badge).
- **Task 9**: `tsc --noEmit` 0 errors. `eslint` 0 new errors (5 pre-existing). `npm run build` clean. All 38 story-impacted tests pass.

### Additional Fix
- Added `source: null` to optimistic update in `useCreateInventaire.ts` to fix build error caused by new required field on `InventaireWithLocation`.
