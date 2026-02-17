# Story 4.6: Suivi des notes bloquantes — Réponses apportées

Status: done

## Story

En tant que utilisateur de posePilot sur un chantier,
Je veux pouvoir ajouter des réponses/solutions sur les notes bloquantes,
Afin de suivre l'historique des actions correctives et savoir ce qui a été fait pour résoudre chaque problème.

## Acceptance Criteria

1. **Given** une note bloquante est ouverte dans la modale de détail **When** l'utilisateur regarde la modale **Then** un onglet "Réponse apportée" est visible

2. **Given** l'onglet "Réponse apportée" est sélectionné **When** aucune réponse n'existe **Then** un message "Aucune réponse" et un bouton d'ajout sont affichés

3. **Given** l'onglet "Réponse apportée" est sélectionné **When** l'utilisateur clique sur "Ajouter une réponse" **Then** un formulaire texte s'affiche

4. **Given** l'utilisateur soumet une réponse **When** la réponse est sauvegardée **Then** elle apparaît dans l'historique avec auteur et date

5. **Given** plusieurs réponses existent sur une note bloquante **When** l'onglet est affiché **Then** les réponses sont listées chronologiquement (plus ancienne en haut)

6. **Given** une note NON bloquante est ouverte **When** la modale s'affiche **Then** l'onglet "Réponse apportée" n'est PAS visible

7. **Given** une note bloquante a des réponses **When** le flag bloquant est retiré (via édition) **Then** les réponses existantes sont conservées mais l'onglet n'est plus affiché

8. **Given** l'utilisateur ajoute une réponse **When** la sauvegarde réussit **Then** un toast de confirmation s'affiche et le cache est invalidé

## Tasks / Subtasks

- [x]Task 1 — Migration SQL : table `note_responses` (AC: #4)
  - [x]1.1 Créer `supabase/migrations/027_note_responses.sql`
  - [x]1.2 Table `note_responses` : `id`, `note_id` (FK → notes ON DELETE CASCADE), `content`, `created_by`, `created_by_email`, `created_at`
  - [x]1.3 RLS policies : INSERT et SELECT pour authenticated
  - [x]1.4 Index sur `note_id`

- [x]Task 2 — Types TypeScript (AC: #4)
  - [x]2.1 Ajouter `NoteResponses` dans `database.ts` (Row, Insert, Update, Relationships)
  - [x]2.2 Exporter interface `NoteResponse`

- [x]Task 3 — Hook `useNoteResponses` (AC: #5)
  - [x]3.1 Créer `src/lib/queries/useNoteResponses.ts` — query par `noteId`, ordonné par `created_at` ASC
  - [x]3.2 Créer `src/lib/queries/useNoteResponses.test.ts`

- [x]Task 4 — Hook `useCreateNoteResponse` (AC: #3, #4, #8)
  - [x]4.1 Créer `src/lib/mutations/useCreateNoteResponse.ts`
  - [x]4.2 Invalidation du cache `['note_responses', noteId]` on success
  - [x]4.3 Toast succès/erreur
  - [x]4.4 Créer `src/lib/mutations/useCreateNoteResponse.test.ts`

- [x]Task 5 — UI onglets dans `NoteDetailDialog` (AC: #1, #2, #6)
  - [x]5.1 Ajouter `Tabs` (shadcn) dans la modale : "Note" | "Réponse apportée" (conditionnel sur `is_blocking`)
  - [x]5.2 Tab "Note" = contenu actuel (texte, photo, actions edit/delete)
  - [x]5.3 Tab "Réponse apportée" = liste des réponses + formulaire d'ajout

- [x]Task 6 — Composant `NoteResponsesList` (AC: #2, #4, #5)
  - [x]6.1 Créer `src/components/NoteResponsesList.tsx` — liste chronologique des réponses
  - [x]6.2 Chaque réponse : contenu, auteur (email), date relative
  - [x]6.3 Message "Aucune réponse" si liste vide
  - [x]6.4 Formulaire inline (Textarea + bouton) pour ajouter une réponse
  - [x]6.5 Créer `src/components/NoteResponsesList.test.tsx`

- [x]Task 7 — Tests & lint (AC: tous)
  - [x]7.1 `npm run lint` — 0 nouvelles erreurs
  - [x]7.2 `npx tsc --noEmit` — 0 erreurs TypeScript
  - [x]7.3 Exécuter tous les tests note_responses — 100% pass, 0 régression

## Dev Notes

### Vue d'ensemble

Story de **nouvelle feature** ajoutant un système de réponses sur les notes bloquantes. Nécessite une nouvelle table SQL, de nouveaux hooks CRUD et une extension de la modale `NoteDetailDialog` créée dans la story 4.5.

### Dépendances

- **Story 4.5** doit être terminée (la modale `NoteDetailDialog` doit exister)

### Ce qui existe déjà

| Élément | Fichier | Notes |
|---------|---------|-------|
| NoteDetailDialog | `src/components/NoteDetailDialog.tsx` | Créé par story 4.5, à enrichir avec onglets |
| Tabs | `src/components/ui/tabs.tsx` | shadcn, si déjà installé — sinon à ajouter |
| Pattern notes | `src/lib/mutations/useCreateNote.ts` | Pattern identique pour les réponses |

### Migration SQL

```sql
CREATE TABLE public.note_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_by_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_note_responses_note_id ON public.note_responses(note_id);

ALTER TABLE public.note_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY note_responses_insert ON public.note_responses
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY note_responses_select ON public.note_responses
  FOR SELECT TO authenticated
  USING (true);
```

### Risques et points d'attention

1. **Tabs shadcn** : Vérifier si le composant Tabs est déjà installé, sinon `npx shadcn@latest add tabs`
2. **Performance** : Les réponses sont chargées à la demande (quand l'onglet est sélectionné ou la modale ouverte), pas dans la liste principale
3. **Pas de suppression de réponse** : Volontairement hors scope — les réponses forment un historique immutable

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Decisions

- Tabs shadcn déjà installé — pas besoin d'ajout
- Onglet "Réponse apportée" visible uniquement sur notes bloquantes (AC #6)
- Réponses ordonnées ASC (plus anciennes en haut) pour un historique chronologique naturel
- Formulaire inline dans l'onglet réponses (pas de bottom-sheet séparé) pour fluidité

### File List

**Nouveaux fichiers (5) :**
- `supabase/migrations/027_note_responses.sql`
- `src/lib/queries/useNoteResponses.ts`
- `src/lib/queries/useNoteResponses.test.ts`
- `src/lib/mutations/useCreateNoteResponse.ts`
- `src/lib/mutations/useCreateNoteResponse.test.ts`
- `src/components/NoteResponsesList.tsx`
- `src/components/NoteResponsesList.test.tsx`

**Fichiers modifiés (3) :**
- `src/types/database.ts` — ajout NoteResponse interface + table type
- `src/components/NoteDetailDialog.tsx` — ajout Tabs (Note | Réponse apportée) conditionnel
- `src/components/NoteDetailDialog.test.tsx` — 3 tests tabs ajoutés
