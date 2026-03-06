# Story 8.7: Acces memos sur plot/etage, contexte etage sur lot, multi-photos

Status: done
Story ID: 8.7
Story Key: 8-7-memos-acces-etage-lot-multi-photos
Epic: 8 — Ameliorations de productivite
Date: 2026-03-06
Dependencies: Story 8.6 (done — memos multi-niveaux + photos)

## Story

En tant que utilisateur de posePilot,
Je veux toujours pouvoir acceder aux memos depuis les pages plot et etage (meme quand il n'y en a aucun), voir uniquement les memos de l'etage sur la page lot, et pouvoir joindre plusieurs photos par memo,
Afin de pouvoir creer des memos facilement a tous les niveaux, avoir un contexte pertinent dans le lot, et documenter visuellement avec plusieurs photos.

## Acceptance Criteria (BDD)

### AC1: Lien memos toujours visible sur la page plot

**Given** l'utilisateur est sur la page detail d'un plot
**When** la page s'affiche (que `memo_count` soit 0 ou > 0)
**Then** le bandeau bleu "Memos" est toujours visible et cliquable, affichant "N memo(s)" si > 0 ou "Memos" si 0

### AC2: Lien memos toujours visible sur la page etage

**Given** l'utilisateur est sur la page detail d'un etage
**When** la page s'affiche (que `memo_count` soit 0 ou > 0)
**Then** le bandeau bleu "Memos" est toujours visible et cliquable, affichant "N memo(s)" si > 0 ou "Memos" si 0

### AC3: Page lot affiche uniquement les memos de l'etage

**Given** un lot appartient a un etage
**When** l'utilisateur consulte la page du lot
**Then** la section memos affiche uniquement les memos de l'etage parent (pas ceux du chantier ni du plot)

### AC4: Section memos masquee sur le lot si aucun memo etage

**Given** aucun memo n'existe sur l'etage parent du lot
**When** l'utilisateur consulte la page du lot
**Then** aucune section memos n'est affichee

### AC5: Joindre plusieurs photos a un memo (creation)

**Given** l'utilisateur cree un nouveau memo (chantier, plot ou etage)
**When** il ajoute des photos via le bouton "Ajouter une photo"
**Then** il peut ajouter jusqu'a 5 photos, chacune apparaissant en apercu avec possibilite de suppression individuelle

### AC6: Afficher plusieurs photos dans MemoCard

**Given** un memo a une ou plusieurs photos
**When** le memo est affiche dans la liste
**Then** les photos sont affichees en ligne horizontale sous le texte (miniatures scrollables)

### AC7: Afficher plusieurs photos dans MemoContextSection (lot)

**Given** un memo d'etage a plusieurs photos
**When** il est affiche dans la section memos de la page lot
**Then** les photos sont visibles en miniatures sous le texte du memo

### AC8: Ajouter des photos a un memo existant (edition)

**Given** l'utilisateur edite un memo existant
**When** il ouvre le formulaire d'edition
**Then** les photos existantes sont affichees, il peut en supprimer ou en ajouter (max 5 au total)

### AC9: Suppression d'un memo avec plusieurs photos

**Given** un memo a plusieurs photos dans le storage
**When** l'utilisateur supprime le memo
**Then** toutes les photos associees sont supprimees du bucket storage, et les lignes `memo_photos` sont supprimees en cascade

## Tasks / Subtasks

- [x] Task 1 — Bandeau memos toujours visible sur plot et etage (AC: #1, #2)
  - [x] 1.1 Modifier `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.tsx` : afficher le bandeau memos inconditionnellement (supprimer la condition `memo_count > 0`), afficher "N memo(s)" si > 0, sinon "Memos"
  - [x] 1.2 Modifier `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/index.tsx` : idem, afficher le bandeau memos inconditionnellement
  - [x] 1.3 Mettre a jour les tests existants du bandeau plot : remplacer le test "masque si pas de memos" par un test "affiche 'Memos' si memo_count === 0"
  - [x] 1.4 Mettre a jour les tests existants du bandeau etage : idem

- [x] Task 2 — MemoContextSection : uniquement etage (AC: #3, #4)
  - [x] 2.1 Simplifier `src/components/MemoContextSection.tsx` : ne plus fetcher/afficher les memos chantier et plot, uniquement les memos de l'etage
  - [x] 2.2 Renommer les props : retirer `chantierId`, `plotId`, `chantierNom`, `plotNom` — garder uniquement `etageId` et `etageNom`
  - [x] 2.3 Simplifier la requete : utiliser `useMemos('etage', etageId)` au lieu de `useContextMemos`
  - [x] 2.4 Affichage : section simple "Memos etage — {etageNom}" avec les memos en lecture seule, sans groupes collapsibles
  - [x] 2.5 Mettre a jour `$lotId/index.tsx` : adapter les props passees a `MemoContextSection`
  - [x] 2.6 Mettre a jour les tests `MemoContextSection.test.tsx` : adapter aux nouvelles props et comportement
  - [x] 2.7 Evaluer si `useContextMemos.ts` et `useContextMemos.test.ts` sont encore utilises. Si non, les supprimer.

- [x] Task 3 — Migration SQL : table `memo_photos` (AC: #5, #6, #8, #9)
  - [x] 3.1 Creer `supabase/migrations/059_memo_photos.sql`
  - [x] 3.2 Creer la table `memo_photos` : `id uuid PK DEFAULT gen_random_uuid()`, `memo_id uuid NOT NULL REFERENCES memos(id) ON DELETE CASCADE`, `photo_url text NOT NULL`, `position integer NOT NULL DEFAULT 0`, `created_at timestamptz NOT NULL DEFAULT now()`
  - [x] 3.3 Creer index : `idx_memo_photos_memo_id`
  - [x] 3.4 Appliquer RLS : `SELECT apply_rls_policy('memo_photos')`
  - [x] 3.5 Migrer les donnees existantes : `INSERT INTO memo_photos (memo_id, photo_url, position) SELECT id, photo_url, 0 FROM memos WHERE photo_url IS NOT NULL`
  - [x] 3.6 Supprimer la colonne `photo_url` de la table `memos` : `ALTER TABLE memos DROP COLUMN photo_url`

- [x] Task 4 — Types TypeScript : database.ts (AC: #5, #6)
  - [x] 4.1 Ajouter la table `memo_photos` dans `Database.public.Tables` avec Row/Insert/Update
  - [x] 4.2 Retirer `photo_url` de `memos.Row/Insert/Update`
  - [x] 4.3 Ajouter le type exporte `MemoPhoto`
  - [x] 4.4 Mettre a jour le type `Memo` pour retirer `photo_url`

- [x] Task 5 — Hooks et mutations : multi-photos (AC: #5, #8, #9)
  - [x] 5.1 Mettre a jour `useMemos.ts` : joindre `memo_photos` dans le select (`.select('*, memo_photos(*)')`) et trier les photos par `position`
  - [x] 5.2 Mettre a jour `useUploadMemoPhoto.ts` : au lieu de faire un `update` sur `memos.photo_url`, faire un `insert` dans `memo_photos` avec le `memo_id`, `photo_url` et `position` (calculer la position comme le nombre de photos existantes)
  - [x] 5.3 Creer `src/lib/mutations/useDeleteMemoPhoto.ts` : supprimer la ligne `memo_photos`, supprimer le fichier du storage bucket
  - [x] 5.4 Mettre a jour `useDeleteMemo.ts` : supprimer toutes les photos du storage (fetch `memo_photos` par `memo_id` avant deletion, puis supprimer les fichiers du bucket)
  - [x] 5.5 Tests : adapter `useMemos.test.ts` pour la jointure `memo_photos`
  - [x] 5.6 Tests : adapter `useUploadMemoPhoto.test.ts` pour l'insert dans `memo_photos`
  - [x] 5.7 Tests : creer `useDeleteMemoPhoto.test.ts`
  - [x] 5.8 Tests : adapter `useDeleteMemo.test.ts` pour la suppression multi-photos

- [x] Task 6 — Composants : affichage multi-photos (AC: #6, #7)
  - [x] 6.1 Mettre a jour `MemoCard.tsx` : remplacer l'affichage `memo.photo_url` par une ligne scrollable de miniatures depuis `memo.memo_photos` (flex row, overflow-x-auto, gap-2, h-20 w-20 rounded-lg object-cover)
  - [x] 6.2 Mettre a jour `MemoContextSection.tsx` : adapter l'affichage des photos en lecture seule avec les miniatures depuis `memo.memo_photos`
  - [x] 6.3 Tests : adapter `MemoCard.test.tsx` pour les multi-photos
  - [x] 6.4 Tests : adapter `MemoContextSection.test.tsx` pour les multi-photos

- [x] Task 7 — MemoFormSheet : ajout/suppression multi-photos (AC: #5, #8)
  - [x] 7.1 Modifier `MemoFormSheet.tsx` : remplacer `pendingPhoto: File | null` par `pendingPhotos: File[]` (max 5)
  - [x] 7.2 Afficher les apercu en ligne (flex row, gap-2) avec bouton de suppression individuel sur chaque miniature
  - [x] 7.3 Masquer le bouton "Ajouter une photo" quand 5 photos atteintes
  - [x] 7.4 Sur submit creation : creer le memo, puis uploader chaque photo sequentiellement via `useUploadMemoPhoto`
  - [x] 7.5 En mode edition : afficher les photos existantes (depuis `editMemo.memo_photos`) + les nouvelles photos en attente, permettre la suppression des existantes (via `useDeleteMemoPhoto`) et l'ajout de nouvelles (tant que total < 5)
  - [x] 7.6 Tests : adapter `MemoFormSheet.test.tsx` pour multi-photos (ajout, suppression, limite max)

- [x] Task 8 — Validation finale (AC: #1-9)
  - [x] 8.1 `npx tsc --noEmit` — 0 erreurs
  - [x] 8.2 `npx eslint` — 0 nouvelles erreurs
  - [x] 8.3 `npm run build` — build propre
  - [x] 8.4 Tous les tests de la story passent
  - [x] 8.5 Tests existants (stories 8.5 et 8.6) toujours verts

## Dev Notes

### Modele de donnees

```sql
-- Nouvelle table memo_photos (relation 1-N)
CREATE TABLE public.memo_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memo_id uuid NOT NULL REFERENCES public.memos(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_memo_photos_memo_id ON public.memo_photos(memo_id);
SELECT public.apply_rls_policy('memo_photos');

-- Migration des donnees existantes
INSERT INTO memo_photos (memo_id, photo_url, position)
SELECT id, photo_url, 0 FROM memos WHERE photo_url IS NOT NULL;

-- Nettoyage
ALTER TABLE memos DROP COLUMN photo_url;
```

### Limite photos

- Maximum 5 photos par memo (valide cote frontend uniquement)
- Pas de CHECK constraint en base : la validation est dans le formulaire

### Bandeau memos : avant/apres

**Avant (plot/etage) :**
```tsx
{plot.memo_count > 0 && (
  <Link ...> {plot.memo_count} memo(s) </Link>
)}
```

**Apres (meme pattern que chantier) :**
```tsx
<Link ...>
  {entity.memo_count > 0
    ? `${entity.memo_count} memo(s)`
    : 'Memos'}
</Link>
```

### MemoContextSection simplifie

**Avant :** 3 groupes collapsibles (Chantier, Plot, Etage)
**Apres :** Section plate avec uniquement les memos de l'etage

```
+---------------------------------------------+
| Memos                                        |
| | Attention dalle fragile hall RDC           |
| | [photo1] [photo2]                         |
| |                         12 fev . bruno     |
| | Cle gardienne                              |
| |                         10 fev . youssef   |
+---------------------------------------------+
```

### MemoFormSheet : gestion multi-photos

```
+---------------------------------------------+
| Nouveau memo                                 |
| [____________________________________]       |
| [____________________________________]       |
|                                              |
| [img1 x] [img2 x] [img3 x]  [+ Photo]      |
|                                              |
| [        Ajouter        ]                    |
+---------------------------------------------+
```

- Apercu en ligne horizontale scrollable
- Bouton "x" sur chaque miniature pour retirer
- Bouton "+ Photo" masque a 5 photos
- En edition : photos existantes + nouvelles en attente

### Query keys

| Hook | Query Key | Notes |
|------|-----------|-------|
| `useMemos('etage', id)` | `['memos', 'etage', id]` | Maintenant avec jointure `memo_photos(*)` |
| `useDeleteMemoPhoto` | invalide `['memos', ...]` | Suppression unitaire de photo |

### Fichiers a supprimer potentiellement

- `src/lib/queries/useContextMemos.ts` — plus utilise si MemoContextSection utilise `useMemos`
- `src/lib/queries/useContextMemos.test.ts` — idem

### Risques et points d'attention

1. **Migration donnees existantes** : Les memos avec `photo_url` doivent etre migres vers `memo_photos` AVANT de dropper la colonne. L'ordre dans la migration est critique.
2. **Suppression cascade** : `ON DELETE CASCADE` sur `memo_photos.memo_id` assure le nettoyage des lignes, mais les fichiers dans le storage doivent etre supprimes manuellement dans `useDeleteMemo`.
3. **Type `Memo` change** : Retirer `photo_url` et ajouter `memo_photos?: MemoPhoto[]` impacte tous les composants qui lisent `memo.photo_url`. Rechercher et mettre a jour toutes les references.
4. **Performance jointure** : La jointure `memo_photos(*)` ajoute une sous-requete par memo. Acceptable car les listes de memos sont courtes (< 50 en general).
5. **Ordre des tasks** : Les tasks 1 et 2 (bandeau + MemoContextSection) sont independantes et peuvent etre faites en premier sans migration. La migration (task 3) est prerequise pour les tasks 4-7.

## Dev Agent Record

### File List

| File | Action | Description |
|------|--------|-------------|
| `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.tsx` | Modified | Bandeau memos toujours visible (unconditional) |
| `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/index.tsx` | Modified | Bandeau memos toujours visible (unconditional) |
| `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.test.tsx` | Modified | Added AC #1 tests for always-visible bandeau |
| `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/index.test.tsx` | Modified | Added AC #2 tests for always-visible bandeau |
| `src/components/MemoContextSection.tsx` | Modified | Simplified to etage-only memos with multi-photo display |
| `src/components/MemoContextSection.test.tsx` | Modified | Adapted to new props (etageId, etageNom) and multi-photo |
| `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/index.tsx` | Modified | Updated MemoContextSection props |
| `src/lib/queries/useContextMemos.ts` | Deleted | Replaced by useMemos('etage', etageId) |
| `src/lib/queries/useContextMemos.test.ts` | Deleted | Removed with useContextMemos |
| `supabase/migrations/059_memo_photos.sql` | Created | memo_photos table, index, RLS, data migration, drop photo_url |
| `src/types/database.ts` | Modified | Added memo_photos table types, removed photo_url from memos |
| `src/lib/queries/useMemos.ts` | Modified | Added MemoWithPhotos type, memo_photos join, position sort |
| `src/lib/queries/useMemos.test.ts` | Modified | Adapted for memo_photos join |
| `src/lib/mutations/useUploadMemoPhoto.ts` | Modified | Insert into memo_photos instead of update memos.photo_url |
| `src/lib/mutations/useUploadMemoPhoto.test.ts` | Modified | Adapted for memo_photos insert |
| `src/lib/mutations/useDeleteMemoPhoto.ts` | Created | Delete photo from storage + memo_photos row |
| `src/lib/mutations/useDeleteMemoPhoto.test.ts` | Created | Tests for useDeleteMemoPhoto |
| `src/lib/mutations/useDeleteMemo.ts` | Modified | Fetch and delete all photos from storage before memo deletion |
| `src/lib/mutations/useDeleteMemo.test.ts` | Modified | Adapted for multi-photo storage cleanup |
| `src/components/MemoCard.tsx` | Modified | Multi-photo thumbnails display (scrollable row) |
| `src/components/MemoCard.test.tsx` | Modified | Multi-photo display tests |
| `src/components/MemoFormSheet.tsx` | Modified | Multi-photo add/remove (pendingPhotos[], deletedPhotoIds) |
| `src/components/MemoFormSheet.test.tsx` | Modified | Multi-photo form tests (add, remove, max 5 limit) |
| `src/routes/_authenticated/chantiers/$chantierId/memos.tsx` | Modified | MemoWithPhotos type, removed photoUrl from delete |
| `src/routes/_authenticated/chantiers/$chantierId/memos.test.tsx` | Modified | Updated mock data: memo_photos instead of photo_url |
| `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/memos.tsx` | Modified | MemoWithPhotos type |
| `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/memos.test.tsx` | Modified | Updated mock data: memo_photos instead of photo_url |
| `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/memos.tsx` | Modified | MemoWithPhotos type |
| `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/memos.test.tsx` | Modified | Updated mock data: memo_photos instead of photo_url |

### Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-03-06 | Task 1: Made memo bandeau unconditional on plot/etage pages | AC #1, #2 |
| 2026-03-06 | Task 2: Simplified MemoContextSection to etage-only, deleted useContextMemos | AC #3, #4 |
| 2026-03-06 | Task 3: Created 059_memo_photos.sql migration | AC #5, #6, #8, #9 |
| 2026-03-06 | Task 4: Updated database.ts types for memo_photos | AC #5, #6 |
| 2026-03-06 | Task 5: Updated hooks/mutations for multi-photo support | AC #5, #8, #9 |
| 2026-03-06 | Task 6: Updated MemoCard and MemoContextSection for multi-photo display | AC #6, #7 |
| 2026-03-06 | Task 7: Updated MemoFormSheet for multi-photo add/remove | AC #5, #8 |
| 2026-03-06 | Task 8: Validation — tsc 0 errors, eslint clean, build success, 84 memo tests pass | AC #1-9 |
| 2026-03-06 | Code review fixes: toast onSuccess/onError (H1), async handleSubmit (H2), delete order (M1), sequential uploads (M2) | Review |

### Test Summary

- **Story 8.7 new tests**: 27 tests across 7 files — all pass
- **Stories 8.5/8.6 existing tests**: 57 tests across 6 files — all pass (after updating mock data to use `memo_photos: []` instead of `photo_url`)
- **Total memo tests**: 84 pass / 0 fail
- **Pre-existing failures**: 29 failures in `plots.$plotId/index.test.tsx` (unrelated to memos, confirmed pre-existing via git stash)

### Completion Notes

All 8 tasks and 9 acceptance criteria implemented. Key decisions:
- Used `data as unknown as MemoWithPhotos[]` cast in useMemos to work around supabase-js type inference limitations with joined tables
- Deleted `useContextMemos` hook entirely (replaced by direct `useMemos('etage', etageId)` call)
- Multi-photo limit (max 5) enforced in frontend only — no DB constraint
- Fixed 3 pre-existing test files (chantier/plot/etage memos.test.tsx) that still used `photo_url` instead of `memo_photos`
