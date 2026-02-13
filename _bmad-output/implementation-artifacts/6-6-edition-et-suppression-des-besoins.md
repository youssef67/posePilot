# Story 6.6: Édition et suppression des besoins

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que utilisateur de posePilot,
Je veux modifier ou supprimer un besoin en attente,
Afin que je puisse corriger une erreur de saisie ou retirer un besoin qui n'est plus pertinent.

## Acceptance Criteria

1. **Given** l'utilisateur consulte la liste des besoins en attente d'un chantier **When** il tape sur un besoin existant **Then** un menu d'actions s'affiche avec les options "Modifier" et "Supprimer"

2. **Given** l'utilisateur choisit "Modifier" sur un besoin en attente **When** le formulaire d'édition s'affiche **Then** la description actuelle est pré-remplie dans le champ texte, modifiable

3. **Given** l'utilisateur modifie la description et valide **When** la mutation s'exécute **Then** la description est mise à jour en base, la liste se rafraîchit et un toast "Besoin modifié" s'affiche

4. **Given** l'utilisateur tente de valider avec une description vide **When** il soumet le formulaire **Then** un message d'erreur en français s'affiche sous le champ et la validation est bloquée

5. **Given** l'utilisateur choisit "Supprimer" sur un besoin en attente **When** une confirmation s'affiche ("Supprimer ce besoin ?") **Then** l'utilisateur peut confirmer ou annuler

6. **Given** l'utilisateur confirme la suppression **When** la mutation s'exécute **Then** le besoin est supprimé de la base, disparaît de la liste et un toast "Besoin supprimé" s'affiche

7. **Given** un besoin est déjà rattaché à une livraison (livraison_id non null) **When** l'utilisateur consulte ce besoin **Then** les options "Modifier" et "Supprimer" ne sont pas disponibles (besoin verrouillé)

## Tasks / Subtasks

