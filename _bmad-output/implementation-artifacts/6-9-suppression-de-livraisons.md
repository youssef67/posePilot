# Story 6.9: Suppression de livraisons

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que utilisateur de posePilot,
Je veux supprimer une livraison au statut commandé ou prévu,
Afin que je puisse annuler une commande qui n'est plus pertinente ou qui a été refusée par le fournisseur.

## Acceptance Criteria

1. **Given** une livraison est au statut "Commandé" ou "Prévu" **When** l'utilisateur tape sur la DeliveryCard et consulte le menu d'actions **Then** l'option "Supprimer" est disponible

2. **Given** la livraison à supprimer a des besoins rattachés **When** l'utilisateur tape "Supprimer" **Then** un dialogue s'affiche avec deux choix : "Repasser en besoins" et "Supprimer définitivement"

3. **Given** l'utilisateur choisit "Repasser en besoins" **When** la mutation s'exécute **Then** les besoins rattachés redeviennent en attente (livraison_id remis à null), la livraison est supprimée, et les fichiers associés (BC/BL) sont supprimés du storage Supabase

4. **Given** les besoins sont repassés en attente **When** l'utilisateur consulte la liste des besoins en attente **Then** les besoins réapparaissent dans la liste avec leurs descriptions d'origine

5. **Given** l'utilisateur choisit "Supprimer définitivement" **When** la mutation s'exécute **Then** la livraison, les besoins rattachés et les fichiers associés (BC/BL) sont tous supprimés définitivement

6. **Given** la livraison à supprimer n'a aucun besoin rattaché (créée directement) **When** l'utilisateur tape "Supprimer" **Then** un dialogue de confirmation simple s'affiche ("Supprimer cette livraison ?") sans proposer l'option "Repasser en besoins"

7. **Given** la suppression est confirmée (quel que soit le mode) **When** la mutation réussit **Then** la DeliveryCard disparaît de la liste, un toast "Livraison supprimée" s'affiche, et les compteurs (tabs de filtre, badge nav) sont mis à jour

8. **Given** une livraison est au statut "Livré" **When** l'utilisateur consulte le menu d'actions **Then** l'option "Supprimer" n'est pas disponible

## Tasks / Subtasks

