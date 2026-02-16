# Story 6.8: Commande groupée de besoins

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que utilisateur de posePilot,
Je veux sélectionner plusieurs besoins en attente et les regrouper en une seule commande,
Afin que je passe une commande unique chez un fournisseur pour plusieurs matériaux à la fois.

## Acceptance Criteria

1. **Given** l'utilisateur consulte la liste des besoins en attente d'un chantier **When** il effectue un appui long sur un besoin (ou tape un bouton "Sélectionner") **Then** le mode sélection s'active : des cases à cocher apparaissent sur chaque besoin et le besoin initial est pré-coché

2. **Given** le mode sélection est actif **When** l'utilisateur coche plusieurs besoins **Then** un compteur affiche le nombre de besoins sélectionnés et un bouton "Commander (N)" apparaît en bas de l'écran

3. **Given** l'utilisateur tape sur "Commander (N)" avec N besoins sélectionnés **When** le formulaire de création de livraison groupée s'affiche **Then** les champs disponibles sont : intitulé de la commande (obligatoire), fournisseur (optionnel), et la liste des N besoins sélectionnés est affichée en résumé

4. **Given** l'utilisateur saisit un intitulé et valide **When** la mutation s'exécute **Then** une seule livraison est créée au statut "Commandé" avec l'intitulé saisi, le fournisseur (si renseigné), et les N besoins sont rattachés à cette livraison (livraison_id mis à jour)

5. **Given** les besoins sont rattachés à la livraison **When** l'utilisateur consulte la liste des besoins en attente **Then** les N besoins commandés ont disparu de la liste en attente

6. **Given** une livraison a des besoins rattachés **When** l'utilisateur consulte la DeliveryCard **Then** un indicateur (icône ou compteur "3 besoins") signale que des besoins sont liés

7. **Given** l'utilisateur tape sur l'indicateur de besoins rattachés **When** l'accordéon se déplie **Then** le détail de chaque besoin rattaché est visible (description, auteur, date de création)

8. **Given** l'utilisateur est en mode sélection et veut annuler **When** il tape sur "Annuler" ou le bouton retour **Then** le mode sélection se désactive, les cases à cocher disparaissent

9. **Given** un seul besoin est sélectionné en mode sélection **When** l'utilisateur tape sur "Commander (1)" **Then** le même formulaire de livraison groupée s'affiche (intitulé + fournisseur) — comportement unifié quel que soit le nombre

## Tasks / Subtasks

