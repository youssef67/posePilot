# Story 8.8: Vue agregee des memos etages sur la page plot

Status: done
Story ID: 8.8
Story Key: 8-8-vue-agregee-memos-etages-sur-plot
Epic: 8 — Ameliorations de productivite
Date: 2026-03-06
Dependencies: Story 8.7 (done — memos acces plot/etage, contexte etage sur lot, multi-photos)

## Story

En tant que utilisateur de posePilot,
Je veux voir une vue agregee de tous les memos des etages directement sur la page plot, sous forme d'accordion depliable par etage, avec navigation vers l'etage au clic,
Afin de consulter rapidement tous les memos pertinents sans avoir a naviguer etage par etage.

## Acceptance Criteria (BDD)

### AC1: Plus de creation de memos au niveau plot

**Given** l'utilisateur est sur la page detail d'un plot
**When** la page s'affiche
**Then** il n'y a plus de lien vers une page de memos plot, ni de possibilite de creer un memo au niveau plot

### AC2: Vue agregee des memos etages sur la page plot

**Given** un ou plusieurs etages du plot ont des memos
**When** l'utilisateur consulte la page detail du plot
**Then** une section "Memos" s'affiche avec un accordion depliable par etage, montrant le nom de l'etage et le nombre de memos

### AC3: Contenu des memos lisible dans l'accordion

**Given** l'utilisateur deplie un etage dans l'accordion
**When** les memos sont affiches
**Then** chaque memo affiche son contenu texte, ses photos (miniatures), l'auteur et la date — en lecture seule

### AC4: Navigation vers l'etage au clic sur un memo

**Given** l'utilisateur voit un memo dans la vue agregee
**When** il clique sur ce memo
**Then** il est navigue vers la page memos de l'etage concerne

### AC5: Section masquee si aucun memo

**Given** aucun etage du plot n'a de memo
**When** l'utilisateur consulte la page detail du plot
**Then** la section memos agregee n'est pas affichee

### AC6: Nettoyage des memos plot en base

**Given** la migration est appliquee
**When** on inspecte la base de donnees
**Then** la colonne `plot_id` n'existe plus dans la table `memos`, la colonne `memo_count` n'existe plus dans la table `plots`, et les triggers associes sont supprimes

## Tasks / Subtasks

