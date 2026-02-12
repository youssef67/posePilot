# Story 6.2: Livraisons — Création directe et cycle de vie

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que utilisateur de posePilot,
Je veux créer des livraisons directement et suivre leur cycle de vie,
Afin que je suive chaque commande depuis la passation jusqu'à la réception.

## Acceptance Criteria

1. **Given** l'utilisateur est dans la section livraisons d'un chantier **When** il tape "Nouvelle livraison" **Then** un formulaire permet de saisir une description et de créer la livraison au statut "Commandé" (table `livraisons`)

2. **Given** une livraison est au statut "Commandé" **When** l'utilisateur tape "Marquer comme Prévu" **Then** le statut passe à "Prévu" et un champ date prévue s'affiche

3. **Given** l'utilisateur renseigne une date de livraison prévue **When** il valide **Then** la date est enregistrée et affichée sur la DeliveryCard

4. **Given** une livraison est au statut "Prévu" **When** l'utilisateur tape "Confirmer la livraison" **Then** le statut passe à "Livré" avec la date du jour

5. **Given** le statut d'une livraison change **When** la mutation s'effectue **Then** le changement est propagé en temps réel via Supabase Realtime aux autres utilisateurs

## Tasks / Subtasks

- [x] Task 1 — Migration SQL : trigger d'activité pour livraisons (AC: #5)
  - [x] 1.1 Créer `supabase/migrations/017_livraison_activity.sql`
  - [x] 1.2 Créer la trigger function `log_livraison_activity()` — INSERT → `livraison_created`, UPDATE status → `livraison_status_changed`
  - [x] 1.3 Créer le trigger `trg_livraison_activity` sur la table `livraisons` (AFTER INSERT OR UPDATE OF status)

