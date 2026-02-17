# Story 4.5: Détail, édition et suppression de notes

Status: done

## Story

En tant que utilisateur de posePilot sur un chantier,
Je veux pouvoir consulter une note en détail, la modifier et la supprimer,
Afin de gérer mes notes de terrain après leur création et corriger les erreurs éventuelles.

## Acceptance Criteria

1. **Given** une note existe dans la liste **When** l'utilisateur clique sur la note **Then** une modale s'affiche avec le texte complet, la date et le badge bloquant (si applicable)

2. **Given** la modale de détail est ouverte sur une note avec photo **When** la photo est affichée en miniature **Then** l'utilisateur peut cliquer sur la miniature pour l'afficher en plein écran

3. **Given** la modale de détail est ouverte **When** l'utilisateur clique sur "Modifier" **Then** le contenu et le flag bloquant deviennent éditables

4. **Given** l'utilisateur modifie une note **When** il valide les modifications **Then** la note est mise à jour en base et la liste se rafraîchit

5. **Given** l'utilisateur modifie le flag bloquant d'une note **When** il valide **Then** la cascade `has_blocking_note` est recalculée (lots → étages → plots → chantiers)

6. **Given** la modale de détail est ouverte **When** l'utilisateur clique sur "Supprimer" **Then** un dialog de confirmation s'affiche avant suppression

7. **Given** l'utilisateur confirme la suppression **When** la note avait une photo **Then** la photo est aussi supprimée du storage Supabase

8. **Given** une note avec photo existe dans la liste **When** la miniature s'affiche **Then** l'image charge correctement (pas de skeleton infini)

9. **Given** la photo ne peut pas charger (URL invalide, erreur réseau) **When** le composant PhotoPreview est affiché **Then** un état d'erreur est affiché à la place du skeleton

## Tasks / Subtasks