- [x] Task 1 — Nouvelle query : useBesoinsForLivraison (AC: #6, #7)
  - [x] 1.1 Créer `src/lib/queries/useBesoinsForLivraison.ts`
  - [x] 1.2 `select('*')` filtré par `livraison_id.eq(livraisonId)`, ordonné `created_at ASC`
  - [x] 1.3 Query key : `['besoins-for-livraison', livraisonId]`
  - [x] 1.4 `enabled: !!livraisonId`

- [x] Task 2 — Nouvelle mutation : useCreateGroupedLivraison (AC: #4, #5)
  - [x] 2.1 Créer `src/lib/mutations/useCreateGroupedLivraison.ts`
  - [x] 2.2 Input : `{ chantierId: string; besoinIds: string[]; description: string; fournisseur?: string }`
  - [x] 2.3 mutationFn : étape 1 — insert livraison `{description, fournisseur, status:'commande', chantier_id, created_by}`
  - [x] 2.4 mutationFn : étape 2 — batch update `supabase.from('besoins').update({livraison_id}).in('id', besoinIds).is('livraison_id', null)`
  - [x] 2.5 Garde serveur : `.is('livraison_id', null)` empêche le double-rattachement
  - [x] 2.6 onMutate : retirer les besoinIds du cache `['besoins', chantierId]`
  - [x] 2.7 onError : rollback avec `context.previous`
  - [x] 2.8 onSettled : invalider `['besoins', chantierId]`, `['livraisons', chantierId]`, `['livraisons-count', chantierId]`, `['all-pending-besoins-count']`, `['all-livraisons']`
  - [x] 2.9 Créer `src/lib/mutations/useCreateGroupedLivraison.test.ts` (4 tests minimum)

- [x] Task 3 — BesoinsList : mode sélection avec cases à cocher (AC: #1, #2, #8)
  - [x] 3.1 Modifier `src/components/BesoinsList.tsx`
  - [x] 3.2 Nouvelles props : `selectionMode: boolean`, `selectedIds: Set<string>`, `onToggleSelect: (id: string) => void`, `onLongPress?: (besoin: Besoin) => void`
  - [x] 3.3 En mode sélection : afficher Checkbox à gauche de chaque besoin
  - [x] 3.4 En mode normal : handler `onLongPress` sur touch/mouse hold (appui > 500ms)
  - [x] 3.5 Masquer le DropdownMenu (Modifier/Supprimer) et le bouton "Commander" individuel en mode sélection
  - [x] 3.6 Mettre à jour tests existants

- [x] Task 4 — Page besoins : gestion du mode sélection et commande groupée (AC: #1, #2, #3, #4, #5, #8, #9)
  - [x] 4.1 Modifier `src/routes/_authenticated/chantiers/$chantierId/besoins.tsx`
  - [x] 4.2 Ajouter states : `selectionMode: boolean`, `selectedBesoinIds: Set<string>`, `showGroupeSheet: boolean`, `groupeDescription: string`, `groupeFournisseur: string`, `groupeError: string`
  - [x] 4.3 Handler `handleLongPress(besoin)` : active le mode sélection + coche le besoin
  - [x] 4.4 Handler `handleToggleSelect(id)` : toggle le besoin dans le Set, si Set vide → désactive le mode
  - [x] 4.5 Handler `handleCancelSelection()` : vide le Set, désactive le mode
  - [x] 4.6 Handler `handleOpenGroupeSheet()` : ouvre le Sheet de commande groupée
  - [x] 4.7 Handler `handleConfirmGroupe()` : valide l'intitulé, appelle `useCreateGroupedLivraison`, reset états, toast "Commande créée"
  - [x] 4.8 Barre de sélection en bas : compteur "N sélectionné(s)" + bouton "Commander (N)" + bouton "Annuler"
  - [x] 4.9 Sheet commande groupée : Textarea intitulé (obligatoire) + Input fournisseur (optionnel) + résumé des N besoins sélectionnés
  - [x] 4.10 Mettre à jour `besoins.test.tsx` (5+ nouveaux tests)

- [x] Task 5 — Page chantier index (léger) : mode sélection groupée (AC: #1, #2, #8, #9)
  - [x] 5.1 Modifier `src/routes/_authenticated/chantiers/$chantierId/index.tsx` (section chantier léger)
  - [x] 5.2 Même logique de sélection que besoins.tsx (states + handlers + barre de sélection + Sheet)
  - [x] 5.3 Mettre à jour `index.test.tsx`

- [x] Task 6 — DeliveryCard : indicateur besoins rattachés et accordéon (AC: #6, #7)
  - [x] 6.1 Modifier `src/components/DeliveryCard.tsx`
  - [x] 6.2 Nouvelle prop optionnelle : `linkedBesoins?: Besoin[]`
  - [x] 6.3 Si `linkedBesoins` non vide : afficher un badge cliquable "N besoins" (icône `Package` ou `List`)
  - [x] 6.4 Au clic sur le badge : toggle l'accordéon (state local `expanded`)
  - [x] 6.5 Accordéon : liste des besoins rattachés avec description, initiale auteur, date relative
  - [x] 6.6 Si `linkedBesoins` vide ou absent : rien n'est affiché (pas de "0 besoins")
  - [x] 6.7 Mettre à jour `DeliveryCard.test.tsx` (4+ nouveaux tests)

- [x] Task 7 — LivraisonsList + routes : passer les besoins liés aux DeliveryCards (AC: #6, #7)
  - [x] 7.1 Créer un hook helper `useBesoinsMapByLivraison(chantierId)` ou utiliser une query qui join les besoins aux livraisons
  - [x] 7.2 Modifier `src/components/LivraisonsList.tsx` : nouvelle prop `besoinsMap?: Map<string, Besoin[]>`, passer `linkedBesoins` à chaque DeliveryCard
  - [x] 7.3 Modifier `src/routes/_authenticated/chantiers/$chantierId/livraisons.tsx` : fetch les besoins liés via query, passer le map
  - [x] 7.4 Modifier `src/routes/_authenticated/livraisons.tsx` (vue globale) : fetch les besoins liés, passer le map

- [x] Task 8 — Tests de régression (AC: #1-9)
  - [x] 8.1 `npm run test` — tous les story tests passent, 0 nouvelles régressions
  - [x] 8.2 `npm run lint` — 0 nouvelles erreurs
  - [x] 8.3 `npm run build` — 0 nouvelles erreurs tsc

## Dev Notes

### Vue d'ensemble — Stratégie d'implémentation

Cette story est la **huitième de l'Epic 6** et ajoute la **commande groupée de besoins** (FR77, FR78, FR79) ainsi que l'**affichage des besoins rattachés sur les DeliveryCards** (FR80). Les stories 6.1-6.7 ont construit le cycle complet besoins/livraisons/inventaire/édition/fournisseur. Cette story ajoute le dernier mécanisme de création de livraison : la sélection multiple de besoins pour les regrouper en une commande unique.

**Scope précis :**
- Mode sélection sur la liste des besoins en attente (cases à cocher, appui long)
- Barre d'actions en bas avec compteur + bouton "Commander (N)" + Annuler
- Sheet "Commande groupée" avec intitulé (obligatoire), fournisseur (optionnel), résumé des besoins
- Nouvelle mutation batch : créer 1 livraison + rattacher N besoins
- Indicateur "N besoins" sur DeliveryCard (toutes les vues livraisons)
- Accordéon dépliable montrant le détail des besoins rattachés
- Comportement unifié : même formulaire groupé pour 1 ou N besoins sélectionnés

**Hors scope (story suivante) :**
- Suppression de livraisons avec choix repasser en besoins (Story 6.9 — FR84, FR85)

**Complexité : MOYENNE-HAUTE** — Nouveau pattern UX (mode sélection multi), nouvelle mutation batch, enrichissement de DeliveryCard avec données liées. Pas de migration SQL nécessaire.

### Ce qui existe déjà (à réutiliser, NE PAS recréer)

| Élément | Fichier | Notes |
|---------|---------|-------|
| `BesoinsList` | `src/components/BesoinsList.tsx` | ~116 lignes — liste avec DropdownMenu (Modifier/Supprimer) + bouton Commander |
| `DeliveryCard` | `src/components/DeliveryCard.tsx` | ~148 lignes — carte livraison avec fournisseur + DropdownMenu Modifier |
| `DeliveryCardSkeleton` | `src/components/DeliveryCard.tsx` | Skeleton loading |
| `LivraisonSheets` | `src/components/LivraisonSheets.tsx` | 3 Sheets : création + date prévue + édition |
| `EditLivraisonSheet` | `src/components/EditLivraisonSheet.tsx` | Sheet réutilisable (description + fournisseur + date) |
| `LivraisonsList` | `src/components/LivraisonsList.tsx` | Liste de DeliveryCards avec état vide et prop onEdit |
| `useLivraisonActions` | `src/lib/hooks/useLivraisonActions.ts` | ~166 lignes — hook partagé: state + handlers création/marquer prévu/confirmer/édition |
| `useCreateLivraison` | `src/lib/mutations/useCreateLivraison.ts` | Insert `{description, fournisseur, status:'commande'}` |
| `useTransformBesoinToLivraison` | `src/lib/mutations/useTransformBesoinToLivraison.ts` | 2-step: créer livraison + lier besoin unique — ne PAS modifier |
| `useUpdateLivraison` | `src/lib/mutations/useUpdateLivraison.ts` | Update description/fournisseur/date_prevue avec garde serveur |
| `useUpdateLivraisonStatus` | `src/lib/mutations/useUpdateLivraisonStatus.ts` | Update status uniquement (prevu/livre) |
| `useBesoins(chantierId)` | `src/lib/queries/useBesoins.ts` | `select('*').is('livraison_id', null)`, key: `['besoins', chantierId]` |
| `useAllPendingBesoinsCount()` | `src/lib/queries/useAllPendingBesoinsCount.ts` | key: `['all-pending-besoins-count']` |
| `useLivraisons(chantierId)` | `src/lib/queries/useLivraisons.ts` | `select('*')`, key: `['livraisons', chantierId]` |
| `useAllLivraisons()` | `src/lib/queries/useAllLivraisons.ts` | `select('*, chantiers(nom)')`, key: `['all-livraisons']` |
| `useLivraisonsCount(chantierId)` | `src/lib/queries/useLivraisonsCount.ts` | key: `['livraisons-count', chantierId]` |
| `useRealtimeBesoins(chantierId)` | `src/lib/subscriptions/useRealtimeBesoins.ts` | Invalide `['besoins', chantierId]` |
| `useRealtimeLivraisons(chantierId)` | `src/lib/subscriptions/useRealtimeLivraisons.ts` | Invalide `['livraisons', chantierId]`, `['livraisons-count', chantierId]` |
| `useRealtimeAllLivraisons()` | `src/lib/subscriptions/useRealtimeAllLivraisons.ts` | Invalide `['all-livraisons']` |
| Page besoins | `src/routes/_authenticated/chantiers/$chantierId/besoins.tsx` | ~310 lignes — liste besoins + Sheet Commander unique + Sheet édition + Dialog suppression |
| Page chantier index | `src/routes/_authenticated/chantiers/$chantierId/index.tsx` | Section léger : besoins inline avec Commander |
| Page livraisons chantier | `src/routes/_authenticated/chantiers/$chantierId/livraisons.tsx` | ~63 lignes — LivraisonsList + LivraisonSheets |
| Page livraisons globale | `src/routes/_authenticated/livraisons.tsx` | Tabs filtre par statut, toutes livraisons |
| `Checkbox` | `src/components/ui/checkbox.tsx` | shadcn/ui — déjà installé |
| `Sheet` | `src/components/ui/sheet.tsx` | Bottom sheet — déjà utilisé partout |
| `Collapsible` | `src/components/ui/collapsible.tsx` | shadcn/ui — vérifier s'il est installé, sinon utiliser state local + animation |
| Type `Besoin` | `src/types/database.ts:248-255` | `{id, chantier_id, description, livraison_id, created_at, created_by}` |
| Type `Livraison` | `src/types/database.ts:258-271` | `{id, chantier_id, description, status, fournisseur, date_prevue, bc_*, bl_*, created_at, created_by}` |

### Aucune migration SQL nécessaire

Le schéma existant supporte déjà le rattachement de N besoins à 1 livraison via `besoins.livraison_id` (FK nullable). La query `useBesoins` filtre déjà par `livraison_id IS NULL` pour les besoins en attente. Il suffit de :
1. Créer la livraison (même pattern que `useCreateLivraison`)
2. Batch update les besoins : `SET livraison_id = <new_id> WHERE id IN (...) AND livraison_id IS NULL`

Les triggers existants loggent automatiquement `besoin_ordered` quand `livraison_id` passe de null à une valeur (trigger `trg_besoin_activity` sur UPDATE de `livraison_id`). Aucun nouveau type d'activité n'est nécessaire.

### Mutation : useCreateGroupedLivraison (NOUVELLE)

```typescript
// src/lib/mutations/useCreateGroupedLivraison.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import type { Besoin, Livraison } from '@/types/database'

interface CreateGroupedLivraisonInput {
  chantierId: string
  besoinIds: string[]
  description: string
  fournisseur?: string
}

export function useCreateGroupedLivraison() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ chantierId, besoinIds, description, fournisseur }: CreateGroupedLivraisonInput) => {
      // Étape 1 : créer la livraison
      const { data: livraison, error: livraisonError } = await supabase
        .from('livraisons')
        .insert({
          chantier_id: chantierId,
          description,
          fournisseur: fournisseur || null,
          status: 'commande' as const,
          created_by: user?.id ?? null,
        })
        .select()
        .single()
      if (livraisonError) throw livraisonError

      // Étape 2 : rattacher tous les besoins en batch
      const { error: besoinsError } = await supabase
        .from('besoins')
        .update({ livraison_id: livraison.id })
        .in('id', besoinIds)
        .is('livraison_id', null) // Garde : empêche double-rattachement
      if (besoinsError) throw besoinsError

      return livraison as unknown as Livraison
    },
    onMutate: async ({ chantierId, besoinIds }) => {
      await queryClient.cancelQueries({ queryKey: ['besoins', chantierId] })
      const previousBesoins = queryClient.getQueryData(['besoins', chantierId])
      // Retirer les besoins sélectionnés du cache
      queryClient.setQueryData(
        ['besoins', chantierId],
        (old: Besoin[] | undefined) =>
          (old ?? []).filter((b) => !besoinIds.includes(b.id)),
      )
      return { previousBesoins }
    },
    onError: (_err, { chantierId }, context) => {
      queryClient.setQueryData(['besoins', chantierId], context?.previousBesoins)
    },
    onSettled: (_data, _error, { chantierId }) => {
      queryClient.invalidateQueries({ queryKey: ['besoins', chantierId] })
      queryClient.invalidateQueries({ queryKey: ['livraisons', chantierId] })
      queryClient.invalidateQueries({ queryKey: ['livraisons-count', chantierId] })
      queryClient.invalidateQueries({ queryKey: ['all-pending-besoins-count'] })
      queryClient.invalidateQueries({ queryKey: ['all-livraisons'] })
    },
  })
}
```

**Points clés :**
- Pattern 2-step identique à `useTransformBesoinToLivraison` mais pour N besoins
- `.in('id', besoinIds)` + `.is('livraison_id', null)` — garde serveur contre le double-rattachement
- L'optimistic update retire les besoins du cache immédiatement
- Invalide toutes les queries impactées dans onSettled

### Query : useBesoinsForLivraison (NOUVELLE)

```typescript
// src/lib/queries/useBesoinsForLivraison.ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Besoin } from '@/types/database'

export function useBesoinsForLivraison(livraisonId: string | null) {
  return useQuery({
    queryKey: ['besoins-for-livraison', livraisonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('besoins')
        .select('*')
        .eq('livraison_id', livraisonId!)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as unknown as Besoin[]
    },
    enabled: !!livraisonId,
    placeholderData: [],
  })
}
```

**Alternative plus performante (1 query pour toutes les livraisons d'un chantier) :**
```typescript
// Approche avec Map<livraisonId, Besoin[]>
// Utiliser useBesoins sans filtre livraison_id IS NULL,
// ou créer une query dédiée qui récupère TOUS les besoins d'un chantier
// et les regroupe par livraison_id côté client.
// Préférer cette approche si chaque DeliveryCard ferait une query individuelle.
```

**Recommandation :** Créer un hook `useAllBesoinsForChantier(chantierId)` qui fetch tous les besoins (avec et sans livraison_id), puis construire un `Map<string, Besoin[]>` côté client. Cela évite N+1 queries (une par DeliveryCard). Les subscriptions `useRealtimeBesoins` invalideront automatiquement ce cache.

```typescript
// src/lib/queries/useAllBesoinsForChantier.ts
export function useAllBesoinsForChantier(chantierId: string) {
  return useQuery({
    queryKey: ['all-besoins', chantierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('besoins')
        .select('*')
        .eq('chantier_id', chantierId)
        .not('livraison_id', 'is', null)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as unknown as Besoin[]
    },
    enabled: !!chantierId,
    placeholderData: [],
  })
}

// Helper pour construire le Map
export function buildBesoinsMap(besoins: Besoin[]): Map<string, Besoin[]> {
  const map = new Map<string, Besoin[]>()
  for (const b of besoins) {
    if (b.livraison_id) {
      const list = map.get(b.livraison_id) ?? []
      list.push(b)
      map.set(b.livraison_id, list)
    }
  }
  return map
}
```

**Pour la vue globale (`livraisons.tsx`)** qui montre les livraisons de TOUS les chantiers : utiliser `useBesoinsForLivraison(livraisonId)` par carte OU (mieux) une query globale `useAllLinkedBesoins()` qui récupère tous les besoins liés à une livraison (pas besoin de filtrer par chantier).

### BesoinsList — Mode sélection

**Nouvelles props :**
```typescript
interface BesoinsListProps {
  besoins: Besoin[] | undefined
  isLoading: boolean
  onOpenSheet: () => void
  onCommander: (besoin: Besoin) => void
  onEdit?: (besoin: Besoin) => void
  onDelete?: (besoin: Besoin) => void
  // NOUVEAU — mode sélection
  selectionMode?: boolean
  selectedIds?: Set<string>
  onToggleSelect?: (id: string) => void
  onLongPress?: (besoin: Besoin) => void
}
```

**Comportement en mode sélection :**
- Checkbox visible à gauche de chaque besoin (composant shadcn `Checkbox`)
- Checked = `selectedIds.has(besoin.id)`
- Tap sur la ligne entière = toggle (pas besoin de taper exactement la checkbox)
- DropdownMenu (Modifier/Supprimer) masqué
- Bouton "Commander" individuel masqué
- Le bouton "Créer un besoin" (état vide) reste visible

**Appui long (mode normal → mode sélection) :**
```typescript
// Pattern appui long (>500ms)
const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

function handlePointerDown(besoin: Besoin) {
  longPressTimer.current = setTimeout(() => {
    onLongPress?.(besoin)
  }, 500)
}

function handlePointerUp() {
  if (longPressTimer.current) {
    clearTimeout(longPressTimer.current)
    longPressTimer.current = null
  }
}
```
**Attention :** Utiliser `onPointerDown`/`onPointerUp` (pas `onTouchStart`) pour compatibilité desktop. Ajouter `touch-action: none` sur l'élément pour empêcher le scroll pendant l'appui long.

**Alternative simplifiée :** Au lieu de l'appui long (UX complexe, edge cases), ajouter un bouton "Sélectionner" visible en haut de la liste (icône `ListChecks`) qui active le mode sélection. L'AC dit "appui long OU tape un bouton Sélectionner". Implémenter les deux :
- Bouton "Sélectionner" dans le header de la section (toujours visible s'il y a ≥ 2 besoins)
- Appui long comme raccourci gestuel

### Page besoins — Gestion du mode sélection

**Nouveaux states :**
```typescript
// Mode sélection groupée
const [selectionMode, setSelectionMode] = useState(false)
const [selectedBesoinIds, setSelectedBesoinIds] = useState<Set<string>>(new Set())

// Sheet commande groupée
const [showGroupeSheet, setShowGroupeSheet] = useState(false)
const [groupeDescription, setGroupeDescription] = useState('')
const [groupeFournisseur, setGroupeFournisseur] = useState('')
const [groupeError, setGroupeError] = useState('')
```

**Handlers clés :**
```typescript
function handleLongPress(besoin: Besoin) {
  setSelectionMode(true)
  setSelectedBesoinIds(new Set([besoin.id]))
}

function handleToggleSelect(id: string) {
  setSelectedBesoinIds((prev) => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    // Si plus rien de sélectionné → quitter le mode sélection
    if (next.size === 0) setSelectionMode(false)
    return next
  })
}

function handleEnterSelectionMode() {
  setSelectionMode(true)
  setSelectedBesoinIds(new Set())
}

function handleCancelSelection() {
  setSelectionMode(false)
  setSelectedBesoinIds(new Set())
}

function handleOpenGroupeSheet() {
  setGroupeDescription('')
  setGroupeFournisseur('')
  setGroupeError('')
  setShowGroupeSheet(true)
}

function handleConfirmGroupe() {
  const trimmed = groupeDescription.trim()
  if (!trimmed) {
    setGroupeError("L'intitulé de la commande est requis")
    return
  }
  createGroupedLivraison.mutate(
    {
      chantierId,
      besoinIds: Array.from(selectedBesoinIds),
      description: trimmed,
      fournisseur: groupeFournisseur.trim() || undefined,
    },
    {
      onSuccess: () => {
        setShowGroupeSheet(false)
        setSelectionMode(false)
        setSelectedBesoinIds(new Set())
        toast('Commande créée')
      },
      onError: () => toast.error('Erreur lors de la commande'),
    },
  )
}
```

**Layout de la barre de sélection (bas de l'écran) :**
```tsx
{selectionMode && (
  <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background p-4 flex items-center justify-between gap-2 safe-area-bottom">
    <Button variant="ghost" onClick={handleCancelSelection}>
      Annuler
    </Button>
    <span className="text-sm text-muted-foreground">
      {selectedBesoinIds.size} sélectionné{selectedBesoinIds.size > 1 ? 's' : ''}
    </span>
    <Button onClick={handleOpenGroupeSheet} disabled={selectedBesoinIds.size === 0}>
      Commander ({selectedBesoinIds.size})
    </Button>
  </div>
)}
```

**Sheet commande groupée :**
```tsx
<Sheet open={showGroupeSheet} onOpenChange={setShowGroupeSheet}>
  <SheetContent side="bottom">
    <SheetHeader>
      <SheetTitle>Commander {selectedBesoinIds.size} besoin{selectedBesoinIds.size > 1 ? 's' : ''}</SheetTitle>
      <SheetDescription>
        Créer une livraison regroupant les besoins sélectionnés.
      </SheetDescription>
    </SheetHeader>
    <div className="px-4 flex flex-col gap-3">
      {/* Intitulé obligatoire */}
      <div>
        <label htmlFor="groupe-description" className="text-sm font-medium mb-1 block">
          Intitulé de la commande
        </label>
        <Textarea
          id="groupe-description"
          value={groupeDescription}
          onChange={(e) => {
            setGroupeDescription(e.target.value)
            if (groupeError) setGroupeError('')
          }}
          placeholder="Ex: Carrelage cuisine T2"
          aria-invalid={!!groupeError}
          rows={2}
        />
        {groupeError && (
          <p className="text-sm text-destructive mt-1">{groupeError}</p>
        )}
      </div>
      {/* Fournisseur optionnel */}
      <div>
        <label htmlFor="groupe-fournisseur" className="text-sm font-medium mb-1 block">
          Fournisseur
        </label>
        <Input
          id="groupe-fournisseur"
          value={groupeFournisseur}
          onChange={(e) => setGroupeFournisseur(e.target.value)}
          placeholder="Optionnel"
        />
      </div>
      {/* Résumé des besoins sélectionnés */}
      <div>
        <p className="text-sm font-medium mb-1">Besoins inclus :</p>
        <ul className="text-sm text-muted-foreground space-y-1">
          {besoins?.filter((b) => selectedBesoinIds.has(b.id)).map((b) => (
            <li key={b.id} className="truncate">• {b.description}</li>
          ))}
        </ul>
      </div>
    </div>
    <SheetFooter>
      <Button
        onClick={handleConfirmGroupe}
        disabled={createGroupedLivraison.isPending}
        className="w-full"
      >
        Confirmer la commande
      </Button>
    </SheetFooter>
  </SheetContent>
</Sheet>
```

### DeliveryCard — Indicateur besoins et accordéon

**Nouvelle prop :**
```typescript
interface DeliveryCardProps {
  // ... props existantes ...
  linkedBesoins?: Besoin[]  // NOUVEAU — besoins rattachés à cette livraison
}
```

**Rendu :**
```tsx
// Après la ligne fournisseur, avant la ligne metadata
{linkedBesoins && linkedBesoins.length > 0 && (
  <>
    <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      aria-expanded={expanded}
    >
      <ListChecks className="h-3.5 w-3.5" />
      <span>{linkedBesoins.length} besoin{linkedBesoins.length > 1 ? 's' : ''}</span>
      <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', expanded && 'rotate-180')} />
    </button>
    {expanded && (
      <div className="mt-2 space-y-1 pl-4 border-l-2 border-muted">
        {linkedBesoins.map((b) => (
          <div key={b.id} className="text-sm">
            <span className="text-foreground">{b.description}</span>
            <span className="text-muted-foreground text-xs ml-2">
              {formatRelativeTime(b.created_at)}
            </span>
          </div>
        ))}
      </div>
    )}
  </>
)}
```

**State local :**
```typescript
const [expanded, setExpanded] = useState(false)
```

**Imports à ajouter :**
```typescript
import { ListChecks, ChevronDown } from 'lucide-react'
```

### Schéma DB — Pas de changement

Tables existantes utilisées :
- `besoins` : colonne `livraison_id` (FK nullable vers `livraisons.id`) — utilisée pour le rattachement
- `livraisons` : inchangée
- Triggers existants : `trg_besoin_activity` logge `besoin_ordered` sur UPDATE de `livraison_id`

### Project Structure Notes

**Nouveaux fichiers (3-4) :**
- `src/lib/mutations/useCreateGroupedLivraison.ts`
- `src/lib/mutations/useCreateGroupedLivraison.test.ts`
- `src/lib/queries/useAllBesoinsForChantier.ts` (ou `useBesoinsForLivraison.ts`)

**Fichiers modifiés (~9) :**
- `src/components/BesoinsList.tsx` — mode sélection (checkbox, appui long, masquer actions)
- `src/components/DeliveryCard.tsx` — prop `linkedBesoins`, badge "N besoins", accordéon
- `src/components/DeliveryCard.test.tsx` — tests indicateur besoins + accordéon
- `src/components/LivraisonsList.tsx` — prop `besoinsMap` + propagation aux DeliveryCards
- `src/routes/_authenticated/chantiers/$chantierId/besoins.tsx` — mode sélection + Sheet groupée
- `src/routes/_authenticated/chantiers/$chantierId/besoins.test.tsx` — tests sélection + commande groupée
- `src/routes/_authenticated/chantiers/$chantierId/index.tsx` — section léger : même logique sélection
- `src/routes/_authenticated/chantiers/$chantierId/livraisons.tsx` — passer besoinsMap
- `src/routes/_authenticated/livraisons.tsx` — passer besoinsMap (vue globale)

**Fichiers NON touchés (ne pas modifier) :**
- `src/lib/mutations/useTransformBesoinToLivraison.ts` — mutation single existante, INCHANGÉE (le bouton "Commander" individuel hors mode sélection l'utilise toujours)
- `src/lib/mutations/useCreateLivraison.ts` — création directe de livraison, INCHANGÉE
- `src/lib/mutations/useUpdateLivraison.ts` — édition de livraison, INCHANGÉE
- `src/lib/mutations/useUpdateBesoin.ts` — édition de besoin, INCHANGÉE
- `src/lib/mutations/useDeleteBesoin.ts` — suppression de besoin, INCHANGÉE
- `src/lib/queries/useBesoins.ts` — filtre `livraison_id IS NULL` inchangé (auto-exclut les besoins commandés)
- `src/lib/hooks/useLivraisonActions.ts` — hook livraisons, pas concerné par la sélection de besoins
- `src/lib/subscriptions/` — toutes les subscriptions existantes suffisent
- `src/types/database.ts` — aucun nouveau type nécessaire
- `supabase/migrations/` — aucune migration nécessaire

### Composant Checkbox shadcn/ui

Vérifier si `src/components/ui/checkbox.tsx` existe. Si non, l'installer :
```bash
npx shadcn@latest add checkbox
```

Ce composant utilise Radix UI `@radix-ui/react-checkbox` et s'utilise :
```tsx
import { Checkbox } from '@/components/ui/checkbox'
<Checkbox checked={isSelected} onCheckedChange={() => onToggleSelect(id)} />
```

### Tests — Stratégie

**useCreateGroupedLivraison.test.ts (4 tests) :**
- Crée une livraison + rattache N besoins
- Passe fournisseur quand fourni
- Gère l'erreur Supabase (rollback optimistic)
- Invalide toutes les query keys nécessaires

**BesoinsList (via besoins.test.tsx, 5+ tests ajoutés) :**
- Bouton "Sélectionner" visible quand ≥ 2 besoins
- Mode sélection : checkboxes apparaissent
- Toggle checkbox → `onToggleSelect` appelé
- Mode sélection : boutons Commander/Modifier/Supprimer masqués
- Annuler → mode sélection désactivé

**DeliveryCard.test.tsx (4+ tests ajoutés) :**
- Affiche "N besoins" quand `linkedBesoins` non vide
- N'affiche rien quand `linkedBesoins` vide ou absent
- Clic sur l'indicateur → accordéon se déplie
- Accordéon affiche la description de chaque besoin

**besoins.test.tsx (5+ tests ajoutés) :**
- Mode sélection activé après appui long (ou bouton Sélectionner)
- Barre de sélection affiche le compteur correct
- Bouton "Commander (N)" ouvre le Sheet groupé
- Sheet groupé valide l'intitulé obligatoire
- Confirmation appelle la mutation avec les bons IDs et reset le mode

**Mock patterns :**
```typescript
// Mock useCreateGroupedLivraison
vi.mock('@/lib/mutations/useCreateGroupedLivraison', () => ({
  useCreateGroupedLivraison: () => ({
    mutate: vi.fn((_input, opts) => opts?.onSuccess?.()),
    isPending: false,
  }),
}))

// Mock Supabase chainable pour useCreateGroupedLivraison
// Étape 1: insert livraison
const mockSingle = vi.fn().mockResolvedValue({ data: newLivraison, error: null })
const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
// Étape 2: batch update besoins
const mockIs = vi.fn().mockResolvedValue({ error: null })
const mockIn = vi.fn().mockReturnValue({ is: mockIs })
const mockUpdate = vi.fn().mockReturnValue({ in: mockIn })

vi.mocked(supabase.from).mockImplementation((table: string) => {
  if (table === 'livraisons') return { insert: mockInsert } as any
  if (table === 'besoins') return { update: mockUpdate } as any
  return {} as any
})
```

### Prérequis et dépendances

- **Aucune migration SQL** nécessaire — le schéma existant supporte déjà N besoins par livraison
- **Composant shadcn Checkbox** : vérifier l'installation (`npx shadcn add checkbox` si absent)
- **Aucune dépendance npm** à ajouter
- **Stories 6.1-6.7** : `done` — cycle complet besoins/livraisons/fournisseur/édition
- **Subscriptions** : DÉJÀ en place pour besoins et livraisons — aucun changement nécessaire

### Risques et points d'attention

1. **Appui long (long press)** : Le pattern `onPointerDown` + `setTimeout` peut interférer avec le scroll sur mobile. Ajouter `touch-action: manipulation` sur l'élément et clearTimeout sur `onPointerMove` (mouvement = scroll, pas appui long). Alternative : le bouton "Sélectionner" est plus fiable en UX terrain (gants de chantier, doigts mouillés). Implémenter les deux mais prioriser le bouton.

2. **Performance de l'accordéon besoins** : Si une livraison a beaucoup de besoins, le rendu de l'accordéon dans chaque DeliveryCard pourrait être lourd. Solution : `useAllBesoinsForChantier` fetch une seule fois + Map. Pour la vue globale, utiliser une query par chantier lazy-loaded ou accepter des requêtes individuelles.

3. **Barre de sélection fixe en bas** : Quand la barre apparaît, elle doit pousser la BottomNavigation (ou la remplacer temporairement). Utiliser `fixed bottom-0 z-50` avec un `pb-[72px]` sur le contenu scrollable pour éviter le chevauchement. La BottomNavigation est masquée sur les écrans de détail profond (besoins est un écran profond) — vérifier le layout actuel.

4. **Mode sélection vs actions individuelles** : En mode sélection, les actions individuelles (Commander un seul, Modifier, Supprimer) doivent être masquées pour éviter la confusion. Le tap normal en mode sélection = toggle la checkbox (pas d'ouverture du menu). Le retour au mode normal restaure toutes les actions.

5. **Garde serveur batch** : `.is('livraison_id', null)` sur le batch update empêche de rattacher un besoin déjà commandé. Si un besoin a été commandé entre-temps (par un autre utilisateur), l'update le skip silencieusement. La mutation ne lève pas d'erreur mais certains besoins peuvent ne pas être liés. Acceptable pour 2-3 utilisateurs — le realtime corrigera l'affichage.

6. **Vue globale livraisons (livraisons.tsx)** : Pour l'accordéon besoins dans la vue globale, il faut une query globale car les livraisons viennent de tous les chantiers. Options :
   - `useAllLinkedBesoins()` : query qui fetch tous les besoins WHERE livraison_id IS NOT NULL, groupés par livraison_id
   - Ou lazy-load par DeliveryCard : `useBesoinsForLivraison(livraisonId)` (N+1 mais simple)
   - **Recommandation** : lazy-load individuel (expand = fetch) car la vue globale peut avoir beaucoup de livraisons et la plupart ne seront pas dépliées.

7. **Pre-existing issues** : Mêmes que stories précédentes — failures pré-existants (pwa-config, hasPointerCapture, placeholderData queries), lint error ThemeProvider.tsx:64.

8. **Unified flow (AC #9)** : Quand 1 seul besoin est sélectionné en mode sélection, le formulaire groupé s'affiche (intitulé + fournisseur). C'est DIFFÉRENT du bouton "Commander" individuel (hors mode sélection) qui utilise `useTransformBesoinToLivraison` avec un flow plus simple. Les deux coexistent — ne PAS supprimer le flow individuel.

### Learnings des stories précédentes (relevants)

**Story 6.7 (fournisseur + édition livraisons) :**
- Pattern Sheet avec validation : Textarea/Input pré-rempli, trim+empty check, toast success/error
- `EditLivraisonSheet` extrait comme composant réutilisable (DRY) — bon pattern
- `DropdownMenu` conditionnel sur DeliveryCard via prop optionnelle
- Invalider `['all-livraisons']` dans onSettled pour la vue globale

**Story 6.6 (édition + suppression besoins) :**
- DropdownMenu `MoreVertical` sur BesoinsList : items "Modifier" + "Supprimer"
- Sheet édition besoin (description Textarea pré-remplie)
- AlertDialog confirmation suppression
- Props optionnelles `onEdit/onDelete` — DropdownMenu conditionnel (rétrocompatible)
- Le DropdownMenu doit être MASQUÉ en mode sélection (sinon conflit UX)

**Story 6.2 (livraisons cycle de vie) :**
- `useLivraisonActions` hook partagé : state centralisé pour les routes livraisons
- Ce hook n'est PAS concerné par la sélection de besoins (contexte différent)

**Story 6.1 (besoins création + Commander unique) :**
- `useTransformBesoinToLivraison` : mutation 2-step — pattern réutilisé et étendu pour le batch
- `useBesoins` filtre `livraison_id IS NULL` — les besoins rattachés disparaissent automatiquement

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 6.8, FR77 (sélection multiple), FR78 (intitulé personnalisé), FR79 (fournisseur), FR80 (accordéon besoins)]
- [Source: _bmad-output/planning-artifacts/architecture.md — Pattern mutations optimistes 2-step, Supabase Client SDK, TanStack Query conventions, query keys]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Formulaires max 3 champs, zones tactiles 48px+, pas de confirmation actions terrain]
- [Source: _bmad-output/implementation-artifacts/6-7-fournisseur-et-edition-des-livraisons.md — Pattern Sheet édition, EditLivraisonSheet, DeliveryCard enrichi]
- [Source: src/components/BesoinsList.tsx — Composant existant (~116 lignes), DropdownMenu + Commander]
- [Source: src/components/DeliveryCard.tsx — Composant existant (~148 lignes), layout carte livraison]
- [Source: src/lib/mutations/useTransformBesoinToLivraison.ts — Pattern transform 2-step (single)]
- [Source: src/lib/mutations/useCreateLivraison.ts — Pattern création avec optimistic + fournisseur]
- [Source: src/lib/queries/useBesoins.ts — Query key: ['besoins', chantierId], filtre livraison_id IS NULL]
- [Source: src/lib/queries/useLivraisons.ts — Query key: ['livraisons', chantierId]]
- [Source: src/lib/queries/useAllLivraisons.ts — Query key: ['all-livraisons'], join chantiers(nom)]
- [Source: src/types/database.ts:248-255 — Interface Besoin (livraison_id: string | null)]
- [Source: src/types/database.ts:258-271 — Interface Livraison]
- [Source: src/routes/_authenticated/chantiers/$chantierId/besoins.tsx — Route besoins (~310 lignes)]
- [Source: supabase/migrations/016_besoins_livraisons.sql — Table besoins DDL, FK livraison_id]
- [Source: supabase/migrations/021_besoin_edit_delete.sql — Triggers besoin_ordered sur UPDATE livraison_id]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

Aucun blocage. Implémentation continue sans HALT.

### Completion Notes List

- Task 1: Créé `useBesoinsForLivraison(livraisonId)` — query avec key `['besoins-for-livraison', livraisonId]`, enabled par !!livraisonId, ordonné ASC
- Task 2: Créé `useCreateGroupedLivraison` — mutation 2-step (insert livraison + batch update besoins via `.in()` + `.is('livraison_id', null)`), optimistic update retirant les besoins du cache, rollback onError, invalidation de 5 query keys. 4 tests passent (create+link, fournisseur, erreur+rollback, invalidation keys)
- Task 3: Modifié `BesoinsList` — nouvelles props `selectionMode/selectedIds/onToggleSelect/onLongPress`. Mode sélection : Checkbox shadcn à gauche, tap ligne = toggle, DropdownMenu et bouton Commander masqués. Mode normal : appui long >500ms via `onPointerDown`/`setTimeout` avec `onPointerMove` cancel
- Task 4: Modifié page besoins — 7 nouveaux states, 6 handlers (longPress, toggleSelect, enterSelection, cancelSelection, openGroupeSheet, confirmGroupe). Barre de sélection fixe en bas. Sheet commande groupée (intitulé obligatoire + fournisseur optionnel + résumé besoins). Bouton "Sélectionner" (ListChecks) dans le header quand ≥2 besoins. Header dynamique en mode sélection. Tests existants inchangés et toujours passants
- Task 5: Modifié page chantier index (section léger) — même logique de sélection groupée. Bouton Sélectionner à côté du titre "Besoins en attente". Barre et Sheet groupée identiques. Tests existants inchangés et passants
- Task 6: Modifié `DeliveryCard` — nouvelle prop `linkedBesoins?: Besoin[]`. Indicateur cliquable "N besoins" avec ListChecks + ChevronDown. Accordéon dépliable montrant description + date relative. Rien affiché si vide/absent. 5 nouveaux tests passent (indicateur N besoins, vide, absent, accordéon expand, singulier)
- Task 7: Créé `useAllBesoinsForChantier` + `buildBesoinsMap` helper. Créé `useAllLinkedBesoins` pour vue globale. Modifié `LivraisonsList` avec prop `besoinsMap`. Modifié 3 routes pour fetch et passer le map (livraisons chantier, livraisons globale, index léger)
- Task 8: 89/89 tests story passent. 0 nouvelles erreurs lint. 0 nouvelles erreurs tsc. Tous les échecs sont pré-existants

### Code Review Fixes (Reviewer: Claude Opus 4.6)

- **H2 fix**: Ajouté 2 invalidations manquantes dans `useCreateGroupedLivraison.ts` onSettled : `['all-besoins', chantierId]` et `['all-linked-besoins']`
- **H1 fix**: Ajouté auteur (initiale) + date relative dans l'accordéon des besoins rattachés de `DeliveryCard.tsx` (AC #7 complet)
- **C1 fix**: Ajouté 10 nouveaux tests (7 dans `besoins.test.tsx`, 3 dans `index.test.tsx`) couvrant le mode sélection groupée, compteur, annulation, validation Sheet, et appel mutation
- **C1 fix**: Ajouté 2 assertions dans `useCreateGroupedLivraison.test.ts` pour les clés d'invalidation manquantes
- **DeliveryCard.test.tsx**: Mis à jour test accordéon pour vérifier l'affichage auteur
- Total après review : 99/99 tests passent, 0 erreur tsc, 0 nouvelle erreur lint

### Change Log

- 2026-02-13: Story 6.8 — Commande groupée de besoins (Tasks 1-8 complètes)
- 2026-02-13: Code review — Corrections H1, H2, C1 (tests manquants + cache invalidation + auteur accordéon)

### File List

**Nouveaux fichiers :**
- src/lib/queries/useBesoinsForLivraison.ts
- src/lib/queries/useAllBesoinsForChantier.ts
- src/lib/queries/useAllLinkedBesoins.ts
- src/lib/mutations/useCreateGroupedLivraison.ts
- src/lib/mutations/useCreateGroupedLivraison.test.ts
- src/components/ui/checkbox.tsx (shadcn installé)

**Fichiers modifiés :**
- src/components/BesoinsList.tsx
- src/components/DeliveryCard.tsx
- src/components/DeliveryCard.test.tsx
- src/components/LivraisonsList.tsx
- src/routes/_authenticated/chantiers/$chantierId/besoins.tsx
- src/routes/_authenticated/chantiers/$chantierId/index.tsx
- src/routes/_authenticated/chantiers/$chantierId/livraisons.tsx
- src/routes/_authenticated/livraisons.tsx
