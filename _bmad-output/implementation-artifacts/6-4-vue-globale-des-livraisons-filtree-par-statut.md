# Story 6.4: Vue globale des livraisons filtrée par statut

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que utilisateur de posePilot,
Je veux voir toutes les livraisons de tous mes chantiers filtrées par statut,
Afin que j'anticipe les prochaines réceptions et identifie les retards.

## Acceptance Criteria

1. **Given** l'utilisateur tape sur l'onglet "Livraisons" de la bottom navigation **When** la vue s'affiche **Then** toutes les livraisons de tous les chantiers (complets ET légers) sont listées en DeliveryCards

2. **Given** la vue globale livraisons s'affiche **When** l'utilisateur consulte les tabs de filtre **Then** les filtres "Tous | Commandé | Prévu | Livré" sont disponibles avec un compteur par tab

3. **Given** l'utilisateur active le filtre "Prévu" **When** les résultats s'affichent **Then** seules les livraisons au statut Prévu apparaissent, triées par date de livraison prévue (la plus proche en premier)

4. **Given** des livraisons ont des dates prévues cette semaine **When** l'utilisateur consulte la vue **Then** ces livraisons sont mises en évidence visuellement

5. **Given** des besoins en attente non commandés existent **When** l'utilisateur consulte la vue globale **Then** un badge sur l'onglet "Livraisons" de la bottom nav indique le nombre de besoins non commandés

## Tasks / Subtasks

