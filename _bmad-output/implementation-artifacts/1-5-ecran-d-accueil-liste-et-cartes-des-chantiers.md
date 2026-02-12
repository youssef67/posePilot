# Story 1.5: Écran d'accueil — Liste et cartes des chantiers

Status: done
Story ID: 1.5
Story Key: 1-5-ecran-d-accueil-liste-et-cartes-des-chantiers
Epic: 1 — Fondation, Authentification & Gestion des chantiers
Date: 2026-02-09
Dependencies: Story 1.1 (done), Story 1.2 (done), Story 1.3 (done), Story 1.4 (done)
FRs: FR3, FR4

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que utilisateur de posePilot,
Je veux voir tous mes chantiers actifs sur l'écran d'accueil avec leur statut,
Afin que je sache d'un coup d'œil l'état de chaque chantier.

## Acceptance Criteria (BDD)

### AC1: Liste des chantiers actifs sous forme de StatusCards

**Given** l'utilisateur a des chantiers actifs
**When** il ouvre l'app / onglet Chantiers
**Then** la liste de tous les chantiers actifs s'affiche sous forme de StatusCards avec barre de statut latérale

### AC2: Chantier complet — indicateur avancement + badge

**Given** un chantier de type complet est dans la liste
**When** l'utilisateur regarde la carte
**Then** il voit un indicateur de % d'avancement (0% initialement) et un badge "Complet" discret

### AC3: Chantier léger — compteur livraisons + badge

**Given** un chantier de type léger est dans la liste
**When** l'utilisateur regarde la carte
**Then** il voit un compteur de livraisons (0 initialement) et un badge "Léger" discret

### AC4: État vide

**Given** l'utilisateur n'a aucun chantier
**When** l'écran d'accueil se charge
**Then** un état vide s'affiche avec "Aucun chantier pour l'instant" et un bouton "Créer un chantier"

### AC5: Mise à jour temps réel via Supabase Realtime

**Given** les données changent (autre utilisateur crée un chantier)
**When** la mise à jour est propagée via Supabase Realtime
**Then** la liste se met à jour automatiquement sans rafraîchir

## Tasks / Subtasks

