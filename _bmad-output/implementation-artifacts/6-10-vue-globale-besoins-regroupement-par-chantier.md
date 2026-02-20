# Story 6.10: Vue globale des besoins — onglet, regroupement par chantier, transformation en livraisons

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant qu'utilisateur de posePilot,
Je veux voir tous les besoins en attente de tous mes chantiers dans un onglet global et pouvoir les transformer en livraisons,
Afin que je gère centralement mes besoins et commandes sans naviguer dans chaque chantier individuellement.

## Acceptance Criteria

1. **Given** l'utilisateur est connecté **When** l'app s'affiche **Then** la BottomNavigation a 5 onglets : Chantiers | Besoins | Livraisons | Activité | Réglages

2. **Given** l'utilisateur tape sur l'onglet "Besoins" **When** la page `/besoins` s'affiche **Then** tous les besoins en attente (`livraison_id IS NULL`) de tous les chantiers sont affichés, groupés par chantier avec un header affichant le nom du chantier et le nombre de besoins

3. **Given** aucun besoin en attente n'existe **When** la page Besoins s'affiche **Then** un état vide s'affiche avec une icône et "Aucun besoin en attente"

4. **Given** des besoins en attente existent **When** l'utilisateur consulte la BottomNavigation **Then** un badge avec le count apparaît sur l'onglet "Besoins" (et non plus sur "Livraisons")

5. **Given** l'utilisateur est sur la page Besoins **When** il long-press ou tape le bouton sélection **Then** il entre en mode sélection avec des checkboxes sur chaque besoin et un bouton "Tout sélectionner" par chantier

6. **Given** des besoins sont sélectionnés (même cross-chantier) **When** l'utilisateur tape "Passer en livraison (N)" **Then** le système crée 1 livraison par besoin sélectionné (statut `prevu`), les besoins disparaissent de la liste, et un toast confirme l'action

7. **Given** l'utilisateur est dans un chantier de type léger **When** il consulte la page chantier **Then** la section "Livraisons" inline n'est plus affichée et le FAB ne propose que "Nouveau besoin"

8. **Given** l'utilisateur est dans un chantier de type complet **When** il consulte le menu Actions **Then** le lien "Livraisons" n'est plus disponible ; seuls "Besoins" et "Inventaire" restent

## Tasks / Subtasks