- [x] Task 1 — Query hook : useAllLivraisons (AC: #1)
  - [x] 1.1 Créer `src/lib/queries/useAllLivraisons.ts`
  - [x] 1.2 Fetch toutes les livraisons avec join `chantiers(nom)` pour afficher le nom du chantier
  - [x] 1.3 Tri par `created_at DESC` par défaut
  - [x] 1.4 Type retour : `LivraisonWithChantier[]` (extends `Livraison` + `chantiers: { nom: string }`)
  - [x] 1.5 Créer `src/lib/queries/useAllLivraisons.test.ts`

- [x] Task 2 — Query hook : useAllPendingBesoinsCount (AC: #5)
  - [x] 2.1 Créer `src/lib/queries/useAllPendingBesoinsCount.ts`
  - [x] 2.2 Count tous les besoins où `livraison_id IS NULL` (cross-chantier)
  - [x] 2.3 QueryKey : `['all-pending-besoins-count']`
  - [x] 2.4 Créer `src/lib/queries/useAllPendingBesoinsCount.test.ts`

- [x] Task 3 — Subscriptions realtime globales (AC: #1, #5)
  - [x] 3.1 Créer `src/lib/subscriptions/useRealtimeAllLivraisons.ts` — écoute ALL livraisons (pas de filtre chantier_id), invalide `['all-livraisons']`
  - [x] 3.2 Créer `src/lib/subscriptions/useRealtimeAllBesoins.ts` — écoute ALL besoins, invalide `['all-pending-besoins-count']`
  - [x] 3.3 Créer les tests correspondants

- [x] Task 4 — Modifier DeliveryCard : nom de chantier et highlight semaine (AC: #1, #4)
  - [x] 4.1 Ajouter prop optionnelle `chantierNom?: string` — afficher sous la description
  - [x] 4.2 Ajouter prop optionnelle `highlighted?: boolean` — appliquer un traitement visuel "Cette semaine"
  - [x] 4.3 Mettre à jour `src/components/DeliveryCard.test.tsx`

- [x] Task 5 — Implémenter la page globale livraisons (AC: #1, #2, #3, #4)
  - [x] 5.1 Remplacer le contenu placeholder de `src/routes/_authenticated/livraisons.tsx`
  - [x] 5.2 Tabs de filtre "Tous | Commandé | Prévu | Livré" avec compteurs via `Tabs`/`TabsList`/`TabsTrigger` shadcn
  - [x] 5.3 Tri par `date_prevue ASC` quand filtre "Prévu" actif, sinon `created_at DESC`
  - [x] 5.4 Calcul `isThisWeek(date_prevue)` et pass `highlighted` prop aux DeliveryCards
  - [x] 5.5 Actions : `useUpdateLivraisonStatus` directement (pas `useLivraisonActions`, car chantierId varie)
  - [x] 5.6 DateSheet inline pour "Marquer prévu" (réutiliser pattern `LivraisonSheets`)
  - [x] 5.7 État vide : icône Truck + "Aucune livraison"
  - [x] 5.8 État loading : `DeliveryCardSkeleton` ×3
  - [x] 5.9 Créer `src/__tests__/livraisons-page.test.tsx`

- [x] Task 6 — Modifier BottomNavigation : badge besoins (AC: #5)
  - [x] 6.1 Ajouter `useAllPendingBesoinsCount()` dans `BottomNavigation`
  - [x] 6.2 Ajouter `useRealtimeAllBesoins()` dans `BottomNavigation` pour garder le badge frais
  - [x] 6.3 Afficher badge rouge sur l'onglet "Livraisons" quand count > 0
  - [x] 6.4 Aria-label : `"Livraisons, X besoins en attente"`
  - [x] 6.5 Mettre à jour `src/components/BottomNavigation.test.tsx`

- [x] Task 7 — Tests de régression (AC: #1-5)
  - [x] 7.1 `npm run test` — tous les tests existants + nouveaux passent
  - [x] 7.2 `npm run lint` — 0 nouvelles erreurs
  - [x] 7.3 `npm run build` — 0 nouvelles erreurs tsc

## Dev Notes

### Vue d'ensemble — Stratégie d'implémentation

Cette story est la **quatrième de l'Epic 6** et implémente la **vue globale des livraisons** accessible depuis la bottom navigation. Les stories 6.1-6.3 ont construit les besoins, livraisons (cycle de vie complet) et documents (BC/BL) au niveau chantier. Cette story **agrège toutes les livraisons cross-chantier** dans une vue filtrée centralisée.

**Scope précis :**
- Page globale livraisons (route `/livraisons`) avec toutes les livraisons de tous les chantiers
- Tabs de filtre par statut avec compteurs
- Tri par date prévue pour le filtre "Prévu"
- Highlight visuel des livraisons prévues cette semaine
- Badge sur l'onglet "Livraisons" de la bottom nav pour les besoins non commandés
- Actions sur les DeliveryCards (marquer prévu, confirmer livraison) fonctionnelles depuis la vue globale

**Hors scope (story suivante) :**
- Gestion d'inventaire avec localisation (Story 6.5)

### Ce qui existe déjà (Stories 6.1-6.3)

| Élément | Fichier | Notes |
|---------|---------|-------|
| `DeliveryCard` | `src/components/DeliveryCard.tsx` | Statut, description, date, badges BC/BL, documents — manque nom chantier et highlight |
| `DeliveryCardSkeleton` | `src/components/DeliveryCard.tsx` | Loading state |
| `LivraisonsList` | `src/components/LivraisonsList.tsx` | Liste de DeliveryCards — PER chantier, pas global |
| `LivraisonSheets` | `src/components/LivraisonSheets.tsx` | Sheets création + date prévue |
| `useLivraisonActions` | `src/lib/hooks/useLivraisonActions.ts` | Hook centralisé — binds chantierId à l'init, PAS réutilisable pour vue globale |
| `useLivraisons(chantierId)` | `src/lib/queries/useLivraisons.ts` | Fetch livraisons PER chantier — PAS réutilisable pour vue globale |
| `useLivraisonsCount(chantierId)` | `src/lib/queries/useLivraisonsCount.ts` | Count PER chantier |
| `useBesoins(chantierId)` | `src/lib/queries/useBesoins.ts` | Fetch besoins PER chantier (livraison_id IS NULL) |
| `useUpdateLivraisonStatus` | `src/lib/mutations/useUpdateLivraisonStatus.ts` | Mutation — accepte chantierId par call, RÉUTILISABLE directement |
| `useRealtimeLivraisons(chantierId)` | `src/lib/subscriptions/useRealtimeLivraisons.ts` | Subscription PER chantier — PAS réutilisable |
| `BottomNavigation` | `src/components/BottomNavigation.tsx` | 4 tabs, badge Activité — PAS de badge Livraisons |
| `livraisons.tsx` route | `src/routes/_authenticated/livraisons.tsx` | Placeholder — titre + "Aucune livraison" |
| `Tabs` / `TabsList` / `TabsTrigger` | `src/components/ui/tabs.tsx` | shadcn composant — variant="line" supporté |
| Type `Livraison` | `src/types/database.ts` | Complet avec bc/bl fields |
| Type `Besoin` | `src/types/database.ts` | Avec livraison_id nullable |

### Pourquoi NE PAS réutiliser certains hooks existants

1. **`useLivraisons(chantierId)`** : Filtre par chantier_id. La vue globale a besoin de TOUTES les livraisons sans filtre. → Nouveau hook `useAllLivraisons`.

2. **`useLivraisonActions(chantierId)`** : Bind `chantierId` au niveau du hook (pour la création). En vue globale, chaque livraison a un `chantier_id` différent. Les actions de statut (`useUpdateLivraisonStatus`) acceptent `chantierId` par call → utiliser directement `useUpdateLivraisonStatus` dans la page.

3. **`useRealtimeLivraisons(chantierId)`** : Subscription filtrée par chantier. → Nouveau hook `useRealtimeAllLivraisons` sans filtre.

4. **`GridFilterTabs`** : Conçu pour un filtrage progress-based (done/total). Les livraisons utilisent un filtrage par statut. → Tabs inline custom dans la page.

### Query : useAllLivraisons

```typescript
// src/lib/queries/useAllLivraisons.ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Livraison } from '@/types/database'

export interface LivraisonWithChantier extends Livraison {
  chantiers: { nom: string }
}

export function useAllLivraisons() {
  return useQuery({
    queryKey: ['all-livraisons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('livraisons')
        .select('*, chantiers(nom)')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as unknown as LivraisonWithChantier[]
    },
  })
}
```

**Points clés :**
- Join `.select('*, chantiers(nom)')` — Supabase auto-join via FK `chantier_id` → `chantiers.id`
- Type `LivraisonWithChantier` — étend `Livraison` avec l'objet `chantiers` nested
- QueryKey : `['all-livraisons']` — distinct de `['livraisons', chantierId]` pour ne pas confliter

### Query : useAllPendingBesoinsCount

```typescript
// src/lib/queries/useAllPendingBesoinsCount.ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useAllPendingBesoinsCount() {
  return useQuery({
    queryKey: ['all-pending-besoins-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('besoins')
        .select('*', { count: 'exact', head: true })
        .is('livraison_id', null)

      if (error) throw error
      return count ?? 0
    },
  })
}
```

**Pattern :** Identique à `useLivraisonsCount` — `head: true` pour ne pas charger les lignes, juste le count.

### Subscriptions globales

```typescript
// src/lib/subscriptions/useRealtimeAllLivraisons.ts
// Channel: 'livraisons:all' (pas de filtre chantier_id)
// Events: '*' (INSERT, UPDATE, DELETE)
// Invalidation: ['all-livraisons']

// src/lib/subscriptions/useRealtimeAllBesoins.ts
// Channel: 'besoins:all' (pas de filtre chantier_id)
// Events: '*'
// Invalidation: ['all-pending-besoins-count']
```

**Pattern identique** à `useRealtimeLivraisons` mais sans le `filter` dans `.on()`. Le channel name n'utilise pas le format `table:filter` mais juste un identifiant unique.

### Modification DeliveryCard — chantierNom et highlight

**Nouvelles props (optionnelles, backward-compatible) :**
```typescript
interface DeliveryCardProps {
  livraison: Livraison
  chantierId: string
  onMarquerPrevu: (id: string) => void
  onConfirmerLivraison: (id: string) => void
  chantierNom?: string      // ← NOUVEAU — affiché sous la description
  highlighted?: boolean     // ← NOUVEAU — traitement visuel "cette semaine"
}
```

**Affichage `chantierNom` :**
- Sous la description, avant la ligne auteur/date
- Texte petit, muted : `<span className="text-xs text-muted-foreground">{chantierNom}</span>`

**Affichage `highlighted` :**
- Quand `true` : ajouter un badge `📅 Cette semaine` compact à côté de la date prévue
- Utiliser `Badge variant="secondary"` avec une couleur blue-ish subtile

```
DELIVERYCARD GLOBAL — LIVRAISON PRÉVUE CETTE SEMAINE :
┌──┬──────────────────────────────────────────────────┐
│  │ Colle pour faïence 20kg                   Prévu  │
│B │ Résidence Les Oliviers                           │
│L │ Y · il y a 2h    📅 14 fév. 2026  📅 Cette sem. │
│E │                                                   │
│U │ 📄 Bon de commande                               │
│  │ facture.pdf                                       │
│  │                         [Confirmer livraison]     │
└──┴──────────────────────────────────────────────────┘
```

**IMPORTANT backward-compat :** Les props sont optionnelles. Les pages chantier existantes (livraisons.tsx, index.tsx) ne les passent pas → comportement identique à avant.

### Page globale livraisons — Architecture

```
┌─────────────────────────────────────────────────┐
│ header: "Livraisons" (h1)                       │
├─────────────────────────────────────────────────┤
│ Tabs: [Tous (12)] [Commandé (5)] [Prévu (4)] [Livré (3)] │
├─────────────────────────────────────────────────┤
│                                                 │
│ DeliveryCard — Livraison A (Résidence Oliviers) │
│ DeliveryCard — Livraison B (Rénovation Duval)   │
│ DeliveryCard — Livraison C (Résidence Oliviers) │
│ ...                                             │
│                                                 │
│ [État vide: icône Truck + "Aucune livraison"]   │
├─────────────────────────────────────────────────┤
│ DateSheet (bottom sheet pour "Marquer prévu")    │
└─────────────────────────────────────────────────┘
```

**Logique de tri :**
- Filtre "Tous" : `created_at DESC` (récentes en premier)
- Filtre "Commandé" : `created_at DESC`
- Filtre "Prévu" : `date_prevue ASC` (plus proches en premier) — **AC3 explicite**
- Filtre "Livré" : `date_prevue DESC` (dernières livrées en premier)

**Logique "Cette semaine" (AC4) :**
```typescript
function isThisWeek(dateStr: string | null): boolean {
  if (!dateStr) return false
  const date = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay() + 1) // Lundi
  startOfWeek.setHours(0, 0, 0, 0)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)
  return date >= startOfWeek && date <= endOfWeek
}
```

**Actions depuis la vue globale :**
- `useUpdateLivraisonStatus` directement — chaque call passe `livraison.chantier_id`
- Pas de `useLivraisonActions` — il bind `chantierId` au hook level
- DateSheet inline : state local `showDateSheet`, `datePrevue`, `livraisonToUpdate`
- Après mutation `onSettled` : l'invalidation de `['livraisons', chantierId]` est faite par la mutation. La subscription `useRealtimeAllLivraisons` invalide `['all-livraisons']` en temps réel.

**Pas de création depuis la vue globale** — l'utilisateur crée les livraisons depuis un chantier spécifique.

### Modification BottomNavigation — badge besoins

```
BOTTOM NAV AVEC BADGE :
┌──────────────┬──────────────┬──────────────┬──────────────┐
│  🏠          │  🚚    (3)   │  🔔    (5)   │  ⚙️          │
│ Chantiers    │ Livraisons   │ Activité     │ Réglages     │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

**Badge "Livraisons" :**
- Apparaît quand `pendingBesoinsCount > 0`
- Même style que le badge "Activité" existant : `bg-[#EF4444]`, text blanc, rond
- Aria-label dynamique : `"Livraisons, ${count} besoins en attente"`

**Hooks ajoutés dans BottomNavigation :**
- `useAllPendingBesoinsCount()` — query pour le count
- `useRealtimeAllBesoins()` — subscription pour garder le badge frais

### Utilitaires existants à réutiliser (NE PAS recréer)

| Utilitaire | Fichier | Usage dans 6.4 |
|-----------|---------|----------------|
| `formatRelativeTime(date)` | `src/lib/utils/formatRelativeTime.ts` | DeliveryCard — déjà utilisé |
| `getDocumentSignedUrl(filePath)` | `src/lib/utils/documentStorage.ts` | DeliveryCard documents — déjà intégré via LivraisonDocumentSlot |
| `supabase` client | `src/lib/supabase.ts` | Queries et subscriptions |

### Composants UI existants à utiliser

| Composant | Fichier | Usage dans 6.4 |
|-----------|---------|----------------|
| **Tabs / TabsList / TabsTrigger** | `src/components/ui/tabs.tsx` | Filtres par statut — variant="line" |
| **Badge** | `src/components/ui/badge.tsx` | "Cette semaine" highlight, compteurs |
| **Card** | `src/components/ui/card.tsx` | Via DeliveryCard |
| **Button** | `src/components/ui/button.tsx` | Actions |
| **Sheet** | `src/components/ui/sheet.tsx` | DateSheet pour marquer prévu |
| **Input** | `src/components/ui/input.tsx` | Input date dans DateSheet |

### Schéma DB — Rappel tables pertinentes

**Table `livraisons` (016_besoins_livraisons.sql) :**

| Colonne | Type | Utilisé en 6.4 |
|---------|------|-----------------|
| id | uuid PK | Oui |
| chantier_id | uuid FK → chantiers | Oui — join pour nom chantier |
| description | text | Oui |
| status | delivery_status (commande/prevu/livre) | Oui — filtres |
| date_prevue | date | Oui — tri et highlight "cette semaine" |
| bc_file_url / bc_file_name | text nullable | Oui — via LivraisonDocumentSlot |
| bl_file_url / bl_file_name | text nullable | Oui — via LivraisonDocumentSlot |
| created_at | timestamptz | Oui — tri par défaut |
| created_by | uuid FK → auth.users | Oui — auteur |

**Table `besoins` (016_besoins_livraisons.sql) :**

| Colonne | Type | Utilisé en 6.4 |
|---------|------|-----------------|
| id | uuid PK | Non |
| chantier_id | uuid FK → chantiers | Non |
| description | text | Non |
| livraison_id | uuid FK → livraisons, nullable | Oui — IS NULL = besoin en attente (count pour badge) |

**Table `chantiers` :**

| Colonne | Type | Utilisé en 6.4 |
|---------|------|-----------------|
| id | uuid PK | Oui — FK livraisons |
| nom | text | Oui — join pour affichage |

### Couleurs sémantiques livraisons (cohérent UX spec)

| Statut | Code | Couleur | Usage |
|--------|------|---------|-------|
| Commandé | `commande` | `#F59E0B` (Orange) | Barre gauche DeliveryCard, tab active |
| Prévu | `prevu` | `#3B82F6` (Blue) | Barre gauche DeliveryCard, tab active |
| Livré | `livre` | `#10B981` (Green) | Barre gauche DeliveryCard, tab active |

### Project Structure Notes

**Nouveaux fichiers (8+) :**
- `src/lib/queries/useAllLivraisons.ts` + test
- `src/lib/queries/useAllPendingBesoinsCount.ts` + test
- `src/lib/subscriptions/useRealtimeAllLivraisons.ts` + test
- `src/lib/subscriptions/useRealtimeAllBesoins.ts` + test

**Fichiers modifiés (5) :**
- `src/routes/_authenticated/livraisons.tsx` — implémentation complète (remplace placeholder)
- `src/components/DeliveryCard.tsx` — ajout props `chantierNom`, `highlighted`
- `src/components/DeliveryCard.test.tsx` — tests nouvelles props
- `src/components/BottomNavigation.tsx` — ajout badge besoins
- `src/components/BottomNavigation.test.tsx` — test badge

**Nouveau fichier test (1) :**
- `src/__tests__/livraisons-page.test.tsx` — tests page globale

### Prérequis et dépendances

- **Aucune migration SQL** — toutes les tables et colonnes existent déjà
- **Aucune dépendance npm à ajouter** — tout est dans le projet
- **Story 6.3** : `done` — DeliveryCard avec BC/BL, LivraisonDocumentSlot, mutations upload/replace
- **Composants shadcn** : Tabs, Badge, Sheet, Input — tous déjà installés

### Risques et points d'attention

1. **Performance query globale** : La query `useAllLivraisons` fetch TOUTES les livraisons cross-chantier. Pour un petit nombre d'utilisateurs (2-3) et un volume raisonnable (50-200 livraisons), c'est acceptable. Pas de pagination pour le MVP.

2. **Optimistic updates cross-cache** : La mutation `useUpdateLivraisonStatus.onSettled` invalide `['livraisons', chantierId]` (cache per-chantier) mais PAS `['all-livraisons']` (cache global). La subscription realtime `useRealtimeAllLivraisons` compense en invalidant `['all-livraisons']` à chaque changement. Le délai entre l'action et le refresh visuel sera de ~1-2s (via realtime) au lieu d'instantané (via optimistic).

3. **Subscription sans filtre** : `useRealtimeAllLivraisons` écoute TOUTES les livraisons sans filtre `chantier_id`. Supabase Realtime envoie un événement pour chaque changement sur la table `livraisons`. Avec un petit volume, c'est ok. Le channel name doit être unique (ex: `livraisons:global`).

4. **DateSheet chantierId** : Quand l'utilisateur clique "Marquer prévu" sur une DeliveryCard en vue globale, le `chantierId` à passer à `useUpdateLivraisonStatus` vient de `livraison.chantier_id`. Stocker le `livraisonToUpdate` complet (pas juste l'id) pour accéder au `chantier_id`.

5. **isThisWeek locale** : Le calcul "cette semaine" utilise le lundi comme début de semaine (convention française). Attention au fuseau horaire — utiliser `new Date(dateStr + 'T00:00:00')` pour éviter les décalages UTC.

6. **Pre-existing issues** : Mêmes que Story 6.3 — 16 test failures pré-existants (pwa-config 5, pwa-html 5, hasPointerCapture 6), lint error ThemeProvider.tsx:64.

### Learnings des stories précédentes (relevants)

- **Subscription pattern** : `useRealtimeLivraisons(chantierId)` — pattern channel + `.on()` + invalidation. Reproduire sans le filtre `chantier_id` pour la version globale.
- **DeliveryCard props** : Le composant accepte déjà `chantierId` (Story 6.3). Ajouter des props optionnelles ne casse rien.
- **Tabs variant="line"** : `GridFilterTabs` utilise `<TabsList variant="line">` — réutiliser ce style visuel pour cohérence.
- **Badge BottomNavigation** : Pattern existant pour le badge Activité — `useUnreadActivityCount` + `useRealtimeActivityLogs()`. Reproduire exactement pour le badge Livraisons.
- **`data as unknown as Type[]`** : Cast pattern établi pour contourner les types Supabase.
- **Mock supabase chainable** : Pattern `from → select → eq → order` chacun retourne mock avec méthode suivante.
- **Route tests** : Utilisent `createRouter` + `createMemoryHistory` + wrappers (AuthContext, QueryClient).

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 6.4, Epic 6, FR52]
- [Source: _bmad-output/planning-artifacts/prd.md — Journey 5 "Youssef bureau", FR52 "vue globale filtrée par statut", Indicateurs home]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — §DeliveryCard, §Bottom Navigation badges, §Status filters tabs, §Couleurs sémantiques livraisons]
- [Source: _bmad-output/planning-artifacts/architecture.md — Routes /livraisons.tsx, Supabase Realtime sans filtre, queries/mutations patterns]
- [Source: _bmad-output/implementation-artifacts/6-3-livraisons-documents-bc-et-bl.md — DeliveryCard, LivraisonDocumentSlot, useLivraisonActions, learnings]
- [Source: src/routes/_authenticated/livraisons.tsx — Placeholder à remplacer]
- [Source: src/components/BottomNavigation.tsx — Badge pattern Activité à reproduire]
- [Source: src/components/DeliveryCard.tsx — Composant à étendre (chantierNom, highlighted)]
- [Source: src/lib/queries/useLivraisons.ts — Pattern query per-chantier (référence)]
- [Source: src/lib/mutations/useUpdateLivraisonStatus.ts — Mutation réutilisable directement]
- [Source: src/lib/subscriptions/useRealtimeLivraisons.ts — Pattern subscription (référence)]
- [Source: src/lib/hooks/useLivraisonActions.ts — Hook NON réutilisable en vue globale (binds chantierId)]
- [Source: src/types/database.ts — Types Livraison, Besoin]
- [Source: src/components/ui/tabs.tsx — Composant shadcn Tabs avec variant="line"]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Test fix: `findByText` → `findAllByText` pour "Résidence Les Oliviers" (2 cards du même chantier)
- Test fix: skeleton detection via `.animate-pulse` class au lieu de `aria-hidden`

### Completion Notes List

- Task 1: `useAllLivraisons` — query `.select('*, chantiers(nom)')` + type `LivraisonWithChantier`, queryKey `['all-livraisons']`. 3 tests.
- Task 2: `useAllPendingBesoinsCount` — count besoins where `livraison_id IS NULL`, queryKey `['all-pending-besoins-count']`. 4 tests.
- Task 3: Subscriptions globales — `useRealtimeAllLivraisons` (channel `livraisons:global`) et `useRealtimeAllBesoins` (channel `besoins:global`), sans filtre chantier_id. 10 tests.
- Task 4: `DeliveryCard` — ajout props optionnelles `chantierNom` (affiché sous description) et `highlighted` (badge "Cette semaine" bleu). Backward-compatible. 4 nouveaux tests (26 total).
- Task 5: Page `/livraisons` — tabs Tous/Commandé/Prévu/Livré avec compteurs, tri `date_prevue ASC` pour Prévu, `isThisWeek()` highlight, `useUpdateLivraisonStatus` direct, DateSheet inline, empty state Truck, loading skeletons ×3. 7 tests.
- Task 6: `BottomNavigation` — badge rouge besoins via `useAllPendingBesoinsCount` + `useRealtimeAllBesoins`, aria-label dynamique. 3 nouveaux tests (12 total).
- Task 7: Régression — 801 tests pass, 16 failures pré-existants (pwa 10 + hasPointerCapture 6). Lint: 1 erreur pré-existante ThemeProvider.tsx:64. Build: erreurs TS pré-existantes database.ts types.

### Change Log

- 2026-02-12: Story 6.4 implementation complete — vue globale livraisons avec filtres par statut, highlight semaine, badge besoins bottom nav
- 2026-02-12: Code review fixes (5 issues) — H1: ajout invalidation `['all-livraisons']` dans useUpdateLivraisonStatus.onSettled. H2: 3 tests d'intégration (Marquer prévu, Confirmer livraison, tri AC3). M1: extraction isThisWeek vers utils + 6 tests unitaires. M2: test tri Prévu ASC. M3: assertion badge besoins renforcée avec within().

### File List

**Nouveaux fichiers :**
- src/lib/queries/useAllLivraisons.ts
- src/lib/queries/useAllLivraisons.test.ts
- src/lib/queries/useAllPendingBesoinsCount.ts
- src/lib/queries/useAllPendingBesoinsCount.test.ts
- src/lib/subscriptions/useRealtimeAllLivraisons.ts
- src/lib/subscriptions/useRealtimeAllLivraisons.test.ts
- src/lib/subscriptions/useRealtimeAllBesoins.ts
- src/lib/subscriptions/useRealtimeAllBesoins.test.ts
- src/__tests__/livraisons-page.test.tsx

**Nouveaux fichiers (review fixes) :**
- src/lib/utils/isThisWeek.ts
- src/lib/utils/isThisWeek.test.ts

**Fichiers modifiés :**
- src/routes/_authenticated/livraisons.tsx
- src/components/DeliveryCard.tsx
- src/components/DeliveryCard.test.tsx
- src/components/BottomNavigation.tsx
- src/components/BottomNavigation.test.tsx
- src/lib/mutations/useUpdateLivraisonStatus.ts (review fix: ajout invalidation `['all-livraisons']`)
