# Story 6.13: Refonte création besoins & livraisons — formulaires multi-lignes

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant qu'utilisateur de posePilot,
Je veux créer plusieurs besoins d'un coup via un formulaire multi-lignes avec chantier par ligne, et que la création de livraisons (directe ou par transformation) fonctionne aussi en multi-lignes avec montant unitaire par ligne,
Afin que je gagne du temps à la saisie et que je puisse suivre précisément le montant dépensé par chantier.

## Acceptance Criteria

1. **Given** l'utilisateur ouvre le formulaire de création de besoin (global ou per-chantier) **When** le sheet s'affiche **Then** il voit un formulaire multi-lignes : chaque ligne contient un champ description, un champ quantité (input numérique séparé, défaut 1), et un dropdown chantier

2. **Given** le formulaire multi-lignes est affiché **When** l'utilisateur remplit une ligne **Then** une nouvelle ligne vide apparaît automatiquement en dessous (ou un bouton "+" permet d'en ajouter)

3. **Given** le formulaire multi-lignes est affiché **When** l'utilisateur active le toggle "Chantier unique" en haut **Then** un seul dropdown chantier global apparaît et les dropdowns individuels par ligne sont masqués ; le chantier choisi s'applique à toutes les lignes

4. **Given** le formulaire multi-lignes est affiché **When** le toggle "Chantier unique" est désactivé **Then** chaque ligne retrouve son propre dropdown chantier

5. **Given** l'utilisateur est sur la page besoins d'un chantier spécifique (`/chantiers/$chantierId/besoins`) **When** il ouvre le formulaire de création **Then** le chantier est pré-sélectionné et verrouillé (pas de toggle, pas de dropdown chantier par ligne — le chantier est implicite)

6. **Given** l'utilisateur valide le formulaire multi-lignes avec N lignes remplies **When** l'insertion s'exécute **Then** N besoins sont créés en base (batch insert), chacun avec son chantier_id, description et quantité

7. **Given** l'utilisateur sélectionne un ou plusieurs besoins et choisit "Commander" **When** le sheet de transformation en livraison s'affiche **Then** il voit : un champ fournisseur (global), et pour chaque besoin sélectionné : la description (non modifiable), la quantité, un champ montant unitaire (obligatoire), et le montant ligne calculé (quantité × montant unitaire)

8. **Given** le sheet de transformation est affiché **When** l'utilisateur renseigne les montants unitaires **Then** le montant total de la livraison (somme de tous les montants lignes) est affiché en bas et se met à jour en temps réel

9. **Given** le sheet de transformation est affiché **When** l'utilisateur valide sans avoir renseigné le montant unitaire sur au moins une ligne **Then** la validation est bloquée avec un message d'erreur "Montant unitaire requis pour chaque ligne"

10. **Given** la transformation est validée **When** l'insertion s'exécute **Then** une livraison est créée avec `montant_ttc` = somme des (quantité × montant_unitaire), le `fournisseur` renseigné, et `chantier_id = null` si les besoins viennent de chantiers différents (sinon le chantier_id commun). Chaque besoin reçoit le `montant_unitaire` et `livraison_id` correspondants.

11. **Given** l'utilisateur ouvre le formulaire de création directe de livraison (sans passer par les besoins) **When** le sheet s'affiche **Then** il voit : un champ fournisseur (global), un toggle "Chantier unique", et un formulaire multi-lignes où chaque ligne contient : description, quantité, montant unitaire, et dropdown chantier

12. **Given** l'utilisateur valide la création directe de livraison avec N lignes **When** l'insertion s'exécute **Then** N besoins implicites sont créés (chacun avec description, quantité, montant_unitaire, chantier_id) et immédiatement rattachés à la livraison créée. Le `montant_ttc` de la livraison = somme des montants lignes.

13. **Given** des besoins ont un `montant_unitaire` renseigné et sont liés à une livraison **When** l'utilisateur consulte la DeliveryCard **Then** les lignes de besoins affichent : description, quantité, montant unitaire, montant ligne (quantité × unitaire), et le chantier associé

14. **Given** le `montant_ttc` d'une livraison est maintenant calculé à partir des lignes **When** l'utilisateur édite une livraison existante **Then** il peut modifier le montant unitaire de chaque besoin lié, et le `montant_ttc` se recalcule automatiquement

## Tasks / Subtasks