- [x] Task 1 — Query : useAllPendingBesoins (AC: #2)
  - [x] 1.1 Créer `src/lib/queries/useAllPendingBesoins.ts`
  - [x] 1.2 Fetch tous les besoins où `livraison_id IS NULL` avec join `chantiers(nom)` pour le nom du chantier
  - [x] 1.3 Tri par `created_at DESC`
  - [x] 1.4 Type retour : `BesoinWithChantier[]` (extends `Besoin` + `chantiers: { nom: string }`)
  - [x] 1.5 QueryKey : `['all-pending-besoins']`
  - [x] 1.6 Créer `src/lib/queries/useAllPendingBesoins.test.ts`

- [x] Task 2 — Mutation : useBulkTransformBesoins (AC: #6)
  - [x] 2.1 Créer `src/lib/mutations/useBulkTransformBesoins.ts`
  - [x] 2.2 Pour chaque besoin sélectionné : créer 1 livraison (statut `prevu`, `status_history: [{ status: 'prevu', date: now }]`) puis update le besoin avec `livraison_id`
  - [x] 2.3 Utiliser `Promise.all` pour paralléliser les créations par chantier
  - [x] 2.4 Invalidation cache : `['all-pending-besoins']`, `['all-pending-besoins-count']`, `['besoins', chantierId]` pour chaque chantier touché, `['livraisons', chantierId]`, `['all-livraisons']`
  - [x] 2.5 Créer `src/lib/mutations/useBulkTransformBesoins.test.ts`

- [x] Task 3 — Subscription : useRealtimeAllPendingBesoins (AC: #2, #4)
  - [x] 3.1 Créer `src/lib/subscriptions/useRealtimeAllPendingBesoins.ts` — écoute ALL besoins, invalide `['all-pending-besoins']` et `['all-pending-besoins-count']`
  - [x] 3.2 Créer test correspondant

- [x] Task 4 — Modifier BottomNavigation : 5 onglets + badge besoins (AC: #1, #4)
  - [x] 4.1 Ajouter onglet "Besoins" entre "Chantiers" et "Livraisons" avec icône `ClipboardList`
  - [x] 4.2 Route : `/besoins`
  - [x] 4.3 Déplacer le badge `pendingBesoinsCount` de l'onglet "Livraisons" vers l'onglet "Besoins"
  - [x] 4.4 Supprimer `useAllPendingBesoinsCount` et `useRealtimeAllBesoins` de BottomNavigation (remplacés par le badge sur Besoins)
  - [x] 4.5 Mettre à jour `src/components/BottomNavigation.test.tsx`

- [x] Task 5 — Route et page globale Besoins (AC: #2, #3, #5, #6)
  - [x] 5.1 Créer `src/routes/_authenticated/besoins.tsx`
  - [x] 5.2 Grouper les besoins par `chantier_id` avec header : nom chantier + count
  - [x] 5.3 Sections triées par chantier ayant le besoin le plus récent en premier
  - [x] 5.4 Chaque besoin : description + auteur initial + date relative
  - [x] 5.5 Mode sélection : long-press ou bouton pour activer, checkboxes par besoin, "Tout sélectionner" par section chantier
  - [x] 5.6 Barre d'action fixe en bas quand sélection active : "Passer en livraison (N)"
  - [x] 5.7 Au tap : appeler `useBulkTransformBesoins`, toast succès, reset sélection
  - [x] 5.8 État vide : icône `ClipboardList` + "Aucun besoin en attente"
  - [x] 5.9 État loading : skeletons
  - [x] 5.10 Créer `src/__tests__/besoins-page.test.tsx`

- [x] Task 6 — Supprimer accès livraisons depuis fiche chantier (AC: #7, #8)
  - [x] 6.1 **Chantier léger** (`index.tsx`): supprimer la section "Livraisons" inline (LivraisonsList, hooks livraisons associés)
  - [x] 6.2 **Chantier léger** : modifier le FAB pour ne garder que "Nouveau besoin" (supprimer "Nouvelle livraison")
  - [x] 6.3 **Chantier complet** (`index.tsx`): supprimer le `DropdownMenuItem` "Livraisons" du menu Actions
  - [x] 6.4 Nettoyer les imports inutilisés (Truck, LivraisonsList, useLivraisons, useLivraisonActions, etc.)
  - [x] 6.5 Mettre à jour `src/routes/_authenticated/chantiers/$chantierId/index.test.tsx`

- [x] Task 7 — Tests de régression (AC: #1-8)
  - [x] 7.1 `npm run test` — tous les tests existants + nouveaux passent (29 échecs pré-existants non liés à cette story)
  - [x] 7.2 `npm run lint` — 0 nouvelles erreurs
  - [x] 7.3 `npm run build` — 0 nouvelles erreurs tsc

## Dev Notes

### Vue d'ensemble — Stratégie d'implémentation

Cette story crée le **nouvel onglet global "Besoins"** et centralise la transformation besoins → livraisons. Elle supprime aussi l'accès aux livraisons depuis les fiches chantier (les livraisons ne sont plus gérées au niveau chantier mais uniquement depuis l'onglet global Livraisons, refactoré en Story 6.11).

**Scope précis :**
- Nouvel onglet "Besoins" dans la bottom nav (5 onglets)
- Page `/besoins` avec besoins groupés par chantier
- Multi-sélection cross-chantier → transformation en livraisons (1 livraison par besoin)
- Badge besoins déplacé de "Livraisons" vers "Besoins"
- Suppression de l'accès livraisons depuis les pages chantier (léger et complet)

**Hors scope (Story 6.11) :**
- Refonte de la page globale livraisons en cartes-résumé par chantier
- Ajout d'onglets de filtre sur la page per-chantier livraisons
- Actions bulk sur les livraisons

### Ce qui existe déjà

| Élément | Fichier | Notes |
|---------|---------|-------|
| `useBesoins(chantierId)` | `src/lib/queries/useBesoins.ts` | Fetch per-chantier, `livraison_id IS NULL` — PAS réutilisable pour vue globale |
| `useAllPendingBesoinsCount` | `src/lib/queries/useAllPendingBesoinsCount.ts` | Count global — RÉUTILISABLE pour badge |
| `useTransformBesoinToLivraison` | `src/lib/mutations/useTransformBesoinToLivraison.ts` | Transform individuel — référence pour la mutation bulk |
| `useCreateGroupedLivraison` | `src/lib/mutations/useCreateGroupedLivraison.ts` | Transform groupé — référence |
| `useRealtimeAllBesoins` | `src/lib/subscriptions/useRealtimeAllBesoins.ts` | Subscription globale besoins — RÉUTILISABLE/adaptable |
| `BottomNavigation` | `src/components/BottomNavigation.tsx` | 4 onglets actuellement, badge besoins sur "Livraisons" |
| `BesoinsList` | `src/components/BesoinsList.tsx` | Liste per-chantier — référence UX |
| Chantier détail | `src/routes/_authenticated/chantiers/$chantierId/index.tsx` | Sections léger (besoins+livraisons inline) et complet (dropdown Actions) |
| Type `Besoin` | `src/types/database.ts` | `{ id, chantier_id, description, livraison_id, created_at, created_by }` |

### Query : useAllPendingBesoins

```typescript
// src/lib/queries/useAllPendingBesoins.ts
export interface BesoinWithChantier extends Besoin {
  chantiers: { nom: string }
}

export function useAllPendingBesoins() {
  return useQuery({
    queryKey: ['all-pending-besoins'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('besoins')
        .select('*, chantiers(nom)')
        .is('livraison_id', null)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as unknown as BesoinWithChantier[]
    },
  })
}
```

**Points clés :**
- Join `.select('*, chantiers(nom)')` — FK `chantier_id` → `chantiers.id`
- Filtre `livraison_id IS NULL` — uniquement les besoins en attente
- QueryKey : `['all-pending-besoins']` — distinct de `['besoins', chantierId]`

### Mutation : useBulkTransformBesoins

```typescript
// src/lib/mutations/useBulkTransformBesoins.ts
interface BulkTransformInput {
  besoins: BesoinWithChantier[]  // besoins sélectionnés
}

// Pour chaque besoin :
// 1. INSERT livraison { chantier_id, description: besoin.description, status: 'prevu', status_history: [...] }
// 2. UPDATE besoin SET livraison_id = new_livraison.id

// Paralléliser avec Promise.all
// Invalidation : tous les caches besoins + livraisons touchés
```

**Pourquoi 1 livraison par besoin (pas groupé) :**
- Plus simple : chaque livraison a sa propre description, son propre cycle de vie
- Le regroupement visuel se fait au niveau de la page livraisons (cartes-résumé par chantier, Story 6.11)
- Pas besoin de demander un intitulé personnalisé à l'utilisateur

### Architecture page Besoins

```
┌─────────────────────────────────────────────────┐
│ header: "Besoins" (h1)                          │
├─────────────────────────────────────────────────┤
│                                                 │
│ ┌─── Résidence Les Oliviers (3 besoins) ──────┐ │
│ │ ☐ Colle pour faïence 20kg    Y · il y a 2h  │ │
│ │ ☐ Croisillons 3mm            Y · hier       │ │
│ │ ☐ Joint gris anthracite      B · il y a 3j  │ │
│ └──────────────────────────────────────────────┘ │
│                                                 │
│ ┌─── Rénovation Duval (2 besoins) ────────────┐ │
│ │ ☐ Primaire d'accrochage      Y · il y a 1h  │ │
│ │ ☐ Silicone transparent       B · il y a 2j  │ │
│ └──────────────────────────────────────────────┘ │
│                                                 │
├─────────────────────────────────────────────────┤
│ [MODE SÉLECTION]                                │
│ ┌───────────────────────────────────────────┐   │
│ │      Passer en livraison (5)              │   │
│ └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

**Mode sélection :**
- Activé par long-press sur un besoin OU bouton dédié
- Checkbox par besoin
- Bouton "Tout" par section chantier pour sélectionner/désélectionner tous les besoins du chantier
- Barre d'action fixe en bas avec compteur

### Modifications chantier détail

**Chantier léger — Avant :**
```
[Besoins en attente (3)]     ← GARDER
  BesoinsList                ← GARDER
[Livraisons (2)]             ← SUPPRIMER
  LivraisonsList             ← SUPPRIMER
FAB: Nouveau besoin | Nouvelle livraison  ← Garder uniquement "Nouveau besoin"
```

**Chantier léger — Après :**
```
[Besoins en attente (3)]
  BesoinsList
FAB: Nouveau besoin
```

**Chantier complet — Avant :**
```
Actions dropdown: Besoins | Livraisons | Inventaire
```

**Chantier complet — Après :**
```
Actions dropdown: Besoins | Inventaire
```

### BottomNavigation — 5 onglets

```
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│  🏠      │ 📋  (3)  │  🚚      │  🔔  (5) │  ⚙️      │
│Chantiers │ Besoins  │Livraisons│ Activité │ Réglages │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

**Icône Besoins :** `ClipboardList` (lucide-react) — cohérent avec le concept de liste de besoins
**Badge :** déplacé de Livraisons → Besoins (même style rouge, même logique `pendingBesoinsCount`)

### Utilitaires existants à réutiliser

| Utilitaire | Fichier | Usage |
|-----------|---------|-------|
| `formatRelativeTime(date)` | `src/lib/utils/formatRelativeTime.ts` | Dates relatives dans la liste |
| `useAllPendingBesoinsCount` | `src/lib/queries/useAllPendingBesoinsCount.ts` | Badge bottom nav |
| `useRealtimeAllBesoins` | `src/lib/subscriptions/useRealtimeAllBesoins.ts` | Adaptable pour invalidation |
| `useAuth` | `src/lib/auth.ts` | Auteur initial dans la liste |

### Schéma DB — Tables pertinentes

**Table `besoins` :**

| Colonne | Type | Usage |
|---------|------|-------|
| id | uuid PK | Identifiant |
| chantier_id | uuid FK → chantiers | Groupement par chantier |
| description | text | Affiché dans la liste |
| livraison_id | uuid FK → livraisons, nullable | IS NULL = besoin en attente |
| created_at | timestamptz | Tri et date relative |
| created_by | uuid FK → auth.users | Auteur initial |

**Table `livraisons` (pour la mutation) :**

| Colonne | Type | Usage |
|---------|------|-------|
| id | uuid PK | Créé par la mutation |
| chantier_id | uuid FK → chantiers | Hérité du besoin |
| description | text | Hérité du besoin |
| status | delivery_status | `prevu` (initial) |
| status_history | jsonb | `[{ status: 'prevu', date: now }]` |
| created_by | uuid FK → auth.users | Utilisateur courant |

### Project Structure Notes

**Nouveaux fichiers :**
- `src/lib/queries/useAllPendingBesoins.ts` + test
- `src/lib/mutations/useBulkTransformBesoins.ts` + test
- `src/lib/subscriptions/useRealtimeAllPendingBesoins.ts` + test
- `src/routes/_authenticated/besoins.tsx`
- `src/__tests__/besoins-page.test.tsx`

**Fichiers modifiés :**
- `src/components/BottomNavigation.tsx` — 5 onglets, badge déplacé
- `src/components/BottomNavigation.test.tsx`
- `src/routes/_authenticated/chantiers/$chantierId/index.tsx` — suppression livraisons
- `src/routes/_authenticated/chantiers/$chantierId/index.test.tsx`

### Risques et points d'attention

1. **5 onglets bottom nav** : C'est le maximum conventionnel sur mobile. L'icône et le label doivent être compacts. Sur petit écran (320px), vérifier que tout tient.

2. **Performance query globale** : `useAllPendingBesoins` fetch TOUS les besoins en attente cross-chantier. Volume raisonnable (50-200 besoins max). Pas de pagination pour le MVP.

3. **Mutation bulk** : `Promise.all` sur N besoins peut être lent si N est grand. Limiter visuellement ? Pour le MVP, pas de limite — le volume est faible.

4. **Suppression livraisons chantier léger** : La section livraisons et les hooks associés (`useLivraisons`, `useLivraisonActions`, `LivraisonsList`) doivent être supprimés proprement. Attention aux imports orphelins.

5. **Route `/besoins`** : Nouvelle route file-based TanStack Router. Sera auto-générée dans `routeTree.gen.ts` au prochain build/dev.

6. **Long-press mobile** : Implémenter via `onTouchStart`/`onTouchEnd` avec timeout 500ms et annulation si `onTouchMove`. Fallback desktop : bouton dédié.

### References

- [Source: src/components/BottomNavigation.tsx — 4 onglets actuels, badge pattern]
- [Source: src/lib/queries/useBesoins.ts — Query per-chantier (référence)]
- [Source: src/lib/queries/useAllPendingBesoinsCount.ts — Count global (réutilisable)]
- [Source: src/lib/mutations/useTransformBesoinToLivraison.ts — Mutation individuelle (référence)]
- [Source: src/lib/mutations/useCreateGroupedLivraison.ts — Mutation groupée (référence)]
- [Source: src/lib/subscriptions/useRealtimeAllBesoins.ts — Subscription globale (adaptable)]
- [Source: src/routes/_authenticated/chantiers/$chantierId/index.tsx — Page chantier à modifier]
- [Source: src/components/BesoinsList.tsx — Liste per-chantier (référence UX)]
- [Source: src/types/database.ts — Types Besoin, Livraison]
- [Source: _bmad-output/implementation-artifacts/6-4-vue-globale-des-livraisons-filtree-par-statut.md — Pattern story précédente]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- useAllPendingBesoins test: `placeholderData: []` causes `isSuccess` immediately — fixed by waiting for actual data
- useRealtimeAllPendingBesoins test: `vi.mock` hoisting prevents variable access — fixed with inline mocks + `vi.mocked().mock.results`
- Chantier index test: "Livraisons" text found in sidebar + BottomNavigation — fixed with `queryByRole('heading')`

### Completion Notes List
- All 7 tasks completed, all ACs covered (#1-#8)
- 35/35 story-specific tests passing across 6 test files
- TypeScript compiles with 0 errors
- ESLint 0 new errors on all story files
- 29 pre-existing test failures (sonner mock, PWA config, etc.) — unrelated to this story
- `useRealtimeAllBesoins` kept in BottomNavigation (renamed import to `useRealtimeAllPendingBesoins`)
- `ChantierIndicators.livraisonsPrevues` made optional to avoid breaking after livraisons removal

### File List

**Created:**
- `src/lib/queries/useAllPendingBesoins.ts`
- `src/lib/queries/useAllPendingBesoins.test.ts`
- `src/lib/mutations/useBulkTransformBesoins.ts`
- `src/lib/mutations/useBulkTransformBesoins.test.ts`
- `src/lib/subscriptions/useRealtimeAllPendingBesoins.ts`
- `src/lib/subscriptions/useRealtimeAllPendingBesoins.test.ts`
- `src/routes/_authenticated/besoins.tsx`
- `src/__tests__/besoins-page.test.tsx`

**Modified:**
- `src/components/BottomNavigation.tsx` — 5 onglets, badge déplacé vers Besoins
- `src/components/BottomNavigation.test.tsx` — Tests mis à jour
- `src/components/ChantierIndicators.tsx` — `livraisonsPrevues` supprimé (code mort nettoyé)
- `src/routes/_authenticated/chantiers/$chantierId/index.tsx` — Suppression livraisons inline + FAB simplifié
- `src/routes/_authenticated/chantiers/$chantierId/index.test.tsx` — Tests mis à jour

### Senior Developer Review (AI)

**Date :** 2026-02-17
**Reviewer :** Claude Opus 4.6 (adversarial code review)

**Résultat :** APPROVED avec corrections appliquées

**Issues trouvées et corrigées :**
- [x] [HIGH] `useBulkTransformBesoins`: `Promise.all` → `Promise.allSettled` pour gestion échec partiel + toast adapté
- [x] [MEDIUM] `getAuthorInitial`: retourne `null` au lieu de `'?'` pour les auteurs inconnus
- [x] [MEDIUM] Tests ajoutés : état loading/skeletons (AC 5.9)
- [x] [MEDIUM] Tests ajoutés : long-press + annulation par mouvement (AC 5.5)
- [x] [LOW] Code mort `livraisonsPrevues` supprimé de `ChantierIndicators`
- [x] [LOW] `initialHistory` timestamp déplacé dans la boucle `map` (chaque livraison a son propre timestamp)

**Issues notées (non corrigées) :**
- [M1] `as unknown as` double casts — dette technique codebase-wide liée à `database.ts`, pas fixable sans refonte des types
- [L2] Spinner sur bouton bulk transform — cosmétique
- [L4] `routeTree.gen.ts` non documenté — fichier auto-généré

**Tests :** 75/75 (6 fichiers) | **Lint :** 0 erreurs | **TypeScript :** 0 erreurs