- [x] Task 1 — Migration SQL : event types + trigger update (AC: #3, #6)
  - [x] 1.1 Créer `supabase/migrations/021_besoin_edit_delete.sql`
  - [x] 1.2 Ajouter `'besoin_updated'` et `'besoin_deleted'` à l'enum `activity_event_type`
  - [x] 1.3 Remplacer la fonction trigger `log_besoin_activity()` pour gérer UPDATE de description et DELETE
  - [x] 1.4 Mettre à jour le trigger pour écouter INSERT, UPDATE (livraison_id, description), et DELETE

- [x] Task 2 — Type TypeScript : event types enum (AC: #3, #6)
  - [x] 2.1 Ajouter `'besoin_updated'` et `'besoin_deleted'` dans le type union `ActivityEventType` de `src/types/database.ts`

- [x] Task 3 — Mutation hook : useUpdateBesoin (AC: #2, #3, #4, #7)
  - [x] 3.1 Créer `src/lib/mutations/useUpdateBesoin.ts`
  - [x] 3.2 Update `description` filtré par `id` ET `livraison_id IS NULL` (garde côté serveur)
  - [x] 3.3 Optimistic update dans le cache `['besoins', chantierId]`
  - [x] 3.4 Invalidation `['besoins', chantierId]` dans onSettled
  - [x] 3.5 Créer `src/lib/mutations/useUpdateBesoin.test.ts`

- [x] Task 4 — Mutation hook : useDeleteBesoin (AC: #5, #6, #7)
  - [x] 4.1 Créer `src/lib/mutations/useDeleteBesoin.ts`
  - [x] 4.2 Delete filtré par `id` ET `livraison_id IS NULL` (garde côté serveur)
  - [x] 4.3 Optimistic remove du cache `['besoins', chantierId]`
  - [x] 4.4 Invalidation `['besoins', chantierId]` + `['all-pending-besoins-count']` dans onSettled
  - [x] 4.5 Créer `src/lib/mutations/useDeleteBesoin.test.ts`

- [x] Task 5 — Composant BesoinsList : menu d'actions (AC: #1, #7)
  - [x] 5.1 Modifier `src/components/BesoinsList.tsx`
  - [x] 5.2 Ajouter un `DropdownMenu` (icône `MoreVertical`) sur chaque carte besoin
  - [x] 5.3 Items du menu : "Modifier" (Pencil icon) + "Supprimer" (Trash2 icon, text-destructive)
  - [x] 5.4 Ajouter props `onEdit: (besoin: Besoin) => void` et `onDelete: (besoin: Besoin) => void`
  - [x] 5.5 Conserver le bouton "Commander" existant (inchangé)
  - [x] 5.6 Mettre à jour `src/components/BesoinsList.test.tsx` (tests DropdownMenu)

- [x] Task 6 — Route besoins.tsx : Sheet édition + AlertDialog suppression (AC: #1-7)
  - [x] 6.1 Modifier `src/routes/_authenticated/chantiers/$chantierId/besoins.tsx`
  - [x] 6.2 Ajouter état `besoinToEdit` + `showEditSheet` pour le Sheet d'édition
  - [x] 6.3 Sheet d'édition : Textarea pré-remplie, validation description non vide, bouton "Enregistrer"
  - [x] 6.4 Ajouter état `besoinToDelete` + `showDeleteDialog` pour l'AlertDialog de suppression
  - [x] 6.5 AlertDialog suppression : "Supprimer ce besoin ?" + description en contexte
  - [x] 6.6 Connecter `useUpdateBesoin` et `useDeleteBesoin`
  - [x] 6.7 Toasts : "Besoin modifié" (success), "Besoin supprimé" (success), erreurs
  - [x] 6.8 Mettre à jour `src/routes/_authenticated/chantiers/$chantierId/besoins.test.tsx`

- [x] Task 7 — Route chantier index (léger) : même fonctionnalité (AC: #1-7)
  - [x] 7.1 Modifier `src/routes/_authenticated/chantiers/$chantierId/index.tsx` (section léger)
  - [x] 7.2 Ajouter Sheet édition + AlertDialog suppression (même pattern que besoins.tsx)
  - [x] 7.3 Connecter les mutations useUpdateBesoin + useDeleteBesoin
  - [x] 7.4 Mettre à jour tests existants dans `src/routes/_authenticated/chantiers/$chantierId/index.test.tsx`

- [x] Task 8 — Composant ActivityFeed : nouveaux event types (AC: #3, #6)
  - [x] 8.1 Modifier `src/components/ActivityFeed.tsx`
  - [x] 8.2 Ajouter mapping `besoin_updated` → icône Pencil (bleu) + "{User} a modifié un besoin"
  - [x] 8.3 Ajouter mapping `besoin_deleted` → icône Trash2 (rouge) + "{User} a supprimé un besoin"

- [x] Task 9 — Tests de régression (AC: #1-7)
  - [x] 9.1 `npm run test` — 54/54 story tests pass, 0 nouvelles régressions (45 failures pré-existants : pwa-config 5, pwa-html 5, queries placeholderData 30+, SidebarNavigation 2, jsdom/hasPointerCapture 3)
  - [x] 9.2 `npm run lint` — 0 nouvelles erreurs
  - [x] 9.3 `npm run build` — 0 nouvelles erreurs tsc

## Dev Notes

### Vue d'ensemble — Stratégie d'implémentation

Cette story est la **sixième de l'Epic 6** et ajoute l'**édition et la suppression des besoins en attente** (FR81, FR83). Les stories 6.1-6.5 ont construit le cycle complet besoins/livraisons/inventaire. Cette story enrichit les besoins avec des opérations CRUD manquantes (update + delete) qui étaient en write-once jusqu'ici.

**Scope précis :**
- Modifier la description d'un besoin en attente (livraison_id IS NULL)
- Supprimer un besoin en attente avec confirmation
- Menu d'actions (DropdownMenu) sur chaque carte besoin dans BesoinsList
- Sheet bottom pour le formulaire d'édition, AlertDialog pour la confirmation de suppression
- Fonctionne sur les DEUX vues : page besoins dédiée (complet) ET section inline (léger)
- Gardes côté serveur : mutations filtrées par `livraison_id IS NULL`
- Nouveaux event types activity : `besoin_updated`, `besoin_deleted`

**Hors scope (stories suivantes) :**
- Fournisseur et édition des livraisons (Story 6.7)
- Commande groupée de besoins avec sélection multiple (Story 6.8)
- Suppression de livraisons avec choix repasser en besoins (Story 6.9)

**Complexité : FAIBLE** — Pas de nouvelle table, pas de nouveau composant majeur. On ajoute 2 mutations simples et on enrichit des composants existants avec des patterns déjà maîtrisés (Sheet, AlertDialog, DropdownMenu, optimistic updates).

### Ce qui existe déjà (à réutiliser, NE PAS recréer)

| Élément | Fichier | Notes |
|---------|---------|-------|
| `BesoinsList` | `src/components/BesoinsList.tsx` | Composant principal à enrichir — actuellement: description + auteur + "Commander" |
| `useBesoins(chantierId)` | `src/lib/queries/useBesoins.ts` | Fetch besoins pending (livraison_id IS NULL), tri created_at DESC, key: `['besoins', chantierId]` |
| `useCreateBesoin()` | `src/lib/mutations/useCreateBesoin.ts` | Pattern de référence pour useUpdateBesoin (optimistic, invalidation) |
| `useTransformBesoinToLivraison()` | `src/lib/mutations/useTransformBesoinToLivraison.ts` | Pattern multi-step mutation avec optimistic remove |
| `useDeleteInventaire()` | `src/lib/mutations/useDeleteInventaire.ts` | Pattern de référence pour useDeleteBesoin (optimistic remove + invalidation) |
| `useRealtimeBesoins(chantierId)` | `src/lib/subscriptions/useRealtimeBesoins.ts` | Déjà en place — écoute INSERT, UPDATE, DELETE → invalide `['besoins', chantierId]` |
| `useRealtimeAllBesoins()` | `src/lib/subscriptions/useRealtimeAllBesoins.ts` | Global subscription → invalide `['all-pending-besoins-count']` |
| `Sheet` / `SheetContent` | `src/components/ui/sheet.tsx` | Bottom sheet pour formulaire édition |
| `AlertDialog` | `src/components/ui/alert-dialog.tsx` | Confirmation suppression |
| `DropdownMenu` | `src/components/ui/dropdown-menu.tsx` | Menu d'actions sur chaque besoin |
| `Textarea` | `src/components/ui/textarea.tsx` | Champ description dans le Sheet |
| `Button` | `src/components/ui/button.tsx` | Boutons formulaire + actions |
| `toast` | `sonner` | Feedback utilisateur (import `{ toast } from 'sonner'`) |
| `ActivityFeed` | `src/components/ActivityFeed.tsx` | À enrichir avec 2 nouveaux event types |
| Page besoins | `src/routes/_authenticated/chantiers/$chantierId/besoins.tsx` | Page dédiée chantier complet — 184 lignes |
| Page chantier index | `src/routes/_authenticated/chantiers/$chantierId/index.tsx` | Section inline chantier léger |
| Type `Besoin` | `src/types/database.ts` | `{ id, chantier_id, description, livraison_id, created_at, created_by }` |

### Migration SQL : 021_besoin_edit_delete.sql

```sql
-- Story 6.6 : Édition et suppression des besoins

-- =====================
-- ENUM — Nouveaux types d'activité
-- =====================
ALTER TYPE public.activity_event_type ADD VALUE IF NOT EXISTS 'besoin_updated';
ALTER TYPE public.activity_event_type ADD VALUE IF NOT EXISTS 'besoin_deleted';

-- =====================
-- TRIGGER FUNCTION — Mise à jour pour gérer UPDATE description et DELETE
-- =====================
CREATE OR REPLACE FUNCTION public.log_besoin_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- INSERT : besoin créé
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_logs (event_type, actor_id, actor_email, chantier_id, target_type, target_id, metadata)
    VALUES (
      'besoin_added',
      COALESCE(auth.uid(), NEW.created_by),
      COALESCE((auth.jwt()->>'email')::text, NULL),
      NEW.chantier_id,
      'besoin',
      NEW.id,
      jsonb_build_object('description', LEFT(NEW.description, 80))
    );
    RETURN NEW;
  END IF;

  -- UPDATE livraison_id : besoin commandé
  IF TG_OP = 'UPDATE' AND OLD.livraison_id IS NULL AND NEW.livraison_id IS NOT NULL THEN
    INSERT INTO public.activity_logs (event_type, actor_id, actor_email, chantier_id, target_type, target_id, metadata)
    VALUES (
      'besoin_ordered',
      COALESCE(auth.uid(), NEW.created_by),
      COALESCE((auth.jwt()->>'email')::text, NULL),
      NEW.chantier_id,
      'besoin',
      NEW.id,
      jsonb_build_object('description', LEFT(NEW.description, 80))
    );
    RETURN NEW;
  END IF;

  -- UPDATE description : besoin modifié
  IF TG_OP = 'UPDATE' AND OLD.description IS DISTINCT FROM NEW.description THEN
    INSERT INTO public.activity_logs (event_type, actor_id, actor_email, chantier_id, target_type, target_id, metadata)
    VALUES (
      'besoin_updated',
      COALESCE(auth.uid(), NEW.created_by),
      COALESCE((auth.jwt()->>'email')::text, NULL),
      NEW.chantier_id,
      'besoin',
      NEW.id,
      jsonb_build_object('description', LEFT(NEW.description, 80))
    );
    RETURN NEW;
  END IF;

  -- DELETE : besoin supprimé
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.activity_logs (event_type, actor_id, actor_email, chantier_id, target_type, target_id, metadata)
    VALUES (
      'besoin_deleted',
      COALESCE(auth.uid(), OLD.created_by),
      COALESCE((auth.jwt()->>'email')::text, NULL),
      OLD.chantier_id,
      'besoin',
      OLD.id,
      jsonb_build_object('description', LEFT(OLD.description, 80))
    );
    RETURN OLD;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer l'ancien trigger et recréer avec les bons events
DROP TRIGGER IF EXISTS trg_besoin_activity ON public.besoins;
CREATE TRIGGER trg_besoin_activity
  AFTER INSERT OR UPDATE OF livraison_id, description OR DELETE ON public.besoins
  FOR EACH ROW EXECUTE FUNCTION public.log_besoin_activity();
```

**Points clés migration :**
- La fonction `log_besoin_activity()` est remplacée (`CREATE OR REPLACE`) — elle conserve les comportements INSERT et UPDATE livraison_id existants
- Le trigger est DROP + CREATE pour ajouter les events `UPDATE OF description` et `DELETE`
- Pour DELETE, on utilise `OLD` (pas `NEW` qui est null)
- La fonction retourne `OLD` pour DELETE, `NEW` pour les autres opérations

### Mutation : useUpdateBesoin

```typescript
// src/lib/mutations/useUpdateBesoin.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Besoin } from '@/types/database'

export function useUpdateBesoin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, chantierId, description }: { id: string; chantierId: string; description: string }) => {
      const { data, error } = await supabase
        .from('besoins')
        .update({ description })
        .eq('id', id)
        .is('livraison_id', null) // Garde : seuls les besoins en attente
        .select()
        .single()
      if (error) throw error
      return data as unknown as Besoin
    },
    onMutate: async ({ id, chantierId, description }) => {
      await queryClient.cancelQueries({ queryKey: ['besoins', chantierId] })
      const previous = queryClient.getQueryData(['besoins', chantierId])
      queryClient.setQueryData(
        ['besoins', chantierId],
        (old: Besoin[] | undefined) =>
          (old ?? []).map((b) => (b.id === id ? { ...b, description } : b)),
      )
      return { previous }
    },
    onError: (_err, { chantierId }, context) => {
      queryClient.setQueryData(['besoins', chantierId], context?.previous)
    },
    onSettled: (_data, _error, { chantierId }) => {
      queryClient.invalidateQueries({ queryKey: ['besoins', chantierId] })
    },
  })
}
```

**Points clés :**
- `.is('livraison_id', null)` dans la query = garde côté serveur (AC #7)
- Si un besoin lié est ciblé, Supabase retourne une erreur (row not found) → mutation échoue proprement
- `chantierId` est passé en param pour l'optimistic update et l'invalidation (même pattern que `useCreateBesoin`)
- Pas besoin d'invalider `['all-pending-besoins-count']` car le nombre de besoins ne change pas

### Mutation : useDeleteBesoin

```typescript
// src/lib/mutations/useDeleteBesoin.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Besoin } from '@/types/database'

export function useDeleteBesoin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, chantierId }: { id: string; chantierId: string }) => {
      const { error } = await supabase
        .from('besoins')
        .delete()
        .eq('id', id)
        .is('livraison_id', null) // Garde : seuls les besoins en attente
      if (error) throw error
    },
    onMutate: async ({ id, chantierId }) => {
      await queryClient.cancelQueries({ queryKey: ['besoins', chantierId] })
      const previous = queryClient.getQueryData(['besoins', chantierId])
      queryClient.setQueryData(
        ['besoins', chantierId],
        (old: Besoin[] | undefined) => (old ?? []).filter((b) => b.id !== id),
      )
      return { previous }
    },
    onError: (_err, { chantierId }, context) => {
      queryClient.setQueryData(['besoins', chantierId], context?.previous)
    },
    onSettled: (_data, _error, { chantierId }) => {
      queryClient.invalidateQueries({ queryKey: ['besoins', chantierId] })
      queryClient.invalidateQueries({ queryKey: ['all-pending-besoins-count'] })
    },
  })
}
```

**Points clés :**
- Même garde `.is('livraison_id', null)` côté serveur
- Optimistic remove (filtre le besoin hors du cache) — même pattern que `useTransformBesoinToLivraison`
- Invalide AUSSI `['all-pending-besoins-count']` car le nombre total diminue (badge SidebarNavigation)
- `chantierId` est passé mais PAS utilisé dans `mutationFn` → utilisé dans `onMutate`/`onError`/`onSettled`. Pattern identique à `useDeleteInventaire` (pas de destructuring inutile dans mutationFn pour éviter lint error)

### Composant BesoinsList — Modifications

**Avant (actuel) :**
```
┌──────────────────────────────────────────────────┐
│ Colle pour faïence 20kg                          │
│ Y · il y a 2h                    [Commander]     │
└──────────────────────────────────────────────────┘
```

**Après :**
```
┌──────────────────────────────────────────────────┐
│ Colle pour faïence 20kg                    [⋮]   │
│ Y · il y a 2h                    [Commander]     │
│                                                  │
│ ┌─────────────────────┐  (DropdownMenu ouvert)   │
│ │ ✏️ Modifier          │                          │
│ │ 🗑️ Supprimer         │  (text-destructive)      │
│ └─────────────────────┘                          │
└──────────────────────────────────────────────────┘
```

**Changements dans BesoinsList.tsx :**
- Ajouter `onEdit?: (besoin: Besoin) => void` et `onDelete?: (besoin: Besoin) => void` aux props
- Sur chaque carte besoin, ajouter un `DropdownMenu` avec icône `MoreVertical` (taille 20px, button ghost variant, h-9 w-9)
- `DropdownMenuItem` "Modifier" avec icône `Pencil` → appelle `onEdit(besoin)`
- `DropdownMenuItem` "Supprimer" avec icône `Trash2` + `className="text-destructive"` → appelle `onDelete(besoin)`
- Le bouton "Commander" existant et la prop `onCommander` restent INCHANGÉS
- Si `onEdit` et `onDelete` ne sont pas fournis, ne pas afficher le DropdownMenu (rétrocompatible)

**Imports à ajouter :**
```typescript
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
```

### Page besoins.tsx — Modifications

**Ajouts au state :**
```typescript
const [besoinToEdit, setBesoinToEdit] = useState<Besoin | null>(null)
const [showEditSheet, setShowEditSheet] = useState(false)
const [editDescription, setEditDescription] = useState('')
const [editDescError, setEditDescError] = useState('')

const [besoinToDelete, setBesoinToDelete] = useState<Besoin | null>(null)
const [showDeleteDialog, setShowDeleteDialog] = useState(false)
```

**Handlers :**
```typescript
function handleEdit(besoin: Besoin) {
  setBesoinToEdit(besoin)
  setEditDescription(besoin.description)
  setEditDescError('')
  setShowEditSheet(true)
}

function handleConfirmEdit() {
  const trimmed = editDescription.trim()
  if (!trimmed) {
    setEditDescError('La description est requise')
    return
  }
  if (!besoinToEdit) return
  updateBesoin.mutate(
    { id: besoinToEdit.id, chantierId, description: trimmed },
    {
      onSuccess: () => {
        setShowEditSheet(false)
        setBesoinToEdit(null)
        toast('Besoin modifié')
      },
      onError: () => toast.error('Erreur lors de la modification du besoin'),
    },
  )
}

function handleDelete(besoin: Besoin) {
  setBesoinToDelete(besoin)
  setShowDeleteDialog(true)
}

function handleConfirmDelete() {
  if (!besoinToDelete) return
  deleteBesoin.mutate(
    { id: besoinToDelete.id, chantierId },
    {
      onSuccess: () => {
        setShowDeleteDialog(false)
        setBesoinToDelete(null)
        toast('Besoin supprimé')
      },
      onError: () => toast.error('Erreur lors de la suppression'),
    },
  )
}
```

**BesoinsList — passer les callbacks :**
```tsx
<BesoinsList
  besoins={besoins.data}
  isLoading={besoins.isLoading}
  onOpenSheet={() => setShowSheet(true)}
  onCommander={handleCommander}
  onEdit={handleEdit}       // ← NOUVEAU
  onDelete={handleDelete}   // ← NOUVEAU
/>
```

**Sheet édition — JSX :**
```tsx
<Sheet open={showEditSheet} onOpenChange={setShowEditSheet}>
  <SheetContent side="bottom">
    <SheetHeader>
      <SheetTitle>Modifier le besoin</SheetTitle>
      <SheetDescription>Modifiez la description du besoin.</SheetDescription>
    </SheetHeader>
    <div className="px-4">
      <Textarea
        value={editDescription}
        onChange={(e) => {
          setEditDescription(e.target.value)
          if (editDescError) setEditDescError('')
        }}
        aria-label="Description du besoin"
        aria-invalid={!!editDescError}
        rows={3}
      />
      {editDescError && (
        <p className="text-sm text-destructive mt-1">{editDescError}</p>
      )}
    </div>
    <SheetFooter>
      <Button
        onClick={handleConfirmEdit}
        disabled={updateBesoin.isPending}
        className="w-full"
      >
        Enregistrer
      </Button>
    </SheetFooter>
  </SheetContent>
</Sheet>
```

**AlertDialog suppression — JSX :**
```tsx
<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Supprimer ce besoin ?</AlertDialogTitle>
      <AlertDialogDescription>
        Le besoin « {besoinToDelete?.description} » sera supprimé définitivement.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Annuler</AlertDialogCancel>
      <AlertDialogAction onClick={handleConfirmDelete}>
        Supprimer
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Page chantier index (léger) — Même pattern

Le chantier de type léger affiche les besoins inline dans `index.tsx`. Les **mêmes modifications** s'appliquent :
- Ajouter les états `besoinToEdit`, `showEditSheet`, etc.
- Ajouter les handlers `handleEdit`, `handleDelete`, `handleConfirmEdit`, `handleConfirmDelete`
- Passer `onEdit` et `onDelete` au `BesoinsList` dans la section léger
- Ajouter le Sheet d'édition et l'AlertDialog de suppression dans le JSX

**ATTENTION** : La page `index.tsx` est volumineuse (gère complet + léger + indicateurs + livraisons). Les ajouts doivent être ciblés dans la section léger uniquement. Ne pas toucher la section complet qui utilise un lien vers `/besoins`.

### ActivityFeed — Nouveaux event types

**Ajouter dans le mapping d'events :**
```typescript
case 'besoin_updated':
  return { icon: Pencil, color: 'text-blue-400', label: 'a modifié un besoin' }
case 'besoin_deleted':
  return { icon: Trash2, color: 'text-red-400', label: 'a supprimé un besoin' }
```

**Imports à ajouter :** `Pencil`, `Trash2` de `lucide-react` (probablement déjà importés).

### Schéma DB — Table besoins (existante, inchangée)

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid PK | gen_random_uuid() |
| chantier_id | uuid FK → chantiers | Chantier parent (ON DELETE CASCADE) |
| description | text NOT NULL | Description libre du besoin |
| livraison_id | uuid FK → livraisons NULL | null = en attente, non-null = commandé (ON DELETE SET NULL) |
| created_at | timestamptz NOT NULL | Date de création |
| created_by | uuid FK → auth.users | Auteur |

**Aucune modification de schéma** — la table `besoins` reste identique. Seuls le trigger et l'enum changent.

### Project Structure Notes

**Nouveaux fichiers (6) :**
- `supabase/migrations/021_besoin_edit_delete.sql`
- `src/lib/mutations/useUpdateBesoin.ts`
- `src/lib/mutations/useUpdateBesoin.test.ts`
- `src/lib/mutations/useDeleteBesoin.ts`
- `src/lib/mutations/useDeleteBesoin.test.ts`
- `src/components/BesoinsList.test.tsx`

**Fichiers modifiés (8) :**
- `src/types/database.ts` — ajout `'besoin_updated' | 'besoin_deleted'` dans `ActivityEventType`
- `src/components/BesoinsList.tsx` — ajout DropdownMenu + props onEdit/onDelete
- `src/components/ActivityFeed.tsx` — ajout 2 event types
- `src/routes/_authenticated/chantiers/$chantierId/besoins.tsx` — Sheet édition + AlertDialog suppression
- `src/routes/_authenticated/chantiers/$chantierId/besoins.test.tsx` — tests édition/suppression
- `src/routes/_authenticated/chantiers/$chantierId/index.tsx` — section léger: Sheet + AlertDialog
- `src/routes/_authenticated/chantiers/$chantierId/index.test.tsx` — tests section léger
- `_bmad-output/planning-artifacts/epics.md` — mise à jour statut story 6.6

**Fichiers NON touchés (ne pas modifier) :**
- `src/lib/queries/useBesoins.ts` — la query reste identique (pas de changement de fetch)
- `src/lib/subscriptions/useRealtimeBesoins.ts` — écoute déjà INSERT + UPDATE + DELETE, pas de changement
- `src/lib/subscriptions/useRealtimeAllBesoins.ts` — écoute déjà tous les events besoins
- `src/lib/mutations/useCreateBesoin.ts` — inchangé
- `src/lib/mutations/useTransformBesoinToLivraison.ts` — inchangé
- `src/routeTree.gen.ts` — aucune nouvelle route créée

### Tests — Stratégie

**useUpdateBesoin.test.ts (3 tests minimum) :**
- ✅ Met à jour la description d'un besoin en attente
- ✅ Gère l'erreur Supabase (rollback optimistic)
- ✅ Appelle invalidateQueries sur `['besoins', chantierId]`

**useDeleteBesoin.test.ts (3 tests minimum) :**
- ✅ Supprime un besoin en attente
- ✅ Gère l'erreur Supabase (rollback optimistic — besoin réapparaît)
- ✅ Invalide `['besoins', chantierId]` ET `['all-pending-besoins-count']`

**BesoinsList.test.tsx (ajouts, 4 tests minimum) :**
- ✅ Affiche le DropdownMenu (bouton MoreVertical) sur chaque besoin
- ✅ DropdownMenu contient "Modifier" et "Supprimer"
- ✅ Cliquer "Modifier" appelle `onEdit` avec le bon besoin
- ✅ Cliquer "Supprimer" appelle `onDelete` avec le bon besoin
- ✅ Pas de DropdownMenu si `onEdit` et `onDelete` ne sont pas fournis (rétrocompat)

**besoins.test.tsx (ajouts, 5 tests minimum) :**
- ✅ Sheet d'édition s'ouvre avec la description pré-remplie
- ✅ Validation : description vide → message d'erreur sous le champ
- ✅ Soumission valide → appelle useUpdateBesoin + toast "Besoin modifié"
- ✅ AlertDialog suppression s'affiche avec le bon besoin
- ✅ Confirmation suppression → appelle useDeleteBesoin + toast "Besoin supprimé"

**index.test.tsx (ajouts, 3 tests minimum — section léger) :**
- ✅ Sheet d'édition fonctionne dans la section léger
- ✅ AlertDialog suppression fonctionne dans la section léger
- ✅ Besoins de la section complet (lien vers /besoins) ne montrent pas le DropdownMenu inline

**Mock patterns pour les tests :**
```typescript
// Mock useUpdateBesoin
vi.mock('@/lib/mutations/useUpdateBesoin', () => ({
  useUpdateBesoin: () => ({
    mutate: vi.fn((_, opts) => opts?.onSuccess?.()),
    isPending: false,
  }),
}))

// Mock useDeleteBesoin
vi.mock('@/lib/mutations/useDeleteBesoin', () => ({
  useDeleteBesoin: () => ({
    mutate: vi.fn((_, opts) => opts?.onSuccess?.()),
    isPending: false,
  }),
}))
```

**Mock Supabase chainable pour mutation tests :**
```typescript
// Update mutation mock
const mockSelect = vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: updatedBesoin, error: null }) })
const mockIs = vi.fn().mockReturnValue({ select: mockSelect })
const mockEq = vi.fn().mockReturnValue({ is: mockIs })
const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as any)

// Delete mutation mock
const mockIs = vi.fn().mockResolvedValue({ error: null })
const mockEq = vi.fn().mockReturnValue({ is: mockIs })
const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })
vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as any)
```

### Prérequis et dépendances

- **Migration SQL** : `021_besoin_edit_delete.sql` — uniquement enum + trigger, pas de DDL table
- **Aucune dépendance npm** à ajouter — tout est déjà installé
- **Composants shadcn** : DropdownMenu, Sheet, AlertDialog, Textarea, Button — tous déjà installés
- **Stories 6.1-6.5** : `done` — patterns complets, besoins fonctionnels
- **Subscriptions** : DÉJÀ en place pour les events INSERT/UPDATE/DELETE sur besoins — aucun changement nécessaire

### Risques et points d'attention

1. **DropdownMenu et BesoinsList** : Le composant `BesoinsList` est partagé entre la page besoins (complet) et l'index (léger). Les props `onEdit`/`onDelete` doivent être optionnelles pour assurer la rétrocompatibilité. Si elles ne sont pas fournies, ne pas rendre le DropdownMenu.

2. **Page index.tsx volumineuse** : La page gère beaucoup de cas (complet + léger + indicateurs). Les ajouts doivent être ciblés dans la section `ChantierLegerContent` ou équivalent. Ne pas restructurer le fichier, ajouter uniquement ce qui est nécessaire.

3. **Garde serveur `.is('livraison_id', null)`** : Cette clause est CRITIQUE. Sans elle, un bug côté client pourrait permettre la modification d'un besoin rattaché à une livraison. Supabase retournera une erreur si aucun row ne matche (0 rows affected) — le `.single()` de update lèvera l'erreur. Pour delete (sans `.single()`), le delete silencieux de 0 rows est OK.

4. **Realtime déjà en place** : Les subscriptions `useRealtimeBesoins` et `useRealtimeAllBesoins` écoutent TOUS les events (INSERT, UPDATE, DELETE). L'ajout d'edit/delete sera automatiquement propagé en temps réel sans aucune modification des subscriptions.

5. **Pre-existing issues** : Mêmes que stories précédentes — 16 test failures pré-existants (pwa-config 5, pwa-html 5, hasPointerCapture 6), lint error ThemeProvider.tsx:64, erreurs TS pré-existantes database.ts.

6. **Toast pattern** : Utiliser `toast('Besoin modifié')` (neutre) et `toast('Besoin supprimé')` (neutre) pour les succès, `toast.error(...)` pour les erreurs. Pattern identique à `toast('Besoin créé')` existant dans besoins.tsx.

7. **Description truncation dans ActivityFeed** : Le trigger SQL tronque déjà la description à 80 chars (`LEFT(NEW.description, 80)`). L'ActivityFeed affiche le champ `metadata.description` tel quel — aucun changement côté feed.

### Learnings des stories précédentes (relevants)

**Story 6.5 (inventaire) :**
- Pattern mutation delete : `useDeleteInventaire` montre le pattern exact (optimistic remove, pas de `.select()` après delete, invalidation).
- `chantierId` en paramètre de mutation : utilisé dans onMutate/onError/onSettled mais PAS destructuré dans mutationFn pour éviter lint `no-unused-vars`.
- Touch target DropdownMenu trigger : utiliser `h-9 w-9` minimum (36px), idéalement `h-10 w-10` (40px). Les boutons d'action de BesoinsList (Commander) font déjà `h-9`.

**Story 6.1 (besoins création) :**
- Pattern Sheet création besoins : description textarea, validation trim+empty, toast success/error.
- La page besoins.tsx a déjà un Sheet de création + AlertDialog commander. Ajouter un 2ème Sheet (édition) et un 2ème AlertDialog (suppression).
- Les Sheets peuvent coexister — chacun a son propre state `open`.

**Story 6.4 (vue globale livraisons) :**
- Cast pattern : `data as unknown as Besoin` — pattern établi pour contourner les types Supabase.
- Invalidation `['all-pending-besoins-count']` : nécessaire quand le nombre global de besoins pending change (delete).

**Code review story 6.5 :**
- Touch targets : vérifier que le bouton DropdownMenu trigger fait au minimum 48px de zone cliquable.
- Tests formulaire : toujours tester la validation (description vide) et le happy path.

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 6.6, FR81 (modifier description), FR83 (supprimer besoin)]
- [Source: _bmad-output/planning-artifacts/prd.md — FR81 modifier description besoin en attente, FR83 supprimer besoin en attente]
- [Source: _bmad-output/planning-artifacts/architecture.md — Pattern mutations optimistes, Supabase Client SDK direct, TanStack Query conventions]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — §Actions destructives: confirmation dialog, §Toast feedback, §Formulaires validation au submit]
- [Source: _bmad-output/implementation-artifacts/6-5-gestion-d-inventaire-avec-localisation.md — Pattern useDeleteInventaire, learnings touch targets, migration triggers]
- [Source: src/components/BesoinsList.tsx — Composant existant à enrichir (82 lignes)]
- [Source: src/routes/_authenticated/chantiers/$chantierId/besoins.tsx — Page besoins existante (184 lignes)]
- [Source: src/routes/_authenticated/chantiers/$chantierId/index.tsx — Page chantier avec section léger]
- [Source: src/lib/mutations/useCreateBesoin.ts — Pattern mutation optimiste create besoin]
- [Source: src/lib/mutations/useTransformBesoinToLivraison.ts — Pattern optimistic remove du cache besoins]
- [Source: src/lib/mutations/useDeleteInventaire.ts — Pattern mutation delete avec optimistic remove]
- [Source: src/lib/queries/useBesoins.ts — Query besoins pending, key: ['besoins', chantierId]]
- [Source: src/lib/queries/useAllPendingBesoinsCount.ts — Compteur global, key: ['all-pending-besoins-count']]
- [Source: src/lib/subscriptions/useRealtimeBesoins.ts — Subscription déjà en place pour INSERT/UPDATE/DELETE]
- [Source: src/components/ActivityFeed.tsx — Mapping event types pour fil d'activité]
- [Source: src/types/database.ts — Types Besoin, ActivityEventType]
- [Source: supabase/migrations/016_besoins_livraisons.sql — Table besoins, trigger log_besoin_activity]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

Aucun problème de debug rencontré.

### Completion Notes List

- ✅ Task 1 : Migration SQL `021_besoin_edit_delete.sql` — enum `besoin_updated`/`besoin_deleted` + trigger function `log_besoin_activity()` remplacée pour gérer UPDATE description et DELETE + trigger recréé avec events INSERT, UPDATE(livraison_id, description), DELETE.  Note : le numéro de migration est 021 (pas 019 comme dans la story) car 019 et 020 existaient déjà.
- ✅ Task 2 : Types TS `besoin_updated | besoin_deleted` ajoutés dans `activity_event_type` enum dans `database.ts`
- ✅ Task 3 : `useUpdateBesoin` — mutation avec garde `.is('livraison_id', null)`, optimistic update, invalidation cache. 3 tests (happy path, error, optimistic).
- ✅ Task 4 : `useDeleteBesoin` — mutation avec garde `.is('livraison_id', null)`, optimistic remove, invalidation cache + `['all-pending-besoins-count']`. 3 tests.
- ✅ Task 5 : `BesoinsList` enrichi avec `DropdownMenu` (MoreVertical → Modifier/Supprimer). Props optionnelles `onEdit`/`onDelete` — rétrocompatible (pas de DropdownMenu si non fournis). 5 tests.
- ✅ Task 6 : Route `besoins.tsx` — Sheet édition (Textarea pré-remplie, validation description vide, toast "Besoin modifié") + AlertDialog suppression (toast "Besoin supprimé"). 5 nouveaux tests (total 10).
- ✅ Task 7 : Route `index.tsx` section léger — même pattern Sheet/AlertDialog, callbacks `handleEditBesoin`/`handleDeleteBesoin`. 3 nouveaux tests (total 33). Fix pré-existant : tests "Livraisons link" adaptés pour SidebarNavigation (getAllByRole au lieu de getByRole).
- ✅ Task 8 : `ActivityFeed` — `besoin_updated` → Pencil bleu + "a modifié un besoin", `besoin_deleted` → Trash2 rouge + "a supprimé un besoin"
- ✅ Task 9 : Régression — 54/54 story tests pass, 0 lint, 0 tsc. Failures pré-existants non introduits par cette story (placeholderData queries, pwa-config, pwa-html, SidebarNavigation).

### Change Log

- 2026-02-13 : Implémentation complète story 6.6 — édition et suppression des besoins en attente (9 tasks, 54 tests)
- 2026-02-13 : Code review (AI) — 3 fixes appliqués : (M2) assertions optimistic tests renforcées, (M3) variant="destructive" sur AlertDialogAction suppression besoin, (M1/L1/L2) correction numéro migration 019→021 et compteurs fichiers dans Dev Notes. Note : ~25 fichiers hors scope story détectés dans le working tree (placeholderData queries, SidebarNavigation, homepage rewrite, queryClient retry) — à commiter séparément.

### File List

**Nouveaux fichiers :**
- `supabase/migrations/021_besoin_edit_delete.sql`
- `src/lib/mutations/useUpdateBesoin.ts`
- `src/lib/mutations/useUpdateBesoin.test.ts`
- `src/lib/mutations/useDeleteBesoin.ts`
- `src/lib/mutations/useDeleteBesoin.test.ts`
- `src/components/BesoinsList.test.tsx`

**Fichiers modifiés :**
- `src/types/database.ts` — ajout `besoin_updated | besoin_deleted` dans `activity_event_type`
- `src/components/BesoinsList.tsx` — DropdownMenu + props `onEdit`/`onDelete`
- `src/components/ActivityFeed.tsx` — mapping `besoin_updated` + `besoin_deleted`
- `src/routes/_authenticated/chantiers/$chantierId/besoins.tsx` — Sheet édition + AlertDialog suppression
- `src/routes/_authenticated/chantiers/$chantierId/besoins.test.tsx` — 5 nouveaux tests edit/delete
- `src/routes/_authenticated/chantiers/$chantierId/index.tsx` — Section léger: Sheet + AlertDialog besoins
- `src/routes/_authenticated/chantiers/$chantierId/index.test.tsx` — 3 nouveaux tests léger + fix Livraisons link