- [x] Task 1 — Migration SQL : enum + trigger DELETE (AC: #3, #5, #7)
  - [x] 1.1 Créer `supabase/migrations/023_livraison_delete.sql`
  - [x] 1.2 `ALTER TYPE activity_event_type ADD VALUE IF NOT EXISTS 'livraison_deleted';`
  - [x] 1.3 `CREATE OR REPLACE FUNCTION log_livraison_activity()` : ajouter le bloc DELETE
  - [x] 1.4 DROP + CREATE trigger pour écouter `INSERT OR UPDATE OF status, description, fournisseur, date_prevue OR DELETE`

- [x] Task 2 — Type TypeScript : ActivityEventType (AC: #7)
  - [x] 2.1 Ajouter `'livraison_deleted'` dans le type union `ActivityEventType` dans `src/types/database.ts`

- [x] Task 3 — Mutation hook : useDeleteLivraison (AC: #2, #3, #4, #5, #6, #7)
  - [x] 3.1 Créer `src/lib/mutations/useDeleteLivraison.ts`
  - [x] 3.2 Input : `{ livraisonId, chantierId, mode: 'release-besoins' | 'delete-all', linkedBesoinIds, bcFileUrl, blFileUrl }`
  - [x] 3.3 mutationFn étape 1 (si mode `delete-all` + besoins) : `supabase.from('besoins').delete().in('id', linkedBesoinIds)`
  - [x] 3.4 mutationFn étape 2 : `supabase.from('livraisons').delete().eq('id', livraisonId).in('status', ['commande', 'prevu']).select('id').single()`
  - [x] 3.5 mutationFn étape 3 (non-bloquant) : `supabase.storage.from('documents').remove(files).catch(() => {})`
  - [x] 3.6 onMutate : retirer la livraison du cache `['livraisons', chantierId]`
  - [x] 3.7 onError : rollback avec `context.previous`
  - [x] 3.8 onSettled : invalider 7 query keys (voir Dev Notes)
  - [x] 3.9 Créer `src/lib/mutations/useDeleteLivraison.test.ts` (5 tests minimum)

- [x] Task 4 — DeliveryCard : option "Supprimer" dans le DropdownMenu (AC: #1, #8)
  - [x] 4.1 Modifier `src/components/DeliveryCard.tsx`
  - [x] 4.2 Nouvelle prop `onDelete?: (livraison: Livraison, linkedBesoins: Besoin[]) => void`
  - [x] 4.3 Condition d'affichage du DropdownMenu : `(onEdit || onDelete) && livraison.status !== 'livre'`
  - [x] 4.4 Ajouter `DropdownMenuItem` "Supprimer" (icône `Trash2`, classe `text-destructive`) APRÈS "Modifier"
  - [x] 4.5 Séparer les items avec `DropdownMenuSeparator` si les deux sont présents
  - [x] 4.6 `onClick={() => onDelete(livraison, linkedBesoins ?? [])}`
  - [x] 4.7 Mettre à jour `DeliveryCard.test.tsx` (4+ nouveaux tests)

- [x] Task 5 — Hook useLivraisonActions : état et handlers suppression (AC: #2, #3, #5, #6, #7)
  - [x] 5.1 Modifier `src/lib/hooks/useLivraisonActions.ts`
  - [x] 5.2 Ajouter mutation `useDeleteLivraison`
  - [x] 5.3 Ajouter états : `livraisonToDelete: Livraison | null`, `deleteLinkedBesoins: Besoin[]`, `showDeleteSheet: boolean`
  - [x] 5.4 Handler `handleDeleteLivraison(livraison: Livraison, linkedBesoins: Besoin[])` — set state + ouvre le Sheet
  - [x] 5.5 Handler `handleConfirmDelete(mode: 'release-besoins' | 'delete-all')` — appelle la mutation, toast, reset
  - [x] 5.6 Exposer les nouveaux états et handlers dans le return

- [x] Task 6 — LivraisonSheets : Sheet de confirmation de suppression (AC: #2, #6)
  - [x] 6.1 Modifier `src/components/LivraisonSheets.tsx`
  - [x] 6.2 Ajouter un 4ème Sheet : suppression
  - [x] 6.3 Si `deleteLinkedBesoins.length > 0` : titre "Supprimer la livraison" + liste des besoins + 2 boutons ("Repasser en besoins" variant outline, "Supprimer définitivement" variant destructive)
  - [x] 6.4 Si `deleteLinkedBesoins.length === 0` : titre "Supprimer cette livraison ?" + 1 bouton "Supprimer" variant destructive
  - [x] 6.5 Boutons disabled si mutation pending

- [x] Task 7 — LivraisonsList + routes chantier : connecter la suppression (AC: #1, #7)
  - [x] 7.1 Modifier `src/components/LivraisonsList.tsx` : ajouter prop `onDelete`, propager aux DeliveryCards
  - [x] 7.2 Modifier `src/routes/_authenticated/chantiers/$chantierId/livraisons.tsx` : passer `onDelete` via actions

- [x] Task 8 — Route livraisons globale : suppression inline (AC: #1, #2, #7)
  - [x] 8.1 Modifier `src/routes/_authenticated/livraisons.tsx`
  - [x] 8.2 Ajouter état inline : `livraisonToDelete`, `deleteLinkedBesoins`, `showDeleteSheet`
  - [x] 8.3 Ajouter `useDeleteLivraison` direct (même pattern que edit inline)
  - [x] 8.4 Handlers `handleDeleteLivraison` + `handleConfirmDelete`
  - [x] 8.5 Ajouter Sheet de suppression (mêmes conditions que Task 6)
  - [x] 8.6 Passer `onDelete` aux DeliveryCards

- [x] Task 9 — ActivityFeed : event type livraison_deleted (AC: #7)
  - [x] 9.1 Modifier `src/components/ActivityFeed.tsx`
  - [x] 9.2 Ajouter mapping `livraison_deleted` → icône `Trash2` (rouge) + "a supprimé une livraison"

- [x] Task 10 — Tests de régression (AC: #1-8)
  - [x] 10.1 `npm run test` — tous les story tests passent, 0 nouvelles régressions
  - [x] 10.2 `npm run lint` — 0 nouvelles erreurs
  - [x] 10.3 `npm run build` — 0 nouvelles erreurs tsc

## Dev Notes

### Vue d'ensemble — Stratégie d'implémentation

Cette story est la **neuvième et dernière de l'Epic 6** et ajoute la **suppression de livraisons** avec gestion intelligente des besoins rattachés (FR84) et **nettoyage des fichiers BC/BL** du storage (FR85). Les stories 6.1-6.8 ont construit le cycle complet besoins/livraisons/inventaire/édition/fournisseur/commande groupée. Cette story ferme l'Epic 6 en permettant l'annulation de commandes.

**Scope précis :**
- Option "Supprimer" dans le DropdownMenu de DeliveryCard (statuts commandé/prévu uniquement)
- Dialogue conditionnel : 2 choix si besoins rattachés, confirmation simple sinon
- Mode "Repasser en besoins" : supprime la livraison, besoins redeviennent en attente (FK SET NULL automatique)
- Mode "Supprimer définitivement" : supprime les besoins puis la livraison
- Nettoyage des fichiers BC/BL du storage Supabase dans les deux modes
- Nouvel event type activité : `livraison_deleted`
- Toast + mise à jour des compteurs

**Hors scope :**
- Suppression de livraison au statut "Livré" (verrouillée)
- Undo/annulation de suppression (pas de corbeille)

**Complexité : MOYENNE** — Pas de nouveau composant UI complexe (réutilise Sheet + DropdownMenu existants). La logique branching (deux modes de suppression) est le point d'attention principal. Le nettoyage storage est un pattern existant (`useReplaceLivraisonDocument`).

### Ce qui existe déjà (à réutiliser, NE PAS recréer)

| Élément | Fichier | Notes |
|---------|---------|-------|
| `DeliveryCard` | `src/components/DeliveryCard.tsx` | ~202 lignes — DropdownMenu "Modifier" conditionnel, prop `linkedBesoins` |
| `DeliveryCardSkeleton` | `src/components/DeliveryCard.tsx` | Skeleton loading |
| `LivraisonSheets` | `src/components/LivraisonSheets.tsx` | 3 Sheets : création + date prévue + édition |
| `EditLivraisonSheet` | `src/components/EditLivraisonSheet.tsx` | Sheet réutilisable (description + fournisseur + date) |
| `LivraisonsList` | `src/components/LivraisonsList.tsx` | Liste de DeliveryCards avec props onEdit + besoinsMap |
| `useLivraisonActions` | `src/lib/hooks/useLivraisonActions.ts` | ~166 lignes — hook partagé: state + handlers création/marquer prévu/confirmer/édition |
| `useDeleteBesoin` | `src/lib/mutations/useDeleteBesoin.ts` | Pattern delete mutation avec optimistic — modèle à suivre |
| `useReplaceLivraisonDocument` | `src/lib/mutations/useReplaceLivraisonDocument.ts` | Pattern suppression fichier storage — `supabase.storage.from('documents').remove([url]).catch(() => {})` |
| `useLivraisons(chantierId)` | `src/lib/queries/useLivraisons.ts` | `select('*')`, key: `['livraisons', chantierId]` |
| `useAllLivraisons()` | `src/lib/queries/useAllLivraisons.ts` | `select('*, chantiers(nom)')`, key: `['all-livraisons']` |
| `useLivraisonsCount(chantierId)` | `src/lib/queries/useLivraisonsCount.ts` | key: `['livraisons-count', chantierId]` |
| `useBesoins(chantierId)` | `src/lib/queries/useBesoins.ts` | Filtre `livraison_id IS NULL` — les besoins relâchés réapparaîtront automatiquement |
| `useAllBesoinsForChantier` | `src/lib/queries/useAllBesoinsForChantier.ts` | key: `['all-besoins', chantierId]` |
| `useAllLinkedBesoins` | `src/lib/queries/useAllLinkedBesoins.ts` | key: `['all-linked-besoins']` |
| `useAllPendingBesoinsCount` | `src/lib/queries/useAllPendingBesoinsCount.ts` | key: `['all-pending-besoins-count']` |
| `useRealtimeLivraisons(chantierId)` | `src/lib/subscriptions/useRealtimeLivraisons.ts` | Écoute INSERT/UPDATE/DELETE — invalide queries automatiquement |
| `useRealtimeAllLivraisons()` | `src/lib/subscriptions/useRealtimeAllLivraisons.ts` | Subscription globale |
| Page livraisons chantier | `src/routes/_authenticated/chantiers/$chantierId/livraisons.tsx` | Utilise `useLivraisonActions` + `LivraisonSheets` |
| Page livraisons globale | `src/routes/_authenticated/livraisons.tsx` | Tabs filtre par statut, état inline (PAS useLivraisonActions) |
| `ActivityFeed` | `src/components/ActivityFeed.tsx` | Mapping event types → icône + label |
| `DropdownMenu` | `src/components/ui/dropdown-menu.tsx` | shadcn/ui — déjà installé |
| `DropdownMenuSeparator` | `src/components/ui/dropdown-menu.tsx` | shadcn/ui — séparateur entre items |
| `Sheet` | `src/components/ui/sheet.tsx` | Bottom sheet — déjà utilisé partout |
| Type `Livraison` | `src/types/database.ts` | `{id, chantier_id, description, status, fournisseur, date_prevue, bc_file_url, bc_file_name, bl_file_url, bl_file_name, created_at, created_by}` |
| Type `Besoin` | `src/types/database.ts` | `{id, chantier_id, description, livraison_id, created_at, created_by}` |

### Migration SQL : 023_livraison_delete.sql

```sql
-- Story 6.9 : Suppression de livraisons

-- =====================
-- ENUM — Nouveau type d'activité
-- =====================
ALTER TYPE public.activity_event_type ADD VALUE IF NOT EXISTS 'livraison_deleted';

-- =====================
-- TRIGGER FUNCTION — Mise à jour pour gérer DELETE
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

  -- DELETE : livraison supprimée
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.activity_logs (event_type, actor_id, actor_email, chantier_id, target_type, target_id, metadata)
    VALUES (
      'livraison_deleted',
      COALESCE(auth.uid(), OLD.created_by),
      COALESCE((auth.jwt()->>'email')::text, NULL),
      OLD.chantier_id,
      'livraison',
      OLD.id,
      jsonb_build_object('description', LEFT(OLD.description, 80))
    );
    RETURN OLD;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer l'ancien trigger et recréer avec DELETE
DROP TRIGGER IF EXISTS trg_livraison_activity ON public.livraisons;
CREATE TRIGGER trg_livraison_activity
  AFTER INSERT OR UPDATE OF status, description, fournisseur, date_prevue OR DELETE ON public.livraisons
  FOR EACH ROW EXECUTE FUNCTION public.log_livraison_activity();
```

**Points clés migration :**
- Reprend la fonction complète de `022_livraison_fournisseur_edit.sql` (CREATE OR REPLACE) et ajoute le bloc DELETE
- Le trigger est DROP+CREATE pour ajouter DELETE aux events écoutés
- `RETURN OLD` obligatoire dans le bloc DELETE (pas `RETURN NEW` qui est null pour DELETE)
- La FK `besoins.livraison_id REFERENCES livraisons(id) ON DELETE SET NULL` est DÉJÀ définie dans `016_besoins_livraisons.sql` — le mode "repasser en besoins" est garanti par la DB

### FK ON DELETE SET NULL — Comportement clé

La table `besoins` a cette FK (définie dans `016_besoins_livraisons.sql`) :
```sql
livraison_id uuid REFERENCES public.livraisons(id) ON DELETE SET NULL
```

**Conséquence pour le mode "Repasser en besoins" :**
- Il suffit de DELETE la livraison — PostgreSQL remet automatiquement `livraison_id = NULL` sur tous les besoins liés
- Les besoins réapparaissent dans `useBesoins(chantierId)` qui filtre `livraison_id IS NULL`
- Aucun UPDATE explicite des besoins n'est nécessaire côté client

**Conséquence pour le mode "Supprimer définitivement" :**
- Il faut DELETE les besoins AVANT la livraison (sinon ON DELETE SET NULL les relâche au lieu de les supprimer)
- Ordre : 1) delete besoins, 2) delete livraison, 3) cleanup storage

**Trigger besoin sur le SET NULL :**
- Le trigger `trg_besoin_activity` (021) écoute `UPDATE OF livraison_id, description OR DELETE`
- La condition `besoin_ordered` ne matche que `OLD.livraison_id IS NULL AND NEW.livraison_id IS NOT NULL` (null→valeur)
- Le SET NULL inverse (valeur→null) ne matche aucune condition → **aucun log d'activité parasite** pour les besoins relâchés

### Mutation : useDeleteLivraison (NOUVELLE)

```typescript
// src/lib/mutations/useDeleteLivraison.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Livraison } from '@/types/database'

interface DeleteLivraisonInput {
  livraisonId: string
  chantierId: string
  mode: 'release-besoins' | 'delete-all'
  linkedBesoinIds: string[]
  bcFileUrl: string | null
  blFileUrl: string | null
}

export function useDeleteLivraison() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ livraisonId, mode, linkedBesoinIds, bcFileUrl, blFileUrl }: DeleteLivraisonInput) => {
      // Étape 1 : Supprimer les besoins si mode "delete-all"
      if (mode === 'delete-all' && linkedBesoinIds.length > 0) {
        const { error: besoinsError } = await supabase
          .from('besoins')
          .delete()
          .in('id', linkedBesoinIds)
        if (besoinsError) throw besoinsError
      }
      // Note mode "release-besoins" : pas d'action sur les besoins,
      // le FK ON DELETE SET NULL les remet en attente automatiquement

      // Étape 2 : Supprimer la livraison (garde serveur : status commande/prevu)
      const { error: livraisonError } = await supabase
        .from('livraisons')
        .delete()
        .eq('id', livraisonId)
        .in('status', ['commande', 'prevu'])
      if (livraisonError) throw livraisonError

      // Étape 3 : Nettoyage fichiers storage (non-bloquant)
      const filesToDelete = [bcFileUrl, blFileUrl].filter(Boolean) as string[]
      if (filesToDelete.length > 0) {
        await supabase.storage.from('documents').remove(filesToDelete).catch(() => {})
      }
    },
    onMutate: async ({ livraisonId, chantierId }) => {
      await queryClient.cancelQueries({ queryKey: ['livraisons', chantierId] })
      const previousLivraisons = queryClient.getQueryData(['livraisons', chantierId])
      queryClient.setQueryData(
        ['livraisons', chantierId],
        (old: Livraison[] | undefined) =>
          (old ?? []).filter((l) => l.id !== livraisonId),
      )
      return { previousLivraisons }
    },
    onError: (_err, { chantierId }, context) => {
      queryClient.setQueryData(['livraisons', chantierId], context?.previousLivraisons)
    },
    onSettled: (_data, _error, { chantierId }) => {
      queryClient.invalidateQueries({ queryKey: ['livraisons', chantierId] })
      queryClient.invalidateQueries({ queryKey: ['livraisons-count', chantierId] })
      queryClient.invalidateQueries({ queryKey: ['all-livraisons'] })
      queryClient.invalidateQueries({ queryKey: ['besoins', chantierId] })
      queryClient.invalidateQueries({ queryKey: ['all-pending-besoins-count'] })
      queryClient.invalidateQueries({ queryKey: ['all-besoins', chantierId] })
      queryClient.invalidateQueries({ queryKey: ['all-linked-besoins'] })
    },
  })
}
```

**Points clés :**
- `.in('status', ['commande', 'prevu'])` — garde serveur (AC #8). Si livraison est `livre`, 0 rows supprimées
- Pour `delete-all` : besoins supprimés AVANT la livraison (sinon FK SET NULL les relâche)
- Pour `release-besoins` : on ne touche pas aux besoins — PostgreSQL les remet en attente via FK
- Fichiers storage supprimés en dernier, non-bloquant (`.catch(() => {})`)
- Optimistic update : retire la livraison du cache immédiatement
- 7 query keys invalidées dans onSettled (livraisons + besoins + compteurs)

### DeliveryCard — Modifications

**Nouvelle prop :**
```typescript
interface DeliveryCardProps {
  // ... props existantes ...
  onDelete?: (livraison: Livraison, linkedBesoins: Besoin[]) => void
}
```

**Condition d'affichage du DropdownMenu (MODIFIÉE) :**
```tsx
// Avant :
{onEdit && livraison.status !== 'livre' && (
// Après :
{(onEdit || onDelete) && livraison.status !== 'livre' && (
```

**Contenu du DropdownMenu (MODIFIÉ) :**
```tsx
<DropdownMenuContent align="end">
  {onEdit && (
    <DropdownMenuItem onClick={() => onEdit(livraison)}>
      <Pencil className="size-4 mr-2" />
      Modifier
    </DropdownMenuItem>
  )}
  {onEdit && onDelete && <DropdownMenuSeparator />}
  {onDelete && (
    <DropdownMenuItem
      onClick={() => onDelete(livraison, linkedBesoins ?? [])}
      className="text-destructive focus:text-destructive"
    >
      <Trash2 className="size-4 mr-2" />
      Supprimer
    </DropdownMenuItem>
  )}
</DropdownMenuContent>
```

**Imports à ajouter :**
```typescript
import { Trash2 } from 'lucide-react'
import { DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
```

### Hook useLivraisonActions — Modifications

**Nouveaux états :**
```typescript
// Suppression
const [livraisonToDelete, setLivraisonToDelete] = useState<Livraison | null>(null)
const [deleteLinkedBesoins, setDeleteLinkedBesoins] = useState<Besoin[]>([])
const [showDeleteSheet, setShowDeleteSheet] = useState(false)
```

**Nouvelle mutation :**
```typescript
const deleteLivraison = useDeleteLivraison()
```

**Nouveaux handlers :**
```typescript
function handleDeleteLivraison(livraison: Livraison, linkedBesoins: Besoin[]) {
  setLivraisonToDelete(livraison)
  setDeleteLinkedBesoins(linkedBesoins)
  setShowDeleteSheet(true)
}

function handleConfirmDelete(mode: 'release-besoins' | 'delete-all') {
  if (!livraisonToDelete) return
  deleteLivraison.mutate(
    {
      livraisonId: livraisonToDelete.id,
      chantierId,
      mode,
      linkedBesoinIds: deleteLinkedBesoins.map((b) => b.id),
      bcFileUrl: livraisonToDelete.bc_file_url,
      blFileUrl: livraisonToDelete.bl_file_url,
    },
    {
      onSuccess: () => {
        setShowDeleteSheet(false)
        setLivraisonToDelete(null)
        setDeleteLinkedBesoins([])
        toast('Livraison supprimée')
      },
      onError: () => toast.error('Erreur lors de la suppression'),
    },
  )
}
```

**Nouvelles valeurs retournées :**
```typescript
return {
  // ... existants ...
  // Suppression
  livraisonToDelete,
  deleteLinkedBesoins,
  showDeleteSheet,
  setShowDeleteSheet,
  handleDeleteLivraison,
  handleConfirmDelete,
  deleteLivraisonPending: deleteLivraison.isPending,
}
```

### LivraisonSheets — Sheet de suppression

**4ème Sheet ajouté :**
```tsx
{/* Sheet suppression */}
<Sheet open={actions.showDeleteSheet} onOpenChange={actions.setShowDeleteSheet}>
  <SheetContent side="bottom">
    <SheetHeader>
      <SheetTitle>
        {actions.deleteLinkedBesoins.length > 0
          ? 'Supprimer la livraison'
          : 'Supprimer cette livraison ?'}
      </SheetTitle>
      <SheetDescription>
        {actions.livraisonToDelete?.description}
      </SheetDescription>
    </SheetHeader>
    <div className="px-4 flex flex-col gap-3">
      {actions.deleteLinkedBesoins.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground">
            Cette livraison a {actions.deleteLinkedBesoins.length} besoin{actions.deleteLinkedBesoins.length > 1 ? 's' : ''} rattaché{actions.deleteLinkedBesoins.length > 1 ? 's' : ''} :
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 pl-4">
            {actions.deleteLinkedBesoins.map((b) => (
              <li key={b.id} className="truncate">• {b.description}</li>
            ))}
          </ul>
        </>
      )}
    </div>
    <SheetFooter className="flex-col gap-2 sm:flex-col">
      {actions.deleteLinkedBesoins.length > 0 ? (
        <>
          <Button
            variant="outline"
            onClick={() => actions.handleConfirmDelete('release-besoins')}
            disabled={actions.deleteLivraisonPending}
            className="w-full"
          >
            Repasser en besoins
          </Button>
          <Button
            variant="destructive"
            onClick={() => actions.handleConfirmDelete('delete-all')}
            disabled={actions.deleteLivraisonPending}
            className="w-full"
          >
            Supprimer définitivement
          </Button>
        </>
      ) : (
        <Button
          variant="destructive"
          onClick={() => actions.handleConfirmDelete('release-besoins')}
          disabled={actions.deleteLivraisonPending}
          className="w-full"
        >
          Supprimer
        </Button>
      )}
    </SheetFooter>
  </SheetContent>
</Sheet>
```

**Points clés UI :**
- Le mode `release-besoins` est utilisé pour les deux cas : avec besoins (bouton "Repasser en besoins") et sans besoins (bouton "Supprimer" simple). Quand il n'y a pas de besoins, le FK SET NULL n'a aucun effet.
- Les deux boutons sont empilés verticalement (`flex-col`) pour confort mobile
- "Repasser en besoins" en `variant="outline"` (action moins destructive)
- "Supprimer définitivement" en `variant="destructive"` (action irréversible)

### Routes livraisons — Connecter la suppression

**LivraisonsList.tsx :**
```typescript
interface LivraisonsListProps {
  // ... existantes ...
  onDelete?: (livraison: Livraison, linkedBesoins: Besoin[]) => void
}
```
Passer `onDelete` à chaque `<DeliveryCard onDelete={onDelete} />`

**chantiers/$chantierId/livraisons.tsx :**
- `useLivraisonActions` retourne `handleDeleteLivraison` — passer à `<LivraisonsList onDelete={actions.handleDeleteLivraison} />`
- `<LivraisonSheets actions={actions} />` affiche automatiquement le nouveau Sheet suppression

**livraisons.tsx (vue globale) — État inline :**
```typescript
// Suppression inline
const deleteLivraison = useDeleteLivraison()
const [livraisonToDelete, setLivraisonToDelete] = useState<Livraison | null>(null)
const [deleteLinkedBesoins, setDeleteLinkedBesoins] = useState<Besoin[]>([])
const [showDeleteSheet, setShowDeleteSheet] = useState(false)

function handleDeleteLivraison(livraison: Livraison, linkedBesoins: Besoin[]) {
  setLivraisonToDelete(livraison)
  setDeleteLinkedBesoins(linkedBesoins)
  setShowDeleteSheet(true)
}

function handleConfirmDelete(mode: 'release-besoins' | 'delete-all') {
  if (!livraisonToDelete) return
  deleteLivraison.mutate(
    {
      livraisonId: livraisonToDelete.id,
      chantierId: livraisonToDelete.chantier_id, // chantierId vient de la livraison
      mode,
      linkedBesoinIds: deleteLinkedBesoins.map((b) => b.id),
      bcFileUrl: livraisonToDelete.bc_file_url,
      blFileUrl: livraisonToDelete.bl_file_url,
    },
    {
      onSuccess: () => {
        setShowDeleteSheet(false)
        setLivraisonToDelete(null)
        setDeleteLinkedBesoins([])
        toast('Livraison supprimée')
      },
      onError: () => toast.error('Erreur lors de la suppression'),
    },
  )
}
```
**ATTENTION** : `chantierId` vient de `livraisonToDelete.chantier_id` (pas d'un param route). Même pattern que l'édition inline existante.

### ActivityFeed — Nouveau event type

```typescript
case 'livraison_deleted':
  return <Trash2 className="h-5 w-5 text-[#EF4444]" />
```

Et dans `getEventLabel` (ou l'équivalent dans le composant) :
```typescript
case 'livraison_deleted':
  return 'a supprimé une livraison'
```

### Schéma DB — Aucune modification de table

Tables existantes utilisées sans modification :
- `livraisons` : DELETE filtré par `status IN ('commande', 'prevu')`
- `besoins` : DELETE par IDs (mode `delete-all`) OU FK SET NULL automatique (mode `release-besoins`)
- `activity_logs` : INSERT via trigger (nouveau event type `livraison_deleted`)

**Storage bucket `documents` :**
- Fichiers à supprimer : `bc_file_url` et `bl_file_url` de la livraison
- Pattern existant dans `useReplaceLivraisonDocument` : `.storage.from('documents').remove([url]).catch(() => {})`

### Project Structure Notes

**Nouveaux fichiers (3) :**
- `supabase/migrations/023_livraison_delete.sql`
- `src/lib/mutations/useDeleteLivraison.ts`
- `src/lib/mutations/useDeleteLivraison.test.ts`

**Fichiers modifiés (~8) :**
- `src/types/database.ts` — `'livraison_deleted'` dans ActivityEventType
- `src/components/DeliveryCard.tsx` — prop `onDelete`, "Supprimer" dans DropdownMenu
- `src/components/DeliveryCard.test.tsx` — tests suppression
- `src/components/LivraisonSheets.tsx` — 4ème Sheet (confirmation suppression)
- `src/components/LivraisonsList.tsx` — prop `onDelete` propagée
- `src/lib/hooks/useLivraisonActions.ts` — états + handlers suppression
- `src/components/ActivityFeed.tsx` — mapping `livraison_deleted`
- `src/routes/_authenticated/chantiers/$chantierId/livraisons.tsx` — passer `onDelete`
- `src/routes/_authenticated/livraisons.tsx` — état suppression inline + Sheet

**Fichiers NON touchés (ne pas modifier) :**
- `src/lib/mutations/useCreateLivraison.ts` — création, inchangée
- `src/lib/mutations/useUpdateLivraison.ts` — édition, inchangée
- `src/lib/mutations/useUpdateLivraisonStatus.ts` — cycle de vie, inchangé
- `src/lib/mutations/useCreateGroupedLivraison.ts` — commande groupée, inchangée
- `src/lib/mutations/useTransformBesoinToLivraison.ts` — transformation besoin, inchangée
- `src/lib/mutations/useUploadLivraisonDocument.ts` — upload BC/BL, inchangé
- `src/lib/mutations/useReplaceLivraisonDocument.ts` — remplacement BC/BL, inchangé
- `src/lib/queries/useLivraisons.ts` — select inchangé
- `src/lib/queries/useAllLivraisons.ts` — idem
- `src/lib/queries/useBesoins.ts` — filtre `livraison_id IS NULL` fait réapparaître les besoins relâchés automatiquement
- `src/lib/subscriptions/` — toutes les subscriptions existantes suffisent (écoutent déjà DELETE)
- `src/components/BesoinsList.tsx` — pas impacté par la suppression de livraison
- `src/routes/_authenticated/chantiers/$chantierId/besoins.tsx` — pas modifié, les besoins relâchés apparaissent via useBesoins
- `src/routes/_authenticated/chantiers/$chantierId/index.tsx` — pas modifié, même raison

### Tests — Stratégie

**useDeleteLivraison.test.ts (5 tests) :**
- Mode `release-besoins` : supprime livraison sans toucher aux besoins
- Mode `delete-all` : supprime besoins PUIS livraison
- Nettoyage fichiers storage quand BC et/ou BL existent
- Pas de nettoyage storage quand aucun fichier
- Invalide les 7 query keys nécessaires

**DeliveryCard.test.tsx (4 tests ajoutés) :**
- Affiche "Supprimer" dans le DropdownMenu quand `onDelete` fourni et status !== 'livre'
- Pas de "Supprimer" quand status === 'livre'
- Cliquer "Supprimer" appelle `onDelete` avec la livraison ET linkedBesoins
- Séparateur visible quand onEdit ET onDelete présents

**Mock patterns :**
```typescript
// Mock useDeleteLivraison
vi.mock('@/lib/mutations/useDeleteLivraison', () => ({
  useDeleteLivraison: () => ({
    mutate: vi.fn((_input, opts) => opts?.onSuccess?.()),
    isPending: false,
  }),
}))

// Mock Supabase chainable pour useDeleteLivraison
// Étape 1 (besoins delete, conditionnel) :
const mockBesoinDelete = vi.fn().mockReturnValue({
  in: vi.fn().mockResolvedValue({ error: null }),
})
// Étape 2 (livraison delete) :
const mockLivraisonIn = vi.fn().mockResolvedValue({ error: null })
const mockLivraisonEq = vi.fn().mockReturnValue({ in: mockLivraisonIn })
const mockLivraisonDelete = vi.fn().mockReturnValue({ eq: mockLivraisonEq })
// Étape 3 (storage) :
const mockStorageRemove = vi.fn().mockResolvedValue({})

vi.mocked(supabase.from).mockImplementation((table: string) => {
  if (table === 'besoins') return { delete: mockBesoinDelete } as any
  if (table === 'livraisons') return { delete: mockLivraisonDelete } as any
  return {} as any
})
vi.mocked(supabase.storage.from).mockReturnValue({
  remove: mockStorageRemove,
} as any)
```

### Prérequis et dépendances

- **Migration SQL** : `023_livraison_delete.sql` — enum + trigger UPDATE
- **Aucune dépendance npm** à ajouter — tout est déjà installé
- **Composants shadcn** : DropdownMenu, DropdownMenuSeparator, Sheet — tous déjà installés
- **Stories 6.1-6.8** : `done` — cycle complet besoins/livraisons incluant édition et commande groupée
- **Subscriptions** : DÉJÀ en place pour DELETE sur livraisons — aucun changement nécessaire
- **FK ON DELETE SET NULL** : DÉJÀ défini dans `016_besoins_livraisons.sql` — le mode "repasser en besoins" est garanti

### Risques et points d'attention

1. **Ordre de suppression (mode delete-all)** : CRITIQUE. Les besoins DOIVENT être supprimés AVANT la livraison. Si la livraison est supprimée en premier, la FK SET NULL remet les besoins en attente (ils ne sont plus supprimables par `livraison_id` car il est devenu null). Cependant, on a les IDs des besoins, donc même après SET NULL, on peut les supprimer par ID. Mais pour éviter un état intermédiaire transitoire (besoins brièvement en attente), supprimer les besoins en premier est plus propre.

2. **Garde serveur `.in('status', ['commande', 'prevu'])`** : Si la livraison a été marquée `livre` entre le clic "Supprimer" et la confirmation, la mutation ne supprimera pas la livraison (0 rows). L'erreur Supabase ne sera pas levée (DELETE avec 0 rows n'est pas une erreur PostgREST). Côté client, l'optimistic update aura retiré la carte, mais l'invalidation dans onSettled la remettra. Le toast "Livraison supprimée" s'affichera quand même — accepté pour 2-3 utilisateurs, la probabilité est quasi nulle.

3. **Vue globale livraisons (livraisons.tsx)** : Cette vue n'utilise PAS `useLivraisonActions` (état inline). La logique de suppression doit être dupliquée en inline, même pattern que l'édition existante. Le `chantierId` vient de `livraison.chantier_id`, pas d'un paramètre de route.

4. **Nettoyage storage non-bloquant** : Si la suppression des fichiers échoue, les fichiers restent orphelins dans le bucket `documents`. Acceptable — aucun impact fonctionnel. Un nettoyage batch futur pourrait les retirer. Pattern identique à `useReplaceLivraisonDocument`.

5. **Trigger besoin sur SET NULL** : Vérifié — le trigger `trg_besoin_activity` ne logge PAS d'activité quand `livraison_id` passe de non-null à null (la condition `besoin_ordered` ne matche que null→valeur). Aucun log parasite.

6. **Accordéon besoins dans le Sheet de suppression** : Le Sheet affiche la liste des besoins rattachés pour que l'utilisateur puisse prendre une décision éclairée. Les besoins sont déjà disponibles via le `linkedBesoins` passé au handler `onDelete`.

7. **Pre-existing issues** : Mêmes que stories précédentes — failures pré-existants (pwa-config, hasPointerCapture, placeholderData queries), lint error ThemeProvider.tsx:64.

### Learnings des stories précédentes (relevants)

**Story 6.8 (commande groupée) :**
- `linkedBesoins` prop sur DeliveryCard — DÉJÀ en place, utilisé pour l'accordéon et maintenant pour le choix delete
- `besoinsMap` pattern dans LivraisonsList + routes — DÉJÀ en place
- Pattern mutation batch (2-step) — réutilisé pour delete-all (delete besoins + delete livraison)

**Story 6.7 (fournisseur + édition) :**
- DropdownMenu conditionnel sur DeliveryCard — DÉJÀ en place, on ajoute "Supprimer" au menu existant
- Pattern état inline dans livraisons.tsx (vue globale) — réutilisé pour la suppression
- `useLivraisonActions` comme hub centralisé — étendre plutôt que dupliquer

**Story 6.6 (édition + suppression besoins) :**
- Pattern `useDeleteBesoin` : delete avec optimistic + rollback + invalidation — modèle direct pour `useDeleteLivraison`
- DropdownMenuItem destructive (Trash2, text-destructive) — même style réutilisé
- Props optionnelles + DropdownMenu conditionnel — même pattern (rétrocompatible)

**Story 6.3 (documents BC/BL) :**
- `useReplaceLivraisonDocument` : pattern suppression fichier storage — `supabase.storage.from('documents').remove([url]).catch(() => {})`
- Bucket name : `documents`
- Colonnes : `bc_file_url`, `bc_file_name`, `bl_file_url`, `bl_file_name`

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 6.9, FR84 (supprimer livraison avec choix repasser en besoins), FR85 (suppression fichiers BC/BL)]
- [Source: _bmad-output/planning-artifacts/architecture.md — Pattern mutations optimistes, Supabase Client SDK, TanStack Query, Supabase Storage]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Confirmations actions destructives, zones tactiles 48px+]
- [Source: _bmad-output/implementation-artifacts/6-8-commande-groupee-de-besoins.md — linkedBesoins prop, besoinsMap, pattern batch mutation]
- [Source: _bmad-output/implementation-artifacts/6-7-fournisseur-et-edition-des-livraisons.md — DropdownMenu DeliveryCard, useLivraisonActions, état inline vue globale]
- [Source: src/components/DeliveryCard.tsx — Composant existant (~202 lignes), DropdownMenu avec "Modifier"]
- [Source: src/components/LivraisonSheets.tsx — Sheets existants : création + date prévue + édition]
- [Source: src/components/LivraisonsList.tsx — Liste DeliveryCards (~64 lignes), props onEdit + besoinsMap]
- [Source: src/lib/hooks/useLivraisonActions.ts — Hook partagé (~166 lignes) : state + handlers]
- [Source: src/lib/mutations/useDeleteBesoin.ts — Pattern delete mutation avec optimistic]
- [Source: src/lib/mutations/useReplaceLivraisonDocument.ts — Pattern suppression fichier storage]
- [Source: src/lib/queries/useBesoins.ts — Filtre `livraison_id IS NULL`, key: `['besoins', chantierId]`]
- [Source: src/lib/queries/useLivraisons.ts — key: `['livraisons', chantierId]`]
- [Source: src/lib/queries/useAllLivraisons.ts — key: `['all-livraisons']`, join chantiers(nom)]
- [Source: src/types/database.ts — Interfaces Livraison et Besoin]
- [Source: supabase/migrations/016_besoins_livraisons.sql — FK besoins.livraison_id ON DELETE SET NULL]
- [Source: supabase/migrations/022_livraison_fournisseur_edit.sql — Trigger log_livraison_activity (INSERT + UPDATE)]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- DeliveryCard.test.tsx separator test: `container.querySelector('[role="separator"]')` échouait car DropdownMenuSeparator est rendu dans un portal. Fix: `screen.getByRole('separator')`.

### Completion Notes List

- Task 1: Migration SQL `023_livraison_delete.sql` créée — enum `livraison_deleted` + trigger function avec bloc DELETE + DROP/CREATE trigger incluant DELETE
- Task 2: `'livraison_deleted'` ajouté au type union `ActivityEventType` dans `database.ts`
- Task 3: `useDeleteLivraison` mutation hook — 2 modes (release-besoins / delete-all), garde serveur `.in('status', ['commande', 'prevu'])`, nettoyage storage non-bloquant, optimistic update + 7 query invalidations. 5 tests passing.
- Task 4: DeliveryCard — prop `onDelete`, "Supprimer" dans DropdownMenu avec Trash2 + text-destructive, DropdownMenuSeparator conditionnel. 4 nouveaux tests (40/40 total).
- Task 5: `useLivraisonActions` étendu avec `useDeleteLivraison`, 3 états suppression, handlers `handleDeleteLivraison` + `handleConfirmDelete`
- Task 6: LivraisonSheets — 4ème Sheet de suppression avec UI conditionnelle (2 boutons si besoins rattachés, 1 sinon), boutons disabled si pending
- Task 7: LivraisonsList prop `onDelete` propagée aux DeliveryCards. Route chantier/livraisons passe `onDelete` via actions.
- Task 8: Route livraisons globale — état suppression inline (même pattern que édition), Sheet de suppression dupliqué, `onDelete` passé aux DeliveryCards
- Task 9: ActivityFeed — mapping `livraison_deleted` → Trash2 rouge + "a supprimé une livraison"
- Task 10: 0 erreurs lint, 0 erreurs tsc. Tests story 6.9: 45/45 passing. Failures pré-existantes (hasPointerCapture, placeholderData) non liées.

### File List

**Nouveaux fichiers (3):**
- `supabase/migrations/023_livraison_delete.sql`
- `src/lib/mutations/useDeleteLivraison.ts`
- `src/lib/mutations/useDeleteLivraison.test.ts`

**Fichiers modifiés (9):**
- `src/types/database.ts`
- `src/components/DeliveryCard.tsx`
- `src/components/DeliveryCard.test.tsx`
- `src/components/LivraisonSheets.tsx`
- `src/components/LivraisonsList.tsx`
- `src/lib/hooks/useLivraisonActions.ts`
- `src/components/ActivityFeed.tsx`
- `src/routes/_authenticated/chantiers/$chantierId/livraisons.tsx`
- `src/routes/_authenticated/livraisons.tsx`

### Change Log

- 2026-02-13: Story 6.9 implémentée — suppression de livraisons avec gestion intelligente des besoins rattachés (mode release-besoins / delete-all), nettoyage fichiers BC/BL, UI conditionnelle, event activité livraison_deleted