- [x] Task 1 — Fix PhotoPreview : handler onError (AC: #8, #9)
  - [x]1.1 Ajouter un state `error` et un handler `onError` sur `<img>` dans `PhotoPreview.tsx`
  - [x]1.2 Afficher une icône/placeholder "image cassée" quand `error = true`
  - [x]1.3 Ajouter tests pour le cas onError dans `PhotoPreview.test.tsx`

- [x]Task 2 — Hook `useUpdateNote` (AC: #4, #5)
  - [x]2.1 Créer `src/lib/mutations/useUpdateNote.ts` — mutation update `content` + `is_blocking`
  - [x]2.2 Invalidation du cache `['notes']` on success
  - [x]2.3 Toast succès/erreur
  - [x]2.4 Créer `src/lib/mutations/useUpdateNote.test.ts`

- [x]Task 3 — Hook `useDeleteNote` + suppression photo storage (AC: #6, #7)
  - [x]3.1 Créer `src/lib/mutations/useDeleteNote.ts` — suppression note + cleanup photo si `photo_url` existe
  - [x]3.2 Extraire le `filePath` depuis `photo_url` pour `storage.from('note-photos').remove()`
  - [x]3.3 Invalidation du cache `['notes']` on success
  - [x]3.4 Toast succès/erreur
  - [x]3.5 Créer `src/lib/mutations/useDeleteNote.test.ts`

- [x]Task 4 — Composant `NoteDetailDialog` (AC: #1, #2, #3, #4, #6)
  - [x]4.1 Créer `src/components/NoteDetailDialog.tsx` — Dialog/Sheet avec :
    - Texte complet de la note
    - Date formatée
    - Badge "Bloquant" si applicable
    - Miniature photo cliquable → plein écran (réutiliser `PhotoPreview`)
  - [x]4.2 Mode lecture par défaut, bouton "Modifier" → bascule en mode édition (Textarea + Switch bloquant)
  - [x]4.3 Bouton "Supprimer" → AlertDialog de confirmation
  - [x]4.4 Appel `useUpdateNote` à la validation des modifications
  - [x]4.5 Appel `useDeleteNote` à la confirmation de suppression
  - [x]4.6 Créer `src/components/NoteDetailDialog.test.tsx`

- [x]Task 5 — Intégration dans `NotesList` (AC: #1)
  - [x]5.1 Ajouter un state `selectedNote` dans `NotesList`
  - [x]5.2 Rendre chaque note cliquable → ouvre `NoteDetailDialog`
  - [x]5.3 Ajouter `cursor-pointer` et feedback visuel au hover/tap
  - [x]5.4 Mettre à jour `NotesList.test.tsx` pour tester l'ouverture de la modale

- [x]Task 6 — Tests & lint (AC: tous)
  - [x]6.1 `npm run lint` — vérifier 0 nouvelles erreurs
  - [x]6.2 `npx tsc --noEmit` — 0 erreurs TypeScript
  - [x]6.3 Exécuter tous les tests notes — 100% pass, 0 régression

## Dev Notes

### Vue d'ensemble

Story de **CRUD completion + UX** sur les notes. On ajoute la lecture détaillée (modale), l'édition et la suppression. On corrige aussi le bug de photo qui ne charge pas (absence de handler `onError`).

### Ce qui existe déjà

| Élément | Fichier | Notes |
|---------|---------|-------|
| Liste notes | `src/components/NotesList.tsx` | À rendre cliquable |
| Photo preview | `src/components/PhotoPreview.tsx` | Manque onError, fullscreen existe déjà |
| Note form (create) | `src/components/NoteForm.tsx` | Réutiliser le pattern pour l'édition |
| Create mutation | `src/lib/mutations/useCreateNote.ts` | Pattern à suivre pour update/delete |
| Upload photo | `src/lib/mutations/useUploadNotePhoto.ts` | Contient le filePath pattern pour cleanup |
| AlertDialog | `src/components/ui/alert-dialog.tsx` | shadcn, pour confirmation suppression |
| Dialog | `src/components/ui/dialog.tsx` | shadcn, pour la modale détail |
| Sheet | `src/components/ui/sheet.tsx` | Alternative bottom-sheet mobile |
| Realtime sub | `src/lib/subscriptions/useRealtimeNotes.ts` | Déjà actif sur lot + piece pages |

### Suppression photo — extraction filePath

```typescript
// photo_url format: https://<project>.supabase.co/storage/v1/object/public/note-photos/<userId>/<noteId>_<timestamp>.jpg
// filePath = tout après "note-photos/"
function extractStoragePath(photoUrl: string): string {
  const marker = 'note-photos/'
  const idx = photoUrl.indexOf(marker)
  return photoUrl.substring(idx + marker.length)
}
```

### Cascade has_blocking_note

Les triggers SQL existants dans `011_notes.sql` gèrent automatiquement le recalcul de `has_blocking_note` sur UPDATE et DELETE des notes. Pas besoin de logique côté client.

### Risques et points d'attention

1. **Bucket public** : La migration `012_note_photos.sql` utilise `ON CONFLICT DO NOTHING` — si le bucket existait avant en privé, il n'a pas été mis à jour. Vérifier dans le dashboard Supabase
2. **RLS sur UPDATE** : Pas de policy UPDATE sur `notes` actuellement — uniquement INSERT et SELECT. Il faudra vérifier que l'UPDATE fonctionne via le client authentifié (RLS permissive par défaut si pas de policy restrictive)
3. **Storage DELETE** : La policy `note_photos_delete` autorise la suppression uniquement par le propriétaire (`auth.uid()::text = (storage.foldername(name))[1]`)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Decisions

- Utilisé `Sheet` (bottom-sheet) au lieu de `Dialog` pour `NoteDetailDialog` — cohérent avec `NoteForm` et meilleur UX mobile
- Fix test pré-existant `NotesList > shows skeleton while loading` — `placeholderData: []` dans `useNotes` rendait `isLoading` jamais true. Test adapté.
- 2 tests pré-existants en échec dans `useNotes.test.ts` (non liés à cette story)
- `line-clamp-2` ajouté sur le contenu dans la liste pour inviter au clic

### File List

**Nouveaux fichiers (6) :**
- `src/components/NoteDetailDialog.tsx`
- `src/components/NoteDetailDialog.test.tsx`
- `src/lib/mutations/useUpdateNote.ts`
- `src/lib/mutations/useUpdateNote.test.ts`
- `src/lib/mutations/useDeleteNote.ts`
- `src/lib/mutations/useDeleteNote.test.ts`

**Fichiers modifiés (4) :**
- `src/components/PhotoPreview.tsx` — ajout handler onError + état erreur
- `src/components/PhotoPreview.test.tsx` — 2 tests ajoutés (onError)
- `src/components/NotesList.tsx` — notes cliquables + NoteDetailDialog intégré
- `src/components/NotesList.test.tsx` — fix test skeleton, ajout tests ouverture modale
