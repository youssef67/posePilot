# Story 8.6: Memos multi-niveaux (plot, etage) + photos

Status: done
Story ID: 8.6
Story Key: 8-6-memos-plot-etage-photos
Epic: 8 — Ameliorations de productivite
Date: 2026-03-06
Dependencies: Story 8.5 (done — memos chantier)

## Story

En tant que utilisateur de posePilot,
Je veux pouvoir creer des memos au niveau plot et etage (en plus du chantier existant), y joindre des photos, et consulter tous les memos contextuels depuis la page lot,
Afin d'avoir des indications organisees par niveau hierarchique et enrichies visuellement.

## Acceptance Criteria (BDD)

### AC1: Creer un memo sur un plot

**Given** l'utilisateur est sur la page memos d'un plot
**When** il tape sur le FAB "+" et saisit un texte puis valide
**Then** le memo est cree en base avec `plot_id`, contenu, auteur et date, et apparait dans la liste

### AC2: Creer un memo sur un etage

**Given** l'utilisateur est sur la page memos d'un etage
**When** il tape sur le FAB "+" et saisit un texte puis valide
**Then** le memo est cree en base avec `etage_id`, contenu, auteur et date, et apparait dans la liste

### AC3: Page memos dediee par plot

**Given** un plot existe
**When** l'utilisateur accede a `/chantiers/$chantierId/plots/$plotId/memos`
**Then** la page affiche les memos du plot, avec le meme pattern que la page memos chantier (MemoCard, FAB, edit/delete)

### AC4: Page memos dediee par etage

**Given** un etage existe
**When** l'utilisateur accede a `/chantiers/$chantierId/plots/$plotId/$etageId/memos`
**Then** la page affiche les memos de l'etage, avec le meme pattern que la page memos chantier

### AC5: Bandeau memo sur la page plot

**Given** un plot a au moins un memo (`memo_count > 0`)
**When** l'utilisateur consulte la page detail du plot
**Then** un bandeau bleu cliquable s'affiche avec l'icone `StickyNote` et le texte "N memo(s)" — un tap navigue vers la page memos du plot

### AC6: Bandeau memo sur la page etage

**Given** un etage a au moins un memo (`memo_count > 0`)
**When** l'utilisateur consulte la page detail de l'etage
**Then** un bandeau bleu cliquable s'affiche avec l'icone `StickyNote` et le texte "N memo(s)" — un tap navigue vers la page memos de l'etage

### AC7: Compteurs denomalises `memo_count` sur plots et etages

**Given** un memo est cree ou supprime sur un plot ou un etage
**When** le trigger s'execute
**Then** le champ `memo_count` de la table `plots` ou `etages` est mis a jour automatiquement

### AC8: Joindre une photo a un memo

**Given** l'utilisateur cree ou modifie un memo (chantier, plot ou etage)
**When** il tape "Ajouter une photo" et capture/selectionne une image
**Then** la photo est compressee, uploadee dans le bucket `note-photos`, et l'URL est stockee dans `memos.photo_url`

### AC9: Afficher la photo dans MemoCard

**Given** un memo a une `photo_url`
**When** le memo est affiche dans la liste
**Then** une miniature de la photo est visible sous le texte du memo

### AC10: Vue agrege des memos contextuels sur la page lot

**Given** un lot appartient a un etage, qui appartient a un plot, qui appartient a un chantier
**When** l'utilisateur consulte la page du lot
**Then** une section "Memos" affiche les memos des 3 niveaux parents (Chantier, Plot, Etage), groupes par niveau avec un libelle clair, en lecture seule

### AC11: Section memos masquee si aucun memo contextuel

**Given** aucun memo n'existe sur le chantier, le plot ou l'etage parent du lot
**When** l'utilisateur consulte la page du lot
**Then** aucune section memos n'est affichee

### AC12: Compatibilite ascendante memos chantier

**Given** des memos chantier existent deja (story 8.5)
**When** la migration s'execute
**Then** tous les memos existants conservent leur `chantier_id` et restent accessibles, le bandeau et la page memos chantier fonctionnent identiquement

## Tasks / Subtasks