- [x] Task 2 — Query hook : useLivraisons(chantierId) (AC: #1-4)
  - [x] 2.1 Créer `src/lib/queries/useLivraisons.ts`
  - [x] 2.2 Fetch toutes les livraisons d'un chantier, triées par `created_at` DESC
  - [x] 2.3 QueryKey : `['livraisons', chantierId]`
  - [x] 2.4 Créer `src/lib/queries/useLivraisons.test.ts`

- [x] Task 3 — Mutation hook : useCreateLivraison() (AC: #1)
  - [x] 3.1 Créer `src/lib/mutations/useCreateLivraison.ts`
  - [x] 3.2 Insert livraison avec `status: 'commande'`, `created_by: user.id`
  - [x] 3.3 Mutation optimiste : ajouter en tête de liste
  - [x] 3.4 Invalider `['livraisons', chantierId]` + `['livraisons-count', chantierId]`
  - [x] 3.5 Créer `src/lib/mutations/useCreateLivraison.test.ts`

- [x] Task 4 — Mutation hook : useUpdateLivraisonStatus() (AC: #2, #3, #4)
  - [x] 4.1 Créer `src/lib/mutations/useUpdateLivraisonStatus.ts`
  - [x] 4.2 Params : `{ livraisonId, chantierId, newStatus, datePrevue? }`
  - [x] 4.3 Pour `prevu` : envoyer `{ status: 'prevu', date_prevue: datePrevue }`
  - [x] 4.4 Pour `livre` : envoyer `{ status: 'livre', date_prevue: new Date().toISOString().split('T')[0] }` (date du jour auto)
  - [x] 4.5 Mutation optimiste : mettre à jour le statut et la date dans le cache
  - [x] 4.6 Invalider `['livraisons', chantierId]` + `['livraisons-count', chantierId]`
  - [x] 4.7 Créer `src/lib/mutations/useUpdateLivraisonStatus.test.ts`

- [x] Task 5 — Subscription hook : useRealtimeLivraisons(chantierId) (AC: #5)
  - [x] 5.1 Créer `src/lib/subscriptions/useRealtimeLivraisons.ts`
  - [x] 5.2 Channel : `livraisons:chantier_id=eq.${chantierId}`
  - [x] 5.3 Invalider `['livraisons', chantierId]` + `['livraisons-count', chantierId]` sur INSERT, UPDATE, DELETE
  - [x] 5.4 Créer `src/lib/subscriptions/useRealtimeLivraisons.test.ts`

- [x] Task 6 — Component : DeliveryCard (AC: #2, #3, #4)
  - [x] 6.1 Créer `src/components/DeliveryCard.tsx`
  - [x] 6.2 Props : `{ livraison: Livraison, onMarquerPrevu: (id) => void, onConfirmerLivraison: (id) => void }`
  - [x] 6.3 Barre de statut latérale : orange `#F59E0B` (commande), bleu `#3B82F6` (prevu), vert `#10B981` (livre)
  - [x] 6.4 Afficher : description, date prévue si renseignée, initiale auteur, date relative de création
  - [x] 6.5 Bouton d'action contextuel : "Marquer prévu" si commande, "Confirmer livraison" si prevu, rien si livre
  - [x] 6.6 Label statut en français : "Commandé", "Prévu", "Livré"
  - [x] 6.7 Créer `DeliveryCardSkeleton` pour l'état de chargement
  - [x] 6.8 Créer `src/components/DeliveryCard.test.tsx`

- [x] Task 7 — Component : LivraisonsList (AC: #1-4)
  - [x] 7.1 Créer `src/components/LivraisonsList.tsx` (même pattern que BesoinsList)
  - [x] 7.2 Props : `{ livraisons, isLoading, onOpenSheet, onMarquerPrevu, onConfirmerLivraison }`
  - [x] 7.3 Afficher la liste de DeliveryCards
  - [x] 7.4 État vide : icône Truck + "Aucune livraison" + bouton "Créer une livraison"
  - [x] 7.5 État chargement : 3 DeliveryCardSkeletons
  - [x] 7.6 Créer `src/components/LivraisonsList.test.tsx`

- [x] Task 8 — Vue chantier léger : intégration livraisons (AC: #1-5)
  - [x] 8.1 Modifier `src/routes/_authenticated/chantiers/$chantierId/index.tsx` — section léger
  - [x] 8.2 Ajouter `useLivraisons(chantierId)` + `useRealtimeLivraisons(chantierId)`
  - [x] 8.3 Afficher `LivraisonsList` sous la section `BesoinsList`
  - [x] 8.4 Changer le FAB en mode multi-items : `[{ icon: Package, label: "Nouveau besoin" }, { icon: Truck, label: "Nouvelle livraison" }]`
  - [x] 8.5 Ajouter Sheet "Nouvelle livraison" (Textarea description, même pattern que besoin sheet)
  - [x] 8.6 Ajouter Sheet "Marquer prévu" (Input date native `type="date"`, bouton confirmer)
  - [x] 8.7 Gérer les callbacks : `handleMarquerPrevu(id)` → ouvre sheet date, `handleConfirmerLivraison(id)` → mutation directe + toast
  - [x] 8.8 Toast feedbacks : "Livraison créée", "Livraison marquée prévu", "Livraison confirmée"
  - [x] 8.9 Mettre à jour les tests existants de la page chantier detail

- [x] Task 9 — Route chantier complet : $chantierId/livraisons.tsx (AC: #1-5)
  - [x] 9.1 Créer `src/routes/_authenticated/chantiers/$chantierId/livraisons.tsx`
  - [x] 9.2 Réutiliser LivraisonsList + même logique de création/transitions que la section léger
  - [x] 9.3 FAB "Nouvelle livraison" (single action mode)
  - [x] 9.4 Breadcrumb : Chantiers › {nom} › Livraisons
  - [x] 9.5 Ajouter un bouton "Livraisons" dans le header du chantier complet (index.tsx, à côté de "Besoins")
  - [x] 9.6 Créer `src/routes/_authenticated/chantiers/$chantierId/livraisons.test.tsx`

- [x] Task 10 — Fix invalidation livraisons-count dans mutations existantes (AC: #1)
  - [x] 10.1 Mettre à jour `useTransformBesoinToLivraison` : ajouter invalidation de `['livraisons-count', chantierId]` dans `onSettled`
  - [x] 10.2 Vérifier que `useCreateLivraison` invalide aussi `['livraisons-count', chantierId]`

- [x] Task 11 — Tests de régression (AC: #1-5)
  - [x] 11.1 `npm run test` — tous les tests existants + nouveaux passent
  - [x] 11.2 `npm run lint` — 0 nouvelles erreurs
  - [x] 11.3 `npm run build` — build propre

## Dev Notes

### Vue d'ensemble — Stratégie d'implémentation

Cette story est la **deuxième de l'Epic 6** et rend les livraisons pleinement fonctionnelles. Story 6.1 a créé les tables `livraisons` et `besoins` et implémenté la transformation besoin → livraison. Cette story ajoute la **création directe** de livraisons et le **cycle de vie complet** : Commandé → Prévu → Livré.

**Scope précis :**
- Créer des livraisons directement (sans passer par un besoin)
- Cycle de vie complet avec transitions de statut
- Date prévue de livraison (saisie + affichage)
- Composant `DeliveryCard` avec barre de statut colorée et actions contextuelles
- Intégration dans le chantier léger (section livraisons) et chantier complet (route dédiée)
- Trigger d'activité pour les événements livraisons (manquant de la 6.1)
- Propagation temps réel

**Hors scope (stories suivantes) :**
- Documents BC/BL rattachés aux livraisons (Story 6.3)
- Vue globale livraisons dans la bottom nav (Story 6.4)
- Inventaire avec localisation (Story 6.5)

### Ce qui existe déjà (Story 6.1)

| Élément | Fichier | Notes |
|---------|---------|-------|
| Table `livraisons` | `016_besoins_livraisons.sql` | Schéma complet avec `date_prevue`, `bc_file_url`, `bl_file_url` |
| Table `besoins` | `016_besoins_livraisons.sql` | Avec FK vers livraisons |
| Type `Livraison` | `src/types/database.ts` | `status: 'commande' \| 'prevu' \| 'livre'` |
| Type `Besoin` | `src/types/database.ts` | Avec `livraison_id` nullable |
| Enum `delivery_status` | `001_enums.sql` | `'commande', 'prevu', 'livre'` |
| Enum activity events | `016_besoins_livraisons.sql` | `livraison_created`, `livraison_status_changed` ajoutés |
| `useLivraisonsCount` | `src/lib/queries/useLivraisonsCount.ts` | Count seulement (pas de détails) |
| `useTransformBesoinToLivraison` | `src/lib/mutations/useTransformBesoinToLivraison.ts` | Crée livraison + lie besoin |
| `useRealtimeBesoins` | `src/lib/subscriptions/useRealtimeBesoins.ts` | Pour besoins seulement |
| ActivityFeed events | `src/components/ActivityFeed.tsx` | `livraison_created` et `livraison_status_changed` DÉJÀ gérés (icône Truck + labels FR) |
| Route stub livraisons | `src/routes/_authenticated/livraisons.tsx` | Page vide "Aucune livraison pour le moment" — Story 6.4 |

**IMPORTANT :** Les activity event types sont dans le code TypeScript ET dans l'enum SQL, mais aucun trigger n'existe pour les déclencher. C'est le rôle de Task 1.

### Migration SQL — `017_livraison_activity.sql`

```sql
-- Story 6.2 : Trigger d'activité pour livraisons
-- Les event types livraison_created et livraison_status_changed existent déjà dans l'enum (016)

CREATE OR REPLACE FUNCTION log_livraison_activity()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_logs (chantier_id, event_type, actor_id, actor_email, target_type, target_id, metadata)
    VALUES (
      NEW.chantier_id,
      'livraison_created',
      auth.uid(),
      current_setting('request.jwt.claims', true)::json->>'email',
      'livraison',
      NEW.id,
      jsonb_build_object('description', NEW.description)
    );
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.activity_logs (chantier_id, event_type, actor_id, actor_email, target_type, target_id, metadata)
    VALUES (
      NEW.chantier_id,
      'livraison_status_changed',
      auth.uid(),
      current_setting('request.jwt.claims', true)::json->>'email',
      'livraison',
      NEW.id,
      jsonb_build_object('description', NEW.description, 'old_status', OLD.status::text, 'new_status', NEW.status::text)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_livraison_activity
  AFTER INSERT OR UPDATE OF status ON public.livraisons
  FOR EACH ROW EXECUTE FUNCTION log_livraison_activity();
```

**Points critiques de la migration :**
- `SECURITY DEFINER` — même pattern que `log_besoin_activity()` dans 016
- La table s'appelle `activity_logs` (au pluriel avec 's') — vérifier le nom exact dans `013_activity_log.sql` AVANT d'écrire le trigger
- Colonnes : `actor_id`, `actor_email`, `target_type`, `target_id`, `metadata` (jsonb) — pattern confirmé par Story 6.1 debug log
- `auth.uid()` et `current_setting('request.jwt.claims')` pour récupérer l'identité de l'utilisateur dans le trigger
- `IS DISTINCT FROM` plutôt que `!=` pour gérer les NULL correctement

### Query hook — useLivraisons.ts

```typescript
// src/lib/queries/useLivraisons.ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Livraison } from '@/types/database'

export function useLivraisons(chantierId: string) {
  return useQuery({
    queryKey: ['livraisons', chantierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('livraisons')
        .select('*')
        .eq('chantier_id', chantierId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as unknown as Livraison[]
    },
    enabled: !!chantierId,
  })
}
```

**Note :** Le cast `as unknown as Livraison[]` est nécessaire car `Database.Tables` utilise `Record<string, never>` — pattern établi dans MEMORY.md et utilisé partout dans le projet.

### Mutation hook — useCreateLivraison.ts

```typescript
// src/lib/mutations/useCreateLivraison.ts
// Pattern identique à useCreateBesoin.ts — mutation optimiste standard
export function useCreateLivraison() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ chantierId, description }: { chantierId: string; description: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('livraisons')
        .insert({
          chantier_id: chantierId,
          description,
          status: 'commande' as const,
          created_by: user?.id ?? null,
        })
        .select()
        .single()
      if (error) throw error
      return data as unknown as Livraison
    },
    onMutate: async ({ chantierId, description }) => {
      await queryClient.cancelQueries({ queryKey: ['livraisons', chantierId] })
      const previous = queryClient.getQueryData(['livraisons', chantierId])
      queryClient.setQueryData(['livraisons', chantierId], (old: Livraison[] | undefined) => [
        {
          id: crypto.randomUUID(),
          chantier_id: chantierId,
          description,
          status: 'commande' as const,
          date_prevue: null,
          bc_file_url: null,
          bc_file_name: null,
          bl_file_url: null,
          bl_file_name: null,
          created_at: new Date().toISOString(),
          created_by: null,
        },
        ...(old ?? []),
      ])
      return { previous }
    },
    onError: (_err, { chantierId }, context) => {
      queryClient.setQueryData(['livraisons', chantierId], context?.previous)
    },
    onSettled: (_data, _error, { chantierId }) => {
      queryClient.invalidateQueries({ queryKey: ['livraisons', chantierId] })
      queryClient.invalidateQueries({ queryKey: ['livraisons-count', chantierId] })
    },
  })
}
```

### Mutation hook — useUpdateLivraisonStatus.ts

```typescript
// src/lib/mutations/useUpdateLivraisonStatus.ts
interface UpdateStatusParams {
  livraisonId: string
  chantierId: string
  newStatus: 'prevu' | 'livre'
  datePrevue?: string  // Format YYYY-MM-DD, requis pour 'prevu'
}

export function useUpdateLivraisonStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ livraisonId, newStatus, datePrevue }: UpdateStatusParams) => {
      const updateData: Record<string, unknown> = { status: newStatus }

      if (newStatus === 'prevu' && datePrevue) {
        updateData.date_prevue = datePrevue
      }
      if (newStatus === 'livre') {
        // Date du jour automatique
        updateData.date_prevue = new Date().toISOString().split('T')[0]
      }

      const { data, error } = await supabase
        .from('livraisons')
        .update(updateData)
        .eq('id', livraisonId)
        .select()
        .single()

      if (error) throw error
      return data as unknown as Livraison
    },
    onMutate: async ({ livraisonId, chantierId, newStatus, datePrevue }) => {
      await queryClient.cancelQueries({ queryKey: ['livraisons', chantierId] })
      const previous = queryClient.getQueryData(['livraisons', chantierId])
      queryClient.setQueryData(
        ['livraisons', chantierId],
        (old: Livraison[] | undefined) =>
          (old ?? []).map((l) =>
            l.id === livraisonId
              ? {
                  ...l,
                  status: newStatus,
                  date_prevue: newStatus === 'prevu' ? (datePrevue ?? l.date_prevue) :
                               newStatus === 'livre' ? new Date().toISOString().split('T')[0] :
                               l.date_prevue,
                }
              : l,
          ),
      )
      return { previous, chantierId }
    },
    onError: (_err, _vars, context) => {
      if (context?.chantierId) {
        queryClient.setQueryData(['livraisons', context.chantierId], context.previous)
      }
    },
    onSettled: (_data, _error, { chantierId }) => {
      queryClient.invalidateQueries({ queryKey: ['livraisons', chantierId] })
      queryClient.invalidateQueries({ queryKey: ['livraisons-count', chantierId] })
    },
  })
}
```

**Note sur la transition livre :** L'AC dit "le statut passe à Livré avec la date du jour". On stocke la date de confirmation dans `date_prevue` puisque c'est le seul champ date disponible. Si un jour il faut distinguer date prévue vs date effective, une colonne `date_livree` pourra être ajoutée. Pour le moment, `date_prevue` sert aux deux usages.

### Subscription hook — useRealtimeLivraisons.ts

```typescript
// Suivre le pattern exact de useRealtimeBesoins.ts
export function useRealtimeLivraisons(chantierId: string) {
  const queryClient = useQueryClient()
  useEffect(() => {
    const channel = supabase
      .channel(`livraisons:chantier_id=eq.${chantierId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'livraisons', filter: `chantier_id=eq.${chantierId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['livraisons', chantierId] })
          queryClient.invalidateQueries({ queryKey: ['livraisons-count', chantierId] })
        },
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [chantierId, queryClient])
}
```

### Component — DeliveryCard

```
DELIVERYCARD — STATUT COMMANDÉ :
┌──┬─────────────────────────────────────────────┐
│  │ Colle pour faïence 20kg            Commandé │
│O │ Y · il y a 2h                               │
│R │                                              │
│A │                        [Marquer prévu]       │
│N │                                              │
│G │                                              │
│E │                                              │
└──┴─────────────────────────────────────────────┘

DELIVERYCARD — STATUT PRÉVU :
┌──┬─────────────────────────────────────────────┐
│  │ Colle pour faïence 20kg              Prévu  │
│B │ Y · il y a 2h       📅 15 fév. 2026        │
│L │                                              │
│E │                     [Confirmer livraison]    │
│U │                                              │
└──┴─────────────────────────────────────────────┘

DELIVERYCARD — STATUT LIVRÉ :
┌──┬─────────────────────────────────────────────┐
│  │ Colle pour faïence 20kg              Livré  │
│V │ Y · il y a 3j       📅 12 fév. 2026        │
│E │                                              │
│R │                              (aucun bouton)  │
│T │                                              │
└──┴─────────────────────────────────────────────┘
```

**Couleurs de la barre latérale (UX spec §8 DeliveryCard) :**
| Statut | Couleur | Hex | Label FR |
|--------|---------|-----|----------|
| commande | Orange | `#F59E0B` | Commandé |
| prevu | Bleu | `#3B82F6` | Prévu |
| livre | Vert | `#10B981` | Livré |

**Pattern :** Le `DeliveryCard` est une **StatusCard étendue** selon l'UX spec. Cependant, NE PAS hériter de `StatusCard.tsx` — créer un composant indépendant qui reprend visuellement le même style (barre latérale + contenu) mais avec la logique spécifique aux livraisons. `StatusCard` est orienté navigation (onClick → navigate), tandis que `DeliveryCard` est orienté actions (boutons de transition).

**Affichage de la date :** Utiliser `Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })` pour formater la date prévue (ex: "15 fév. 2026"). Le projet utilise déjà `formatRelativeTime` dans `src/lib/utils/formatRelativeTime.ts` pour les dates relatives — réutiliser pour la date de création.

### Vue chantier léger — Anatomie visuelle après 6.2

```
CHANTIER LÉGER — AVEC besoins + livraisons :
┌──────────────────────────────────────────────────┐
│  ← Retour     Rénovation Duval           [⋮]    │
├──────────────────────────────────────────────────┤
│  [Léger]                        2 livraisons     │
│                                                   │
│  Besoins en attente (2)                           │
│  ┌─────────────────────────────────────────────┐ │
│  │ Joint gris 5kg                              │ │
│  │ B · hier                     [Commander]     │ │
│  └─────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────┐ │
│  │ Silicone transparent                        │ │
│  │ Y · il y a 3j                [Commander]     │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  Livraisons (3)                                   │
│  ┌──┬──────────────────────────────────────────┐ │
│  │OR│ Colle faïence 20kg          Commandé     │ │
│  │  │ Y · il y a 2h        [Marquer prévu]     │ │
│  └──┴──────────────────────────────────────────┘ │
│  ┌──┬──────────────────────────────────────────┐ │
│  │BL│ Croisillons 3mm              Prévu       │ │
│  │  │ Y · hier  📅 15 fév  [Confirmer]         │ │
│  └──┴──────────────────────────────────────────┘ │
│  ┌──┬──────────────────────────────────────────┐ │
│  │VE│ Ragréage P3               Livré          │ │
│  │  │ B · il y a 5j  📅 10 fév                 │ │
│  └──┴──────────────────────────────────────────┘ │
│                                                   │
│                                    [+ ⚪]  ← FAB │
│                       (menu: Besoin / Livraison)  │
└──────────────────────────────────────────────────┘
```

**FAB multi-items :** Le composant `Fab` (`src/components/Fab.tsx`) supporte déjà un mode `menuItems`. Passer :
```typescript
<Fab
  menuItems={[
    { icon: Package, label: 'Nouveau besoin', onClick: handleOpenBesoinSheet },
    { icon: Truck, label: 'Nouvelle livraison', onClick: handleOpenLivraisonSheet },
  ]}
/>
```

### Sheet "Marquer prévu" — Saisie de la date

Quand l'utilisateur tape "Marquer prévu" sur une DeliveryCard au statut "Commandé" :
1. Ouvrir un Sheet avec un `<input type="date">` natif (excellent UX mobile — ouvre le date picker natif)
2. Bouton "Confirmer" pour valider
3. Appeler `useUpdateLivraisonStatus({ ..., newStatus: 'prevu', datePrevue: selectedDate })`
4. Fermer le Sheet + toast "Livraison marquée prévu"

```
SHEET "MARQUER PRÉVU" :
┌──────────────────────────────────────────────────┐
│  Date de livraison prévue                  [✕]   │
├──────────────────────────────────────────────────┤
│                                                   │
│  Colle pour faïence 20kg                         │
│                                                   │
│  Date prévue                                      │
│  ┌─────────────────────────────────────────────┐ │
│  │ JJ/MM/AAAA                   [📅]          │ │  ← input type="date"
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  [       Marquer comme prévu       ]              │
└──────────────────────────────────────────────────┘
```

### Transition "Confirmer livraison" (Prévu → Livré)

Quand l'utilisateur tape "Confirmer livraison" sur une DeliveryCard au statut "Prévu" :
- **Pas de Sheet** — action directe (UX spec : "Chaque étape est un statut clair, jamais un formulaire")
- Appeler `useUpdateLivraisonStatus({ ..., newStatus: 'livre' })` directement
- La date du jour est renseignée automatiquement par la mutation
- Toast "Livraison confirmée"
- L'UI se met à jour immédiatement (mutation optimiste)

### Chantier complet — Header avec bouton Livraisons

Le header du chantier complet dans `index.tsx` a déjà un bouton "Besoins". Ajouter un bouton "Livraisons" à côté :

```typescript
// Dans la section chantier complet, à côté du bouton Besoins existant
<Button variant="outline" size="sm" asChild>
  <Link
    to="/chantiers/$chantierId/livraisons"
    params={{ chantierId }}
  >
    <Truck className="mr-1 size-3.5" />
    Livraisons
  </Link>
</Button>
```

### Composants existants à réutiliser

| Composant | Usage dans 6.2 |
|-----------|----------------|
| **Sheet** (`src/components/ui/sheet.tsx`) | Formulaire création livraison + Sheet "Marquer prévu" |
| **Fab** (`src/components/Fab.tsx`) | FAB multi-items (besoin + livraison) pour léger, single pour complet |
| **Badge** (`src/components/ui/badge.tsx`) | Badge statut sur DeliveryCard |
| **Button** (`src/components/ui/button.tsx`) | Actions "Marquer prévu", "Confirmer livraison" |
| **Textarea** (`src/components/ui/textarea.tsx`) | Description de la livraison |
| **Input** (`src/components/ui/input.tsx`) | `type="date"` pour la date prévue |
| **BesoinsList** (`src/components/BesoinsList.tsx`) | Pattern de référence pour LivraisonsList |
| **StatusCard** (`src/components/StatusCard.tsx`) | Pattern visuel de référence pour DeliveryCard (barre latérale) |

### Pattern d'affichage de l'auteur

Même pattern que `BesoinsList.tsx` : comparer `created_by` (UUID) avec l'utilisateur courant via `useAuth()`. Afficher l'initiale de l'email si c'est l'utilisateur courant, sinon '?'. Avec 2-3 utilisateurs, c'est suffisant.

### Routing — TanStack Router

**Nouvelle route : `$chantierId/livraisons.tsx`**
- Sera auto-détectée par TanStack Router (file-based routing)
- `routeFileIgnorePattern: '.*\\.test\\.tsx?$'` exclut les tests
- Après ajout du fichier, relancer `npm run dev` pour regénérer `routeTree.gen.ts`
- La route existante stub `src/routes/_authenticated/livraisons.tsx` (bottom nav) **n'est PAS touchée** — c'est Story 6.4

**ATTENTION** : La route `$chantierId/livraisons.tsx` est DIFFÉRENTE de `_authenticated/livraisons.tsx`. La première est la page livraisons d'un chantier spécifique, la seconde est la vue globale (bottom nav).

### Schéma DB — Rappel table `livraisons` (existante)

| Colonne | Type | Contrainte | Utilisé en 6.2 |
|---------|------|------------|-----------------|
| id | uuid | PK | Oui |
| chantier_id | uuid | NOT NULL, FK chantiers | Oui |
| description | text | NOT NULL | Oui |
| status | delivery_status | NOT NULL, DEFAULT 'commande' | Oui (transitions) |
| date_prevue | date | nullable | Oui (saisie + affichage) |
| bc_file_url | text | nullable | Non (Story 6.3) |
| bc_file_name | text | nullable | Non (Story 6.3) |
| bl_file_url | text | nullable | Non (Story 6.3) |
| bl_file_name | text | nullable | Non (Story 6.3) |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Oui |
| created_by | uuid | FK auth.users | Oui |

### Project Structure Notes

**Nouveaux fichiers (10+) :**
- `supabase/migrations/017_livraison_activity.sql`
- `src/lib/queries/useLivraisons.ts` + test
- `src/lib/mutations/useCreateLivraison.ts` + test
- `src/lib/mutations/useUpdateLivraisonStatus.ts` + test
- `src/lib/subscriptions/useRealtimeLivraisons.ts` + test
- `src/components/DeliveryCard.tsx` + test
- `src/components/LivraisonsList.tsx` + test
- `src/routes/_authenticated/chantiers/$chantierId/livraisons.tsx` + test

**Fichiers modifiés (3) :**
- `src/routes/_authenticated/chantiers/$chantierId/index.tsx` — Section léger (ajout livraisons, FAB multi-items, sheets) + section complet (bouton "Livraisons" dans header)
- `src/lib/mutations/useTransformBesoinToLivraison.ts` — Ajout invalidation `['livraisons-count', chantierId]`
- `src/routeTree.gen.ts` — Auto-regénéré par TanStack Router (nouvelle route livraisons)

### Prérequis et dépendances

- **Aucune dépendance npm à ajouter** — tout est déjà dans le projet
- **Icônes lucide-react** : `Truck` (livraisons), `Package` (besoins), `Calendar` (date prévue) — tous déjà disponibles
- **Table `livraisons`** : déjà créée en 016 avec le schéma complet
- **Activity event types** : `livraison_created`, `livraison_status_changed` — déjà dans l'enum SQL et le TypeScript
- **ActivityFeed** : gère DÉJÀ ces event types (icône Truck + labels FR) — **rien à modifier**
- **Epics précédentes** : Toutes (1-5) sont `done`, Story 6.1 est `done`

### Risques et points d'attention

1. **Vérifier le nom exact de la table `activity_logs`** : Story 6.1 debug log mentionne `activity_logs` (pluriel) mais l'architecture dit `activity_log` (singulier). Consulter `013_activity_log.sql` pour confirmer le nom exact AVANT d'écrire le trigger. Le trigger de 6.1 (`log_besoin_activity`) est la référence fiable.

2. **Colonnes activity_logs** : Vérifier les colonnes exactes dans le trigger existant `log_besoin_activity()`. Story 6.1 debug log confirme : `actor_id`, `actor_email`, `target_type`, `target_id`, `metadata` (jsonb). Reproduire le même pattern.

3. **`date_prevue` pour "Livré"** : On réutilise `date_prevue` pour stocker la date de livraison effective. C'est un raccourci acceptable pour le MVP. Si besoin de distinguer date prévue vs date effective, ajouter une colonne `date_livree` dans une migration future.

4. **FAB multi-items dans léger** : Le FAB passe de single-action à multi-items. S'assurer que l'overlay et l'animation fonctionnent correctement. Le composant Fab supporte déjà ce mode via la prop `menuItems`.

5. **Route `$chantierId/livraisons.tsx` vs `_authenticated/livraisons.tsx`** : Ce sont deux routes DIFFÉRENTES. Ne pas modifier la route bottom nav (Story 6.4). La nouvelle route est nested sous `$chantierId/`.

6. **Pre-existing issues** : 16 test failures pré-existants (pwa-config 5, pwa-html 5, hasPointerCapture 6), lint error ThemeProvider.tsx:64 — ne pas s'en inquiéter.

7. **Invalidation `livraisons-count`** : `useTransformBesoinToLivraison` de la Story 6.1 invalide `['livraisons', chantierId]` mais PAS `['livraisons-count', chantierId]`. Task 10 corrige ça.

### Learnings des stories précédentes (relevants)

- **Pattern mutation optimiste** : `onMutate` (update UI), `onError` (rollback), `onSettled` (revalidation) — pattern utilisé dans TOUTES les mutations du projet. Ne pas dévier.
- **Mock supabase chainable API** : `from → select → eq → order` chaque appel retourne un mock avec la méthode suivante. Pattern établi dans tous les tests.
- **`data as unknown as Type[]`** : Cast nécessaire car `Database.Tables` est `Record<string, never>`. MEMORY.md le confirme.
- **Route tests** : `createRouter` + `createMemoryHistory` + `RouterProvider` + `QueryClientProvider` + `AuthContext.Provider`.
- **Sonner toast** : `toast('message')` / `toast.error(...)` — le projet utilise sonner avec le ThemeProvider custom.
- **Sheet** : Utilisé pour les formulaires de création (besoin, plot, variante). Même pattern : Sheet + form + bouton submit.
- **Fab menuItems** : Le Fab accepte `menuItems?: FabMenuItem[]` avec `{ icon: LucideIcon, label: string, onClick: () => void }`. Si `menuItems` est fourni, le FAB bascule en mode menu expandable.
- **BesoinsList** : Le pattern à reproduire pour LivraisonsList — props avec data/loading/callbacks, skeleton, empty state, liste de cartes.

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 6.2, Epic 6, FR47, FR48, FR51]
- [Source: _bmad-output/planning-artifacts/architecture.md — Supabase SDK direct, TanStack Query mutations optimistes, Realtime subscriptions, structure par domaine]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — DeliveryCard specs (§8), couleurs cycle : orange commandé, bleu prévu, vert livré]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — "Besoin → Commandé → Prévu → Livré. Chaque étape est un statut clair, jamais un formulaire"]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Transformation = confirmation inline, actions terrain = jamais de confirmation]
- [Source: _bmad-output/implementation-artifacts/6-1-besoins-creation-gestion-et-transformation-en-livraison.md — Tables livraisons/besoins, patterns hooks, debug logs trigger colonnes]
- [Source: src/components/BesoinsList.tsx — Pattern composant liste à reproduire pour LivraisonsList]
- [Source: src/components/Fab.tsx — FAB avec menuItems prop pour mode expandable]
- [Source: src/components/StatusCard.tsx — Pattern visuel barre de statut latérale]
- [Source: src/components/ActivityFeed.tsx — Lignes 30-33, 67-70 : livraison_created/livraison_status_changed DÉJÀ gérés]
- [Source: src/lib/mutations/useTransformBesoinToLivraison.ts — Pattern mutation, invalidation ['livraisons', chantierId] existante]
- [Source: src/lib/queries/useLivraisonsCount.ts — QueryKey ['livraisons-count', chantierId]]
- [Source: src/routes/_authenticated/chantiers/$chantierId/index.tsx — Page chantier detail, section léger/complet, FAB, sheets]
- [Source: src/routes/_authenticated/livraisons.tsx — Stub bottom nav (Story 6.4, ne PAS modifier)]
- [Source: supabase/migrations/016_besoins_livraisons.sql — Table livraisons existante, enum delivery_status]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Table `activity_logs` (pluriel, confirmé dans 013_activity_log.sql ligne 17)
- Pattern trigger reproduit depuis `log_besoin_activity()` (016) avec `COALESCE(auth.uid(), NEW.created_by)` et `auth.jwt()->>'email'`
- Pre-existing failures confirmés : pwa-config (5), pwa-html (5), hasPointerCapture (6), lint ThemeProvider.tsx:64, build `Record<string, never>` type errors

### Completion Notes List

- ✅ Task 1 : Migration `017_livraison_activity.sql` — trigger function + trigger sur INSERT et UPDATE OF status
- ✅ Task 2 : `useLivraisons(chantierId)` — query hook avec select/eq/order, 3 tests
- ✅ Task 3 : `useCreateLivraison()` — mutation optimiste complète, invalidation livraisons + livraisons-count, 3 tests
- ✅ Task 4 : `useUpdateLivraisonStatus()` — transitions prevu (avec date) et livre (date auto), mutation optimiste, 4 tests
- ✅ Task 5 : `useRealtimeLivraisons(chantierId)` — subscription postgres_changes, invalidation livraisons + livraisons-count, 5 tests
- ✅ Task 6 : `DeliveryCard` — barre latérale colorée, labels FR, boutons contextuels, date formatée Intl, skeleton, 16 tests
- ✅ Task 7 : `LivraisonsList` — liste de DeliveryCards, empty state Truck, loading skeletons, 6 tests
- ✅ Task 8 : Intégration vue léger — LivraisonsList sous BesoinsList, FAB multi-items (besoin + livraison), Sheet nouvelle livraison, Sheet date prévue, callbacks transitions, toasts, bouton Livraisons dans complet header
- ✅ Task 9 : Route `$chantierId/livraisons.tsx` — page dédiée avec FAB single, back link, sheets, 5 tests
- ✅ Task 10 : Fix invalidation `livraisons-count` dans `useTransformBesoinToLivraison.onSettled`
- ✅ Task 11 : Régression 717/717 tests passent, 0 nouvelles erreurs lint, 0 nouvelles erreurs build

### Change Log

- 2026-02-12 : Story 6.2 complète — 11 tasks, 42 nouveaux tests, 10 nouveaux fichiers, 2 fichiers modifiés

### File List

**Nouveaux fichiers :**
- `supabase/migrations/017_livraison_activity.sql`
- `src/lib/queries/useLivraisons.ts`
- `src/lib/queries/useLivraisons.test.ts`
- `src/lib/mutations/useCreateLivraison.ts`
- `src/lib/mutations/useCreateLivraison.test.ts`
- `src/lib/mutations/useUpdateLivraisonStatus.ts`
- `src/lib/mutations/useUpdateLivraisonStatus.test.ts`
- `src/lib/subscriptions/useRealtimeLivraisons.ts`
- `src/lib/subscriptions/useRealtimeLivraisons.test.ts`
- `src/components/DeliveryCard.tsx`
- `src/components/DeliveryCard.test.tsx`
- `src/components/LivraisonsList.tsx`
- `src/components/LivraisonsList.test.tsx`
- `src/routes/_authenticated/chantiers/$chantierId/livraisons.tsx`
- `src/routes/_authenticated/chantiers/$chantierId/livraisons.test.tsx`

**Fichiers modifiés :**
- `src/routes/_authenticated/chantiers/$chantierId/index.tsx` — section léger (livraisons, FAB multi-items, sheets) + section complet (bouton Livraisons)
- `src/lib/mutations/useTransformBesoinToLivraison.ts` — ajout invalidation `['livraisons-count', chantierId]`
- `src/routeTree.gen.ts` — auto-regénéré (nouvelle route livraisons)
