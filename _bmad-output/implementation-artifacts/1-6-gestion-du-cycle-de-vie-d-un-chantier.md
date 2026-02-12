# Story 1.6: Gestion du cycle de vie d'un chantier

Status: done
Story ID: 1.6
Story Key: 1-6-gestion-du-cycle-de-vie-d-un-chantier
Epic: 1 — Fondation, Authentification & Gestion des chantiers
Date: 2026-02-09
Dependencies: Story 1.1 (done), Story 1.2 (done), Story 1.3 (done), Story 1.4 (done), Story 1.5 (done)
FRs: FR5

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que utilisateur de posePilot,
Je veux marquer un chantier comme terminé ou le supprimer,
Afin que mon écran d'accueil ne montre que les chantiers actifs pertinents.

## Acceptance Criteria (BDD)

### AC1: Options du chantier accessibles depuis la page détail

**Given** l'utilisateur est sur la vue d'un chantier
**When** il accède aux options du chantier
**Then** il voit les options "Marquer comme terminé" et "Supprimer"

### AC2: Marquer un chantier comme terminé

**Given** l'utilisateur choisit "Marquer comme terminé"
**When** il confirme l'action
**Then** le chantier disparaît de la vue principale des chantiers actifs

### AC3: Supprimer un chantier (action destructive)

**Given** l'utilisateur choisit "Supprimer"
**When** il confirme via la dialog de confirmation (action destructive)
**Then** le chantier est supprimé et disparaît définitivement

### AC4: Filtre "Terminés" pour retrouver les chantiers archivés

**Given** l'utilisateur veut retrouver ses chantiers terminés
**When** il utilise le filtre "Terminés" sur l'écran d'accueil
**Then** les chantiers archivés s'affichent

## Tasks / Subtasks