- [x] Task 1 — Migration SQL : suppression du support memos plot (AC: #6)
  - [x] 1.1 Creer `supabase/migrations/061_remove_plot_memos.sql` (numerote 061 car 060 existait deja)
  - [x] 1.2 Supprimer les memos plot existants : `DELETE FROM memos WHERE plot_id IS NOT NULL`
  - [x] 1.3 Supprimer les triggers : `DROP TRIGGER IF EXISTS trg_plot_memo_count_insert ON memos` et `DROP TRIGGER IF EXISTS trg_plot_memo_count_delete ON memos`
  - [x] 1.4 Supprimer la fonction : `DROP FUNCTION IF EXISTS update_plot_memo_count()`
  - [x] 1.5 Supprimer la colonne `memo_count` de `plots` : `ALTER TABLE plots DROP COLUMN IF EXISTS memo_count`
  - [x] 1.6 Supprimer la contrainte `memos_parent_check`, retirer `plot_id`, ajouter nouvelle contrainte : `CHECK (num_nonnulls(chantier_id, etage_id) = 1)`

- [x] Task 2 — Types TypeScript : database.ts (AC: #1, #6)
  - [x] 2.1 Retirer `memo_count` de `plots` dans Row/Insert/Update
  - [x] 2.2 Retirer `plot_id` de `memos` dans Row/Insert/Update
  - [x] 2.3 Retirer `'plot'` de `MemoEntityType` dans `useMemos.ts` (devient `'chantier' | 'etage'`)
  - [x] 2.4 `EtageRow` dans `useEtages.ts` : `memo_count` non impacte (etages gardent leur compteur)

- [x] Task 3 — Nouveau hook : usePlotEtageMemos (AC: #2, #5)
  - [x] 3.1 Creer `src/lib/queries/usePlotEtageMemos.ts` : accepte un tableau d'etage IDs, fetch tous les memos avec `memo_photos(*)` via `.in('etage_id', etageIds)`, retourne `MemoWithPhotos[]`
  - [x] 3.2 Query key : `['memos', 'plot-etages', plotId]`
  - [x] 3.3 Creer `src/lib/queries/usePlotEtageMemos.test.ts` : 4 tests (fetch, sort photos, empty, disabled)

- [x] Task 4 — Composant EtageMemosAccordion (AC: #2, #3, #4, #5)
  - [x] 4.1 Installer le composant shadcn Accordion : `npx shadcn@latest add accordion`
  - [x] 4.2 Creer `src/components/EtageMemosAccordion.tsx`
  - [x] 4.3 Props : `etages: { id: string; nom: string }[]`, `plotId: string`, `chantierId: string`
  - [x] 4.4 Utiliser `usePlotEtageMemos` pour fetcher les memos, grouper par `etage_id`
  - [x] 4.5 Afficher un Accordion `type="multiple"` avec `defaultValue` = tous les etage IDs qui ont des memos (tout deplie par defaut)
  - [x] 4.6 Chaque AccordionItem : titre = nom de l'etage + badge "(N memos)", contenu = liste de MemoCard en lecture seule (sans boutons edit/delete)
  - [x] 4.7 Chaque memo est wrappe dans un `Link` vers `/chantiers/$chantierId/plots/$plotId/$etageId/memos`
  - [x] 4.8 Si aucun memo sur aucun etage, le composant retourne `null` (ne s'affiche pas)
  - [x] 4.9 Creer `src/components/EtageMemosAccordion.test.tsx` : 6 tests (grouping, content, hidden etages, links, empty, no dropdown)

- [x] Task 5 — Page plot index : integration (AC: #1, #2, #5)
  - [x] 5.1 Modifier `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.tsx`
  - [x] 5.2 Supprimer le bandeau bleu lien vers `/memos` (lignes ~699-713)
  - [x] 5.3 Integrer `EtageMemosAccordion` a la place, en passant les etages et IDs necessaires
  - [x] 5.4 Supprimer les references a `plot.memo_count`, `StickyNote`, `ChevronRight` devenues inutiles
  - [x] 5.5 Supprimer les 2 tests du bandeau memos dans `index.test.tsx` (tests du composant EtageMemosAccordion couvrent)

- [x] Task 6 — Nettoyage : suppression du code plot memos (AC: #1)
  - [x] 6.1 Supprimer `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/memos.tsx`
  - [x] 6.2 Supprimer `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/memos.test.tsx`
  - [x] 6.3 Retirer le support `entityType: 'plot'` dans `useCreateMemo.ts` + ajouter invalidation `['memos', 'plot-etages']`
  - [x] 6.4 Retirer le support `entityType: 'plot'` dans `useDeleteMemo.ts` + ajouter invalidation `['memos', 'plot-etages']`
  - [x] 6.5 Retirer le support `entityType: 'plot'` dans `MemoFormSheet.tsx`, `useUpdateMemo.ts`, `useUploadMemoPhoto.ts`, `useDeleteMemoPhoto.ts`
  - [x] 6.6 Nettoyer `plot_id` dans mock data des tests memo (`useMemos.test.ts`, `useDeleteMemo.test.ts`, `useCreateMemo.test.ts`, `memos.test.tsx`)
  - [x] 6.7 Supprimer test 'plot' dans `useMemos.test.ts`, corriger entityType dans `useDeleteMemo.test.ts`

- [x] Task 7 — Validation finale (AC: #1-6)
  - [x] 7.1 `npx tsc --noEmit` — 0 erreurs
  - [x] 7.2 `npx eslint` — 0 nouvelles erreurs (1 pre-existante dans MemoFormSheet.tsx)
  - [x] 7.3 `npm run build` — build propre
  - [x] 7.4 Tous les tests de la story passent (18/18)
  - [x] 7.5 Tests existants (stories 8.5, 8.6, 8.7) toujours verts (49/49)

## Dev Notes

### Strategie migration

L'ordre dans la migration est critique :
1. D'abord supprimer les donnees (DELETE memos plot)
2. Puis les triggers/fonctions
3. Puis les colonnes (memo_count sur plots, plot_id sur memos)
4. La contrainte CHECK existante doit etre retrouvee par nom (inspecter avec `\d memos` ou `pg_constraint`) avant d'etre droppee et recreeee

### Hook usePlotEtageMemos

Approche simple : recevoir les etage IDs (deja disponibles via `useEtages` sur la page plot) et fetcher avec `.in('etage_id', etageIds)`. Evite les joins PostgREST complexes.

```ts
// usePlotEtageMemos.ts
supabase
  .from('memos')
  .select('*, memo_photos(*)')
  .in('etage_id', etageIds)
  .order('created_at', { ascending: false })
```

Grouper par `etage_id` cote frontend avec les noms d'etages fournis par le composant parent.

### Composant EtageMemosAccordion

```
+---------------------------------------------+
| v RDC (2 memos)                              |
|   +---------------------------------------+  |
|   | Attention dalle fragile hall          |  |
|   | [photo1] [photo2]                    |  |
|   |                    12 fev . bruno    |  |
|   +---------------------------------------+  |
|   +---------------------------------------+  |
|   | Cle gardienne                         |  |
|   |                  10 fev . youssef    |  |
|   +---------------------------------------+  |
|                                              |
| > Etage 1 (3 memos)                         |
+---------------------------------------------+
```

- Accordion `type="multiple"` : plusieurs etages depliables en meme temps
- `defaultValue` = tous les etage IDs avec memos (tout ouvert par defaut)
- Chaque MemoCard est read-only (pas de menu edit/delete)
- Chaque MemoCard est wrappé dans un `<Link>` cliquable vers la page memos de l'etage
- Retourne `null` si aucun memo

### MemoCard en mode read-only

MemoCard accepte actuellement `onEdit` et `onDelete` en props. Si on ne les passe pas, le menu dropdown ne s'affiche pas (a verifier). Sinon, ajouter une prop `readOnly?: boolean` pour masquer le dropdown.

### Query keys

| Hook | Query Key | Notes |
|------|-----------|-------|
| `usePlotEtageMemos` | `['memos', 'plot-etages', plotId]` | Invalide par useCreateMemo/useDeleteMemo via pattern `['memos']` |
| `useMemos('etage', id)` | `['memos', 'etage', id]` | Inchange |

### Invalidation du cache

Les mutations `useCreateMemo` et `useDeleteMemo` invalident `['memos']` en prefix. Cela invalidera automatiquement `['memos', 'plot-etages', plotId]`. Verifier que c'est bien le cas, sinon ajouter l'invalidation explicite.

### Risques et points d'attention

1. **Contrainte CHECK** : Le nom exact de la contrainte sur memos doit etre retrouve dynamiquement dans la migration. Utiliser `SELECT conname FROM pg_constraint WHERE conrelid = 'memos'::regclass AND contype = 'c'` pour trouver le nom.
2. **MemoCard read-only** : Verifier que ne pas passer `onEdit`/`onDelete` suffit a masquer le dropdown, sinon ajouter une prop.
3. **Performance** : Le hook `usePlotEtageMemos` fait une seule requete pour tous les etages du plot. Acceptable car les memos sont generalement peu nombreux.
4. **Accordion component** : Verifier si shadcn Accordion est deja installe (`src/components/ui/accordion.tsx`). Si non, l'installer.
5. **Tests plot index** : Il y a 29 pre-existing failures dans `plots.$plotId/index.test.tsx` (documentees en story 8.7). Ne pas les comptabiliser comme regressions.

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
Aucun

### Completion Notes List
- Migration 061 cree (numerotee 061 car 060 existait deja) avec suppression ordonnee : data, triggers, fonctions, colonnes, contrainte
- Nom de contrainte `memos_parent_check` identifie dans migration 058 et utilise directement
- `MemoCard` : props `onEdit`/`onDelete` rendues optionnelles, dropdown masque quand non fournies
- MemoEntityType reduit a `'chantier' | 'etage'` dans tous les hooks (useMemos, useCreateMemo, useDeleteMemo, useUpdateMemo, useUploadMemoPhoto, useDeleteMemoPhoto)
- Invalidation explicite de `['memos', 'plot-etages']` ajoutee dans useCreateMemo et useDeleteMemo pour rafraichir l'accordion
- Route tree regenere apres suppression de `plots.$plotId/memos.tsx`
- `PlotRow` dans `usePlots.ts` et optimistic update dans `useCreatePlot.ts` nettoyes de `memo_count`
- 29 failures pre-existantes dans `plots.$plotId/index.test.tsx` confirmees identiques sur main

### Senior Developer Review (AI)

**Reviewer:** Youssef — 2026-03-06
**Outcome:** Approved with fixes applied

**Issues found and fixed:**
- **H1** — `useUpdateMemo`, `useUploadMemoPhoto`, `useDeleteMemoPhoto` manquaient l'invalidation `['memos', 'plot-etages']` pour `entityType === 'etage'`. Ajoute pour coherence avec `useCreateMemo`/`useDeleteMemo`.
- **H2** — Heading "Memos" manquant dans la section agregee (AC2). Ajoute `<h2>Memos</h2>` dans `EtageMemosAccordion` avec padding `px-4 pt-3`.
- **M1** — Tests AC3 incomplets : ajout d'assertions pour photos miniatures et dates dans `EtageMemosAccordion.test.tsx`.
- **M2** — Non-null assertion `memo.etage_id!` remplacee par un guard `if (!key) return acc`.

**Issues noted (not fixed):**
- **L1** — Double cast `as unknown as MemoWithPhotos[]` dans `usePlotEtageMemos.ts` (pattern existant).
- **L2** — Layout shift au chargement de l'accordion (pas de skeleton).

### File List
- `supabase/migrations/061_remove_plot_memos.sql` (nouveau)
- `src/types/database.ts` (modifie)
- `src/lib/queries/useMemos.ts` (modifie)
- `src/lib/queries/useMemos.test.ts` (modifie)
- `src/lib/queries/usePlots.ts` (modifie)
- `src/lib/queries/usePlotEtageMemos.ts` (nouveau)
- `src/lib/queries/usePlotEtageMemos.test.ts` (nouveau)
- `src/lib/mutations/useCreateMemo.ts` (modifie)
- `src/lib/mutations/useCreateMemo.test.ts` (modifie)
- `src/lib/mutations/useDeleteMemo.ts` (modifie)
- `src/lib/mutations/useDeleteMemo.test.ts` (modifie)
- `src/lib/mutations/useUpdateMemo.ts` (modifie)
- `src/lib/mutations/useUploadMemoPhoto.ts` (modifie)
- `src/lib/mutations/useDeleteMemoPhoto.ts` (modifie)
- `src/lib/mutations/useCreatePlot.ts` (modifie)
- `src/components/MemoCard.tsx` (modifie)
- `src/components/MemoFormSheet.tsx` (modifie)
- `src/components/EtageMemosAccordion.tsx` (nouveau)
- `src/components/EtageMemosAccordion.test.tsx` (nouveau)
- `src/components/ui/accordion.tsx` (nouveau — shadcn)
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.tsx` (modifie)
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.test.tsx` (modifie)
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/memos.tsx` (supprime)
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/memos.test.tsx` (supprime)
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/memos.test.tsx` (modifie)
- `src/routeTree.gen.ts` (regenere)
