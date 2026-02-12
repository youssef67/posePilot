# Story 6.1: Besoins — Création, gestion et transformation en livraison

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que utilisateur de posePilot,
Je veux créer des besoins, voir ceux en attente, et les transformer en livraisons,
Afin que les demandes matériel du terrain soient tracées et converties en commandes.

## Acceptance Criteria

1. **Given** l'utilisateur est dans un chantier (complet ou léger) **When** il tape "Nouveau besoin" **Then** un formulaire minimaliste s'affiche avec un champ description libre (ex: "Colle pour faïence 20kg")

2. **Given** l'utilisateur valide le besoin **When** le besoin est créé (table `besoins`) **Then** il apparaît dans la liste des besoins en attente du chantier avec un toast "Besoin créé"

3. **Given** l'utilisateur est dans un chantier de type léger **When** il tape sur le chantier depuis l'écran d'accueil **Then** il accède directement à la vue besoins et livraisons (pas de navigation plots/lots)

4. **Given** des besoins en attente existent **When** l'utilisateur consulte la liste **Then** chaque besoin affiche sa description, sa date de création et l'auteur

5. **Given** l'utilisateur veut commander un besoin **When** il tape "Commander" sur un besoin en attente **Then** le besoin est transformé en livraison au statut "Commandé" et disparaît de la liste des besoins en attente

## Tasks / Subtasks