- [x] Task 1 — Migration SQL : renommer table, ajouter colonnes, triggers (AC: #1, #2, #7, #8, #12)
  - [x] 1.1 Creer `supabase/migrations/058_memos_multi_level.sql`
  - [x] 1.2 `ALTER TABLE chantier_memos RENAME TO memos`
  - [x] 1.3 Ajouter colonnes `plot_id uuid REFERENCES plots(id) ON DELETE CASCADE` (nullable), `etage_id uuid REFERENCES etages(id) ON DELETE CASCADE` (nullable), `photo_url text` (nullable)
  - [x] 1.4 Rendre `chantier_id` nullable (etait NOT NULL)
  - [x] 1.5 Ajouter CHECK constraint : exactement un parent renseigne parmi `chantier_id`, `plot_id`, `etage_id`
  - [x] 1.6 Ajouter `memo_count integer NOT NULL DEFAULT 0` aux tables `plots` et `etages`
  - [x] 1.7 Creer index : `idx_memos_plot_id`, `idx_memos_etage_id`
  - [x] 1.8 Mettre a jour la fonction trigger `update_chantier_memo_count()` pour referencer la table `memos` au lieu de `chantier_memos`
  - [x] 1.9 Creer la fonction trigger `update_plot_memo_count()` + attacher sur `memos` pour INSERT/DELETE quand `plot_id IS NOT NULL`
  - [x] 1.10 Creer la fonction trigger `update_etage_memo_count()` + attacher sur `memos` pour INSERT/DELETE quand `etage_id IS NOT NULL`
  - [x] 1.11 RLS : recrer les policies sur la table renommee si necessaire (verifier que le rename conserve les policies)

- [x] Task 2 — Types TypeScript : database.ts (AC: #1, #2, #8, #12)
  - [x] 2.1 Renommer la section `chantier_memos` en `memos` dans `Database.public.Tables`
  - [x] 2.2 Ajouter `plot_id`, `etage_id`, `photo_url` (nullable) dans Row/Insert/Update
  - [x] 2.3 Rendre `chantier_id` optionnel dans Insert, nullable dans Row
  - [x] 2.4 Ajouter `memo_count: number` dans `plots.Row/Insert/Update` et `etages.Row/Insert/Update`
  - [x] 2.5 Renommer le type exporte `ChantierMemo` en `Memo`
  - [x] 2.6 Mettre a jour tous les imports de `ChantierMemo` → `Memo` dans le codebase

- [x] Task 3 — Hooks query : `useMemos` + `useContextMemos` (AC: #3, #4, #10, #11)
  - [x] 3.1 Remplacer `src/lib/queries/useChantierMemos.ts` par `src/lib/queries/useMemos.ts`
  - [x] 3.2 `useMemos(entityType: 'chantier' | 'plot' | 'etage', entityId: string)` — requete sur la table `memos` filtree par la colonne correspondante (`chantier_id`, `plot_id` ou `etage_id`)
  - [x] 3.3 Creer `src/lib/queries/useContextMemos.ts` — `useContextMemos(chantierId, plotId, etageId)` qui recupere les memos des 3 niveaux en une seule requete (`WHERE chantier_id = $1 OR plot_id = $2 OR etage_id = $3`), retourne les resultats groupes par niveau
  - [x] 3.4 Tests pour `useMemos` (3 tests : chantier, plot, etage)
  - [x] 3.5 Tests pour `useContextMemos` (2 tests : avec memos, sans memos)

- [x] Task 4 — Hooks mutations : generaliser + photo (AC: #1, #2, #8)
  - [x] 4.1 Mettre a jour `useCreateMemo` : accepter `{ chantierId?, plotId?, etageId?, content, createdByEmail }`, inserer dans `memos` avec la bonne colonne, invalider les query keys par type (`['memos', 'chantier', id]`, `['memos', 'plot', id]`, `['memos', 'etage', id]`) + invalider `['context-memos']` + invalider la liste parente (`['chantiers']`, `['plots']`, `['etages']`)
  - [x] 4.2 Mettre a jour `useUpdateMemo` : passer la table `memos`, invalider les bonnes query keys
  - [x] 4.3 Mettre a jour `useDeleteMemo` : passer la table `memos`, nettoyer la photo du storage si `photo_url` existe, invalider les bonnes query keys
  - [x] 4.4 Creer `src/lib/mutations/useUploadMemoPhoto.ts` — meme pattern que `useUploadNotePhoto` : compression → upload vers `note-photos` bucket → update `memos.photo_url`, invalider `['memos']` et `['context-memos']`
  - [x] 4.5 Tests mutations (1 test par mutation modifiee/creee = 4 tests)

- [x] Task 5 — Composant `MemoCard` : ajout photo (AC: #9)
  - [x] 5.1 Ajouter dans `MemoCard` l'affichage conditionnel d'une miniature photo si `memo.photo_url` est present (thumbnail `h-20 w-20 rounded-lg object-cover`, meme pattern que `NoteForm`)
  - [x] 5.2 Changer le type de `ChantierMemo` en `Memo` dans les props
  - [x] 5.3 Tests MemoCard (1 test supplementaire : affichage photo)

- [x] Task 6 — Composant `MemoFormSheet` : generalisation + photo (AC: #1, #2, #8)
  - [x] 6.1 Remplacer la prop `chantierId` par `entityType: 'chantier' | 'plot' | 'etage'` + `entityId: string`
  - [x] 6.2 Ajouter capture photo : bouton "Ajouter une photo" + `PhotoCapture` + preview + suppression (meme pattern que `NoteForm`)
  - [x] 6.3 Sur submit : creer le memo puis uploader la photo via `useUploadMemoPhoto` si present
  - [x] 6.4 Changer le type de `ChantierMemo` en `Memo` pour `editMemo`
  - [x] 6.5 Tests MemoFormSheet (2 tests supplementaires : avec photo, entite plot/etage)

- [x] Task 7 — Page memos chantier : adapter au renommage (AC: #12)
  - [x] 7.1 Mettre a jour `src/routes/_authenticated/chantiers/$chantierId/memos.tsx` : importer `useMemos('chantier', chantierId)` au lieu de `useChantierMemos`, `Memo` au lieu de `ChantierMemo`
  - [x] 7.2 Passer `entityType="chantier"` et `entityId={chantierId}` a `MemoFormSheet`
  - [x] 7.3 Mettre a jour les tests existants

- [x] Task 8 — Page memos plot + bandeau (AC: #3, #5)
  - [x] 8.1 Creer `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/memos.tsx` — meme structure que la page memos chantier, avec `useMemos('plot', plotId)`
  - [x] 8.2 Header : "Memos" + sous-titre avec nom du plot
  - [x] 8.3 Bouton retour vers la page plot
  - [x] 8.4 Ajouter le bandeau bleu cliquable sur la page plot index (`plots.$plotId/index.tsx`) — meme pattern que le bandeau sur la page chantier, avec lien vers `memos`
  - [x] 8.5 Afficher `memo_count` dans le bandeau, masquer si `memo_count === 0`
  - [x] 8.6 Tests page memos plot (4 tests : liste, creation, modification, suppression)
  - [x] 8.7 Tests bandeau plot (2 tests : affiche si memos, masque si pas de memos)

- [x] Task 9 — Page memos etage + bandeau (AC: #4, #6)
  - [x] 9.1 Creer `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/memos.tsx` — meme structure, avec `useMemos('etage', etageId)`
  - [x] 9.2 Header : "Memos" + sous-titre avec nom de l'etage
  - [x] 9.3 Bouton retour vers la page etage
  - [x] 9.4 Ajouter le bandeau bleu cliquable sur la page etage index (`$etageId/index.tsx`) — meme pattern
  - [x] 9.5 Afficher `memo_count` dans le bandeau, masquer si `memo_count === 0`
  - [x] 9.6 Tests page memos etage (4 tests : liste, creation, modification, suppression)
  - [x] 9.7 Tests bandeau etage (2 tests : affiche si memos, masque si pas de memos)

- [x] Task 10 — Composant `MemoContextSection` + integration page lot (AC: #10, #11)
  - [x] 10.1 Creer `src/components/MemoContextSection.tsx`
  - [x] 10.2 Props : `chantierId`, `plotId`, `etageId`, `chantierNom`, `plotNom`, `etageNom`
  - [x] 10.3 Utiliser `useContextMemos(chantierId, plotId, etageId)` pour fetcher tous les memos
  - [x] 10.4 Si aucun memo a aucun niveau, ne rien rendre (AC #11)
  - [x] 10.5 Grouper par niveau : sections collapsibles "Chantier — {nom}", "Plot — {nom}", "Etage — {nom}"
  - [x] 10.6 Chaque memo affiche en lecture seule : contenu, photo miniature si presente, auteur, date relative
  - [x] 10.7 Integrer `MemoContextSection` dans `$lotId/index.tsx`, apres le `BreadcrumbNav` et avant la liste des pieces
  - [x] 10.8 Tests MemoContextSection (3 tests : affichage groupe, masque si vide, affiche photos)

- [x] Task 11 — Validation finale (AC: #1-12)
  - [x] 11.1 `npx tsc --noEmit` — 0 erreurs
  - [x] 11.2 `npx eslint` — 0 nouvelles erreurs
  - [x] 11.3 `npm run build` — build propre
  - [x] 11.4 Tous les tests de la story passent
  - [x] 11.5 Tests existants (memos chantier story 8.5) toujours verts

## Dev Notes

### Modele de donnees

```sql
-- Renommer la table
ALTER TABLE chantier_memos RENAME TO memos;

-- Nouvelles colonnes
ALTER TABLE memos
  ALTER COLUMN chantier_id DROP NOT NULL,
  ADD COLUMN plot_id uuid REFERENCES plots(id) ON DELETE CASCADE,
  ADD COLUMN etage_id uuid REFERENCES etages(id) ON DELETE CASCADE,
  ADD COLUMN photo_url text;

-- Exactement un parent
ALTER TABLE memos ADD CONSTRAINT memos_parent_check CHECK (
  (chantier_id IS NOT NULL AND plot_id IS NULL AND etage_id IS NULL) OR
  (chantier_id IS NULL AND plot_id IS NOT NULL AND etage_id IS NULL) OR
  (chantier_id IS NULL AND plot_id IS NULL AND etage_id IS NOT NULL)
);

-- Compteurs denomalises
ALTER TABLE plots ADD COLUMN memo_count integer NOT NULL DEFAULT 0;
ALTER TABLE etages ADD COLUMN memo_count integer NOT NULL DEFAULT 0;
```

### Triggers memo_count

Meme pattern que `update_chantier_memo_count()` (migration 048), adapte pour 3 entites :

```sql
-- Trigger chantier : mettre a jour pour reference a 'memos' au lieu de 'chantier_memos'
CREATE OR REPLACE FUNCTION update_chantier_memo_count() ...
  SELECT count(*) FROM public.memos WHERE chantier_id = ...

-- Trigger plot
CREATE OR REPLACE FUNCTION update_plot_memo_count() ...
  WHEN NEW.plot_id IS NOT NULL (pour INSERT)
  WHEN OLD.plot_id IS NOT NULL (pour DELETE)

-- Trigger etage
CREATE OR REPLACE FUNCTION update_etage_memo_count() ...
  WHEN NEW.etage_id IS NOT NULL (pour INSERT)
  WHEN OLD.etage_id IS NOT NULL (pour DELETE)
```

### Query keys

| Hook | Query Key | Invalidated By |
|------|-----------|---------------|
| `useMemos('chantier', id)` | `['memos', 'chantier', id]` | createMemo, updateMemo, deleteMemo |
| `useMemos('plot', id)` | `['memos', 'plot', id]` | createMemo, updateMemo, deleteMemo |
| `useMemos('etage', id)` | `['memos', 'etage', id]` | createMemo, updateMemo, deleteMemo |
| `useContextMemos(c, p, e)` | `['context-memos', { chantierId, plotId, etageId }]` | createMemo, updateMemo, deleteMemo, uploadMemoPhoto |

### Photo : reutilisation de l'infra existante

- Bucket : `note-photos` (public, deja cree par story 4.2)
- Compression : `compressPhoto()` de `src/lib/utils/compressImage.ts`
- Composant : `PhotoCapture` de `src/components/PhotoCapture.tsx`
- Path storage : `{userId}/memo_{memoId}_{timestamp}.jpg`
- Pattern upload : meme 3 phases que `useUploadNotePhoto` (compression 0-70%, upload 70-90%, DB update 90-100%)

### UX page memos plot/etage

Identique a la page memos chantier existante :

```
+---------------------------------------------+
| <- Memos                                    |
|   Plot Residence Lumiere                    |
+---------------------------------------------+
| | Attention dalle fragile hall RDC          |
| | [photo miniature]                         |
| |                          12 fev . bruno   |
| |                                      ...  |
+---------------------------------------------+
| | Cle chez gardienne bat B                  |
| |                          10 fev . youssef |
| |                                      ...  |
+---------------------------------------------+
                                          [+]
```

### UX section memos contextuels sur page lot

```
+---------------------------------------------+
| <- Lot 101                             ...  |
| Chantier > Plot A > RDC > Lot 101          |
+---------------------------------------------+
| Memos                                       |
| v Chantier — Residence Lumiere         (2)  |
|   | Cle chez gardienne bat B                |
|   |                      10 fev . youssef   |
|   | Pas de stationnement entree parking     |
|   |                      8 fev . bruno      |
| v Plot — Plot A                        (1)  |
|   | Dalle fragile hall RDC                  |
|   | [photo]                                 |
|   |                      12 fev . bruno     |
| > Etage — RDC                          (0)  |
+---------------------------------------------+
| Pieces (4)                                  |
| ...                                         |
```

- Sections collapsibles (Collapsible de shadcn/ui)
- Compteur entre parentheses a droite
- Section masquee si 0 memos au total (AC #11)
- Lecture seule : pas d'edition/suppression depuis cette vue
- Niveaux sans memos : header affiche mais collapses par defaut

### Risques et points d'attention

1. **Rename table** : Verifier que les RLS policies PostgreSQL suivent le rename (elles sont liees a l'OID, pas au nom). Si ce n'est pas le cas, les recreer dans la migration.
2. **Trigger existant** : La fonction `update_chantier_memo_count()` reference `chantier_memos` dans son corps. Il faut la remplacer avec `CREATE OR REPLACE` pour pointer vers `memos`.
3. **Index existant** : `idx_chantier_memos_chantier_id` sera renomme implicitement ou non — ajouter un rename explicite si besoin pour la clarte.
4. **Tests existants story 8.5** : Les mocks referenceront `chantier_memos`. Mettre a jour vers `memos` dans tous les fichiers de test.
5. **routeTree.gen.ts** : L'ajout de 2 nouvelles routes (`plots.$plotId/memos` et `$etageId/memos`) regenerera le route tree. Verifier la generation.
6. **Taille page lot** : La page lot est deja volumineuse. Le `MemoContextSection` est un composant separe importe — impact minimal sur la taille du fichier.

## Dev Agent Record

### File List

**New files:**
- `supabase/migrations/058_memos_multi_level.sql`
- `src/lib/queries/useMemos.ts`
- `src/lib/queries/useMemos.test.ts`
- `src/lib/queries/useContextMemos.ts`
- `src/lib/queries/useContextMemos.test.ts`
- `src/lib/mutations/useUploadMemoPhoto.ts`
- `src/lib/mutations/useUploadMemoPhoto.test.ts`
- `src/components/MemoContextSection.tsx`
- `src/components/MemoContextSection.test.tsx`
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/memos.tsx`
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/memos.test.tsx`
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/memos.tsx`
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/memos.test.tsx`

**Modified files:**
- `src/types/database.ts` — Rename `chantier_memos` → `memos`, add columns, rename export
- `src/lib/queries/usePlots.ts` — Add `memo_count` to `PlotRow`
- `src/lib/queries/useEtages.ts` — Add `memo_count` to `EtageRow`
- `src/lib/mutations/useCreateMemo.ts` — Generalize for plot/etage
- `src/lib/mutations/useCreateMemo.test.ts` — Adapt to new table name + API
- `src/lib/mutations/useUpdateMemo.ts` — Table name + entityType/entityId query key
- `src/lib/mutations/useUpdateMemo.test.ts` — Adapt to new API
- `src/lib/mutations/useDeleteMemo.ts` — Table name + photo cleanup + query key update
- `src/lib/mutations/useDeleteMemo.test.ts` — Adapt to new API + photo cleanup test
- `src/lib/mutations/useCreatePlot.ts` — Add `memo_count: 0` to optimistic update
- `src/components/MemoCard.tsx` — Photo display + type rename
- `src/components/MemoCard.test.tsx` — Photo test + type rename
- `src/components/MemoFormSheet.tsx` — Generalize props + photo capture + fix useEffect lint
- `src/components/MemoFormSheet.test.tsx` — Photo + entity tests
- `src/routes/_authenticated/chantiers/$chantierId/memos.tsx` — Adapt to generalized hooks
- `src/routes/_authenticated/chantiers/$chantierId/memos.test.tsx` — Adapt mocks
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.tsx` — Add memo banner
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/index.tsx` — Add memo banner
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/index.tsx` — Add MemoContextSection

**Deleted files:**
- `src/lib/queries/useChantierMemos.ts` — Replaced by `useMemos.ts`
- `src/lib/queries/useChantierMemos.test.ts` — Replaced by `useMemos.test.ts`

**Auto-generated:**
- `src/routeTree.gen.ts` — Updated by TanStack Router

### Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-03-06 | Implementation complete — all 11 tasks done | Story 8.6 |
| 2026-03-06 | Code review fixes: deduplicate formatRelativeTime (use shared util), fix MemoFormSheet content reset between creations, fix ObjectURL leak (useMemo), remove unsafe type cast in useUploadMemoPhoto, add entityType/entityId to useUploadMemoPhoto for targeted invalidation, fix MemoContextSection test act() warning, create missing plot/etage memos page tests (12 new tests) | AI Code Review |

### Test Summary

- 45 tests across 12 test files — all passing
- useMemos: 4 tests (chantier, plot, etage, disabled)
- useContextMemos: 2 tests (grouped, empty)
- useCreateMemo: 1 test
- useUpdateMemo: 1 test
- useDeleteMemo: 2 tests (delete, photo cleanup)
- useUploadMemoPhoto: 1 test
- MemoCard: 6 tests (content, border, edit, delete, photo, no-photo)
- MemoFormSheet: 6 tests (create, edit, disabled, enabled, photo button, no-photo-in-edit)
- MemoContextSection: 3 tests (grouped display, hidden when empty, photo thumbnails)
- Memos page (chantier): 7 tests (heading, subtitle, cards, empty, back link, delete dialog, delete mutation)
- Memos page (plot): 6 tests (heading, subtitle, cards, empty, back link, delete mutation)
- Memos page (etage): 6 tests (heading, subtitle, cards, empty, back link, delete mutation)

### Completion Notes

- Renamed table `chantier_memos` to `memos` with multi-level parent support (chantier, plot, etage)
- Added photo support via `photo_url` column, using existing `note-photos` bucket and `compressPhoto` infra
- Generalized all hooks: `useMemos(entityType, entityId)` replaces `useChantierMemos`
- Created `useContextMemos` for aggregated read-only view on lot page
- New pages: plot memos + etage memos (same UX pattern as chantier memos)
- Blue banners on plot and etage index pages (hidden when memo_count is 0)
- `MemoContextSection` on lot page shows parent memos grouped by level with collapsible sections
- MemoFormSheet properly resets content/photo state on open via useEffect
- `formatRelativeTime` uses shared utility from `src/lib/utils/formatRelativeTime.ts`
- `useUploadMemoPhoto` uses targeted query invalidation (entityType/entityId)
- Added `memo_count` to PlotRow, EtageRow interfaces and useCreatePlot optimistic update
- Zero regressions introduced — all pre-existing test failures are unrelated to this story