- [x] Task 1 — Mutations pour le cycle de vie du chantier (AC: #2, #3)
  - [x] 1.1 Créer `src/lib/mutations/useUpdateChantierStatus.ts` — mutation pour changer le statut d'un chantier (`termine` ou `supprime`)
  - [x] 1.2 Pattern optimiste standard : `onMutate` (update cache `['chantiers']` en retirant le chantier de la liste active), `onError` (rollback), `onSettled` (invalidation)
  - [x] 1.3 Fonction mutation : `supabase.from('chantiers').update({ status }).eq('id', chantierId)`
  - [x] 1.4 Après mutation réussie, naviguer vers la page d'accueil via `router.navigate({ to: '/' })`
  - [x] 1.5 Tests unitaires dans `src/lib/mutations/useUpdateChantierStatus.test.ts`

- [x] Task 2 — Page détail chantier avec options (AC: #1, #2, #3)
  - [x] 2.1 Enrichir `src/routes/_authenticated/chantiers/$chantierId.tsx` — charger les données du chantier via une query `useChantier(chantierId)`
  - [x] 2.2 Créer `src/lib/queries/useChantier.ts` — hook TanStack Query pour un chantier unique : `supabase.from('chantiers').select('*').eq('id', chantierId).single()`, query key : `['chantiers', chantierId]`
  - [x] 2.3 Afficher le nom du chantier en header (H1), le badge type (Complet/Léger), le statut d'avancement
  - [x] 2.4 Ajouter un DropdownMenu (shadcn/ui) avec un bouton "⋮" (EllipsisVertical) en haut à droite pour les options
  - [x] 2.5 Items du DropdownMenu : "Marquer comme terminé" (icône CheckCircle2) + "Supprimer" (icône Trash2, texte rouge destructif)
  - [x] 2.6 "Marquer comme terminé" → affiche un AlertDialog de confirmation sobre : "Terminer ce chantier ?" / "Le chantier {nom} sera archivé et disparaîtra de la vue active. Vous pourrez le retrouver via le filtre Terminés." / [Annuler] [Terminer]
  - [x] 2.7 "Supprimer" → affiche un AlertDialog destructif : "Supprimer ce chantier ?" / "Le chantier {nom} sera supprimé définitivement. Cette action est irréversible." / [Annuler] [Supprimer (rouge)]
  - [x] 2.8 À la confirmation, appeler `useUpdateChantierStatus` avec le statut correspondant (`termine` ou `supprime`)
  - [x] 2.9 Afficher un toast de confirmation : "Chantier archivé" ou "Chantier supprimé"
  - [x] 2.10 Gérer les états loading, error et not-found (chantier inexistant ou supprimé)
  - [x] 2.11 Tests dans `src/routes/_authenticated/chantiers/$chantierId.test.tsx` — mise à jour pour tester les options, confirmations, mutations

- [x] Task 3 — Installer les composants shadcn/ui manquants (AC: #1, #3)
  - [x] 3.1 Installer `AlertDialog` via `npx shadcn@latest add alert-dialog`
  - [x] 3.2 Installer `DropdownMenu` via `npx shadcn@latest add dropdown-menu`
  - [x] 3.3 Vérifier que les composants sont générés dans `src/components/ui/`

- [x] Task 4 — Filtres de statut sur l'écran d'accueil (AC: #4)
  - [x] 4.1 Modifier `src/lib/queries/useChantiers.ts` — ajouter un paramètre optionnel `status` au hook, défaut `'active'` pour garder le comportement actuel
  - [x] 4.2 Signature : `useChantiers(status?: ChantierStatus)` avec query key `['chantiers', { status }]`
  - [x] 4.3 Modifier `src/routes/_authenticated/index.tsx` — ajouter des tabs de filtre en haut : "Actifs" (défaut) | "Terminés"
  - [x] 4.4 Utiliser `Tabs` de shadcn/ui — installer via `npx shadcn@latest add tabs` si pas présent
  - [x] 4.5 Tab "Actifs" : appelle `useChantiers('active')` (comportement actuel)
  - [x] 4.6 Tab "Terminés" : appelle `useChantiers('termine')`
  - [x] 4.7 Les chantiers terminés affichent la StatusCard avec statusColor `STATUS_COLORS.DONE` et pas de `Link` vers le détail (lecture seule, pas d'actions)
  - [x] 4.8 État vide pour Terminés : "Aucun chantier terminé"
  - [x] 4.9 Le filtre "Supprimé" n'est PAS exposé — les chantiers supprimés sont définitivement masqués (soft delete)
  - [x] 4.10 Mettre à jour `src/lib/subscriptions/useRealtimeChantiers.ts` — l'invalidation doit couvrir tous les query keys `['chantiers', ...]`
  - [x] 4.11 Mettre à jour les tests de la page d'accueil `src/routes/index.test.tsx`

- [x] Task 5 — Tests finaux et non-régression (toutes AC)
  - [x] 5.1 `src/lib/mutations/useUpdateChantierStatus.test.ts` — mock supabase `.update().eq()`, vérifier optimistic update, rollback, invalidation
  - [x] 5.2 `src/lib/queries/useChantier.test.ts` — mock supabase `.select().eq().single()`, test données et erreur
  - [x] 5.3 Mettre à jour `src/routes/_authenticated/chantiers/$chantierId.test.tsx` — tester DropdownMenu, AlertDialogs, mutations, navigation retour, loading, error, not-found
  - [x] 5.4 Mettre à jour `src/routes/index.test.tsx` — tester tabs Actifs/Terminés, filtre, état vide terminés
  - [x] 5.5 Vérifier que tous les tests existants passent (82 pré-existants + nouveaux = 0 régressions)
  - [x] 5.6 Lint clean (sauf pre-existing ThemeProvider warning)

## Dev Notes

### Architecture & Patterns obligatoires

- **Mutations optimistes standard** — `onMutate` / `onError` / `onSettled` pour le changement de statut, pattern identique à `useCreateChantier` [Source: architecture.md#API & Communication Patterns]
- **Dialog uniquement pour actions destructives** — "Supprimer" utilise un AlertDialog avec bouton destructif rouge. "Marquer terminé" utilise aussi un AlertDialog mais sobre (pas rouge) car l'action est réversible conceptuellement (le chantier reste accessible via filtre) [Source: ux-design-specification.md#Interaction Patterns]
- **Pas de confirmation pour les actions terrain courantes** — seules les actions destructives ou de changement d'état majeur sont confirmées [Source: ux-design-specification.md#Anti-Patterns]
- **Toast après action** — `toast()` de sonner pour confirmer "Chantier archivé" ou "Chantier supprimé" [Source: ux-design-specification.md#Feedback Patterns]
- **Composants shadcn/ui** — AlertDialog et DropdownMenu à installer, pas de composant custom [Source: architecture.md#Enforcement Guidelines]
- **Query keys avec filtres** — convention `['chantiers', { status }]` pour les queries filtrées [Source: architecture.md#Communication Patterns]
- **Realtime invalidation élargie** — `invalidateQueries({ queryKey: ['chantiers'] })` sans filtre exact pour invalider toutes les variantes (actifs ET terminés) [Source: architecture.md#Communication Patterns]
- **Messages en français** [Source: architecture.md#Enforcement Guidelines]
- **Types snake_case** — `status`, `chantier_status`, pas de transformation [Source: architecture.md#Naming Patterns]

### Conventions de nommage

- Fichier mutation : `useUpdateChantierStatus.ts` (camelCase)
- Fichier query : `useChantier.ts` (singulier, pour un chantier unique)
- Tests co-localisés : `.test.ts` / `.test.tsx` à côté du fichier testé
- Pas de barrel files — imports directs

### Stack technique — Versions exactes (déjà installées)

| Bibliothèque | Version | Utilisation dans cette story |
|---|---|---|
| **@supabase/supabase-js** | 2.x | `.update()`, `.eq()`, `.select().single()` |
| **@tanstack/react-query** | 5.x | `useMutation`, `useQuery`, `useQueryClient`, `invalidateQueries` |
| **@tanstack/react-router** | 1.158.x | `Route.useParams()`, `useNavigate()`, `Link` |
| **shadcn/ui** | CLI 3.8.4 | AlertDialog (à installer), DropdownMenu (à installer), Tabs (à installer), Badge, Button, Toast (existants) |
| **lucide-react** | 0.563.x | `EllipsisVertical`, `CheckCircle2`, `Trash2`, `ArrowLeft` |
| **vitest** | 4.0.x | Tests unitaires co-localisés |

### Page détail chantier — Design

```
+--[←]--------[Nom du chantier]--------[⋮]--+
|                                              |
|  [Complet] ou [Léger]           0%           |
|                                              |
|  Contenu placeholder                         |
|  "Détails du chantier à venir"               |
|  (Les sous-pages plots/lots seront           |
|   ajoutées dans les epics futures)           |
|                                              |
+----------------------------------------------+
| [Chantiers] [Livraisons] [Act.] [Reg.]      |
+----------------------------------------------+
```

**Menu "⋮" (DropdownMenu) :**
```
┌────────────────────────────┐
│ ☑  Marquer comme terminé   │
│ 🗑  Supprimer      (rouge) │
└────────────────────────────┘
```

**AlertDialog "Terminer" (sobre) :**
```
┌────────────────────────────────────┐
│  Terminer ce chantier ?            │
│                                    │
│  Le chantier {nom} sera archivé    │
│  et disparaîtra de la vue active.  │
│  Vous pourrez le retrouver via     │
│  le filtre Terminés.               │
│                                    │
│       [Annuler]  [Terminer]        │
└────────────────────────────────────┘
```

**AlertDialog "Supprimer" (destructif) :**
```
┌────────────────────────────────────┐
│  Supprimer ce chantier ?           │
│                                    │
│  Le chantier {nom} sera supprimé   │
│  définitivement. Cette action est  │
│  irréversible.                     │
│                                    │
│     [Annuler]  [Supprimer] 🔴     │
└────────────────────────────────────┘
```

### Écran d'accueil — Tabs de filtre

```
+----------------------------------+
|           Chantiers              |
+----------------------------------+
|  [Actifs]  [Terminés]            |  ← Tabs
+----------------------------------+
|                                  |
|  (liste StatusCards filtrée)     |
|                                  |
+----------------------------------+
```

- Tab "Actifs" : sélectionné par défaut, affiche le comportement actuel
- Tab "Terminés" : affiche les chantiers archivés (status = 'termine')
- Le tab actif est visuellement distinct (style shadcn/ui Tabs)
- Les chantiers terminés ne sont PAS cliquables (pas de `Link` vers détail) — lecture seule
- StatusCard en mode terminé : `statusColor = STATUS_COLORS.DONE` (vert), badge "Complet" ou "Léger" conservé

### Mutation — Pattern standard

```typescript
// src/lib/mutations/useUpdateChantierStatus.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type ChantierStatus = Database['public']['Enums']['chantier_status']

interface UpdateStatusParams {
  chantierId: string
  status: ChantierStatus
}

export function useUpdateChantierStatus() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async ({ chantierId, status }: UpdateStatusParams) => {
      const { data, error } = await supabase
        .from('chantiers')
        .update({ status })
        .eq('id', chantierId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onMutate: async ({ chantierId }) => {
      await queryClient.cancelQueries({ queryKey: ['chantiers'] })
      // Snapshot des caches pour rollback
      const previousActive = queryClient.getQueryData(['chantiers', { status: 'active' }])
      const previousAll = queryClient.getQueryData(['chantiers'])
      // Retirer le chantier de toutes les listes en cache
      queryClient.setQueriesData(
        { queryKey: ['chantiers'] },
        (old: unknown[] | undefined) =>
          old?.filter((c: any) => c.id !== chantierId) ?? []
      )
      return { previousActive, previousAll }
    },
    onError: (_err, _vars, context) => {
      // Rollback
      if (context?.previousActive) {
        queryClient.setQueryData(['chantiers', { status: 'active' }], context.previousActive)
      }
      if (context?.previousAll) {
        queryClient.setQueryData(['chantiers'], context.previousAll)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['chantiers'] })
      navigate({ to: '/' })
    },
  })
}
```

**IMPORTANT :** L'invalidation `{ queryKey: ['chantiers'] }` sans filtre exact invalide TOUTES les variantes (actifs, terminés). Ainsi le tab Terminés se met à jour correctement.

### Query chantier unique

```typescript
// src/lib/queries/useChantier.ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useChantier(chantierId: string) {
  return useQuery({
    queryKey: ['chantiers', chantierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chantiers')
        .select('*')
        .eq('id', chantierId)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!chantierId,
  })
}
```

### Modification de useChantiers — Ajout du filtre status

```typescript
// src/lib/queries/useChantiers.ts — modification
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type ChantierStatus = Database['public']['Enums']['chantier_status']

export function useChantiers(status: ChantierStatus = 'active') {
  return useQuery({
    queryKey: ['chantiers', { status }],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chantiers')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}
```

**IMPORTANT — Breaking change potentiel :** L'ancien query key était `['chantiers']` (sans filtre). Le nouveau sera `['chantiers', { status: 'active' }]`. Il faut :
1. Mettre à jour `useRealtimeChantiers` pour invalider `{ queryKey: ['chantiers'] }` (préfixe, invalide toutes les variantes)
2. Mettre à jour `useCreateChantier` : les `onMutate` et `onError` qui référencent `['chantiers']` devront utiliser `['chantiers', { status: 'active' }]` pour l'optimistic update, mais l'`onSettled` peut garder `{ queryKey: ['chantiers'] }` pour invalider tout
3. Mettre à jour les tests existants qui mockent `queryClient.getQueryData(['chantiers'])`

### Realtime — Invalidation élargie

Le hook `useRealtimeChantiers` utilise déjà `invalidateQueries({ queryKey: ['chantiers'] })` sans filtre précis — c'est un **préfixe match**, donc il invalide `['chantiers']`, `['chantiers', { status: 'active' }]`, `['chantiers', { status: 'termine' }]`, `['chantiers', chantierId]`. Pas de modification nécessaire.

### Project Structure Notes

**Nouveaux fichiers à créer :**
- `src/lib/mutations/useUpdateChantierStatus.ts` — Mutation changement de statut
- `src/lib/mutations/useUpdateChantierStatus.test.ts` — Tests mutation
- `src/lib/queries/useChantier.ts` — Query chantier unique
- `src/lib/queries/useChantier.test.ts` — Tests query
- `src/components/ui/alert-dialog.tsx` — Composant shadcn (généré via CLI)
- `src/components/ui/dropdown-menu.tsx` — Composant shadcn (généré via CLI)
- `src/components/ui/tabs.tsx` — Composant shadcn (généré via CLI)

**Fichiers à modifier :**
- `src/lib/queries/useChantiers.ts` — Ajouter paramètre `status` avec query key élargi
- `src/lib/mutations/useCreateChantier.ts` — Adapter query keys pour le nouveau format `['chantiers', { status: 'active' }]`
- `src/routes/_authenticated/index.tsx` — Ajouter tabs Actifs/Terminés, passer le statut au hook
- `src/routes/_authenticated/chantiers/$chantierId.tsx` — Enrichir avec query, DropdownMenu, AlertDialogs, mutations
- `src/routes/index.test.tsx` — Adapter pour les nouveaux query keys et ajouter tests tabs
- `src/routes/_authenticated/chantiers/$chantierId.test.tsx` — Enrichir avec tests options, confirmations

**Fichiers à supprimer :**
- `src/lib/mutations/.gitkeep` — Remplacé par useUpdateChantierStatus.ts

**Fichiers NON touchés :**
- `src/lib/subscriptions/useRealtimeChantiers.ts` — Invalidation en préfixe déjà correcte
- `src/components/StatusCard.tsx` — Pas de changement
- `src/components/BottomNavigation.tsx` — Pas de changement
- `src/components/ThemeProvider.tsx` — Pas de changement
- `src/types/database.ts` — Pas de changement (enum `chantier_status` déjà défini avec 'active' | 'termine' | 'supprime')
- `src/types/enums.ts` — Pas de changement (`ChantierStatus` déjà défini)
- `supabase/migrations/` — Pas de nouvelle migration (le statut est déjà dans le schéma)
- `src/main.tsx` — Pas de changement
- `src/routes/_authenticated.tsx` — Pas de changement

**Alignement architecture :**
- Mutations dans `src/lib/mutations/` (convention architecture)
- Queries dans `src/lib/queries/` (convention architecture)
- Composants shadcn dans `src/components/ui/` (convention shadcn)
- Tests co-localisés : `.test.ts` à côté du fichier testé
- Pas de barrel files — imports directs

### Attention — Pièges courants

1. **Ne PAS confondre AlertDialog et Dialog** — AlertDialog est conçu pour les confirmations bloquantes (focus trap, pas de dismiss par clic overlay). Dialog est pour le contenu non-critique. Ici on veut AlertDialog pour la confirmation destructive.
2. **Ne PAS oublier le toast après l'action** — Feedback essentiel : `toast('Chantier archivé')` ou `toast('Chantier supprimé')`.
3. **Le query key change** — L'ancien `['chantiers']` devient `['chantiers', { status: 'active' }]`. TOUS les usages doivent être mis à jour : `useCreateChantier` (onMutate, onError), tests.
4. **L'invalidation `['chantiers']` est un préfixe** — TanStack Query invalide toutes les queries qui commencent par ce préfixe. Donc `invalidateQueries({ queryKey: ['chantiers'] })` invalide `['chantiers', { status: 'active' }]` ET `['chantiers', { status: 'termine' }]`. C'est le comportement voulu.
5. **Les chantiers terminés ne sont PAS cliquables** — Pas de `Link` vers le détail. L'utilisateur voit la liste en lecture seule. Il pourra éventuellement les réactiver dans une future story si le besoin se présente.
6. **Le statut 'supprime' est un soft delete** — Le chantier reste en base mais n'est JAMAIS affiché nulle part (ni Actifs, ni Terminés).
7. **Pas de nouvelle migration SQL** — L'enum `chantier_status` et la colonne `status` existent déjà (migration 003_chantiers.sql).
8. **Les composants shadcn générés peuvent avoir le lint warning react-refresh** — Ajouter le commentaire eslint-disable si nécessaire (pattern établi avec `badge.tsx`).
9. **Le routeTree.gen.ts ne devrait PAS changer** — On modifie des fichiers existants, on n'ajoute pas de nouvelles routes.
10. **L'état "not found"** — Si l'utilisateur navigue vers un `chantierId` invalide (ou supprimé), afficher un message "Chantier introuvable" avec un lien retour.

### References

- [Source: epics.md#Story 1.6] — User story, acceptance criteria BDD
- [Source: architecture.md#API & Communication Patterns] — Mutations optimistes, SDK Supabase direct
- [Source: architecture.md#Communication Patterns] — Query keys convention `[entite, ...filtres]`, invalidation par préfixe
- [Source: architecture.md#Enforcement Guidelines] — shadcn d'abord, messages français, snake_case DB
- [Source: ux-design-specification.md#Interaction Patterns] — "Actions destructives = confirmation via Dialog", "Actions terrain = jamais de confirmation"
- [Source: ux-design-specification.md#Component Library] — Dialog pour confirmations destructives, Sheet pour détails, Toast pour feedback
- [Source: ux-design-specification.md#Button Strategy] — Destructive = texte rouge, jamais de bouton plein rouge
- [Source: ux-design-specification.md#Feedback Patterns] — Action irréversible = Dialog de confirmation
- [Source: ux-design-specification.md#Modal Strategy] — Dialog titre + message + 2 boutons max, overlay sombre
- [Source: prd.md#FR5] — Marquer chantier terminé/supprimé (disparaît de la vue principale)
- [Source: 1-5-ecran-d-accueil-liste-et-cartes-des-chantiers.md] — Patterns établis: StatusCard, useRealtimeChantiers, useChantiers, Badge, grille responsive
- [Source: 1-4-creation-d-un-chantier.md] — Patterns établis: useCreateChantier (mutation optimiste), toast, FAB

## Previous Story Intelligence (Story 1.5)

### Learnings critiques de la story précédente

1. **`useChantiers()` avec query key `['chantiers']`** — actuellement sans paramètre de filtre. La modification en `['chantiers', { status }]` nécessite la mise à jour de `useCreateChantier` (onMutate, onError) et des tests.
2. **`useRealtimeChantiers` invalide `['chantiers']`** — c'est un préfixe match, donc ça invalide automatiquement toutes les variantes. Pas de modification nécessaire.
3. **StatusCard est générique** — pas de logique métier dedans. La logique statut/couleur est dans la page d'accueil. Pour les chantiers terminés, on passera `STATUS_COLORS.DONE` directement.
4. **Mock supabase chainable** — pattern établi : `from → select → eq → order`, chaque mock retourne le suivant. Pour la mutation `.update().eq().select().single()`, même pattern.
5. **$chantierId.tsx existe en placeholder** — il faut l'enrichir considérablement (query, menu options, dialogs, mutation).
6. **Badge shadcn/ui déjà installé** — réutiliser pour le type complet/léger sur la page détail.
7. **Toast (sonner) intégré** — Toaster dans main.tsx, `toast()` disponible.
8. **Pré-existing lint error** — `ThemeProvider.tsx:64` (react-refresh/only-export-components) — ignoré.

### Code patterns établis (à respecter)

- `createFileRoute('/_authenticated/...')` pour les routes protégées
- `useAuth()` hook pour l'état d'authentification
- `supabase` client singleton dans `src/lib/supabase.ts` (typé `Database`)
- `queryClient` dans `src/lib/queryClient.ts` (staleTime 5min, retry 3)
- Composants shadcn/ui dans `src/components/ui/`
- Composants custom dans `src/components/`
- Tests avec Vitest + Testing Library + mocks Supabase
- Navigation TanStack Router : `Link`, `useNavigate()`, `Route.useParams()`

## Git Intelligence

### Commits récents (5 derniers)

```
e6487b6 feat: auth, route protection & login — Story 1-2 + code review fixes
e1c18ef fix: code review story 1-1 — 7 issues corrigées
61938ec docs: story 1-1 complete — all tasks done, status review
3789f3d docs: update story 1-1 progress — tasks 1-6 implemented
a3719c1 feat: initial project scaffolding — Story 1-1
```

### Patterns de commit à suivre

- Format : `feat:` / `fix:` / `docs:` + description concise + référence story
- Commits atomiques par fonctionnalité

### Technologies déjà en place

- React 19.2 + TypeScript strict
- Tailwind CSS v4 (config inline dans index.css)
- TanStack Router (file-based routing, route generation automatique)
- TanStack Query (configuré, query keys `['chantiers']`)
- Supabase Auth (email/password, RLS) + Supabase JS Client (typé Database)
- Supabase Realtime (subscription `chantiers-changes`, invalidation query)
- shadcn/ui (button, card, input, label, badge, sonner — style "new-york")
- Lucide React (icônes)
- Vitest + Testing Library (setup complet)
- 82 tests existants

## Latest Tech Information

### shadcn/ui AlertDialog — Pattern d'utilisation

AlertDialog de shadcn/ui utilise Radix UI sous le capot. Pattern :

```typescript
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Supprimer</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Supprimer ce chantier ?</AlertDialogTitle>
      <AlertDialogDescription>
        Le chantier sera supprimé définitivement. Cette action est irréversible.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Annuler</AlertDialogCancel>
      <AlertDialogAction className="bg-destructive text-destructive-foreground">
        Supprimer
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Points importants :**
- `AlertDialogTrigger` peut wrapper un item de DropdownMenu — il faut utiliser le pattern `open/onOpenChange` controllé quand le trigger est dans un DropdownMenu (car le DropdownMenu se ferme au clic, il faut gérer l'état manuellement)
- Le bouton destructif utilise `className="bg-destructive text-destructive-foreground"` (Tailwind classes du thème shadcn)
- L'AlertDialog est **modal** — focus trap, pas de dismiss par overlay

### shadcn/ui DropdownMenu — Pattern d'utilisation

```typescript
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <EllipsisVertical className="size-5" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem>
      <CheckCircle2 className="mr-2 size-4" />
      Marquer comme terminé
    </DropdownMenuItem>
    <DropdownMenuItem className="text-destructive">
      <Trash2 className="mr-2 size-4" />
      Supprimer
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**IMPORTANT — Combinaison DropdownMenu + AlertDialog :**
Quand un DropdownMenuItem doit ouvrir un AlertDialog, le DropdownMenu se ferme automatiquement au clic sur l'item. Il faut utiliser un état contrôlé pour l'AlertDialog :

```typescript
const [showDeleteDialog, setShowDeleteDialog] = useState(false)

// Dans le DropdownMenu
<DropdownMenuItem onSelect={(e) => {
  e.preventDefault() // empêche la fermeture auto
  setShowDeleteDialog(true)
}}>
  Supprimer
</DropdownMenuItem>

// AlertDialog séparé (hors du DropdownMenu)
<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
  <AlertDialogContent>...</AlertDialogContent>
</AlertDialog>
```

Ce pattern évite les conflits entre le focus trap du Dialog et la fermeture du Menu.

### TanStack Query — invalidateQueries préfixe

Rappel : `invalidateQueries({ queryKey: ['chantiers'] })` invalide TOUTES les queries dont la clé commence par `['chantiers']` :
- `['chantiers']`
- `['chantiers', { status: 'active' }]`
- `['chantiers', { status: 'termine' }]`
- `['chantiers', 'some-uuid']`

C'est le comportement par défaut de TanStack Query v5 (`exact: false`). Pour invalider uniquement une query précise, il faut `exact: true`.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

Aucun incident.

### Completion Notes List

- Task 1: Mutation `useUpdateChantierStatus` — optimistic update (setQueriesData prefix), rollback, invalidation préfixe `['chantiers']`, navigation `/` on settled. 7 tests.
- Task 2: Page détail enrichie — useChantier query, DropdownMenu + 2 AlertDialogs (terminer/supprimer) contrôlés via état, toast feedback, loading/error/not-found. 14 tests.
- Task 3: AlertDialog, DropdownMenu, Tabs installés via shadcn CLI. eslint-disable ajouté sur tabs.tsx et button.tsx (react-refresh).
- Task 4: useChantiers accepte `status` param (défaut `'active'`), query key `['chantiers', { status }]`. Page accueil avec Tabs Actifs/Terminés, chantiers terminés non-cliquables (pas de Link), état vide "Aucun chantier terminé", FAB masqué sur tab Terminés. useCreateChantier adapté pour nouveau query key. 19 tests accueil + 4 tests useChantiers.
- Task 5: 113 tests total (82 baseline + 31 nouveaux), 0 régressions, lint clean (sauf ThemeProvider pré-existant).
- Note: useRealtimeChantiers inchangé — son `invalidateQueries({ queryKey: ['chantiers'] })` invalide déjà toutes les variantes par préfixe match.

### Code Review Fixes (AI)

- **[H1] Rollback complet** — `useUpdateChantierStatus.onMutate` utilise maintenant `getQueriesData` pour snapshot TOUTES les queries `['chantiers', ...]`, et `onError` les restaure toutes via boucle. Avant : seuls `['chantiers', { status: 'active' }]` et `['chantiers']` étaient restaurés.
- **[H2] Navigation conditionnelle** — `navigate({ to: '/' })` déplacé de `onSettled` vers `onSuccess`. L'utilisateur n'est plus renvoyé à l'accueil si la mutation échoue. +1 test `does not navigate on error`.
- **[M1] Toast d'erreur** — Ajout `onError: () => toast.error(...)` sur les handlers `handleTerminer` et `handleSupprimer` dans `$chantierId.tsx`.
- **[M2] console.warn supprimé** — `useRealtimeChantiers.ts` : callback `.subscribe()` simplifié (plus de console.warn en production).
- **[M4] eslint-disable non nécessaire** — `alert-dialog.tsx` et `dropdown-menu.tsx` n'exportent que des composants, le commentaire n'est pas requis (contrairement à `button.tsx`/`tabs.tsx` qui exportent des variants cva).
- Tests : 114 total (82 baseline + 32 story), 0 régressions, lint clean (sauf ThemeProvider pré-existant), TypeScript 0 erreurs.

### File List

**Nouveaux fichiers :**
- `src/lib/mutations/useUpdateChantierStatus.ts`
- `src/lib/mutations/useUpdateChantierStatus.test.ts`
- `src/lib/queries/useChantier.ts`
- `src/lib/queries/useChantier.test.ts`
- `src/components/ui/alert-dialog.tsx` (shadcn generated)
- `src/components/ui/dropdown-menu.tsx` (shadcn generated)
- `src/components/ui/tabs.tsx` (shadcn generated)

**Fichiers modifiés :**
- `src/routes/_authenticated/chantiers/$chantierId.tsx` — page détail complète + toast erreur (review fix M1)
- `src/routes/_authenticated/chantiers/$chantierId.test.tsx` — 14 tests
- `src/routes/_authenticated/index.tsx` — tabs Actifs/Terminés
- `src/routes/index.test.tsx` — 19 tests (tabs, filtres)
- `src/lib/queries/useChantiers.ts` — paramètre status, query key élargi
- `src/lib/queries/useChantiers.test.ts` — 4 tests (status param, query key)
- `src/lib/mutations/useCreateChantier.ts` — query keys adaptés `['chantiers', { status: 'active' }]`
- `src/lib/mutations/useCreateChantier.test.ts` — query keys adaptés
- `src/lib/mutations/useUpdateChantierStatus.ts` — rollback complet + navigation onSuccess (review fix H1, H2)
- `src/lib/mutations/useUpdateChantierStatus.test.ts` — rollback élargi + test no-navigate-on-error (review fix H1, H2)
- `src/lib/subscriptions/useRealtimeChantiers.ts` — suppression console.warn (review fix M2)
- `src/components/ui/button.tsx` — écrasé par shadcn, eslint-disable ré-ajouté

**Fichiers supprimés :**
- `src/lib/mutations/.gitkeep`
- `src/lib/queries/.gitkeep`
- `src/lib/subscriptions/.gitkeep`

**Fichiers NON touchés (confirmé) :**
- `src/components/StatusCard.tsx`
- `src/types/database.ts`
- `src/types/enums.ts`
- `supabase/migrations/`