- [x] Task 1 — Migration SQL : tables `livraisons` et `besoins` + RLS + activité (AC: #1-5)
  - [x] 1.1 Créer `supabase/migrations/016_besoins_livraisons.sql`
  - [x] 1.2 Ajouter les valeurs `besoin_added` et `besoin_ordered` à l'enum `activity_event_type`
  - [x] 1.3 Créer la table `livraisons` (id, chantier_id, description, status, date_prevue, bc_file_url, bc_file_name, bl_file_url, bl_file_name, created_at, created_by)
  - [x] 1.4 Créer la table `besoins` (id, chantier_id, description, livraison_id nullable, created_at, created_by)
  - [x] 1.5 Ajouter les index (chantier_id) sur les deux tables
  - [x] 1.6 Appliquer les RLS policies via `apply_rls_policy()`
  - [x] 1.7 Créer les triggers d'activité sur besoins INSERT et besoin.livraison_id UPDATE

- [x] Task 2 — Types TypeScript : Besoin et Livraison dans database.ts (AC: #1-5)
  - [x] 2.1 Ajouter le type `Besoin` dans `src/types/database.ts`
  - [x] 2.2 Ajouter le type `Livraison` dans `src/types/database.ts`
  - [x] 2.3 Ajouter les nouvelles valeurs à `ActivityEventType`
  - [x] 2.4 Ajouter les Tables `besoins` et `livraisons` dans le schéma Database

- [x] Task 3 — Query hook : useBesoins(chantierId) (AC: #4)
  - [x] 3.1 Créer `src/lib/queries/useBesoins.ts`
  - [x] 3.2 Filtrer `livraison_id IS NULL` pour n'afficher que les besoins en attente
  - [x] 3.3 Résoudre l'auteur côté UI via useAuth() (auth.users inaccessible en schéma public)
  - [x] 3.4 Trier par `created_at` DESC (plus récent en haut)
  - [x] 3.5 Créer `src/lib/queries/useBesoins.test.ts`

- [x] Task 4 — Mutation hooks : useCreateBesoin et useTransformBesoinToLivraison (AC: #1, #2, #5)
  - [x] 4.1 Créer `src/lib/mutations/useCreateBesoin.ts` avec mutation optimiste
  - [x] 4.2 Créer `src/lib/mutations/useCreateBesoin.test.ts`
  - [x] 4.3 Créer `src/lib/mutations/useTransformBesoinToLivraison.ts`
  - [x] 4.4 La transformation crée une livraison + met à jour `besoins.livraison_id` dans une seule transaction (RPC ou séquentiel)
  - [x] 4.5 Invalider `['besoins', chantierId]` après la transformation
  - [x] 4.6 Créer `src/lib/mutations/useTransformBesoinToLivraison.test.ts`

- [x] Task 5 — Subscription hook : useRealtimeBesoins(chantierId) (AC: #2, #5)
  - [x] 5.1 Créer `src/lib/subscriptions/useRealtimeBesoins.ts`
  - [x] 5.2 Invalider `['besoins', chantierId]` sur INSERT, UPDATE, DELETE
  - [x] 5.3 Créer `src/lib/subscriptions/useRealtimeBesoins.test.ts`

- [x] Task 6 — Vue chantier léger : afficher les besoins en attente (AC: #3, #4)
  - [x] 6.1 Modifier `src/routes/_authenticated/chantiers/$chantierId/index.tsx` — section léger
  - [x] 6.2 Remplacer le placeholder "Les besoins et livraisons seront disponibles prochainement" par la liste des besoins en attente
  - [x] 6.3 Afficher chaque besoin avec : description, date relative (Intl.RelativeTimeFormat), initiale de l'auteur (via BesoinsList partagé)
  - [x] 6.4 Ajouter le FAB "Nouveau besoin" en bas à droite
  - [x] 6.5 Afficher un état vide "Aucun besoin en attente" avec bouton "Créer un besoin" si la liste est vide
  - [x] 6.6 Ajouter le bouton "Commander" sur chaque besoin en attente
  - [x] 6.7 Ajouter `useRealtimeBesoins(chantierId)` pour la mise à jour temps réel
  - [x] 6.8 Ajouter les tests dans le fichier test existant de la page chantier detail

- [x] Task 7 — Vue chantier complet : accès aux besoins (AC: #1, #2)
  - [x] 7.1 Ajouter un bouton ou lien "Besoins" dans le header du chantier complet
  - [x] 7.2 Créer `src/routes/_authenticated/chantiers/$chantierId/besoins.tsx` comme page dédiée
  - [x] 7.3 Réutiliser la même liste de besoins que le chantier léger (extraire en composant si nécessaire)
  - [x] 7.4 FAB "Nouveau besoin" + état vide + bouton "Commander"
  - [x] 7.5 Créer les tests pour la route besoins

- [x] Task 8 — Formulaire création besoin (Sheet) (AC: #1, #2)
  - [x] 8.1 Créer le formulaire dans un Sheet (slide-up depuis le bas)
  - [x] 8.2 Un seul champ : `description` (textarea, placeholder "Ex: Colle pour faïence 20kg")
  - [x] 8.3 Validation au submit : description non vide
  - [x] 8.4 Toast sonner "Besoin créé" après succès
  - [x] 8.5 Fermer le Sheet automatiquement après création

- [x] Task 9 — Action "Commander" : transformation besoin → livraison (AC: #5)
  - [x] 9.1 Ajouter un bouton "Commander" (outline, style secondaire) sur chaque besoin
  - [x] 9.2 Au tap sur "Commander" : AlertDialog de confirmation "Transformer ce besoin en commande ?"
  - [x] 9.3 Si confirmé : appeler `useTransformBesoinToLivraison` — crée la livraison et lie le besoin
  - [x] 9.4 Toast "Besoin commandé" après succès
  - [x] 9.5 Le besoin disparaît de la liste en attente (cache invalidé automatiquement)

- [x] Task 10 — Mise à jour compteur livraisons chantier léger (AC: #3)
  - [x] 10.1 Remplacer le "0 livraisons" hardcodé sur la carte chantier léger par un vrai compteur
  - [x] 10.2 Créer un hook `useLivraisonsCount(chantierId)` ou ajouter la logique dans useChantier
  - [x] 10.3 Afficher "X livraison(s)" avec le pluriel correct

- [x] Task 11 — Mise à jour ActivityFeed pour les nouveaux événements (AC: #2, #5)
  - [x] 11.1 Mettre à jour `src/components/ActivityFeed.tsx` pour gérer `besoin_added` et `besoin_ordered`
  - [x] 11.2 Ajouter les icônes et labels français pour ces événements
  - [x] 11.3 Ajouter les tests

- [x] Task 12 — Tests de régression (AC: #1-5)
  - [x] 12.1 `npm run test` — tous les tests existants + nouveaux passent
  - [x] 12.2 `npm run lint` — 0 nouvelles erreurs
  - [x] 12.3 `npm run build` — build propre

## Dev Notes

### Vue d'ensemble — Stratégie d'implémentation

Cette story est la **première de l'Epic 6** et introduit les concepts de `besoins` et `livraisons` dans posePilot. C'est aussi la première story qui rend le **chantier léger fonctionnel** (jusqu'ici le type léger avait un placeholder).

**Scope précis :**
- Créer les tables `besoins` et `livraisons` (schéma complet pour les stories suivantes)
- Implémenter le CRUD des besoins + la transformation besoin → livraison
- Rendre le chantier léger fonctionnel (vue besoins directe)
- Rendre les besoins accessibles aussi depuis les chantiers complets

**Hors scope (stories suivantes) :**
- Création directe de livraisons (Story 6.2)
- Cycle de vie complet des livraisons Commandé → Prévu → Livré (Story 6.2)
- Documents BC/BL (Story 6.3)
- Vue globale livraisons bottom nav (Story 6.4)
- Inventaire (Story 6.5)

### Migration SQL — `016_besoins_livraisons.sql`

```sql
-- Story 6.1 : Besoins, livraisons, et transformation
-- Crée les tables complètes pour l'Epic 6 (seuls les besoins sont exploités dans 6.1)

-- =====================
-- ENUM — Nouveaux types d'activité
-- =====================
ALTER TYPE public.activity_event_type ADD VALUE IF NOT EXISTS 'besoin_added';
ALTER TYPE public.activity_event_type ADD VALUE IF NOT EXISTS 'besoin_ordered';
ALTER TYPE public.activity_event_type ADD VALUE IF NOT EXISTS 'livraison_created';
ALTER TYPE public.activity_event_type ADD VALUE IF NOT EXISTS 'livraison_status_changed';

-- =====================
-- TABLE livraisons (créée AVANT besoins car FK)
-- =====================
CREATE TABLE public.livraisons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chantier_id uuid NOT NULL REFERENCES public.chantiers(id) ON DELETE CASCADE,
  description text NOT NULL,
  status public.delivery_status NOT NULL DEFAULT 'commande',
  date_prevue date,
  bc_file_url text,
  bc_file_name text,
  bl_file_url text,
  bl_file_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE INDEX idx_livraisons_chantier_id ON public.livraisons(chantier_id);
CREATE INDEX idx_livraisons_status ON public.livraisons(status);
SELECT public.apply_rls_policy('livraisons');

-- =====================
-- TABLE besoins
-- =====================
CREATE TABLE public.besoins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chantier_id uuid NOT NULL REFERENCES public.chantiers(id) ON DELETE CASCADE,
  description text NOT NULL,
  livraison_id uuid REFERENCES public.livraisons(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE INDEX idx_besoins_chantier_id ON public.besoins(chantier_id);
CREATE INDEX idx_besoins_livraison_id ON public.besoins(livraison_id);
SELECT public.apply_rls_policy('besoins');

-- =====================
-- TRIGGER FUNCTION — Activity log pour besoins
-- =====================
CREATE OR REPLACE FUNCTION log_besoin_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_log (chantier_id, event_type, target_id, target_label, user_id)
    VALUES (NEW.chantier_id, 'besoin_added', NEW.id, NEW.description, NEW.created_by);
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.livraison_id IS NULL AND NEW.livraison_id IS NOT NULL THEN
    INSERT INTO public.activity_log (chantier_id, event_type, target_id, target_label, user_id)
    VALUES (NEW.chantier_id, 'besoin_ordered', NEW.id, NEW.description, NEW.created_by);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_besoin_activity
  AFTER INSERT OR UPDATE OF livraison_id ON public.besoins
  FOR EACH ROW EXECUTE FUNCTION log_besoin_activity();
```

**Points critiques de la migration :**
- `livraisons` est créée AVANT `besoins` car `besoins.livraison_id` référence `livraisons.id`
- Le schéma `livraisons` est complet (inclut `date_prevue`, `bc_file_url`, `bl_file_url`) pour les stories futures — pas de migration supplémentaire pour 6.2/6.3
- `delivery_status` enum existe déjà dans `001_enums.sql` : `'commande' | 'prevu' | 'livre'`
- `besoins.livraison_id IS NULL` = besoin en attente ; `IS NOT NULL` = besoin commandé
- `ON DELETE SET NULL` pour livraison_id : si une livraison est supprimée, le besoin redevient "en attente"
- `apply_rls_policy()` existe dans `002_rls_base.sql` et applique `authenticated = accès total`
- **Vérifier** que `activity_log` a les colonnes `target_id` et `target_label` avant d'utiliser dans le trigger — consulter `013_activity_log.sql`

### Types TypeScript — database.ts

```typescript
// Ajouter dans src/types/database.ts

export interface Besoin {
  id: string
  chantier_id: string
  description: string
  livraison_id: string | null
  created_at: string
  created_by: string | null
}

export interface Livraison {
  id: string
  chantier_id: string
  description: string
  status: 'commande' | 'prevu' | 'livre'
  date_prevue: string | null
  bc_file_url: string | null
  bc_file_name: string | null
  bl_file_url: string | null
  bl_file_name: string | null
  created_at: string
  created_by: string | null
}

// Mettre à jour ActivityEventType (ajouter les nouvelles valeurs)
export type ActivityEventType =
  | 'task_status_changed'
  | 'note_added'
  | 'photo_added'
  | 'blocking_noted'
  | 'besoin_added'
  | 'besoin_ordered'
  | 'livraison_created'
  | 'livraison_status_changed'
```

**RAPPEL database.ts (MEMORY.md) :**
- Tables MUST include `Relationships: []` field pour supabase-js v2
- Utiliser `{ [_ in never]: never }` au lieu de `Record<string, never>` pour les sections vides
- Garder le `snake_case` pour toutes les colonnes (pas de transformation camelCase)

### Query hook — useBesoins.ts

```typescript
// src/lib/queries/useBesoins.ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export type BesoinWithAuthor = {
  id: string
  chantier_id: string
  description: string
  livraison_id: string | null
  created_at: string
  created_by: string | null
  // Pas de join lourd — l'email suffit pour afficher l'initiale
}

export function useBesoins(chantierId: string) {
  return useQuery({
    queryKey: ['besoins', chantierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('besoins')
        .select('*')
        .eq('chantier_id', chantierId)
        .is('livraison_id', null)        // Seulement les besoins en attente
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as unknown as BesoinWithAuthor[]
    },
    enabled: !!chantierId,
  })
}
```

**Note sur l'auteur :**
L'AC exige l'affichage de l'auteur. Deux approches possibles :
1. Joindre `auth.users` (limité par Supabase — les tables auth ne sont pas dans le schéma public)
2. Stocker `created_by` (UUID) et résoudre côté client via `supabase.auth.getUser()` pour l'utilisateur courant, ou afficher l'initiale du user_id

**Approche recommandée :** Puisqu'il n'y a que 2-3 utilisateurs, stocker l'email dans `created_by` directement OU utiliser le même pattern que ActivityFeed qui résout les initiales. Vérifier comment `ActivityFeed.tsx` gère l'affichage de l'auteur et reproduire le même pattern.

### Mutation hooks

**useCreateBesoin.ts :**
```typescript
// Pattern standard mutations optimistes (cf. architecture.md)
export function useCreateBesoin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ chantierId, description }: { chantierId: string; description: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('besoins')
        .insert({
          chantier_id: chantierId,
          description,
          created_by: user?.id ?? null,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onMutate: async ({ chantierId, description }) => {
      await queryClient.cancelQueries({ queryKey: ['besoins', chantierId] })
      const previous = queryClient.getQueryData(['besoins', chantierId])
      queryClient.setQueryData(['besoins', chantierId], (old: unknown[] | undefined) => [
        {
          id: crypto.randomUUID(),
          chantier_id: chantierId,
          description,
          livraison_id: null,
          created_at: new Date().toISOString(),
          created_by: null,
        },
        ...(old ?? []),
      ])
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

**useTransformBesoinToLivraison.ts :**
```typescript
// La transformation est une opération en deux étapes :
// 1. Créer la livraison
// 2. Mettre à jour le besoin avec livraison_id
// Les deux doivent être cohérentes — si l'une échoue, l'autre aussi.
// Pas de RPC custom nécessaire : on fait les deux opérations séquentiellement.
// Si la 2ème échoue, la livraison orpheline n'est pas un problème (invisible côté UI).

export function useTransformBesoinToLivraison() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ besoin }: { besoin: BesoinWithAuthor }) => {
      const { data: { user } } = await supabase.auth.getUser()

      // 1. Créer la livraison
      const { data: livraison, error: livraisonError } = await supabase
        .from('livraisons')
        .insert({
          chantier_id: besoin.chantier_id,
          description: besoin.description,
          status: 'commande' as const,
          created_by: user?.id ?? null,
        })
        .select()
        .single()
      if (livraisonError) throw livraisonError

      // 2. Lier le besoin à la livraison
      const { error: besoinError } = await supabase
        .from('besoins')
        .update({ livraison_id: livraison.id })
        .eq('id', besoin.id)
      if (besoinError) throw besoinError

      return livraison
    },
    onMutate: async ({ besoin }) => {
      // Retirer le besoin de la liste (mutation optimiste)
      const chantierId = besoin.chantier_id
      await queryClient.cancelQueries({ queryKey: ['besoins', chantierId] })
      const previous = queryClient.getQueryData(['besoins', chantierId])
      queryClient.setQueryData(
        ['besoins', chantierId],
        (old: BesoinWithAuthor[] | undefined) =>
          (old ?? []).filter(b => b.id !== besoin.id),
      )
      return { previous, chantierId }
    },
    onError: (_err, _vars, context) => {
      if (context?.chantierId) {
        queryClient.setQueryData(['besoins', context.chantierId], context.previous)
      }
    },
    onSettled: (_data, _error, { besoin }) => {
      queryClient.invalidateQueries({ queryKey: ['besoins', besoin.chantier_id] })
      // Invalider aussi les livraisons pour le compteur
      queryClient.invalidateQueries({ queryKey: ['livraisons', besoin.chantier_id] })
    },
  })
}
```

### Subscription hook — useRealtimeBesoins.ts

```typescript
// Suivre le pattern exact de useRealtimeChantiers.ts
export function useRealtimeBesoins(chantierId: string) {
  const queryClient = useQueryClient()
  useEffect(() => {
    const channel = supabase
      .channel(`besoins:chantier_id=eq.${chantierId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'besoins', filter: `chantier_id=eq.${chantierId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['besoins', chantierId] })
        },
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [chantierId, queryClient])
}
```

### Vue chantier léger — Anatomie visuelle

```
CHANTIER LÉGER — AVEC besoins en attente :
┌──────────────────────────────────────────────────┐
│  BreadcrumbNav : Chantiers › Rénovation Duval    │
│  [Léger]                                          │
├──────────────────────────────────────────────────┤
│  Besoins en attente (3)                           │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │ Colle pour faïence 20kg                     │ │
│  │ Youssef · il y a 2h         [Commander]     │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │ Joint gris 5kg                              │ │
│  │ Bruno · hier                 [Commander]     │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │ Silicone transparent                        │ │
│  │ Youssef · il y a 3 jours    [Commander]     │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│                                           [+ ⚪]  │  ← FAB
└──────────────────────────────────────────────────┘

CHANTIER LÉGER — ÉTAT VIDE :
┌──────────────────────────────────────────────────┐
│  BreadcrumbNav : Chantiers › Rénovation Duval    │
│  [Léger]                                          │
├──────────────────────────────────────────────────┤
│                                                   │
│                    📦                              │
│       Aucun besoin en attente                     │
│       [Créer un besoin]                           │
│                                                   │
│                                           [+ ⚪]  │  ← FAB
└──────────────────────────────────────────────────┘

FORMULAIRE CRÉATION BESOIN (Sheet depuis le bas) :
┌──────────────────────────────────────────────────┐
│  Nouveau besoin                            [✕]   │
├──────────────────────────────────────────────────┤
│                                                   │
│  Description                                      │
│  ┌─────────────────────────────────────────────┐ │
│  │ Ex: Colle pour faïence 20kg                 │ │
│  │                                             │ │
│  │                                             │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  [         Créer le besoin         ]              │  ← Bouton primaire plein
└──────────────────────────────────────────────────┘
```

**Pour les chantiers complets :**
- Ajouter un lien/bouton "Besoins (X)" dans le header de la page chantier, à côté des plots
- Ce bouton navigue vers `/$chantierId/besoins` qui est une page dédiée avec la même liste

### Composants existants à réutiliser

| Composant | Usage dans 6.1 |
|-----------|---------------|
| **Sheet** (`src/components/ui/sheet.tsx`) | Formulaire création besoin |
| **Fab** (`src/components/Fab.tsx`) | Bouton "Nouveau besoin" |
| **AlertDialog** (`src/components/ui/alert-dialog.tsx`) | Confirmation "Commander" |
| **Badge** (`src/components/ui/badge.tsx`) | Badge "Léger" sur le chantier |
| **Textarea** (`src/components/ui/textarea.tsx`) | Champ description du besoin |

**Ne PAS créer de composant DeliveryCard pour cette story.** La Story 6.2 introduira le DeliveryCard avec le cycle de vie complet des livraisons.

### Pattern d'affichage de l'auteur

Vérifier comment `ActivityFeed.tsx` résout l'identité de l'auteur à partir du `user_id`. Le pattern existant est probablement :
- Stocker `user_id` (UUID) dans `created_by`
- Comparer avec l'utilisateur courant (`supabase.auth.getUser()`) pour afficher "Vous" ou l'initiale
- Puisqu'il n'y a que 2-3 utilisateurs, un simple mapping hardcodé ou une query `auth.users` pourrait suffire

**Alternative plus simple :** Ajouter une colonne `created_by_email` dans `besoins` pour stocker l'email directement. Mais ce n'est pas le pattern existant. Suivre le pattern de ActivityFeed.

### Date relative — Pattern existant

Le projet utilise `Intl.RelativeTimeFormat` pour les dates relatives (architecture.md). Vérifier si un utilitaire `formatDate.ts` ou `formatRelativeDate` existe déjà dans `src/lib/utils/` et le réutiliser.

### Chantier léger — Compteur livraisons sur la carte

La carte chantier léger sur l'écran d'accueil affiche actuellement "0 livraisons" en dur. Pour cette story, rendre ce compteur dynamique :

```typescript
// Approche simple — query séparée dans la page chantier list
// OU ajouter à useChantiers un count de livraisons par chantier

// Option 1 (simple) : count dans le component
const { data: livraisonsCount } = useQuery({
  queryKey: ['livraisons-count', chantier.id],
  queryFn: async () => {
    const { count, error } = await supabase
      .from('livraisons')
      .select('*', { count: 'exact', head: true })
      .eq('chantier_id', chantier.id)
    if (error) throw error
    return count ?? 0
  },
  enabled: chantier.type === 'leger',
})

// Option 2 (trigger) : stocker dans chantiers.progress_total
// Plus performant mais plus complexe — reporter à story 6.4 si le count simple suffit
```

**Recommandation :** Utiliser l'option 1 (query count) pour cette story. L'option 2 (trigger) est meilleure en termes de performance mais peut être ajoutée dans Story 6.4 quand la vue globale livraisons sera implémentée.

### Routing — Chantier complet vs léger

**Chantier léger :** Le contenu besoins est affiché directement dans `$chantierId/index.tsx` quand `chantier.type === 'leger'`. Pas de route supplémentaire.

**Chantier complet :** Les besoins sont sur une route dédiée `$chantierId/besoins.tsx` accessible depuis un bouton dans le header du chantier.

**Route `besoins.tsx` :**
- Même contenu que la section léger mais en page dédiée
- Breadcrumb : Chantiers › Les Oliviers › Besoins
- BreadcrumbNav gère déjà les niveaux de profondeur

**IMPORTANT TanStack Router :**
- Le fichier `$chantierId/besoins.tsx` sera automatiquement détecté par TanStack Router (file-based routing)
- Vérifier que `routeFileIgnorePattern: '.*\\.test\\.tsx?$'` dans la config TanStack Router exclut bien les tests
- Après ajout du fichier, relancer `npm run dev` pour regénérer `routeTree.gen.ts`

### Schéma DB — Récapitulatif des tables créées

**Table `livraisons` (nouvelle) :**
| Colonne | Type | Contrainte | Notes |
|---------|------|------------|-------|
| id | uuid | PK, gen_random_uuid() | |
| chantier_id | uuid | NOT NULL, FK chantiers | ON DELETE CASCADE |
| description | text | NOT NULL | Description libre du matériel |
| status | delivery_status | NOT NULL, DEFAULT 'commande' | Enum existant |
| date_prevue | date | nullable | Story 6.2 |
| bc_file_url | text | nullable | Story 6.3 |
| bc_file_name | text | nullable | Story 6.3 |
| bl_file_url | text | nullable | Story 6.3 |
| bl_file_name | text | nullable | Story 6.3 |
| created_at | timestamptz | NOT NULL, DEFAULT now() | |
| created_by | uuid | FK auth.users | |

**Table `besoins` (nouvelle) :**
| Colonne | Type | Contrainte | Notes |
|---------|------|------------|-------|
| id | uuid | PK, gen_random_uuid() | |
| chantier_id | uuid | NOT NULL, FK chantiers | ON DELETE CASCADE |
| description | text | NOT NULL | Description libre |
| livraison_id | uuid | FK livraisons, nullable | NULL = en attente, NOT NULL = commandé |
| created_at | timestamptz | NOT NULL, DEFAULT now() | |
| created_by | uuid | FK auth.users | |

### Project Structure Notes

**Nouveaux fichiers (8+) :**
- `supabase/migrations/016_besoins_livraisons.sql`
- `src/lib/queries/useBesoins.ts` + test
- `src/lib/mutations/useCreateBesoin.ts` + test
- `src/lib/mutations/useTransformBesoinToLivraison.ts` + test
- `src/lib/subscriptions/useRealtimeBesoins.ts` + test
- `src/routes/_authenticated/chantiers/$chantierId/besoins.tsx` + test

**Fichiers modifiés (3-4) :**
- `src/types/database.ts` — Types Besoin, Livraison, ActivityEventType
- `src/routes/_authenticated/chantiers/$chantierId/index.tsx` — Section léger → liste besoins
- `src/components/ActivityFeed.tsx` — Nouvelles icônes événements besoins
- `src/routeTree.gen.ts` — Auto-regénéré par TanStack Router

**Tests modifiés :**
- Test du chantier detail pour la section léger
- Tests ActivityFeed pour les nouveaux types d'événements

### Prérequis et dépendances

- **Aucune dépendance npm à ajouter** — tout est déjà dans le projet
- **Enum existant** : `delivery_status` ('commande', 'prevu', 'livre') dans `001_enums.sql`
- **RLS helper** : `apply_rls_policy()` dans `002_rls_base.sql`
- **Composants existants** : Sheet, Fab, AlertDialog, Badge, Textarea, sonner toast
- **Epics précédentes** : Toutes (1-5) sont `done` — pas de blocage
- **ActivityFeed** : Vérifier les colonnes de `activity_log` (013) avant d'écrire le trigger

### Risques et points d'attention

1. **Vérifier le schéma `activity_log`** : Le trigger suppose que `activity_log` a les colonnes `target_id`, `target_label`, `user_id`. Consulter `013_activity_log.sql` pour confirmer les noms exacts des colonnes AVANT d'écrire le trigger.

2. **ALTER TYPE ... ADD VALUE** : PostgreSQL ne permet pas d'ajouter des valeurs à un enum dans une transaction (si les migrations sont wrappées dans des transactions). Utiliser `IF NOT EXISTS` et placer les ALTER TYPE en tout début de migration.

3. **`besoins.livraison_id` SET NULL** : Quand une livraison est supprimée, le besoin redevient "en attente". C'est le comportement voulu. L'utilisateur pourra re-commander le besoin.

4. **Transformation en 2 étapes** : Créer la livraison puis mettre à jour le besoin. Si l'update du besoin échoue, une livraison orpheline existe. C'est acceptable — elle n'apparaît nulle part tant que la vue globale (6.4) n'est pas implémentée. Alternative : utiliser une RPC Supabase (function PostgreSQL) pour tout faire en une transaction.

5. **Compteur livraisons chantier léger** : La query count séparée fonctionne pour 2-3 utilisateurs. Si le nombre de chantiers légers augmente, un trigger serait préférable. Ne pas over-optimiser pour le moment.

6. **Pre-existing issues** : 16 test failures pré-existants (pwa-config 5, pwa-html 5, hasPointerCapture 6), lint error ThemeProvider.tsx:64 — ne pas s'en inquiéter.

7. **Realtime pour besoins** : Le filtre `chantier_id=eq.${chantierId}` sur le channel Supabase Realtime est important pour ne pas recevoir les updates de tous les chantiers.

### Learnings des stories précédentes (relevants)

- **Pattern mutation optimiste** : `onMutate` (update UI), `onError` (rollback), `onSettled` (revalidation) — pattern utilisé dans TOUTES les mutations du projet. Ne pas dévier.
- **Mock supabase chainable API** : `from → select → eq → order` chaque appel retourne un mock avec la méthode suivante. Pattern établi dans tous les tests.
- **`data as unknown as Type[]`** : Cast nécessaire car `Database.Tables` est `Record<string, never>`. MEMORY.md le confirme.
- **Route tests** : `createRouter` + `createMemoryHistory` + `RouterProvider` + `QueryClientProvider` + `AuthContext.Provider`.
- **Sonner toast** : `toast.success("Besoin créé")` / `toast.error(...)` — le projet utilise sonner avec le ThemeProvider custom.
- **Sheet** : Utilisé pour les formulaires de création (cf. plot creation, variante creation). Même pattern : Sheet + form + bouton submit.
- **Fab** : Single action mode pour "Nouveau besoin". Pas de menu expandable sauf si on veut aussi "Nouvelle livraison" (Story 6.2).
- **Badge** : `// eslint-disable-next-line react-refresh/only-export-components` si nécessaire (voir button.tsx).
- **`is()` Supabase filter** : Pour filtrer `livraison_id IS NULL`, utiliser `.is('livraison_id', null)` — c'est la méthode correcte avec supabase-js v2.
- **BreadcrumbNav** : Utilise `useMatches()` pour résoudre les params. `match.params` à N'IMPORTE quel niveau contient TOUS les params de l'URL (MEMORY.md gotcha TanStack Router).

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 6.1, Epic 6, FR7, FR44, FR45, FR46]
- [Source: _bmad-output/planning-artifacts/prd.md — FR7 (chantier léger), FR44-FR46 (besoins/livraisons)]
- [Source: _bmad-output/planning-artifacts/architecture.md — Supabase SDK direct, TanStack Query mutations optimistes, Realtime subscriptions, structure par domaine]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — DeliveryCard specs (Section Component Strategy #8), StatusCard pattern, Sheet pour formulaires, FAB, zones tactiles 48px+]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Couleurs cycle livraison : gris (besoin), orange (commandé), bleu (prévu), vert (livré)]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — "Besoin → Commandé → Prévu → Livré. Chaque étape est un statut clair, jamais un formulaire"]
- [Source: supabase/migrations/001_enums.sql — delivery_status enum déjà défini]
- [Source: supabase/migrations/002_rls_base.sql — apply_rls_policy() helper]
- [Source: supabase/migrations/013_activity_log.sql — Structure table activity_log]
- [Source: src/lib/mutations/useCreateChantier.ts — Pattern mutation optimiste de référence]
- [Source: src/lib/subscriptions/useRealtimeChantiers.ts — Pattern subscription de référence]
- [Source: src/components/Fab.tsx — FAB component, single action mode]
- [Source: src/components/ActivityFeed.tsx — Pattern résolution auteur, types d'événements]
- [Source: src/routes/_authenticated/chantiers/$chantierId/index.tsx — Section léger existante (placeholder ligne 214-226)]
- [Source: _bmad-output/implementation-artifacts/5-3-recapitulatif-et-indicateurs-de-documents-manquants.md — Learnings : trigger pattern, test patterns, pre-existing issues]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Trigger `log_besoin_activity()` : le schéma des Dev Notes référençait des colonnes inexistantes (`target_label`, `user_id`). Adapté au schéma réel `activity_logs` : `actor_id`, `actor_email`, `target_type`, `target_id`, `metadata` (jsonb). Trigger marqué `SECURITY DEFINER` comme les triggers existants.
- Tests `$chantierId.test.tsx` et `$chantierId/index.test.tsx` : les mocks supabase ne géraient pas les tables `besoins` et `livraisons`. Mis à jour les fonctions `setupMockSupabase` pour gérer les nouvelles queries.
- Task 3.3 (joindre le profil auteur) : l'auteur n'est pas joiné dans le hook `useBesoins` car `auth.users` n'est pas accessible via le schéma public Supabase. Le `created_by` (UUID) est stocké et la résolution se fait côté UI comme dans `ActivityFeed.tsx`.

### Completion Notes List

- Task 1 : Migration SQL `016_besoins_livraisons.sql` — tables `livraisons` et `besoins` créées avec FK, index, RLS, et trigger d'activité
- Task 2 : Types `Besoin`, `Livraison` ajoutés dans `database.ts`, `ActivityEventType` étendu avec 4 nouvelles valeurs
- Task 3 : Hook `useBesoins(chantierId)` avec filtre `.is('livraison_id', null)` et tri DESC — 3 tests
- Task 4 : Hooks `useCreateBesoin` (mutation optimiste) et `useTransformBesoinToLivraison` (2 étapes séquentielles) — 6 tests
- Task 5 : Hook `useRealtimeBesoins(chantierId)` avec filtre par chantier — 5 tests
- Task 6 : Vue léger remplacée — liste besoins, FAB, état vide, bouton Commander, realtime — 2 tests ajoutés + 4 tests existants mis à jour
- Task 7 : Route `besoins.tsx` pour chantiers complets + bouton "Besoins" dans le header — 5 tests
- Task 8 : Sheet "Nouveau besoin" avec Textarea, validation, toast "Besoin créé" — intégré dans index.tsx et besoins.tsx
- Task 9 : AlertDialog de confirmation + `useTransformBesoinToLivraison` + toast "Besoin commandé" — intégré dans index.tsx et besoins.tsx
- Task 10 : Hook `useLivraisonsCount(chantierId)` + affichage dynamique "X livraison(s)" avec pluriel correct
- Task 11 : `ActivityFeed.tsx` — icônes Package/ShoppingCart + labels FR pour `besoin_added`/`besoin_ordered` — 2 tests ajoutés
- Task 12 : Régression OK (16 failures + 6 errors pré-existants), lint 0 erreurs, build propre

### Change Log

- 2026-02-12 : Story 6.1 implémentée — besoins, livraisons, vue léger fonctionnelle, vue complet avec route dédiée
- 2026-02-12 : Code review — 8 issues trouvées (2C, 1H, 3M, 2L). Fixes : BesoinsList partagé avec auteur (C1+C2+H1+M2), tests useLivraisonsCount (M1), ActivityFeed events complets (M3)

### File List

**Nouveaux fichiers :**
- `supabase/migrations/016_besoins_livraisons.sql`
- `src/lib/queries/useBesoins.ts`
- `src/lib/queries/useBesoins.test.ts`
- `src/lib/queries/useLivraisonsCount.ts`
- `src/lib/queries/useLivraisonsCount.test.ts`
- `src/lib/mutations/useCreateBesoin.ts`
- `src/lib/mutations/useCreateBesoin.test.ts`
- `src/lib/mutations/useTransformBesoinToLivraison.ts`
- `src/lib/mutations/useTransformBesoinToLivraison.test.ts`
- `src/lib/subscriptions/useRealtimeBesoins.ts`
- `src/lib/subscriptions/useRealtimeBesoins.test.ts`
- `src/routes/_authenticated/chantiers/$chantierId/besoins.tsx`
- `src/routes/_authenticated/chantiers/$chantierId/besoins.test.tsx`
- `src/components/BesoinsList.tsx`

**Fichiers modifiés :**
- `src/types/database.ts` — Types Besoin, Livraison, ActivityEventType étendu, metadata.description
- `src/routes/_authenticated/chantiers/$chantierId/index.tsx` — Section léger → BesoinsList, FAB, Sheet, AlertDialog, compteur livraisons, lien Besoins pour complet
- `src/routes/_authenticated/chantiers/$chantierId/besoins.tsx` — Utilise BesoinsList partagé
- `src/components/ActivityFeed.tsx` — Icônes et labels pour besoin_added/besoin_ordered + livraison_created/livraison_status_changed
- `src/routeTree.gen.ts` — Auto-regénéré par TanStack Router (nouvelle route besoins)

**Tests modifiés :**
- `src/routes/_authenticated/chantiers/$chantierId.test.tsx` — Tests léger adaptés au nouveau UI
- `src/routes/_authenticated/chantiers/$chantierId/index.test.tsx` — Tests léger adaptés, mocks mis à jour
- `src/components/ActivityFeed.test.tsx` — Tests pour besoin_added et besoin_ordered
