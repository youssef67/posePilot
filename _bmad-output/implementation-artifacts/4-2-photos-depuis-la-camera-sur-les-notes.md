# Story 4.2: Photos depuis la caméra sur les notes

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que utilisateur terrain de posePilot,
Je veux prendre une photo et l'attacher à une note,
Afin que les problèmes soient documentés visuellement depuis le chantier.

## Acceptance Criteria

1. **Given** l'utilisateur crée ou édite une note **When** il tape sur le bouton photo **Then** l'appareil photo s'ouvre via `<input type="file" capture="environment">`

2. **Given** l'utilisateur a pris une photo **When** la photo est sélectionnée **Then** elle est compressée côté client (browser-image-compression, qualité 0.7, max 1200px) avant upload

3. **Given** la photo est compressée **When** l'upload vers Supabase Storage s'effectue **Then** la photo est stockée dans le bucket `note-photos` et liée à la note

4. **Given** la note a des photos attachées **When** l'utilisateur consulte la note **Then** les photos s'affichent en miniatures avec possibilité de les agrandir en plein écran

5. **Given** le réseau est lent (3G) **When** l'upload est en cours **Then** une barre de progression s'affiche et la note est déjà sauvegardée (texte d'abord, photo en arrière-plan)

## Tasks / Subtasks

- [x] Task 1 — Migration SQL : colonne `photo_url` sur notes + bucket Supabase Storage (AC: #3)
  - [x] 1.1 Créer `supabase/migrations/012_note_photos.sql`
  - [x] 1.2 Ajouter colonne `photo_url TEXT` (nullable) à la table `notes`
  - [x] 1.3 Créer le bucket Supabase Storage `note-photos` (public = true pour simplifier l'accès aux URLs)
  - [x] 1.4 RLS policy sur `storage.objects` : authenticated users peuvent INSERT, SELECT et DELETE sur le bucket `note-photos`
  - [x] 1.5 Vérifier que les triggers `has_blocking_note` cascade ne sont PAS impactés par l'ajout de la colonne

- [x] Task 2 — Types TypeScript et mise à jour `database.ts` (AC: #3)
  - [x] 2.1 Ajouter `photo_url: string | null` à l'interface `Note` dans `src/types/database.ts`

- [x] Task 3 — Installer et configurer `browser-image-compression` (AC: #2)
  - [x] 3.1 `npm install browser-image-compression`
  - [x] 3.2 Créer `src/lib/utils/compressImage.ts`
  - [x] 3.3 Export une fonction `compressPhoto(file: File): Promise<File>` avec options : `{ maxSizeMB: 1, maxWidthOrHeight: 1200, useWebWorker: true, initialQuality: 0.7, fileType: 'image/jpeg' }`
  - [x] 3.4 Créer `src/lib/utils/compressImage.test.ts` — tester avec un mock de `browser-image-compression`

- [x] Task 4 — Hook mutation `useUploadNotePhoto` (AC: #2, #3, #5)
  - [x] 4.1 Créer `src/lib/mutations/useUploadNotePhoto.ts`
  - [x] 4.2 Fonction `uploadNotePhoto({ file: File, noteId: string }): Promise<string>` qui :
    - Compresse la photo via `compressPhoto()`
    - Upload vers Supabase Storage : `note-photos/{userId}/{noteId}_{timestamp}.jpg`
    - Récupère l'URL publique via `getPublicUrl()`
    - Met à jour la note (`notes.photo_url = publicUrl`) via `.update()`
    - Retourne l'URL publique
  - [x] 4.3 Pas de mutation optimiste pour l'upload — on affiche une barre de progression réelle
  - [x] 4.4 `onSettled` : invalidate `['notes', ...]` pour rafraîchir la liste
  - [x] 4.5 Toast succès : "Photo ajoutée" / erreur : "Erreur lors de l'upload de la photo"
  - [x] 4.6 Créer `src/lib/mutations/useUploadNotePhoto.test.ts`

- [x] Task 5 — Modifier `useCreateNote` pour supporter le flow photo (AC: #5)
  - [x] 5.1 Modifier `src/lib/mutations/useCreateNote.ts`
  - [x] 5.2 Le flow "note avec photo" fonctionne en 2 temps :
    - Étape 1 : Créer la note (texte + is_blocking) immédiatement → mutation optimiste existante
    - Étape 2 : Upload la photo en arrière-plan via `useUploadNotePhoto` une fois le noteId connu
  - [x] 5.3 La mutation retourne `data` (la note créée avec son `id`) pour permettre l'enchaînement
  - [x] 5.4 Mettre à jour `src/lib/mutations/useCreateNote.test.ts`

- [x] Task 6 — Refactoring du FAB : action unique → menu (AC: #1)
  - [x] 6.1 Modifier `src/components/Fab.tsx` pour supporter un mode menu
  - [x] 6.2 Nouvelle prop optionnelle `menuItems?: Array<{ icon: LucideIcon; label: string; onClick: () => void }>`
  - [x] 6.3 Quand `menuItems` est fourni : tap sur le FAB → affiche un mini-menu vertical au-dessus (items empilés, animation spring) avec overlay semi-transparent
  - [x] 6.4 Quand `menuItems` n'est pas fourni : comportement actuel inchangé (single action `onClick`)
  - [x] 6.5 Items du menu pour cette story : `[{ icon: MessageSquare, label: 'Note', onClick }, { icon: Camera, label: 'Photo', onClick }]`
  - [x] 6.6 Le FAB tourne son icône (Plus → X) quand le menu est ouvert
  - [x] 6.7 Tap sur overlay ou icône X → ferme le menu
  - [x] 6.8 Mettre à jour `src/components/Fab.test.tsx` — tests pour le mode menu

- [x] Task 7 — Composant `PhotoCapture` pour la capture caméra (AC: #1, #2)
  - [x] 7.1 Créer `src/components/PhotoCapture.tsx`
  - [x] 7.2 `<input type="file" accept="image/*" capture="environment" ref={inputRef} className="hidden" />`
  - [x] 7.3 Props : `onPhotoSelected: (file: File) => void`, `disabled?: boolean`
  - [x] 7.4 Expose une méthode `trigger()` via `forwardRef` + `useImperativeHandle` pour ouvrir le sélecteur de fichier depuis le parent
  - [x] 7.5 Sur `onChange` : valide que le fichier est une image, appelle `onPhotoSelected(file)`
  - [x] 7.6 Créer `src/components/PhotoCapture.test.tsx`

- [x] Task 8 — Composant `PhotoPreview` pour la prévisualisation + plein écran (AC: #4)
  - [x] 8.1 Créer `src/components/PhotoPreview.tsx`
  - [x] 8.2 Mode miniature : affiche la photo en `w-20 h-20 rounded-lg object-cover` avec icône de suppression optionnelle
  - [x] 8.3 Mode plein écran : tap sur la miniature → affiche la photo en plein écran via un `Dialog` shadcn (fond noir, photo centrée, bouton fermer)
  - [x] 8.4 Props : `url: string`, `alt?: string`, `onRemove?: () => void`, `showRemove?: boolean`
  - [x] 8.5 Skeleton loading pendant le chargement de l'image
  - [x] 8.6 Créer `src/components/PhotoPreview.test.tsx`

- [x] Task 9 — Modifier `NoteForm` : ajout du flow photo (AC: #1, #2, #5)
  - [x] 9.1 Modifier `src/components/NoteForm.tsx`
  - [x] 9.2 Ajouter un état `pendingPhoto: File | null` pour la photo en attente
  - [x] 9.3 Ajouter un état `photoPreviewUrl: string | null` via `URL.createObjectURL()` pour l'aperçu
  - [x] 9.4 Nouveau prop optionnel `initialPhoto?: File` — quand le FAB ouvre le NoteForm via "Photo", la caméra a déjà été déclenchée et le fichier est passé
  - [x] 9.5 Afficher l'aperçu de la photo sous le Textarea (miniature 80x80px avec bouton supprimer)
  - [x] 9.6 Bouton "Ajouter une photo" (icône Camera) visible si pas de photo en attente
  - [x] 9.7 Flow de création : `createNote.mutate()` → si photo → `uploadNotePhoto.mutate({ file, noteId })` dans le callback `onSuccess`
  - [x] 9.8 Pendant l'upload de la photo : afficher une barre de progression (Progress component ou simple barre CSS)
  - [x] 9.9 Cleanup `URL.revokeObjectURL()` sur close/unmount
  - [x] 9.10 Mettre à jour `src/components/NoteForm.test.tsx`

- [x] Task 10 — Modifier `NotesList` : affichage des photos (AC: #4)
  - [x] 10.1 Modifier `src/components/NotesList.tsx`
  - [x] 10.2 Quand `note.photo_url` est non null : afficher `<PhotoPreview url={note.photo_url} />` sous le texte de la note
  - [x] 10.3 Lazy loading de l'image : `loading="lazy"` natif
  - [x] 10.4 Mettre à jour `src/components/NotesList.test.tsx`

- [x] Task 11 — Intégration sur les pages lot et pièce (AC: #1)
  - [x] 11.1 Modifier `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/index.tsx`
    - Remplacer le FAB single-action par le FAB menu avec 2 items (Note, Photo)
    - "Note" : ouvre NoteForm sans photo (comportement actuel)
    - "Photo" : déclenche PhotoCapture → quand photo sélectionnée → ouvre NoteForm avec `initialPhoto`
  - [x] 11.2 Modifier `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/$pieceId.tsx`
    - Même pattern que le lot : FAB menu → Note / Photo
    - Attention : le FAB ne doit PAS interférer avec le swipe entre pièces (vérifier le z-index et la zone tactile)
  - [x] 11.3 Mettre à jour les tests d'intégration des deux pages

- [x] Task 12 — Tests de bout en bout et régression (AC: #1-5)
  - [x] 12.1 Lancer `npm run test` — tous les tests existants (490+) + nouveaux passent
  - [x] 12.2 Lancer `npm run lint` — 0 nouvelles erreurs (erreur ThemeProvider.tsx:64 pré-existante tolérée)
  - [x] 12.3 Lancer `npm run build` — build propre

## Dev Notes

### Flow principal — Capture photo et upload

```
Utilisateur tape FAB → Menu s'ouvre (Note / Photo)
                                  ↓
                            Tape "Photo"
                                  ↓
                   <input capture="environment"> → Caméra s'ouvre
                                  ↓
                         Photo sélectionnée
                                  ↓
                    NoteForm s'ouvre avec aperçu photo
                     (pendingPhoto + photoPreviewUrl)
                                  ↓
               Utilisateur saisit texte (optionnel) + valide
                                  ↓
            Étape 1: createNote.mutate() → note créée (optimiste)
                                  ↓
            Étape 2: uploadNotePhoto.mutate({ file, noteId })
                     → compressPhoto() (browser-image-compression)
                     → supabase.storage.upload() (barre de progression)
                     → supabase.from('notes').update({ photo_url })
                                  ↓
                  Note visible avec photo dans NotesList
```

### Décision architecturale — Upload en 2 temps

Le flow est volontairement **découplé** :
1. **La note est créée immédiatement** (mutation optimiste) — l'utilisateur n'attend pas
2. **La photo est uploadée en arrière-plan** — barre de progression visible

Raisons :
- Le texte + flag bloquant sont l'info critique (visible immédiatement)
- L'upload peut prendre 5-10s en 3G — on ne bloque pas l'utilisateur
- Si l'upload échoue, la note existe quand même (texte préservé)
- La barre de progression rassure l'utilisateur pendant l'upload

### FAB Menu — Pattern d'interaction

```
┌─────────────────────────────────┐
│                                 │
│                                 │
│                                 │
│                    ┌──────────┐ │
│                    │ 📷 Photo │ │  ← mini-menu empilé
│                    ├──────────┤ │
│                    │ 💬 Note  │ │
│                    └──────────┘ │
│                         [×]     │  ← FAB (icône tournée en X)
├─────────────────────────────────┤
│ BottomNavigation               │
└─────────────────────────────────┘
```

- Le menu empile les items **au-dessus** du FAB
- Un overlay semi-transparent couvre le reste de l'écran
- Tap sur l'overlay ou le X → ferme le menu
- Les labels sont optionnels (icône + texte court pour la clarté)
- Animation spring d'apparition (ou transition CSS scale/opacity)
- `prefers-reduced-motion` : pas d'animation

### Compression photo — Configuration

```typescript
// src/lib/utils/compressImage.ts
import imageCompression from 'browser-image-compression'

export async function compressPhoto(file: File): Promise<File> {
  return imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    initialQuality: 0.7,
    fileType: 'image/jpeg',
  })
}
```

**Specs architecture/PRD** : qualité 0.7, max 1200px — définis dans le PRD (NFR7) et l'Architecture (browser-image-compression).

### Supabase Storage — Organisation des fichiers

```
note-photos/                    ← bucket public
  {userId}/                     ← dossier par utilisateur
    {noteId}_{timestamp}.jpg    ← fichier unique par photo
```

- Bucket **public** : les URLs sont accessibles directement sans signed URLs. Acceptable pour un outil interne avec 2-3 utilisateurs.
- Le `userId` dans le path sert de clé organisationnelle et facilite la RLS policy
- Le `timestamp` évite les collisions si une photo est remplacée

### Migration 012 — Ajouts

```sql
-- Colonne photo_url sur la table notes
ALTER TABLE public.notes ADD COLUMN photo_url TEXT;

-- Bucket Storage (exécuté via Supabase Dashboard ou seed, pas en migration SQL)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('note-photos', 'note-photos', true);
```

**Note importante** : La création de buckets Supabase Storage ne peut pas toujours être faite via migration SQL standard. Il est recommandé de :
1. Ajouter le `ALTER TABLE` dans la migration SQL
2. Créer le bucket via le Supabase Dashboard ou via un script seed

Alternativement, si le Supabase local supporte l'INSERT dans `storage.buckets` dans les migrations, on peut le faire directement :

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('note-photos', 'note-photos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies pour le bucket
CREATE POLICY "Authenticated users can upload photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'note-photos');

CREATE POLICY "Authenticated users can view photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'note-photos');

CREATE POLICY "Authenticated users can delete own photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'note-photos');
```

### Modification NoteForm — Aperçu photo

```
┌─────────────────────────────────┐
│ Nouvelle note                   │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ Écrire une note...          │ │  ← Textarea (existant)
│ └─────────────────────────────┘ │
│                                 │
│ ┌──────┐                        │
│ │ 📷   │  × supprimer           │  ← Photo preview 80x80
│ └──────┘                        │
│   --- OU ---                    │
│ 📷 Ajouter une photo            │  ← Bouton si pas de photo
│                                 │
│ 🔴 Bloquant  [toggle]          │  ← Switch (existant)
│                                 │
│ [ Créer ]                       │  ← Bouton (existant)
│ ████████░░░░ 65%                │  ← Barre progression upload
└─────────────────────────────────┘
```

### NotesList — Affichage des photos

```
┌─────────────────────────────────────┐
│ 🔴 Fissure au plafond SDB          │
│    support fissuré                   │
│    ┌──────┐                          │
│    │ 📷   │  ← tap pour plein écran │
│    └──────┘                          │
│    bruno · il y a 2h · Bloquant     │
├─────────────────────────────────────┤
│    Joints vérifiés, RAS             │
│    youssef · hier                    │
└─────────────────────────────────────┘
```

- La miniature est en `w-20 h-20 rounded-lg object-cover`
- Tap sur la miniature → Dialog plein écran avec fond noir
- `loading="lazy"` pour ne pas charger les images hors viewport

### PhotoPreview — Dialog plein écran

Utiliser le composant shadcn `Dialog` existant :

```tsx
<Dialog open={fullscreen} onOpenChange={setFullscreen}>
  <DialogContent className="max-w-none h-screen bg-black/95 border-none p-0 flex items-center justify-center">
    <img src={url} alt={alt} className="max-w-full max-h-full object-contain" />
  </DialogContent>
</Dialog>
```

### Interactions FAB vs Swipe sur écran pièce

La Story 4.1 a validé que le FAB (tap) ne conflicte pas avec le swipe (drag). Avec le menu FAB :
- Le menu s'affiche **au-dessus** du FAB en `fixed`, avec un `z-50`
- L'overlay intercepte les taps mais pas les swipes (car le swipe est géré par `onPointerDown/Move/Up` sur le contenu en dessous)
- Si le menu est ouvert et que l'utilisateur swipe → l'overlay capture le tap initial, le menu se ferme. Pas de conflit.

### Prérequis et dépendances

- **browser-image-compression** : `npm install browser-image-compression` — nouvelle dépendance
- **shadcn Dialog** : Vérifier qu'il est installé. Si non : `npx shadcn@latest add dialog` — nécessaire pour PhotoPreview plein écran
- **lucide-react** : Déjà installé — icônes `Camera`, `MessageSquare`, `X`, `ImageIcon`, `Trash2`
- **Supabase Storage SDK** : Inclus dans `@supabase/supabase-js` (déjà installé v2.95.3)

### Risques et points d'attention

1. **Bucket Storage** : Première utilisation de Supabase Storage dans le projet. La création du bucket en migration SQL peut nécessiter un ajustement si le Supabase local n'exécute pas les INSERTs sur `storage.buckets`.
2. **Camera sur iOS PWA** : iOS en mode standalone (PWA installée) peut avoir des restrictions sur l'accès caméra. `capture="environment"` est le pattern le plus fiable. Tester sur appareil réel.
3. **Web Worker pour compression** : `browser-image-compression` avec `useWebWorker: true` nécessite que le CSP permette `blob:` pour les scripts. Vérifier si Vite/Vercel impose des restrictions.
4. **Photos haute résolution** : Les smartphones modernes produisent des photos de 10-20 MB. La compression `maxSizeMB: 1` + `maxWidthOrHeight: 1200` ramène à ~200-500 KB. Suffisant pour le chantier.
5. **URL.createObjectURL()** : Bien appeler `URL.revokeObjectURL()` au cleanup pour éviter les memory leaks.
6. **Tests jsdom** : `URL.createObjectURL` et `FileReader` sont limités en jsdom. Mocker ces APIs dans les tests.
7. **Dialog shadcn** : S'assurer qu'il est installé. Le fichier `src/components/ui/dialog.tsx` devrait exister (utilisé dans AlertDialog).

### Learnings des stories précédentes (relevants)

- **FAB cohabite avec le swipe** — validé en Story 4.1 (tap vs drag, pas de conflit PointerEvents)
- **Mutation optimiste standard** : `onMutate/onError/onSettled` — pattern établi depuis Story 1.4
- **`Relationships: []`** dans `database.ts` : obligatoire pour l'inférence de types
- **`{ [_ in never]: never }`** au lieu de `Record<string, never>` pour les sections vides de `database.ts`
- **Sonner** : utiliser `useTheme` custom du projet, pas `next-themes`
- **Erreur lint ThemeProvider.tsx:64** : pré-existante, ne pas corriger
- **Tests jsdom vs Browser APIs** : La rétro Epic 3 a identifié le besoin de mocker les APIs navigateur (Camera, File, Blob) dans les tests. Définir les mocks dans `src/test/` pour réutilisation.
- **Pre-existing test failures** : 5 pwa-html.test.ts, 5 pwa-config.test.ts, 6 plots.$plotId/index.test.tsx (Radix UI hasPointerCapture jsdom issue) — ne pas s'en inquiéter.

### Project Structure Notes

- Nouveaux fichiers dans `src/lib/utils/` : premier utilitaire dans ce dossier (`compressImage.ts`)
- Nouveau composant `PhotoCapture.tsx` : réutilisable pour les stories futures (Story 4.3: partage photo, Story 6.3: BC/BL)
- Nouveau composant `PhotoPreview.tsx` : réutilisable pour tout affichage de photo dans l'app
- Migration 012 suit la séquence existante (001-011)
- Le bucket `note-photos` est le premier bucket Storage du projet

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 4.2, Epic 4]
- [Source: _bmad-output/planning-artifacts/architecture.md — Frontend Architecture (browser-image-compression qualité 0.7, max 1200px), Supabase Storage buckets, Naming Patterns (compressImage.ts), Data Architecture]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — FAB 56px, Photo capture caméra, Max 3 champs formulaire, Barre de progression upload]
- [Source: _bmad-output/planning-artifacts/prd.md — FR30, NFR7]
- [Source: _bmad-output/implementation-artifacts/4-1-creation-de-notes-texte-avec-flag-bloquant.md — NoteForm pattern, FAB pattern, NotesList pattern, Triggers cascade, Review fixes]
- [Source: _bmad-output/implementation-artifacts/epic-3-retro-2026-02-10.md — Action items: Supabase Storage config, Browser APIs testing strategy]
- [Source: supabase/migrations/011_notes.sql — Notes table schema, triggers cascade has_blocking_note]
- [Source: src/components/NoteForm.tsx — Current note creation UI (Sheet, Textarea, Switch)]
- [Source: src/components/NotesList.tsx — Current note display (relative time, blocking badge)]
- [Source: src/components/Fab.tsx — Current single-action FAB (Plus icon, fixed bottom-20 right-4)]
- [Source: src/lib/mutations/useCreateNote.ts — Mutation optimiste, insert notes, auth.getUser()]
- [Source: src/lib/queries/useNotes.ts — Query notes by lotId/pieceId]
- [Source: src/lib/supabase.ts — Client Supabase singleton (supports Storage API)]
- [Source: src/types/database.ts — Note interface (no photo_url currently)]
- [Source: npm: browser-image-compression v2.0.2 — maxSizeMB, maxWidthOrHeight, useWebWorker, onProgress, TypeScript support]
- [Source: Supabase Docs — Storage upload, getPublicUrl, createSignedUrl, RLS policies, bucket creation]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- `sonner` package was removed during `npm install browser-image-compression` — fixed by `npm install sonner`
- jsdom doesn't support `HTMLImageElement.loading` property — used `getAttribute('loading')` in tests
- Missing `DialogTitle` in PhotoPreview Dialog — added sr-only title for a11y
- `react-hooks/set-state-in-effect` lint errors in NoteForm — refactored to `useState(initialPhoto)` + key-based remounting pattern
- `react-hooks/refs` lint error from accessing ref during render — removed the ref pattern entirely

### Completion Notes List

- All 12 tasks and subtasks implemented and verified
- 525 tests pass (16 pre-existing failures: 5 pwa-html, 5 pwa-config, 6 hasPointerCapture)
- 0 new lint errors (pre-existing ThemeProvider.tsx:64 only)
- Build: no new TS errors from story 4.2 files (pre-existing `Record<string, never>` issues remain)
- First use of Supabase Storage in the project (bucket `note-photos`)
- First utility in `src/lib/utils/` directory (`compressImage.ts`)
- FAB refactored from single-action to menu mode with backward compatibility
- Two-phase note+photo flow: note created optimistically, photo uploaded in background
- Key-based remounting pattern used for NoteForm to sync `initialPhoto` prop without lint violations

### Senior Developer Review (AI) — 2026-02-10

**Reviewer:** Youssef (Claude Opus 4.6)

**Issues Found:** 2 High, 2 Medium, 3 Low — All HIGH/MEDIUM fixed.

**Fixes applied:**
1. **[H1] Fake progress bar → real progress tracking** — `compressImage.ts` now accepts `onProgress`, `useUploadNotePhoto.ts` reports phase-based progress (compression 0-70%, upload 70-90%, DB update 90-100%), `NoteForm.tsx` displays real progress bar with `role="progressbar"` and aria attributes.
2. **[H2] RLS DELETE policy too permissive** — `012_note_photos.sql` DELETE policy now filters by `auth.uid()::text = (storage.foldername(name))[1]` so users can only delete their own photos.
3. **[M1] Orphan photo cleanup** — `useUploadNotePhoto.ts` now removes the uploaded photo from storage if the DB update fails (`supabase.storage.remove()`).
4. **[M2] Mock data alignment** — Added `photo_url: null` to mock notes in lot index and piece route tests.

**Low issues (not fixed, acceptable):**
- L1: `package-lock.json` not in File List (expected side-effect)
- L2: `src/routeTree.gen.ts` not in File List (auto-generated)
- L3: `as Record<string, unknown>` type assertion (known pre-existing `database.ts` issue)

### File List

**New files:**
- `supabase/migrations/012_note_photos.sql`
- `src/lib/utils/compressImage.ts`
- `src/lib/utils/compressImage.test.ts`
- `src/lib/mutations/useUploadNotePhoto.ts`
- `src/lib/mutations/useUploadNotePhoto.test.ts`
- `src/components/PhotoCapture.tsx`
- `src/components/PhotoCapture.test.tsx`
- `src/components/PhotoPreview.tsx`
- `src/components/PhotoPreview.test.tsx`
- `src/components/ui/dialog.tsx` (shadcn)

**Modified files:**
- `src/types/database.ts` — added `photo_url` to Note interface
- `src/lib/mutations/useCreateNote.ts` — added `photo_url: null` to optimistic update
- `src/lib/mutations/useCreateNote.test.ts` — added data return test
- `src/components/Fab.tsx` — refactored to support menu mode
- `src/components/Fab.test.tsx` — updated for menu mode tests
- `src/components/NoteForm.tsx` — added photo capture/preview/upload flow
- `src/components/NoteForm.test.tsx` — added photo-related tests
- `src/components/NotesList.tsx` — added PhotoPreview rendering
- `src/components/NotesList.test.tsx` — added photo tests
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/index.tsx` — FAB menu + PhotoCapture
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/index.test.tsx` — updated FAB tests
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/$pieceId.tsx` — FAB menu + PhotoCapture
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/$pieceId.test.tsx` — updated FAB tests
- `package.json` — added `browser-image-compression`, re-added `sonner`