- [x] Task 1 — Migration SQL : ajout `montant_unitaire` sur besoins (AC: #7, #10, #12)
  - [x] 1.1 Créer `supabase/migrations/037_besoin_montant_unitaire.sql`
  - [x] 1.2 `ALTER TABLE public.besoins ADD COLUMN montant_unitaire numeric DEFAULT NULL;`
  - [x] 1.3 Ajouter contrainte : `ALTER TABLE public.besoins ADD CONSTRAINT besoins_montant_unitaire_positive CHECK (montant_unitaire IS NULL OR montant_unitaire >= 0);`

- [x] Task 2 — Types TypeScript : mise à jour database.ts (AC: #7, #10, #12)
  - [x] 2.1 Ajouter `montant_unitaire: number | null` au Row de `besoins` dans `src/types/database.ts`
  - [x] 2.2 Ajouter `montant_unitaire?: number | null` aux Insert et Update de `besoins`

- [x] Task 3 — Composant `BesoinLineForm` : ligne unitaire du formulaire multi-lignes (AC: #1, #2, #3, #4, #5)
  - [x] 3.1 Créer `src/components/BesoinLineForm.tsx`
  - [x] 3.2 Props : `value: BesoinLineValue`, `onChange`, `onRemove`, `showChantierSelect`, `chantiers`, `autoFocus`, `index`
  - [x] 3.3 Auto-focus sur le champ description quand la ligne est ajoutée
  - [x] 3.4 Créer `src/components/BesoinLineForm.test.tsx` — 8 tests

- [x] Task 4 — Refonte du sheet de création de besoins : formulaire multi-lignes (AC: #1, #2, #3, #4, #5, #6)
  - [x] 4.1 Modifier `besoins.tsx` (page globale) — multi-lignes avec `BesoinLineForm`
  - [x] 4.2 Toggle `Switch` "Chantier unique" + `Select` chantier global
  - [x] 4.3 Bouton "Ajouter une ligne"
  - [x] 4.4 Modifier `chantiers/$chantierId/besoins.tsx` — multi-lignes sans toggle
  - [x] 4.5 Tests mis à jour

- [x] Task 5 — Mutation `useCreateBesoins` : création batch (AC: #6)
  - [x] 5.1 Créer `src/lib/mutations/useCreateBesoins.ts`
  - [x] 5.2 Batch `.insert([...])`
  - [x] 5.3 Invalidation des query keys
  - [x] 5.4 Toast succès
  - [x] 5.5 `useCreateBesoin` conservé
  - [x] 5.6 `src/lib/mutations/useCreateBesoins.test.ts` — 3 tests

- [x] Task 6 — Refonte du sheet de transformation besoin → livraison (AC: #7, #8, #9, #10)
  - [x] 6.1 Accepter `montantUnitaire` dans les mutations
  - [x] 6.2 Calcul `montant_ttc` depuis les lignes
  - [x] 6.3 UI per-besoin montant unitaire inputs
  - [x] 6.4 Champ fournisseur
  - [x] 6.5 Total livraison en temps réel
  - [x] 6.6 Validation montant unitaire requis
  - [x] 6.7 Tests mis à jour

- [x] Task 7 — Refonte du sheet de création directe de livraison (AC: #11, #12)
  - [x] 7.1 Multi-lignes dans `LivraisonSheets.tsx`
  - [x] 7.2 Toggle "Chantier unique" (dans useLivraisonActions)
  - [x] 7.3 Champ fournisseur conservé
  - [x] 7.4 `useCreateLivraison.ts` accepte tableau de lignes
  - [x] 7.5 Création besoins implicites liés
  - [x] 7.6 Tests mis à jour

- [x] Task 8 — DeliveryCard : affichage détaillé des lignes avec montant unitaire (AC: #13)
  - [x] 8.1 BesoinLine sub-component avec description, quantité, montant unitaire, montant ligne, chantier
  - [x] 8.2 Formatage EUR avec `Intl.NumberFormat`
  - [x] 8.3 Tests mis à jour — 40 tests

- [x] Task 9 — Édition livraison : modification des montants unitaires par ligne (AC: #14)
  - [x] 9.1 `EditLivraisonSheet.tsx` — per-besoin montant unitaire éditable avec total recalculé
  - [x] 9.3 `useUpdateLivraison` modifié pour accepter `besoinMontants[]` et batch update
  - [x] 9.4 Tests mis à jour — 5 tests

- [x] Task 10 — Recalcul `montant_ttc` : cohérence et rétro-compatibilité (AC: #10, #12, #14)
  - [x] 10.1 Rétro-compatibilité : recalcul seulement quand `besoinMontants` est fourni
  - [x] 10.2 Pas de trigger SQL (recalcul côté client dans les mutations)
  - [x] 10.3 Couvert par les tests unitaires des mutations

## Dev Notes

### Architecture

Le changement principal est le passage d'un modèle "1 besoin à la fois" à "N besoins en batch". Le modèle de données ne change que marginalement (ajout `montant_unitaire` sur `besoins`). La logique de calcul du `montant_ttc` migre du saisie manuelle vers un calcul dérivé.

### Modèle de données — État cible

```
besoins
├── id (uuid PK)
├── chantier_id (uuid FK → chantiers, NOT NULL)
├── description (text NOT NULL)
├── quantite (integer NOT NULL DEFAULT 1, CHECK >= 1)
├── montant_unitaire (numeric DEFAULT NULL, CHECK >= 0)  ← NOUVEAU
├── livraison_id (uuid FK → livraisons, nullable)
├── created_at, created_by

livraisons (inchangé)
├── id, chantier_id (nullable), description, status, ...
├── montant_ttc (numeric, nullable)  ← maintenant calculé depuis les lignes
```

### Calcul du montant_ttc

```
livraison.montant_ttc = SUM(besoin.quantite * besoin.montant_unitaire)
                        pour tous les besoins WHERE livraison_id = this.id
                                              AND montant_unitaire IS NOT NULL
```

### Rétro-compatibilité

Les livraisons existantes ayant un `montant_ttc` saisi manuellement sans `montant_unitaire` sur leurs besoins continueront à fonctionner. Le recalcul ne s'applique que lorsque des `montant_unitaire` sont effectivement renseignés.

### UI — Wireframe formulaire multi-lignes besoins (page globale)

```
┌─────────────────────────────────────────────┐
│  Nouveau(x) besoin(s)                       │
│                                             │
│  [Toggle] Chantier unique  ○                │
│                                             │
│  ┌─ Ligne 1 ──────────────────────────────┐ │
│  │ Description: [__________]  Qté: [_1_]  │ │
│  │ Chantier: [▼ Sélectionner...]          │ │
│  └────────────────────────────────────────┘ │
│  ┌─ Ligne 2 ──────────────────────────────┐ │
│  │ Description: [__________]  Qté: [_1_]  │ │
│  │ Chantier: [▼ Sélectionner...]          │ │
│  └────────────────────────────────────────┘ │
│                                             │
│  [+ Ajouter une ligne]                      │
│                                             │
│  [    Créer N besoin(s)    ]                │
└─────────────────────────────────────────────┘
```

### UI — Wireframe transformation besoin → livraison

```
┌─────────────────────────────────────────────┐
│  Commander (N besoins)                      │
│                                             │
│  Fournisseur: [__________________]          │
│                                             │
│  ┌─ Ligne 1 ──────────────────────────────┐ │
│  │ Colle faïence           Qté: 3         │ │
│  │ Chantier A                              │ │
│  │ P.U.: [___€]    Total: 0,00 €          │ │
│  └────────────────────────────────────────┘ │
│  ┌─ Ligne 2 ──────────────────────────────┐ │
│  │ Mortier                 Qté: 5         │ │
│  │ Chantier B                              │ │
│  │ P.U.: [___€]    Total: 0,00 €          │ │
│  └────────────────────────────────────────┘ │
│                                             │
│  ──────────────────────────────────────     │
│  Total livraison:              0,00 €       │
│                                             │
│  [    Valider la commande    ]              │
└─────────────────────────────────────────────┘
```

### Mutations impactées

| Mutation existante | Modification |
|---|---|
| `useCreateBesoin` | Remplacé par `useCreateBesoins` (batch) ou conservé si utilisé |
| `useTransformBesoinToLivraison` | Accepter `montant_unitaire`, recalculer `montant_ttc` |
| `useCreateGroupedLivraison` | Accepter `montant_unitaire` par besoin |
| `useBulkTransformBesoins` | Accepter `montant_unitaire` par besoin |
| `useCreateLivraison` | Accepter tableau de lignes, créer besoins implicites |
| `useUpdateLivraison` | Accepter modification `montant_unitaire` par besoin |

### References

- Source: `supabase/migrations/016_besoins_livraisons.sql` — schema initial besoins/livraisons
- Source: `supabase/migrations/034_besoin_quantite.sql` — ajout quantité sur besoins
- Source: `supabase/migrations/035_livraison_nullable_chantier.sql` — chantier_id nullable pour multi-chantier
- Source: `src/types/database.ts:490-518` — types TS actuels besoins
- Source: `src/types/database.ts:436-488` — types TS actuels livraisons
- Source: `src/routes/_authenticated/besoins.tsx` — page globale besoins
- Source: `src/routes/_authenticated/chantiers/$chantierId/besoins.tsx` — page per-chantier besoins
- Source: `src/components/LivraisonSheets.tsx` — sheets de création/édition livraison
- Source: `src/components/DeliveryCard.tsx` — carte livraison avec besoins liés
- Source: `src/lib/mutations/useCreateGroupedLivraison.ts` — commande groupée
- Source: `src/lib/mutations/useBulkTransformBesoins.ts` — commande bulk multi-chantier

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

N/A

### Completion Notes List

- All 10 tasks implemented and verified
- 102 story-related tests passing across 10 test files
- `tsc --noEmit` clean — no TypeScript errors
- Backward compatibility preserved: existing livraisons with manual `montant_ttc` (no `montant_unitaire` on besoins) continue to work unchanged
- Recalculation of `montant_ttc` only triggered when `besoinMontants` is explicitly provided in mutations
- No SQL trigger needed — client-side recalculation in mutations is sufficient (Task 10.2)

### Change Log

- Task 1: Added SQL migration `037_besoin_montant_unitaire.sql` — `montant_unitaire numeric` column with CHECK >= 0
- Task 2: Updated `database.ts` types for besoins Row/Insert/Update with `montant_unitaire`
- Task 3: Created `BesoinLineForm` component for multi-line besoin form rows
- Task 4: Refactored besoins creation sheets (global + per-chantier) to multi-line with "Chantier unique" toggle
- Task 5: Created `useCreateBesoins` batch mutation
- Task 6: Refactored transformation sheets (single + grouped + bulk) with per-besoin montant unitaire, validation, and total calculation
- Task 7: Refactored direct livraison creation sheet to multi-line with implicit besoin creation
- Task 8: Updated `DeliveryCard` with per-besoin line display (description, qty, unit price, line total, chantier)
- Task 9: Added per-besoin montant unitaire editing in `EditLivraisonSheet` with auto-recalculated `montant_ttc`
- Task 10: Backward compatibility ensured — recalculation only when `besoinMontants` provided

### File List

**Created:**
- `supabase/migrations/037_besoin_montant_unitaire.sql`
- `src/components/BesoinLineForm.tsx`
- `src/components/BesoinLineForm.test.tsx`
- `src/lib/mutations/useCreateBesoins.ts`
- `src/lib/mutations/useCreateBesoins.test.ts`

**Modified:**
- `src/types/database.ts` — added `montant_unitaire` to besoins types
- `src/routes/_authenticated/besoins.tsx` — multi-line creation form with "Chantier unique" toggle
- `src/routes/_authenticated/besoins.test.tsx` — updated tests for multi-line form and commander flows
- `src/routes/_authenticated/chantiers/$chantierId/besoins.tsx` — multi-line creation form (per-chantier, no toggle)
- `src/routes/_authenticated/chantiers/$chantierId/besoins.test.tsx` — updated tests
- `src/routes/_authenticated/chantiers/$chantierId/livraisons.test.tsx` — updated tests for multi-line creation
- `src/routes/_authenticated/livraisons.tsx` — edit flow with per-besoin montant editing
- `src/components/LivraisonSheets.tsx` — multi-line creation + edit props passthrough
- `src/components/EditLivraisonSheet.tsx` — per-besoin montant unitaire editing with auto-recalculated total
- `src/components/DeliveryCard.tsx` — per-besoin line display with montant unitaire/line total
- `src/components/DeliveryCard.test.tsx` — updated tests for new line display
- `src/components/LivraisonsList.tsx` — onEdit passes linked besoins
- `src/lib/hooks/useLivraisonActions.ts` — edit flow with besoin montant state management
- `src/lib/mutations/useCreateLivraison.ts` — accepts lines array, creates implicit besoins
- `src/lib/mutations/useCreateLivraison.test.ts` — updated assertions
- `src/lib/mutations/useTransformBesoinToLivraison.ts` — accepts montantUnitaire, recalculates montant_ttc
- `src/lib/mutations/useTransformBesoinToLivraison.test.ts` — updated assertions
- `src/lib/mutations/useCreateGroupedLivraison.ts` — accepts besoinMontants, recalculates montant_ttc
- `src/lib/mutations/useCreateGroupedLivraison.test.ts` — updated assertions
- `src/lib/mutations/useBulkTransformBesoins.ts` — accepts besoinMontants, recalculates montant_ttc
- `src/lib/mutations/useBulkTransformBesoins.test.ts` — rewritten for new single-livraison batch pattern
- `src/lib/mutations/useUpdateLivraison.ts` — accepts besoinMontants, batch updates montant_unitaire, recalculates montant_ttc
- `src/lib/mutations/useUpdateLivraison.test.ts` — updated assertions