- [x] Task 1 — Composant StatusCard réutilisable (AC: #1, #2, #3)
  - [x] 1.1 Créer `src/components/StatusCard.tsx` — composant générique avec barre de statut latérale, titre, sous-titre, indicateur droit, badge
  - [x] 1.2 Props : `title`, `subtitle?`, `statusColor` (hex), `indicator` (ReactNode), `badge?` (ReactNode), `onClick?`, `className?`
  - [x] 1.3 Barre latérale gauche : 4px de large, couleur via `statusColor` prop, hauteur 100% de la carte, border-radius gauche
  - [x] 1.4 Variante Standard (défaut) : hauteur minimum 72px, titre Poppins Semi-Bold + sous-titre
  - [x] 1.5 Zone tactile : toute la carte est cliquable (min-height 48px), `cursor-pointer` si `onClick` fourni
  - [x] 1.6 Dark mode : fond `bg-card` (#1E293B dark, #FFFFFF light), texte `text-card-foreground`
  - [x] 1.7 Accessibilité : `role="listitem"` sur le conteneur, `aria-label` incluant titre et statut
  - [x] 1.8 Skeleton variant : export `StatusCardSkeleton` — même dimensions avec `animate-pulse`, barre latérale grise

- [x] Task 2 — Intégrer StatusCard sur la page d'accueil (AC: #1, #2, #3, #4)
  - [x] 2.1 Modifier `src/routes/_authenticated/index.tsx` — remplacer les `Card` basiques par `StatusCard`
  - [x] 2.2 Chantier complet : `statusColor` gris (`#64748B` — pas de progression pour l'instant), `indicator` = "0%", `badge` = Badge "Complet"
  - [x] 2.3 Chantier léger : `statusColor` gris (`#64748B`), `indicator` = "0 livraisons", `badge` = Badge "Léger"
  - [x] 2.4 Calcul dynamique de statusColor : si `progress_total > 0` → calculer le % : 0% = gris `#64748B`, partiel = orange `#F59E0B`, 100% = vert `#10B981`
  - [x] 2.5 Calcul dynamique indicateur complet : `Math.round((progress_done / progress_total) * 100)` + "%" (ou "0%" si progress_total === 0)
  - [x] 2.6 Indicateur léger : afficher "0 livraisons" (hardcodé 0 — la colonne `delivery_count` sera ajoutée avec les triggers de la table `livraisons` en Epic 6)
  - [x] 2.7 Conserver l'état vide, l'état erreur et le FAB "+" existants — ne pas les modifier
  - [x] 2.8 Utiliser `StatusCardSkeleton` pour le loading au lieu des div pulse actuelles
  - [x] 2.9 Wrapping de la liste dans `role="list"` pour l'accessibilité

- [x] Task 3 — Subscription Realtime sur les chantiers (AC: #5)
  - [x] 3.1 Créer `src/lib/subscriptions/useRealtimeChantiers.ts` — hook qui subscribe aux changements de la table `chantiers`
  - [x] 3.2 Pattern : `supabase.channel('chantiers-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'chantiers' }, callback).subscribe()`
  - [x] 3.3 Callback : `queryClient.invalidateQueries({ queryKey: ['chantiers'] })`
  - [x] 3.4 Cleanup dans le `useEffect` return : `supabase.removeChannel(channel)`
  - [x] 3.5 Intégrer `useRealtimeChantiers()` dans la page d'accueil (`index.tsx`)
  - [x] 3.6 Supprimer `src/lib/subscriptions/.gitkeep` une fois le premier fichier créé

- [x] Task 4 — Rendre les cartes tappables avec navigation (AC: #1)
  - [x] 4.1 Chaque StatusCard wrappée dans un `<Link to="/chantiers/$chantierId">` pour préparer la navigation (route créée dans les epics futures)
  - [x] 4.2 Utiliser `Link` de TanStack Router avec `params: { chantierId: chantier.id }`
  - [x] 4.3 Créer `src/routes/_authenticated/chantiers/$chantierId.tsx` — route placeholder avec nom du chantier + "Détail à venir"
  - [x] 4.4 Le routeTree sera regénéré automatiquement

- [x] Task 5 — Grille responsive pour tablette/desktop (AC: #1)
  - [x] 5.1 Mobile (< 768px) : liste verticale (1 colonne) — comportement actuel
  - [x] 5.2 Tablette (md: >= 768px) : grille 2 colonnes de StatusCards
  - [x] 5.3 Desktop (lg: >= 1024px) : grille 3 colonnes
  - [x] 5.4 Utiliser les classes Tailwind : `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3`

- [x] Task 6 — Tests (toutes AC)
  - [x] 6.1 `src/components/StatusCard.test.tsx` — rendu avec barre latérale, titre, indicateur, badge, skeleton, accessibilité (aria-label, role)
  - [x] 6.2 `src/lib/subscriptions/useRealtimeChantiers.test.ts` — mock Supabase channel, vérifie subscribe et cleanup (removeChannel)
  - [x] 6.3 Mettre à jour `src/routes/index.test.tsx` — tester StatusCards au lieu de Card basique, vérifier badge type, indicateur, état vide, skeleton, erreur
  - [x] 6.4 Tester la route placeholder `$chantierId` — affiche "Détail à venir"
  - [x] 6.5 Vérifier que les 54 tests existants passent toujours (0 régressions) — 80/80 total (69 existants + 11 nouveaux)

## Dev Notes

### Architecture & Patterns obligatoires

- **Supabase Realtime pour la sync** — subscription sur la table `chantiers`, invalidation TanStack Query sur chaque changement [Source: architecture.md#API & Communication Patterns]
- **Pas de polling** — subscription Realtime uniquement, pas de refetchInterval [Source: architecture.md#Communication Patterns]
- **Convention channel** : `chantiers-changes` (pas de filtre, on veut tous les changements de la table) [Source: architecture.md#Subscriptions temps réel]
- **Cleanup systématique** : `supabase.removeChannel(channel)` dans le useEffect return [Source: architecture.md#Subscriptions temps réel]
- **Composants réutilisables dans `src/components/`** — StatusCard sera réutilisé pour lots, plots, étages dans les stories futures [Source: architecture.md#Component Boundary]
- **shadcn/ui Card comme base** — StatusCard utilise Card/CardContent de shadcn/ui + barre latérale custom [Source: ux-design-specification.md#Component Implementation Strategy]
- **Types snake_case** — `progress_done`, `progress_total`, `created_at` etc. sans transformation [Source: architecture.md#Naming Patterns]
- **Messages utilisateur en français** [Source: architecture.md#Enforcement Guidelines]

### Conventions de nommage

- Fichier composant : `StatusCard.tsx` (PascalCase)
- Fichier hook : `useRealtimeChantiers.ts` (camelCase)
- Tests co-localisés : `StatusCard.test.tsx`, `useRealtimeChantiers.test.ts`
- Pas de barrel files — imports directs

### Stack technique — Versions exactes (déjà installées)

| Bibliothèque | Version | Utilisation dans cette story |
|---|---|---|
| **@supabase/supabase-js** | 2.x | Realtime subscriptions (`channel`, `on`, `subscribe`, `removeChannel`) |
| **@tanstack/react-query** | 5.x | `useQueryClient`, `invalidateQueries` pour refresh temps réel |
| **@tanstack/react-router** | 1.158.x | `Link`, `createFileRoute`, navigation vers chantier |
| **shadcn/ui** | CLI 3.8.4 | `Card`, `CardContent`, `Badge`, `Button` (déjà installés) |
| **lucide-react** | 0.563.x | `ClipboardList` (état vide), `Plus` (FAB) |
| **vitest** | 4.0.x | Tests unitaires co-localisés |

### Composant StatusCard — Design détaillé

```
+--+------------------------------------+
|  |  Résidence Les Oliviers     [0%]  |
|▌ |  [Complet]                         |
|  |                                    |
+--+------------------------------------+

+--+------------------------------------+
|  |  Rénovation Duval    [0 livraisons]|
|▌ |  [Léger]                           |
|  |                                    |
+--+------------------------------------+
```

**Barre latérale gauche :**
- Largeur : 4px
- Hauteur : 100% de la carte
- Border-radius : arrondi gauche uniquement (pour s'intégrer au Card de shadcn)
- Couleur dynamique via prop `statusColor` :
  - `#64748B` gris : pas commencé (progress 0/0)
  - `#F59E0B` orange : en cours (partiel)
  - `#10B981` vert : terminé (100%)
  - `#EF4444` rouge : bloqué (note bloquante — futur)

**Implémentation technique — barre latérale :**
```typescript
// Approche recommandée : absolute positioning dans un Card relative
<Card className="relative overflow-hidden pl-2 ...">
  <div
    className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
    style={{ backgroundColor: statusColor }}
  />
  <CardContent>...</CardContent>
</Card>
```

**Props interface :**
```typescript
interface StatusCardProps {
  title: string
  subtitle?: string
  statusColor: string
  indicator?: React.ReactNode
  badge?: React.ReactNode
  onClick?: () => void
  className?: string
}
```

### Couleurs sémantiques — Constantes à utiliser

Les couleurs sémantiques sont déjà définies dans `index.css` comme CSS variables. Pour le StatusCard, utiliser les constantes directes car la barre latérale utilise un style inline :

```typescript
// src/components/StatusCard.tsx — ou définir dans un fichier utils si besoin
export const STATUS_COLORS = {
  NOT_STARTED: '#64748B',  // gris
  IN_PROGRESS: '#F59E0B',  // orange
  DONE: '#10B981',         // vert
  BLOCKED: '#EF4444',      // rouge
} as const
```

### Logique de calcul du statut pour les chantiers

```typescript
// Dériver la couleur de statut d'un chantier
function getChantierStatusColor(chantier: ChantierRow): string {
  if (chantier.progress_total === 0) return STATUS_COLORS.NOT_STARTED
  if (chantier.progress_done >= chantier.progress_total) return STATUS_COLORS.DONE
  return STATUS_COLORS.IN_PROGRESS
}

// Dériver l'indicateur texte
function getChantierIndicator(chantier: ChantierRow): string {
  if (chantier.type === 'complet') {
    if (chantier.progress_total === 0) return '0%'
    return `${Math.round((chantier.progress_done / chantier.progress_total) * 100)}%`
  }
  // Type léger — pas de colonne delivery_count encore, 0 par défaut
  return '0 livraisons'
}
```

**IMPORTANT :** Pour le type `léger`, afficher "0 livraisons" en dur pour cette story. La colonne `delivery_count` (ou compteur agrégé) sera ajoutée en Epic 6 avec la table `livraisons`. Ne PAS créer de migration ou de colonne supplémentaire dans cette story.

### Subscription Realtime — Pattern standard

```typescript
// src/lib/subscriptions/useRealtimeChantiers.ts
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useRealtimeChantiers() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('chantiers-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chantiers' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['chantiers'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])
}
```

**IMPORTANT :** Le `queryClient` est stable (singleton), donc `[queryClient]` dans le tableau de dépendances ne causera pas de re-subscribe intempestif. Le hook ne crée qu'une seule subscription.

### Page d'accueil — Modification de `index.tsx`

La page d'accueil actuelle (`src/routes/_authenticated/index.tsx`) utilise déjà `useChantiers()` et affiche des `Card` basiques. Les modifications :

1. Importer `StatusCard`, `StatusCardSkeleton` de `@/components/StatusCard`
2. Importer `useRealtimeChantiers` de `@/lib/subscriptions/useRealtimeChantiers`
3. Appeler `useRealtimeChantiers()` dans le composant
4. Remplacer les `Card` par des `StatusCard` avec les bonnes props
5. Remplacer les div skeleton par `StatusCardSkeleton`
6. Wrapper les cartes avec `Link` vers `/chantiers/$chantierId`
7. Ajouter `role="list"` sur le conteneur de la liste

**Structure résultante :**
```
+----------------------------------+
|           Chantiers              |
+----------------------------------+
|                                  |
|  +▌--------------------------+  |
|  | Résidence Les Oliviers [0%]|  |  ← StatusCard complet
|  | [Complet]                  |  |
|  +----------------------------+  |
|                                  |
|  +▌--------------------------+  |
|  | Rénovation Duval  [0 livr.]|  |  ← StatusCard léger
|  | [Léger]                    |  |
|  +----------------------------+  |
|                                  |
|                           [+]   |  ← FAB inchangé
+----------------------------------+
| [Chantiers] [Livraisons] [Act.] [Reg.] |
+----------------------------------+
```

### Route placeholder chantier detail

```typescript
// src/routes/_authenticated/chantiers/$chantierId.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/chantiers/$chantierId')({
  component: ChantierDetailPage,
})

function ChantierDetailPage() {
  const { chantierId } = Route.useParams()
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 px-4">
      <p className="text-muted-foreground">Détail du chantier à venir</p>
      <p className="text-xs text-muted-foreground">{chantierId}</p>
    </div>
  )
}
```

### Responsive — Grille adaptative

```typescript
// Conteneur de la liste des chantiers
<div role="list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
  {chantiers.map((chantier) => (
    <StatusCard key={chantier.id} ... />
  ))}
</div>
```

Conforme à [Source: ux-design-specification.md#Responsive Strategy] :
- Mobile (< 768px) : 1 colonne
- Tablette md (768px-1023px) : 2 colonnes
- Desktop lg (>= 1024px) : 3 colonnes

### Accessibilité — Règles pour cette story

- Liste de chantiers : `role="list"` sur le conteneur
- Chaque StatusCard : `role="listitem"`, `aria-label="Chantier {nom}, {type}, {indicateur}"`
- FAB : `aria-label="Créer un nouveau chantier"` (déjà en place)
- Badge type : texte lisible, pas uniquement un indicateur couleur (déjà en place)
- Cartes tappables : focus visible, zone tactile minimum 48px de hauteur
- Skeleton : `aria-hidden="true"` et `aria-label="Chargement"` sur le conteneur

### Project Structure Notes

**Nouveaux fichiers à créer :**
- `src/components/StatusCard.tsx` — Composant réutilisable StatusCard + StatusCardSkeleton
- `src/components/StatusCard.test.tsx` — Tests du composant
- `src/lib/subscriptions/useRealtimeChantiers.ts` — Hook subscription Realtime
- `src/lib/subscriptions/useRealtimeChantiers.test.ts` — Tests du hook
- `src/routes/_authenticated/chantiers/$chantierId.tsx` — Route placeholder détail chantier

**Fichiers à modifier :**
- `src/routes/_authenticated/index.tsx` — Remplacer Card par StatusCard, ajouter subscription Realtime, grille responsive
- `src/routes/index.test.tsx` — Mettre à jour les tests pour StatusCard, ajouter tests Realtime
- `src/routeTree.gen.ts` — Regénéré automatiquement (nouvelle route $chantierId)

**Fichiers à supprimer :**
- `src/lib/subscriptions/.gitkeep` — Remplacé par useRealtimeChantiers.ts

**Fichiers NON touchés :**
- `src/main.tsx` — Pas de changement
- `src/components/ThemeProvider.tsx` — Pas de changement
- `src/components/BottomNavigation.tsx` — Pas de changement
- `src/components/ui/badge.tsx` — Déjà installé, réutilisé
- `src/lib/queries/useChantiers.ts` — Pas de changement (le hook reste identique)
- `src/lib/mutations/useCreateChantier.ts` — Pas de changement
- `src/types/database.ts` — Pas de changement (pas de nouvelle table/colonne)
- `src/types/enums.ts` — Pas de changement
- `src/routes/_authenticated.tsx` — Pas de changement
- `src/routes/login.tsx` — Pas de changement

**Alignement architecture :**
- StatusCard dans `src/components/` (composant custom, pas dans `ui/`)
- Subscription dans `src/lib/subscriptions/` (convention architecture)
- Tests co-localisés : `.test.tsx` à côté du composant
- Route placeholder dans `src/routes/_authenticated/chantiers/$chantierId.tsx`
- Pas de barrel files — imports directs

### Attention — Pièges courants

1. **Ne PAS confondre `supabase.channel()` avec `supabase.from()`** — le Realtime utilise son propre API (`channel`, `on`, `subscribe`)
2. **Ne PAS oublier `removeChannel` dans le cleanup** — sinon les subscriptions s'accumulent
3. **Ne PAS créer de migration SQL** — cette story ne modifie pas le schéma (pas de nouvelle colonne `delivery_count`)
4. **Le compteur livraisons pour léger est "0 livraisons" en dur** — sera dynamique en Epic 6
5. **StatusCard doit être GÉNÉRIQUE** — pas de logique métier chantier dans le composant. La logique (couleur, indicateur) est dans la page d'accueil
6. **Ne PAS dupliquer le Badge** — réutiliser le `Badge` shadcn/ui déjà installé (Story 1.4)
7. **La barre latérale utilise `style={{ backgroundColor }}` en inline** — pas de classe Tailwind car la couleur est dynamique
8. **Le `routeTree.gen.ts` sera regénéré** — ne pas le modifier manuellement
9. **Tester les deux thèmes** — vérifier que la StatusCard est lisible en dark ET light
10. **Le `<Link>` vers `$chantierId` est du TanStack Router** — utiliser `to="/chantiers/$chantierId"` avec `params={{ chantierId: chantier.id }}`

### References

- [Source: epics.md#Story 1.5] — User story, acceptance criteria BDD
- [Source: architecture.md#API & Communication Patterns] — Supabase Realtime subscriptions, invalidation TanStack Query
- [Source: architecture.md#Communication Patterns] — Convention channels, cleanup subscriptions, query key invalidation
- [Source: architecture.md#Component Boundary] — components/ = UI réutilisable, routes/ = écrans avec logique
- [Source: architecture.md#Frontend Architecture] — Structure par domaine, lib/subscriptions/
- [Source: architecture.md#Naming Patterns] — snake_case DB, PascalCase composants, camelCase hooks
- [Source: architecture.md#Enforcement Guidelines] — shadcn d'abord, zones tactiles 48px+, messages français
- [Source: ux-design-specification.md#StatusCard] — Anatomie, états, variantes, couleurs, accessibilité
- [Source: ux-design-specification.md#Component Implementation Strategy] — Composition Card + barre custom
- [Source: ux-design-specification.md#Responsive Strategy] — Grille adaptative md:2cols lg:3cols
- [Source: ux-design-specification.md#Skeleton Loading] — Chaque composant a sa propre variante skeleton
- [Source: ux-design-specification.md#Accessibility Strategy] — WCAG 2.1 AA, role="listitem", aria-label
- [Source: prd.md#FR3] — Voir chantiers actifs avec indicateurs visuels (% ou compteur livraisons)
- [Source: prd.md#FR4] — Identifier type complet/léger visuellement sur la carte
- [Source: prd.md#NFR10] — Synchronisation temps réel < 5 secondes
- [Source: 1-4-creation-d-un-chantier.md] — Patterns établis: useChantiers, Badge, Card, FAB, page d'accueil, sonner

## Previous Story Intelligence (Story 1.4)

### Learnings critiques de la story précédente

1. **`useChantiers()` déjà fonctionnel** — fetch chantiers actifs avec `.eq('status', 'active').order('created_at', { ascending: false })`. Query key: `['chantiers']`. Ce hook NE DOIT PAS être modifié.
2. **Page d'accueil existante avec états complets** — loading (skeleton), error (retry), empty (CTA), liste (Card+Badge), FAB. La migration vers StatusCard doit conserver tous ces états.
3. **Badge shadcn/ui installé** — disponible via `@/components/ui/badge`. Variante "secondary" utilisée pour le type.
4. **Sonner (toast) intégré** — Toaster dans `main.tsx`, pattern `toast()` disponible si besoin pour les erreurs Realtime.
5. **Supabase Database type avec `Relationships: []`** — pattern corrigé en Story 1.4, ne pas régréser.
6. **FAB positionnement** — `fixed right-4 z-10`, `bottom: calc(56px + env(safe-area-inset-bottom) + 16px)`, `size-14`, `rounded-full bg-primary`.
7. **Mock Supabase chainable** — dans les tests, `from → select → eq → order` chacun retourne un mock avec la méthode suivante.
8. **Pré-existing lint error** — `ThemeProvider.tsx:64` (react-refresh/only-export-components) — ignoré, pas introduit par cette story.

### Code patterns établis (à respecter)

- `AuthProvider` + `ThemeProvider` + `QueryClientProvider` + `Toaster` wrapping l'app dans `main.tsx`
- `createFileRoute('/_authenticated/...')` pour les routes protégées
- `useAuth()` hook pour l'état d'authentification
- `supabase` client singleton dans `src/lib/supabase.ts` (typé `Database`)
- `queryClient` dans `src/lib/queryClient.ts` (staleTime 5min, retry 3)
- Composants shadcn/ui dans `src/components/ui/`
- Composants custom dans `src/components/`
- Tests avec Vitest + Testing Library + mocks Supabase

### Fichiers existants impactés

| Fichier | État actuel | Modification requise |
|---|---|---|
| `src/routes/_authenticated/index.tsx` | Card basique + Badge + FAB + états | Remplacer Card par StatusCard, ajouter Realtime, grille responsive |
| `src/routes/index.test.tsx` | 8 tests (heading, redirect, empty, list, FAB, skeleton, error, retry) | Adapter pour StatusCard, ajouter tests indicateurs type |
| `src/lib/subscriptions/.gitkeep` | Placeholder | Supprimer (remplacé par useRealtimeChantiers.ts) |
| `src/routeTree.gen.ts` | Auto-généré | Regénéré (nouvelle route $chantierId) |

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
- Tailwind CSS v4 (via @tailwindcss/vite, config inline dans index.css)
- TanStack Router (file-based routing, route generation automatique, `routeFileIgnorePattern: '.*\\.test\\.tsx?$'`)
- TanStack Query (configuré, utilisé dans Story 1.4 pour useChantiers et useCreateChantier)
- Supabase Auth (email/password, RLS) + Supabase JS Client (typé Database)
- Supabase Realtime — **PREMIER USAGE dans cette story**
- shadcn/ui (button, card, input, label, badge, sonner — style "new-york")
- Lucide React (icônes)
- Vitest + Testing Library (setup complet)
- PWA via vite-plugin-pwa (manifest configuré)

## Latest Tech Information

### Supabase Realtime — Pattern subscription PostgreSQL Changes

Le SDK Supabase JS v2 expose l'API Realtime via `channel()` :

```typescript
const channel = supabase
  .channel('my-channel-name')
  .on(
    'postgres_changes',
    {
      event: '*',        // INSERT, UPDATE, DELETE ou *
      schema: 'public',
      table: 'chantiers',
      // filter: 'status=eq.active'  // filtre optionnel
    },
    (payload) => {
      // payload.new, payload.old, payload.eventType
      // Pour notre cas : on invalide simplement la query
    }
  )
  .subscribe()

// Cleanup
supabase.removeChannel(channel)
```

**Points importants :**
- `event: '*'` capte INSERT, UPDATE et DELETE
- Le callback est déclenché pour chaque mutation sur la table
- `removeChannel` est la méthode propre pour unsubscribe (pas `unsubscribe()`)
- Le Realtime nécessite que le user soit authentifié (RLS)
- Le channel name doit être unique par page/composant

### Supabase Realtime — Prérequis côté serveur

Pour que Realtime fonctionne sur une table :
1. La table doit exister dans le schema `public`
2. Supabase Realtime doit être activé sur la table (par défaut dans Supabase cloud)
3. RLS doit permettre l'accès (notre policy `authenticated = accès total` couvre cela)
4. La publication `supabase_realtime` doit inclure la table

**Vérification/activation :**
```sql
-- Vérifier si la table est dans la publication Realtime
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- Si chantiers n'est pas listé, l'ajouter :
ALTER PUBLICATION supabase_realtime ADD TABLE chantiers;
```

**IMPORTANT :** Si le Realtime ne fonctionne pas en test, vérifier que la table `chantiers` est bien ajoutée à la publication `supabase_realtime`. Sur Supabase cloud, cela se fait via le dashboard Database → Publications → supabase_realtime → ajouter la table.

### TanStack Query — invalidateQueries depuis un callback externe

Pattern confirmé pour invalider une query depuis un callback Realtime :

```typescript
const queryClient = useQueryClient()

// Dans le callback Realtime
queryClient.invalidateQueries({ queryKey: ['chantiers'] })
```

Cela déclenche un refetch de la query `['chantiers']` qui met à jour la liste. Le composant qui utilise `useChantiers()` est automatiquement re-rendu avec les nouvelles données.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Fixed `nouveau.test.tsx` supabase mock to include `channel`/`removeChannel` (required after `useRealtimeChantiers` integration in HomePage)

### Completion Notes List

- **Task 1:** Created `StatusCard` component with lateral status bar (4px, dynamic color via `style`), title, subtitle, indicator, badge, onClick, aria-label, configurable `role` prop. Exported `StatusCardSkeleton` with animate-pulse. Exported `STATUS_COLORS` constants. 16 tests.
- **Task 2:** Replaced `Card` with `StatusCard` in `index.tsx`. Added `getChantierStatusColor()` (NOT_STARTED/IN_PROGRESS/DONE) and `getChantierIndicator()` (complet→%, léger→"0 livraisons"). Skeleton uses `StatusCardSkeleton` with `role="status"`. Empty/error/FAB states preserved. `role="listitem"` on `<Link>` wrappers (not Card) for proper list/listitem nesting.
- **Task 3:** Created `useRealtimeChantiers` hook — subscribes to `chantiers-changes` channel, invalidates `['chantiers']` query on any postgres_changes event. Cleanup via `removeChannel`. Error logging on CHANNEL_ERROR/TIMED_OUT. 5 tests.
- **Task 4:** Wrapped each StatusCard in `<Link to="/chantiers/$chantierId" params={{ chantierId }}>`. Created placeholder route at `$chantierId.tsx`. routeTree regenerated. 2 tests.
- **Task 5:** Applied responsive grid `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3` on list container and skeleton container.
- **Task 6:** All tests written and passing. 82/82 total (56 pre-existing + 26 new). 0 regressions. Lint clean.

### Change Log

- 2026-02-09: Story 1.5 implementation complete — StatusCard, Realtime subscription, responsive grid, route placeholder, 80/80 tests passing
- 2026-02-09: Code review fixes — H1: role="listitem" moved to Link wrapper (a11y nesting), H3: added callback invocation test for Realtime, M1: role="status" on skeleton container, M2: Realtime error logging, M3: corrected test counts. 82/82 tests passing.

### File List

**New files:**
- `src/components/StatusCard.tsx`
- `src/components/StatusCard.test.tsx`
- `src/lib/subscriptions/useRealtimeChantiers.ts`
- `src/lib/subscriptions/useRealtimeChantiers.test.ts`
- `src/routes/_authenticated/chantiers/$chantierId.tsx`
- `src/routes/_authenticated/chantiers/$chantierId.test.tsx`

**Modified files:**
- `src/routes/_authenticated/index.tsx`
- `src/routes/index.test.tsx`
- `src/routes/_authenticated/chantiers/nouveau.test.tsx` (added channel mock)
- `src/routeTree.gen.ts` (auto-generated)

**Deleted files:**
- `src/lib/subscriptions/.gitkeep`
