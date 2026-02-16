# Story 6.7: Fournisseur et édition des livraisons

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que utilisateur de posePilot,
Je veux renseigner un fournisseur sur mes livraisons et pouvoir modifier les informations d'une livraison,
Afin que je sache qui livre chaque commande et que je puisse corriger ou mettre à jour les détails.

## Acceptance Criteria

1. **Given** l'utilisateur crée une livraison directement (bouton "Nouvelle livraison") **When** le formulaire de création s'affiche **Then** un champ "Fournisseur" (texte libre, optionnel) est disponible en plus de la description

2. **Given** l'utilisateur transforme un besoin unique en livraison (bouton "Commander" existant) **When** la confirmation s'affiche **Then** un champ "Fournisseur" est proposé dans le flow de transformation (Sheet remplace l'AlertDialog actuel)

3. **Given** une livraison a un fournisseur renseigné **When** l'utilisateur consulte la DeliveryCard **Then** le nom du fournisseur est affiché sur la carte (sous la description, en texte muted)

4. **Given** une livraison est au statut "Commandé" ou "Prévu" **When** l'utilisateur tape sur la DeliveryCard **Then** un menu d'actions s'affiche avec l'option "Modifier"

5. **Given** l'utilisateur choisit "Modifier" sur une livraison **When** le formulaire d'édition s'affiche **Then** les champs éditables sont : description/intitulé, fournisseur, et date prévue — tous pré-remplis avec les valeurs actuelles

6. **Given** l'utilisateur modifie un ou plusieurs champs et valide **When** la mutation s'exécute **Then** les modifications sont enregistrées en base, la DeliveryCard se met à jour et un toast "Livraison modifiée" s'affiche

7. **Given** une livraison est au statut "Livré" **When** l'utilisateur consulte la DeliveryCard **Then** l'option "Modifier" n'est pas disponible (livraison verrouillée)

8. **Given** la colonne `fournisseur` est ajoutée à la table `livraisons` **When** des livraisons existantes n'ont pas de fournisseur **Then** le champ est null et la DeliveryCard n'affiche rien à cet emplacement (pas de "Fournisseur : —")

## Tasks / Subtasks

- [x] Task 1 — Migration SQL : colonne fournisseur + event type + trigger (AC: #3, #6, #8)
  - [x] 1.1 Créer `supabase/migrations/022_livraison_fournisseur_edit.sql`
  - [x] 1.2 `ALTER TABLE livraisons ADD COLUMN fournisseur text;`
  - [x] 1.3 `ALTER TYPE activity_event_type ADD VALUE IF NOT EXISTS 'livraison_updated';`
  - [x] 1.4 Remplacer `log_livraison_activity()` pour gérer UPDATE description/fournisseur/date_prevue (quand status inchangé)
  - [x] 1.5 DROP + CREATE trigger pour écouter `INSERT OR UPDATE OF status, description, fournisseur, date_prevue`

- [x] Task 2 — Type TypeScript : Livraison + ActivityEventType (AC: #3, #8)
  - [x] 2.1 Ajouter `fournisseur: string | null` à `interface Livraison` dans `src/types/database.ts`
  - [x] 2.2 Ajouter `'livraison_updated'` dans le type union `ActivityEventType`

- [x] Task 3 — Mutation hook : useUpdateLivraison (AC: #4, #5, #6, #7)
  - [x] 3.1 Créer `src/lib/mutations/useUpdateLivraison.ts`
  - [x] 3.2 Update `description`, `fournisseur`, `date_prevue` filtré par `id` ET `status.in('commande','prevu')`
  - [x] 3.3 Optimistic update dans le cache `['livraisons', chantierId]`
  - [x] 3.4 Invalidation `['livraisons', chantierId]`, `['all-livraisons']`, `['livraisons-count', chantierId]`
  - [x] 3.5 Créer `src/lib/mutations/useUpdateLivraison.test.ts`

- [x] Task 4 — Mutation : modifier useCreateLivraison (AC: #1)
  - [x] 4.1 Ajouter paramètre optionnel `fournisseur?: string` à l'input
  - [x] 4.2 Inclure `fournisseur` dans l'insert Supabase et l'objet optimistic
  - [x] 4.3 Mettre à jour les tests existants

- [x] Task 5 — Mutation : modifier useTransformBesoinToLivraison (AC: #2)
  - [x] 5.1 Ajouter paramètre optionnel `fournisseur?: string` à l'input
  - [x] 5.2 Inclure `fournisseur` dans l'insert de la livraison créée
  - [x] 5.3 Mettre à jour les tests existants

- [x] Task 6 — Composant DeliveryCard : fournisseur + DropdownMenu (AC: #3, #4, #7, #8)
  - [x] 6.1 Modifier `src/components/DeliveryCard.tsx`
  - [x] 6.2 Afficher le fournisseur sous la description (texte muted, masqué si null)
  - [x] 6.3 Ajouter prop `onEdit?: (livraison: Livraison) => void`
  - [x] 6.4 Ajouter `DropdownMenu` (icône `MoreVertical`) si `onEdit` fourni ET status !== 'livre'
  - [x] 6.5 `DropdownMenuItem` "Modifier" avec icône `Pencil`
  - [x] 6.6 Mettre à jour `src/components/DeliveryCard.test.tsx`

- [x] Task 7 — Hook useLivraisonActions : état et handlers édition (AC: #5, #6)
  - [x] 7.1 Modifier `src/lib/hooks/useLivraisonActions.ts`
  - [x] 7.2 Ajouter états : `livraisonToEdit`, `showEditSheet`, `editDescription`, `editFournisseur`, `editDatePrevue`, `editError`
  - [x] 7.3 Ajouter `livraisonFournisseur` + `setLivraisonFournisseur` dans le state création
  - [x] 7.4 Handler `handleEditLivraison(livraison)` — pré-remplit les champs, ouvre le Sheet
  - [x] 7.5 Handler `handleConfirmEdit()` — valide, appelle `useUpdateLivraison`, toast
  - [x] 7.6 Modifier `handleCreateLivraison()` — inclure `fournisseur` dans l'appel mutation
  - [x] 7.7 Modifier `handleOpenLivraisonSheet()` — reset `livraisonFournisseur`

- [x] Task 8 — Composant LivraisonSheets : fournisseur création + Sheet édition (AC: #1, #5, #6)
  - [x] 8.1 Modifier `src/components/LivraisonSheets.tsx`
  - [x] 8.2 Ajouter Input "Fournisseur" (optionnel) dans le Sheet de création
  - [x] 8.3 Ajouter un 3ème Sheet : édition (description Textarea + fournisseur Input + date_prevue Input type="date")
  - [x] 8.4 Bouton "Enregistrer" disabled si description vide ou mutation pending

- [x] Task 9 — Routes besoins : Sheet transformation avec fournisseur (AC: #2)
  - [x] 9.1 Modifier `src/routes/_authenticated/chantiers/$chantierId/besoins.tsx`
  - [x] 9.2 Remplacer l'AlertDialog "Commander" par un Sheet avec : description besoin (read-only) + champ Fournisseur (optionnel) + bouton "Confirmer la commande"
  - [x] 9.3 Modifier `handleConfirmCommander()` pour passer `fournisseur` à la mutation
  - [x] 9.4 Modifier `src/routes/_authenticated/chantiers/$chantierId/index.tsx` (section léger) : même modification
  - [x] 9.5 Mettre à jour `besoins.test.tsx` et `index.test.tsx`

- [x] Task 10 — Routes livraisons : connecter l'édition (AC: #4, #5, #6, #7)
  - [x] 10.1 Modifier `src/components/LivraisonsList.tsx` : ajouter prop `onEdit` et propager aux DeliveryCards
  - [x] 10.2 Modifier `src/routes/_authenticated/chantiers/$chantierId/livraisons.tsx` : passer `onEdit` via actions
  - [x] 10.3 Modifier `src/routes/_authenticated/livraisons.tsx` (vue globale) : ajouter état édition inline + `useUpdateLivraison` + Sheet édition

- [x] Task 11 — ActivityFeed : event type livraison_updated (AC: #6)
  - [x] 11.1 Modifier `src/components/ActivityFeed.tsx`
  - [x] 11.2 Ajouter mapping `livraison_updated` → icône `Pencil` (bleu) + "a modifié une livraison"

- [x] Task 12 — Tests de régression (AC: #1-8)
  - [x] 12.1 `npm run test` — tous les story tests passent, 0 nouvelles régressions
  - [x] 12.2 `npm run lint` — 0 nouvelles erreurs
  - [x] 12.3 `npm run build` — 0 nouvelles erreurs tsc

## Dev Notes

### Vue d'ensemble — Stratégie d'implémentation

Cette story est la **septième de l'Epic 6** et ajoute le **champ fournisseur** sur les livraisons ainsi que l'**édition complète** des livraisons non livrées (FR79, FR82). Les stories 6.1-6.6 ont construit le cycle complet besoins/livraisons/inventaire/édition besoins. Cette story enrichit les livraisons avec un champ métier important (fournisseur) et donne la capacité de corriger/mettre à jour les informations d'une livraison.

**Scope précis :**
- Nouvelle colonne `fournisseur TEXT NULL` sur la table `livraisons`
- Affichage du fournisseur sur DeliveryCard (masqué si null)
- Champ fournisseur optionnel dans le formulaire de création de livraison
- Champ fournisseur optionnel dans le flow de transformation besoin → livraison (Sheet remplace AlertDialog)
- DropdownMenu "Modifier" sur DeliveryCard (statuts commandé/prévu uniquement)
- Sheet d'édition avec 3 champs : description, fournisseur, date_prevue (pré-remplis)
- Garde serveur : UPDATE limité aux status `commande` / `prevu`
- Nouvel event type activité : `livraison_updated`

**Hors scope (stories suivantes) :**
- Commande groupée de besoins avec sélection multiple (Story 6.8)
- Accordéon besoins rattachés sur DeliveryCard (Story 6.8 — FR80)
- Suppression de livraisons avec choix repasser en besoins (Story 6.9)

**Complexité : MOYENNE** — Pas de nouvelle table mais modification de 3 mutations existantes, création d'1 mutation nouvelle, modification de DeliveryCard (composant central), modification de 4 routes, et remplacement de l'AlertDialog Commander par un Sheet.

### Ce qui existe déjà (à réutiliser, NE PAS recréer)

| Élément | Fichier | Notes |
|---------|---------|-------|
| `DeliveryCard` | `src/components/DeliveryCard.tsx` | 147 lignes — carte livraison avec barre statut, description, auteur, date, BC/BL, boutons action |
| `DeliveryCardSkeleton` | `src/components/DeliveryCard.tsx` | Skeleton loading |
| `LivraisonSheets` | `src/components/LivraisonSheets.tsx` | 2 Sheets : création (description) + date prévue |
| `LivraisonsList` | `src/components/LivraisonsList.tsx` | Liste de DeliveryCards avec état vide |
| `useLivraisonActions` | `src/lib/hooks/useLivraisonActions.ts` | 94 lignes — hook partagé: state + handlers création/marquer prévu/confirmer |
| `useCreateLivraison` | `src/lib/mutations/useCreateLivraison.ts` | Insert `{description, status:'commande'}` — manque fournisseur |
| `useTransformBesoinToLivraison` | `src/lib/mutations/useTransformBesoinToLivraison.ts` | 2-step: créer livraison + lier besoin — manque fournisseur |
| `useUpdateLivraisonStatus` | `src/lib/mutations/useUpdateLivraisonStatus.ts` | Update status uniquement (prevu/livre) — PAS d'édition champs |
| `useLivraisons(chantierId)` | `src/lib/queries/useLivraisons.ts` | `select('*')`, key: `['livraisons', chantierId]` |
| `useAllLivraisons()` | `src/lib/queries/useAllLivraisons.ts` | `select('*, chantiers(nom)')`, key: `['all-livraisons']` |
| `useLivraisonsCount(chantierId)` | `src/lib/queries/useLivraisonsCount.ts` | key: `['livraisons-count', chantierId]` |
| `useRealtimeLivraisons(chantierId)` | `src/lib/subscriptions/useRealtimeLivraisons.ts` | Subscription INSERT/UPDATE/DELETE — invalide queries automatiquement |
| `useRealtimeAllLivraisons()` | `src/lib/subscriptions/useRealtimeAllLivraisons.ts` | Subscription globale |
| Page livraisons chantier | `src/routes/_authenticated/chantiers/$chantierId/livraisons.tsx` | Utilise `useLivraisonActions` + `LivraisonSheets` |
| Page livraisons globale | `src/routes/_authenticated/livraisons.tsx` | Tabs filtre par statut, toutes livraisons |
| Page besoins | `src/routes/_authenticated/chantiers/$chantierId/besoins.tsx` | AlertDialog "Commander" → `useTransformBesoinToLivraison` |
| Page chantier index | `src/routes/_authenticated/chantiers/$chantierId/index.tsx` | Section léger : besoins inline avec "Commander" |
| `ActivityFeed` | `src/components/ActivityFeed.tsx` | Mapping event types → icône + label |
| `BesoinsList` | `src/components/BesoinsList.tsx` | Prop `onCommander` — INCHANGÉ |
| Type `Livraison` | `src/types/database.ts:258-270` | Interface sans `fournisseur` actuellement |
| `DropdownMenu` | `src/components/ui/dropdown-menu.tsx` | shadcn/ui — déjà installé et utilisé dans BesoinsList (story 6.6) |
| `Sheet` | `src/components/ui/sheet.tsx` | Bottom sheet — déjà utilisé partout |
| `Input` | `src/components/ui/input.tsx` | Champ texte standard |
| `Textarea` | `src/components/ui/textarea.tsx` | Champ texte multi-lignes |

### Migration SQL : 022_livraison_fournisseur_edit.sql

```sql
-- Story 6.7 : Fournisseur et édition des livraisons

-- =====================
-- COLONNE — Fournisseur (texte libre, optionnel)
-- =====================
ALTER TABLE public.livraisons ADD COLUMN fournisseur text;

-- =====================
-- ENUM — Nouveau type d'activité
-- =====================
ALTER TYPE public.activity_event_type ADD VALUE IF NOT EXISTS 'livraison_updated';

-- =====================
-- TRIGGER FUNCTION — Mise à jour pour gérer UPDATE champs éditables
-- =====================
CREATE OR REPLACE FUNCTION public.log_livraison_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- INSERT : livraison créée
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_logs (event_type, actor_id, actor_email, chantier_id, target_type, target_id, metadata)
    VALUES (
      'livraison_created',
      COALESCE(auth.uid(), NEW.created_by),
      COALESCE((auth.jwt()->>'email')::text, NULL),
      NEW.chantier_id,
      'livraison',
      NEW.id,
      jsonb_build_object('description', LEFT(NEW.description, 80))
    );
    RETURN NEW;
  END IF;

  -- UPDATE status : changement de statut (prioritaire sur les autres updates)
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.activity_logs (event_type, actor_id, actor_email, chantier_id, target_type, target_id, metadata)
    VALUES (
      'livraison_status_changed',
      COALESCE(auth.uid(), NEW.created_by),
      COALESCE((auth.jwt()->>'email')::text, NULL),
      NEW.chantier_id,
      'livraison',
      NEW.id,
      jsonb_build_object('description', LEFT(NEW.description, 80), 'old_status', OLD.status::text, 'new_status', NEW.status::text)
    );
    RETURN NEW;
  END IF;

  -- UPDATE champs éditables (description, fournisseur, date_prevue) sans changement de status
  IF TG_OP = 'UPDATE' AND OLD.status = NEW.status AND (
    OLD.description IS DISTINCT FROM NEW.description OR
    OLD.fournisseur IS DISTINCT FROM NEW.fournisseur OR
    OLD.date_prevue IS DISTINCT FROM NEW.date_prevue
  ) THEN
    INSERT INTO public.activity_logs (event_type, actor_id, actor_email, chantier_id, target_type, target_id, metadata)
    VALUES (
      'livraison_updated',
      COALESCE(auth.uid(), NEW.created_by),
      COALESCE((auth.jwt()->>'email')::text, NULL),
      NEW.chantier_id,
      'livraison',
      NEW.id,
      jsonb_build_object('description', LEFT(NEW.description, 80))
    );
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer l'ancien trigger et recréer avec les bons events
DROP TRIGGER IF EXISTS trg_livraison_activity ON public.livraisons;
CREATE TRIGGER trg_livraison_activity
  AFTER INSERT OR UPDATE OF status, description, fournisseur, date_prevue ON public.livraisons
  FOR EACH ROW EXECUTE FUNCTION public.log_livraison_activity();
```

**Points clés migration :**
- La colonne `fournisseur` est `text` sans NOT NULL — null par défaut, aucun impact sur les lignes existantes
- La condition `OLD.status = NEW.status` dans le bloc `livraison_updated` évite un double log quand `useUpdateLivraisonStatus` change le status ET la date_prevue simultanément
- Le trigger est DROP + CREATE pour ajouter `fournisseur` et `description` aux colonnes écoutées
- Pattern identique à `021_besoin_edit_delete.sql` (story 6.6)

### Mutation : useUpdateLivraison (NOUVELLE)

```typescript
// src/lib/mutations/useUpdateLivraison.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Livraison } from '@/types/database'

interface UpdateLivraisonInput {
  id: string
  chantierId: string
  description: string
  fournisseur: string | null
  datePrevue: string | null
}

export function useUpdateLivraison() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, description, fournisseur, datePrevue }: UpdateLivraisonInput) => {
      const { data, error } = await supabase
        .from('livraisons')
        .update({
          description,
          fournisseur: fournisseur || null,
          date_prevue: datePrevue || null,
        })
        .eq('id', id)
        .in('status', ['commande', 'prevu']) // Garde : pas d'édition si livré
        .select()
        .single()
      if (error) throw error
      return data as unknown as Livraison
    },
    onMutate: async ({ id, chantierId, description, fournisseur, datePrevue }) => {
      await queryClient.cancelQueries({ queryKey: ['livraisons', chantierId] })
      const previous = queryClient.getQueryData(['livraisons', chantierId])
      queryClient.setQueryData(
        ['livraisons', chantierId],
        (old: Livraison[] | undefined) =>
          (old ?? []).map((l) =>
            l.id === id
              ? { ...l, description, fournisseur: fournisseur || null, date_prevue: datePrevue || null }
              : l,
          ),
      )
      return { previous }
    },
    onError: (_err, { chantierId }, context) => {
      queryClient.setQueryData(['livraisons', chantierId], context?.previous)
    },
    onSettled: (_data, _error, { chantierId }) => {
      queryClient.invalidateQueries({ queryKey: ['livraisons', chantierId] })
      queryClient.invalidateQueries({ queryKey: ['all-livraisons'] })
    },
  })
}
```

**Points clés :**
- `.in('status', ['commande', 'prevu'])` — garde serveur (AC #7). Si livraison est `livre`, `.single()` lèvera une erreur
- `fournisseur || null` — normalise string vide en null (cohérence DB)
- Invalide aussi `['all-livraisons']` car la vue globale affiche les infos modifiées
- Pas besoin d'invalider `['livraisons-count']` car le nombre ne change pas
- Pattern identique à `useUpdateBesoin` (story 6.6) mais avec plus de champs

### Mutation : useCreateLivraison — Modifications

```typescript
// Changement dans l'input
mutationFn: async ({ chantierId, description, fournisseur }: {
  chantierId: string; description: string; fournisseur?: string
}) => {
  // ...
  const { data, error } = await supabase
    .from('livraisons')
    .insert({
      chantier_id: chantierId,
      description,
      fournisseur: fournisseur || null, // NOUVEAU
      status: 'commande' as const,
      created_by: user?.id ?? null,
    })
    // ...
},
// Dans onMutate, l'objet optimiste ajoute :
{
  // ... champs existants ...
  fournisseur: fournisseur || null, // NOUVEAU
}
```

### Mutation : useTransformBesoinToLivraison — Modifications

```typescript
// Changement dans l'input
mutationFn: async ({ besoin, fournisseur }: { besoin: Besoin; fournisseur?: string }) => {
  // ...
  const { data: livraison, error: livraisonError } = await supabase
    .from('livraisons')
    .insert({
      chantier_id: besoin.chantier_id,
      description: besoin.description,
      fournisseur: fournisseur || null, // NOUVEAU
      status: 'commande' as const,
      created_by: user?.id ?? null,
    })
    // ...
}
```

### Composant DeliveryCard — Modifications

**Avant :**
```
+--------------------------------------------------+
| Description                          [Commandé]  |
| Chantier Les Oliviers                            |
| Y . il y a 2h  cal 15 fév 2026  BC ok            |
|                              [Marquer prévu]     |
| --- BC slot --- BL slot ---                      |
+--------------------------------------------------+
```

**Après :**
```
+--------------------------------------------------+
| Description                    [Commandé]   [:]  |
| Leroy Merlin                  (text-muted)       |
| Chantier Les Oliviers                            |
| Y . il y a 2h  cal 15 fév 2026  BC ok            |
|                              [Marquer prévu]     |
| --- BC slot --- BL slot ---                      |
+--------------------------------------------------+
```

**Changements dans DeliveryCard.tsx :**
- Ajouter prop `onEdit?: (livraison: Livraison) => void`
- Après la ligne description + badge statut : afficher `livraison.fournisseur` en `text-sm text-muted-foreground` si non null
- Ajouter un `DropdownMenu` avec trigger `MoreVertical` (button ghost, h-9 w-9) en haut à droite de la carte
- Condition d'affichage du DropdownMenu : `onEdit` fourni ET `livraison.status !== 'livre'`
- `DropdownMenuItem` "Modifier" avec icône `Pencil` — appelle `onEdit(livraison)`
- Story 6.9 ajoutera "Supprimer" au même DropdownMenu (ne PAS pré-ajouter `onDelete`)

**Imports à ajouter :**
```typescript
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreVertical, Pencil } from 'lucide-react'
```

### Hook useLivraisonActions — Modifications

**Nouveaux états :**
```typescript
// Création — champ fournisseur
const [livraisonFournisseur, setLivraisonFournisseur] = useState('')

// Édition
const [livraisonToEdit, setLivraisonToEdit] = useState<Livraison | null>(null)
const [showEditSheet, setShowEditSheet] = useState(false)
const [editDescription, setEditDescription] = useState('')
const [editFournisseur, setEditFournisseur] = useState('')
const [editDatePrevue, setEditDatePrevue] = useState('')
const [editError, setEditError] = useState('')
```

**Nouveaux handlers :**
```typescript
function handleEditLivraison(livraison: Livraison) {
  setLivraisonToEdit(livraison)
  setEditDescription(livraison.description)
  setEditFournisseur(livraison.fournisseur ?? '')
  setEditDatePrevue(livraison.date_prevue ?? '')
  setEditError('')
  setShowEditSheet(true)
}

function handleConfirmEdit() {
  const trimmed = editDescription.trim()
  if (!trimmed) {
    setEditError('La description est requise')
    return
  }
  if (!livraisonToEdit) return
  updateLivraison.mutate(
    {
      id: livraisonToEdit.id,
      chantierId,
      description: trimmed,
      fournisseur: editFournisseur.trim() || null,
      datePrevue: editDatePrevue || null,
    },
    {
      onSuccess: () => {
        setShowEditSheet(false)
        setLivraisonToEdit(null)
        toast('Livraison modifiée')
      },
      onError: () => toast.error('Erreur lors de la modification'),
    },
  )
}
```

**Modification de handleOpenLivraisonSheet :**
```typescript
function handleOpenLivraisonSheet() {
  setLivraisonDescription('')
  setLivraisonFournisseur('') // NOUVEAU — reset fournisseur
  setLivraisonError('')
  setShowLivraisonSheet(true)
}
```

**Modification de handleCreateLivraison :**
```typescript
createLivraison.mutate(
  { chantierId, description: trimmed, fournisseur: livraisonFournisseur.trim() || undefined },
  // ... callbacks inchangés
)
```

### Composant LivraisonSheets — Modifications

**Sheet création (existant) — ajouter champ fournisseur après le Textarea :**
```tsx
<Input
  placeholder="Fournisseur (optionnel)"
  value={actions.livraisonFournisseur}
  onChange={(e) => actions.setLivraisonFournisseur(e.target.value)}
  aria-label="Fournisseur"
  className="mt-2"
/>
```

**Nouveau Sheet édition :**
```tsx
<Sheet open={actions.showEditSheet} onOpenChange={actions.setShowEditSheet}>
  <SheetContent side="bottom">
    <SheetHeader>
      <SheetTitle>Modifier la livraison</SheetTitle>
      <SheetDescription>Modifiez les informations de la livraison.</SheetDescription>
    </SheetHeader>
    <div className="px-4 flex flex-col gap-3">
      <div>
        <label className="text-sm font-medium mb-1 block">Description</label>
        <Textarea
          value={actions.editDescription}
          onChange={(e) => {
            actions.setEditDescription(e.target.value)
            if (actions.editError) actions.setEditError('')
          }}
          aria-label="Description de la livraison"
          aria-invalid={!!actions.editError}
          rows={3}
        />
        {actions.editError && (
          <p className="text-sm text-destructive mt-1">{actions.editError}</p>
        )}
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Fournisseur</label>
        <Input
          value={actions.editFournisseur}
          onChange={(e) => actions.setEditFournisseur(e.target.value)}
          placeholder="Optionnel"
          aria-label="Fournisseur"
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Date prévue</label>
        <Input
          type="date"
          value={actions.editDatePrevue}
          onChange={(e) => actions.setEditDatePrevue(e.target.value)}
          aria-label="Date prévue"
        />
      </div>
    </div>
    <SheetFooter>
      <Button
        onClick={actions.handleConfirmEdit}
        disabled={actions.updateLivraisonPending}
        className="w-full"
      >
        Enregistrer
      </Button>
    </SheetFooter>
  </SheetContent>
</Sheet>
```

### Routes besoins — Remplacement AlertDialog Commander par Sheet

**Avant (actuel dans besoins.tsx) :**
```tsx
<AlertDialog open={showCommanderDialog} onOpenChange={setShowCommanderDialog}>
  <AlertDialogContent>
    <AlertDialogTitle>Transformer ce besoin en commande ?</AlertDialogTitle>
    <AlertDialogDescription>
      Le besoin ... sera transformé en livraison au statut Commandé.
    </AlertDialogDescription>
    <AlertDialogFooter>
      <AlertDialogCancel>Annuler</AlertDialogCancel>
      <AlertDialogAction onClick={handleConfirmCommander}>Commander</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Après :**
```tsx
// Renommer : showCommanderDialog → showCommanderSheet
// Nouvel état :
const [commanderFournisseur, setCommanderFournisseur] = useState('')

// handleCommander : ouvre le Sheet (même logique)
function handleCommander(besoin: Besoin) {
  setBesoinToCommand(besoin)
  setCommanderFournisseur('')
  setShowCommanderSheet(true)
}

// handleConfirmCommander : passe fournisseur à la mutation
function handleConfirmCommander() {
  if (!besoinToCommand) return
  transformBesoin.mutate(
    { besoin: besoinToCommand, fournisseur: commanderFournisseur.trim() || undefined },
    {
      onSuccess: () => {
        setShowCommanderSheet(false)
        setBesoinToCommand(null)
        setCommanderFournisseur('')
        toast('Besoin commandé')
      },
      onError: () => toast.error('Erreur lors de la commande'),
    },
  )
}

// JSX — Sheet remplace AlertDialog
<Sheet open={showCommanderSheet} onOpenChange={setShowCommanderSheet}>
  <SheetContent side="bottom">
    <SheetHeader>
      <SheetTitle>Commander ce besoin</SheetTitle>
      <SheetDescription>
        Le besoin &laquo;{besoinToCommand?.description}&raquo; sera transformé en livraison.
      </SheetDescription>
    </SheetHeader>
    <div className="px-4">
      <Input
        placeholder="Fournisseur (optionnel)"
        value={commanderFournisseur}
        onChange={(e) => setCommanderFournisseur(e.target.value)}
        aria-label="Fournisseur"
      />
    </div>
    <SheetFooter>
      <Button
        onClick={handleConfirmCommander}
        disabled={transformBesoin.isPending}
        className="w-full"
      >
        Confirmer la commande
      </Button>
    </SheetFooter>
  </SheetContent>
</Sheet>
```

**ATTENTION** : la même modification s'applique à `index.tsx` (section léger). Le pattern est identique — remplacer l'AlertDialog Commander par un Sheet avec fournisseur.

### Routes livraisons — Connecter l'édition

**LivraisonsList.tsx :**
- Ajouter prop `onEdit?: (livraison: Livraison) => void`
- Passer `onEdit` à chaque `<DeliveryCard onEdit={onEdit} />`

**chantiers/$chantierId/livraisons.tsx :**
- `useLivraisonActions` retourne `handleEditLivraison` — passer à `<LivraisonsList onEdit={actions.handleEditLivraison} />`
- `<LivraisonSheets actions={actions} />` affiche automatiquement le nouveau Sheet édition

**livraisons.tsx (vue globale) :**
- Cette vue n'utilise PAS `useLivraisonActions` (elle a son propre state inline)
- Ajouter état local pour l'édition : `livraisonToEdit`, `showEditSheet`, etc.
- Utiliser `useUpdateLivraison` directement
- **ATTENTION** : la vue globale montre des livraisons de **tous les chantiers** — `chantierId` doit venir de `livraison.chantier_id` (pas d'un param route)

### ActivityFeed — Nouveau event type

```typescript
case 'livraison_updated':
  return { icon: Pencil, color: 'text-blue-400', label: 'a modifié une livraison' }
```

### Schéma DB — Table livraisons (après migration)

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid PK | gen_random_uuid() |
| chantier_id | uuid FK → chantiers | ON DELETE CASCADE |
| description | text NOT NULL | Description libre |
| status | delivery_status NOT NULL | 'commande' \| 'prevu' \| 'livre' (défaut: 'commande') |
| **fournisseur** | **text NULL** | **NOUVEAU — Texte libre, null par défaut** |
| date_prevue | date NULL | Date de livraison prévue |
| bc_file_url | text NULL | URL fichier BC dans storage |
| bc_file_name | text NULL | Nom original fichier BC |
| bl_file_url | text NULL | URL fichier BL dans storage |
| bl_file_name | text NULL | Nom original fichier BL |
| created_at | timestamptz NOT NULL | now() |
| created_by | uuid FK → auth.users | Auteur |

### Project Structure Notes

**Nouveaux fichiers (3) :**
- `supabase/migrations/022_livraison_fournisseur_edit.sql`
- `src/lib/mutations/useUpdateLivraison.ts`
- `src/lib/mutations/useUpdateLivraison.test.ts`

**Fichiers modifiés (~14) :**
- `src/types/database.ts` — `fournisseur: string | null` dans Livraison + `livraison_updated` dans ActivityEventType
- `src/lib/mutations/useCreateLivraison.ts` — paramètre fournisseur optionnel
- `src/lib/mutations/useTransformBesoinToLivraison.ts` — paramètre fournisseur optionnel
- `src/lib/hooks/useLivraisonActions.ts` — états + handlers édition + fournisseur création
- `src/components/DeliveryCard.tsx` — affichage fournisseur + DropdownMenu Modifier
- `src/components/DeliveryCard.test.tsx` — tests fournisseur + DropdownMenu
- `src/components/LivraisonSheets.tsx` — fournisseur dans création + Sheet édition
- `src/components/LivraisonsList.tsx` — prop onEdit propagée
- `src/components/ActivityFeed.tsx` — mapping livraison_updated
- `src/routes/_authenticated/chantiers/$chantierId/besoins.tsx` — Sheet Commander avec fournisseur (remplace AlertDialog)
- `src/routes/_authenticated/chantiers/$chantierId/besoins.test.tsx`
- `src/routes/_authenticated/chantiers/$chantierId/index.tsx` — section léger: même modification Commander
- `src/routes/_authenticated/chantiers/$chantierId/index.test.tsx`
- `src/routes/_authenticated/chantiers/$chantierId/livraisons.tsx` — passer onEdit
- `src/routes/_authenticated/livraisons.tsx` — état édition inline + onEdit

**Fichiers NON touchés (ne pas modifier) :**
- `src/lib/queries/useLivraisons.ts` — `select('*')` récupère automatiquement la nouvelle colonne
- `src/lib/queries/useAllLivraisons.ts` — idem, `select('*, chantiers(nom)')` inclura fournisseur
- `src/lib/queries/useLivraisonsCount.ts` — compteur inchangé
- `src/lib/mutations/useUpdateLivraisonStatus.ts` — inchangé, gère uniquement les transitions de status
- `src/lib/subscriptions/useRealtimeLivraisons.ts` — écoute déjà UPDATE → invalide automatiquement
- `src/lib/subscriptions/useRealtimeAllLivraisons.ts` — idem
- `src/components/BesoinsList.tsx` — prop `onCommander` inchangée
- `src/lib/mutations/useUpdateBesoin.ts` — story 6.6, inchangé
- `src/lib/mutations/useDeleteBesoin.ts` — story 6.6, inchangé
- `src/routeTree.gen.ts` — aucune nouvelle route créée

### Tests — Stratégie

**useUpdateLivraison.test.ts (4 tests) :**
- Met à jour description + fournisseur + date_prevue
- Gère l'erreur Supabase (rollback optimistic)
- Ne modifie pas une livraison au statut `livre` (garde serveur)
- Invalide `['livraisons', chantierId]` et `['all-livraisons']`

**DeliveryCard.test.tsx (5 tests ajoutés) :**
- Affiche le fournisseur quand non null
- N'affiche rien quand fournisseur est null
- Affiche le DropdownMenu (MoreVertical) quand onEdit fourni et status !== 'livre'
- Pas de DropdownMenu quand status === 'livre'
- Cliquer "Modifier" appelle `onEdit` avec la bonne livraison

**besoins.test.tsx (3 tests modifiés/ajoutés) :**
- Sheet Commander s'ouvre avec champ fournisseur
- Confirmer sans fournisseur → mutation appelée avec fournisseur undefined
- Confirmer avec fournisseur → mutation appelée avec le fournisseur saisi

**LivraisonSheets (via route tests) :**
- Sheet création inclut champ fournisseur
- Sheet édition s'ouvre pré-rempli
- Validation description vide → message d'erreur
- Soumission valide → toast "Livraison modifiée"

**Mock patterns :**
```typescript
// Mock useUpdateLivraison
vi.mock('@/lib/mutations/useUpdateLivraison', () => ({
  useUpdateLivraison: () => ({
    mutate: vi.fn((_, opts) => opts?.onSuccess?.()),
    isPending: false,
  }),
}))

// Mock useCreateLivraison (mise à jour pour fournisseur)
// Le mock existant fonctionne tel quel — fournisseur est optionnel

// Mock Supabase chainable pour useUpdateLivraison
const mockSelect = vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: updatedLivraison, error: null }) })
const mockIn = vi.fn().mockReturnValue({ select: mockSelect })
const mockEq = vi.fn().mockReturnValue({ in: mockIn })
const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as any)
```

### Prérequis et dépendances

- **Migration SQL** : `022_livraison_fournisseur_edit.sql` — ADD COLUMN + enum + trigger
- **Aucune dépendance npm** à ajouter — tout est déjà installé
- **Composants shadcn** : DropdownMenu, Sheet, Input, Textarea, Button — tous déjà installés
- **Stories 6.1-6.6** : `done` — cycle livraisons complet + édition besoins
- **Subscriptions** : DÉJÀ en place pour UPDATE sur livraisons — aucun changement nécessaire

### Risques et points d'attention

1. **Vue globale livraisons (livraisons.tsx)** : Cette vue n'utilise PAS `useLivraisonActions` et a son propre state inline. L'ajout de l'édition doit être fait séparément avec `useUpdateLivraison` directement. Le `chantierId` vient de `livraison.chantier_id`, pas d'un paramètre de route.

2. **Remplacement AlertDialog → Sheet pour Commander** : C'est un changement de pattern UX. L'AlertDialog actuel (confirmation simple) est remplacé par un Sheet (formulaire avec champ fournisseur). Les tests existants du flow Commander doivent être mis à jour. Renommer les variables `showCommanderDialog` → `showCommanderSheet` pour la cohérence.

3. **Garde serveur `.in('status', ['commande', 'prevu'])`** : CRITIQUE. Sans elle, un bug côté client permettrait la modification d'une livraison livrée. Supabase `.single()` lèvera une erreur si 0 rows matchent.

4. **Normalisation fournisseur** : Toujours normaliser string vide en null (`fournisseur || null`) côté mutation pour éviter des strings vides en base. Le DeliveryCard vérifie `livraison.fournisseur` (truthy check) pour l'affichage.

5. **Optimistic update dans `useUpdateLivraison`** : Doit mettre à jour `['livraisons', chantierId]` mais aussi invalider `['all-livraisons']` dans onSettled car la vue globale joint avec `chantiers(nom)` — l'optimistic local ne suffit pas.

6. **Date prevue dans le Sheet édition** : Le champ `<Input type="date">` retourne un string `YYYY-MM-DD` ou vide. Normaliser en null si vide. Ne PAS confondre avec `useUpdateLivraisonStatus` qui gère les transitions de status + date (inchangé).

7. **Pre-existing issues** : Mêmes que stories précédentes — failures pré-existants (pwa-config, pwa-html, hasPointerCapture, placeholderData queries), lint error ThemeProvider.tsx:64.

8. **Tests des mutations modifiées** : `useCreateLivraison` et `useTransformBesoinToLivraison` ont des tests existants. Ajouter un test vérifiant que `fournisseur` est passé dans l'insert. Ne PAS casser les tests existants — fournisseur est optionnel.

### Learnings des stories précédentes (relevants)

**Story 6.6 (édition besoins) :**
- Pattern DropdownMenu sur liste : icône `MoreVertical`, button ghost `h-9 w-9`, items "Modifier" (Pencil) + "Supprimer" (Trash2 text-destructive)
- Pattern Sheet édition : Textarea pré-remplie, validation trim+empty, toast success/error, isPending disabled
- Pattern mutation update avec garde serveur : `.is('livraison_id', null)` — adapté ici en `.in('status', ['commande', 'prevu'])`
- Props optionnelles `onEdit/onDelete` — DropdownMenu conditionnel (rétrocompatible)

**Story 6.2 (livraisons création + cycle de vie) :**
- `useLivraisonActions` hook : state centralisé partagé entre routes — modifier plutôt que dupliquer
- `LivraisonSheets` : composant partagé — ajouter le Sheet édition ici
- Pattern création livraison : description textarea + validation — ajouter fournisseur input en dessous

**Story 6.1 (besoins création + Commander) :**
- AlertDialog Commander : confirmation simple avec texte besoin — REMPLACÉ par Sheet avec fournisseur
- `useTransformBesoinToLivraison` : mutation 2-step (créer livraison + lier besoin) — ajouter fournisseur dans le step 1

**Story 6.4 (vue globale livraisons) :**
- Vue globale utilise `useAllLivraisons` avec join `chantiers(nom)` — fournisseur sera automatiquement inclus par `select('*')`
- Tabs filtre par statut : l'édition doit fonctionner depuis n'importe quel tab
- `chantierId` vient de `livraison.chantier_id` dans la vue globale (pas de param route)

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 6.7, FR79 (fournisseur texte libre), FR82 (modifier fournisseur/intitulé/date)]
- [Source: _bmad-output/planning-artifacts/architecture.md — Pattern mutations optimistes, Supabase Client SDK, TanStack Query conventions]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — DeliveryCard anatomy, formulaires max 3 champs, validation au submit]
- [Source: _bmad-output/implementation-artifacts/6-6-edition-et-suppression-des-besoins.md — Pattern DropdownMenu, Sheet édition, useUpdateBesoin, useDeleteBesoin]
- [Source: src/components/DeliveryCard.tsx — Composant existant (147 lignes), layout carte livraison]
- [Source: src/components/LivraisonSheets.tsx — Sheets existants (85 lignes) : création + date prévue]
- [Source: src/components/LivraisonsList.tsx — Liste DeliveryCards]
- [Source: src/lib/hooks/useLivraisonActions.ts — Hook partagé (94 lignes) : state + handlers]
- [Source: src/lib/mutations/useCreateLivraison.ts — Pattern création avec optimistic]
- [Source: src/lib/mutations/useTransformBesoinToLivraison.ts — Pattern transform 2-step]
- [Source: src/lib/mutations/useUpdateLivraisonStatus.ts — Pattern update status (inchangé)]
- [Source: src/lib/queries/useLivraisons.ts — Query key: ['livraisons', chantierId]]
- [Source: src/lib/queries/useAllLivraisons.ts — Query key: ['all-livraisons'], join chantiers(nom)]
- [Source: src/types/database.ts:258-270 — Interface Livraison existante]
- [Source: supabase/migrations/017_livraison_activity.sql — Trigger existant log_livraison_activity]
- [Source: supabase/migrations/016_besoins_livraisons.sql — Table livraisons DDL]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

Aucun debug nécessaire — implémentation directe sans blocage.

### Completion Notes List

- Task 1 : Migration SQL `022_livraison_fournisseur_edit.sql` — ALTER TABLE + enum + trigger CREATE OR REPLACE
- Task 2 : `fournisseur: string | null` ajouté à `Livraison`, `'livraison_updated'` ajouté à `ActivityEventType`
- Task 3 : `useUpdateLivraison` créé avec garde serveur `.in('status', ['commande', 'prevu'])`, optimistic update + invalidation `['livraisons']` + `['all-livraisons']`. 4 tests.
- Task 4 : `useCreateLivraison` — paramètre `fournisseur` optionnel + objet optimistic mis à jour. Tests existants adaptés.
- Task 5 : `useTransformBesoinToLivraison` — paramètre `fournisseur` optionnel. Tests existants adaptés.
- Task 6 : `DeliveryCard` — affichage fournisseur (text-sm text-muted-foreground si non null) + `DropdownMenu` avec `MoreVertical`/`Pencil` (conditionnel `onEdit` + status !== 'livre'). 5 nouveaux tests (31 total).
- Task 7 : `useLivraisonActions` — ajout états édition + `livraisonFournisseur` pour création + handlers `handleEditLivraison`/`handleConfirmEdit` + mutation `useUpdateLivraison`.
- Task 8 : `LivraisonSheets` — champ fournisseur dans Sheet création + nouveau Sheet édition (description + fournisseur + date_prevue).
- Task 9 : Routes besoins + index — AlertDialog "Commander" remplacé par Sheet avec champ fournisseur optionnel. `commanderFournisseur` state + mutation avec `fournisseur`.
- Task 10 : `LivraisonsList` — prop `onEdit` propagée. Routes livraisons chantier + vue globale connectées. Vue globale : état inline + `useUpdateLivraison` direct (chantierId via livraison.chantier_id).
- Task 11 : `ActivityFeed` — `livraison_updated` → Pencil bleu + "a modifié une livraison".
- Task 12 : 261 tests story-related passent, 0 régressions, lint 0 erreurs, tsc 0 erreurs. Failures globales (28 fichiers) sont pré-existantes (pwa-config, hasPointerCapture, jsdom issues).

### Change Log

- 2026-02-13 : Story 6.7 implémentée — fournisseur + édition des livraisons (12 tasks, 0 régressions)
- 2026-02-13 : Code review — 3 HIGH (tests manquants), 3 MEDIUM (scope creep, DRY, a11y labels) corrigés. Tests ajoutés: garde serveur, fournisseur-provided, Commander Sheet fournisseur. EditLivraisonSheet extrait pour DRY.

### Senior Developer Review (AI)

**Reviewer:** Youssef (via Claude Opus 4.6 adversarial review)
**Date:** 2026-02-13
**Outcome:** Changes Requested → Fixed

**Issues trouvés (7) — tous corrigés :**
- H1 — Tests Commander Sheet fournisseur manquants dans besoins.test.tsx et index.test.tsx → **FIXÉ** (6 tests ajoutés)
- H2 — Test garde serveur manquant dans useUpdateLivraison.test.ts → **FIXÉ** (1 test ajouté)
- H3 — Tests fournisseur-provided manquants dans useCreateLivraison.test.ts et useTransformBesoinToLivraison.test.ts → **FIXÉ** (2 tests ajoutés)
- M1 — 24+ fichiers modifiés dans git mais non documentés dans la File List (scope creep hors story) → **DOCUMENTÉ** ci-dessous
- M2 — Sheet édition dupliqué entre LivraisonSheets et livraisons.tsx → **FIXÉ** (EditLivraisonSheet extrait)
- M3 — Labels sans htmlFor dans les formulaires → **FIXÉ** (via EditLivraisonSheet avec htmlFor+id)
- L1 — DeliveryCard button h-8 vs spec h-9 → accepté (mineur)

### File List

**Nouveaux fichiers (4) :**
- `supabase/migrations/022_livraison_fournisseur_edit.sql`
- `src/lib/mutations/useUpdateLivraison.ts`
- `src/lib/mutations/useUpdateLivraison.test.ts`
- `src/components/EditLivraisonSheet.tsx` *(ajouté lors de la code review — DRY refactor)*

**Fichiers modifiés (15) :**
- `src/types/database.ts`
- `src/lib/mutations/useCreateLivraison.ts`
- `src/lib/mutations/useCreateLivraison.test.ts`
- `src/lib/mutations/useTransformBesoinToLivraison.ts`
- `src/lib/mutations/useTransformBesoinToLivraison.test.ts`
- `src/lib/hooks/useLivraisonActions.ts`
- `src/components/DeliveryCard.tsx`
- `src/components/DeliveryCard.test.tsx`
- `src/components/LivraisonSheets.tsx`
- `src/components/LivraisonsList.tsx`
- `src/components/ActivityFeed.tsx`
- `src/routes/_authenticated/chantiers/$chantierId/besoins.tsx`
- `src/routes/_authenticated/chantiers/$chantierId/index.tsx`
- `src/routes/_authenticated/chantiers/$chantierId/livraisons.tsx`
- `src/routes/_authenticated/livraisons.tsx`

**Fichiers hors scope détectés dans le diff git (NON liés à la story 6.7) :**
- 20 fichiers query (`useChantiers.ts`, `useBesoins.ts`, etc.) — ajout `placeholderData: []`
- `src/lib/queryClient.ts` — `retry: 3` → `retry: 1`
- `src/routes/_authenticated.tsx` — ajout SidebarNavigation + layout restructure
- `src/components/SidebarNavigation.tsx` — nouveau composant 84 lignes
- `src/routes/_authenticated/index.tsx` — réécriture page d'accueil
