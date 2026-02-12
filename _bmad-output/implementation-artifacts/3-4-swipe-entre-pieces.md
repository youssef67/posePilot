# Story 3.4: Swipe entre pièces

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que chef d'équipe terrain (Bruno),
Je veux pouvoir swiper horizontalement entre les pièces d'un lot,
Afin que je valide les tâches de chaque pièce sans revenir à la grille — un geste = une pièce suivante.

## Acceptance Criteria

1. **Given** l'utilisateur est sur l'écran d'une pièce dans un lot contenant plusieurs pièces **When** il swipe vers la gauche **Then** une transition slide (animation 200ms ease-out) affiche la pièce suivante dans l'ordre de création

2. **Given** l'utilisateur est sur l'écran d'une pièce **When** il swipe vers la droite **Then** une transition slide affiche la pièce précédente

3. **Given** l'utilisateur est sur la dernière pièce du lot **When** il swipe vers la gauche **Then** aucune action ne se produit (pas de boucle)

4. **Given** l'utilisateur est sur la première pièce du lot **When** il swipe vers la droite **Then** aucune action ne se produit (pas de boucle)

5. **Given** des indicateurs de pagination (dots) **When** l'utilisateur navigue entre pièces **Then** les dots en bas de l'écran montrent la position courante parmi les pièces du lot

6. **Given** le système détecte `prefers-reduced-motion: reduce` **When** l'utilisateur swipe **Then** la transition est instantanée (0ms) au lieu de 200ms

## Tasks / Subtasks

- [x] Task 1 — Créer le hook `useSwipe` pour la détection de gestes (AC: #1, #2, #3, #4, #6)
  - [x] 1.1 Créer `src/lib/utils/useSwipe.ts`
  - [x] 1.2 Implémenter la détection via `onPointerDown` / `onPointerMove` / `onPointerUp` (fonctionne sur tactile ET souris)
  - [x] 1.3 Seuil de déclenchement : 50px de déplacement horizontal OU vélocité rapide (>0.5px/ms)
  - [x] 1.4 Ignorer les gestes principalement verticaux (deltaY > deltaX)
  - [x] 1.5 Retourner : `{ onPointerDown, onPointerMove, onPointerUp }` handlers à attacher au conteneur
  - [x] 1.6 Callback : `onSwipe(direction: 'left' | 'right')` appelé une seule fois par geste
  - [x] 1.7 Créer `src/lib/utils/useSwipe.test.ts` — tests unitaires du hook (seuil, direction, vélocité, vertical ignoré)

- [x] Task 2 — Créer le composant `PaginationDots` (AC: #5)
  - [x] 2.1 Créer `src/components/PaginationDots.tsx`
  - [x] 2.2 Props : `total: number`, `current: number`
  - [x] 2.3 Afficher des dots (cercles 8px) : dot actif = `bg-foreground`, inactifs = `bg-muted-foreground/40`
  - [x] 2.4 Dots non interactifs (informatifs uniquement), aria-label "Pièce X sur Y"
  - [x] 2.5 Créer `src/components/PaginationDots.test.tsx` — vérifier rendu, dot actif, aria-label

- [x] Task 3 — Ajouter l'animation CSS de transition slide (AC: #1, #2, #6)
  - [x] 3.1 Ajouter dans `src/index.css` les keyframes `@keyframes slide-in-from-right` et `@keyframes slide-in-from-left`
  - [x] 3.2 Ajouter les variables d'animation dans le bloc `@theme inline` : `--animate-slide-in-right` et `--animate-slide-in-left` (200ms ease-out)
  - [x] 3.3 Le `prefers-reduced-motion: reduce` global existant (lignes 155-159) force déjà `animation-duration: 0ms !important` — rien à ajouter pour AC #6

- [x] Task 4 — Refactorer `$pieceId.tsx` pour supporter le swipe entre pièces (AC: #1, #2, #3, #4, #5)
  - [x] 4.1 Calculer `currentIndex`, `prevPiece`, `nextPiece` depuis le tableau `pieces` trié par `created_at`
  - [x] 4.2 Attacher les handlers de `useSwipe` au conteneur principal de la page
  - [x] 4.3 Sur swipe left (et `nextPiece` existe) → `navigate()` vers le `pieceId` suivant
  - [x] 4.4 Sur swipe right (et `prevPiece` existe) → `navigate()` vers le `pieceId` précédent
  - [x] 4.5 Ajouter un state `slideDirection` pour contrôler la classe d'animation (`animate-slide-in-right` ou `animate-slide-in-left`)
  - [x] 4.6 Utiliser `key={pieceId}` sur le conteneur animé pour forcer le re-mount et déclencher l'animation à chaque navigation
  - [x] 4.7 Intégrer `<PaginationDots total={pieces.length} current={currentIndex} />` en bas du contenu, au-dessus du safe-area
  - [x] 4.8 Mettre à jour le `<h1>` du header avec le nom de la pièce courante (déjà fait via `piece.nom`)
  - [x] 4.9 Le BreadcrumbNav se met à jour automatiquement via les params de route (pas de modification nécessaire)

- [x] Task 5 — Tests de la page pièce avec swipe (AC: #1-5)
  - [x] 5.1 Mettre à jour `$pieceId.test.tsx` : ajouter des `mockPieces` avec 3 pièces (Séjour, Chambre, SDB)
  - [x] 5.2 Test : swipe left navigue vers la pièce suivante (vérifier changement de heading)
  - [x] 5.3 Test : swipe right navigue vers la pièce précédente
  - [x] 5.4 Test : swipe left sur la dernière pièce → pas de navigation
  - [x] 5.5 Test : swipe right sur la première pièce → pas de navigation
  - [x] 5.6 Test : pagination dots affichés avec le bon nombre et la bonne position active
  - [x] 5.7 Test : les tests existants (TapCycleButton, counter, skeleton, etc.) passent toujours

- [x] Task 6 — Vérification 0 régression (AC: #1-6)
  - [x] 6.1 Lancer `npm run test` — tous les tests existants (385+) passent
  - [x] 6.2 Lancer `npm run lint` — 0 nouvelles erreurs
  - [x] 6.3 Lancer `npm run build` — build propre

## Dev Notes

### Contexte architectural

- **Navigation par URL** : La page pièce est `$pieceId.tsx`, routable via `/chantiers/$chantierId/plots/$plotId/$etageId/$lotId/$pieceId`. Swiper entre pièces = changer le `pieceId` dans l'URL via `navigate()`.
- **Données pré-chargées** : `usePieces(lotId)` retourne TOUTES les pièces du lot avec leurs tâches (`.select('*, taches(*)')`). Pas de nouvelle query nécessaire.
- **Pas de librairie de gestes** : Aucune librairie (Framer Motion, react-use-gesture) installée. Utiliser les PointerEvents natifs dans un hook custom `useSwipe`. Cela garde le bundle léger et évite une dépendance supplémentaire.
- **Animation CSS pure** : Utiliser des keyframes CSS + classes Tailwind v4 pour l'animation slide. Le `prefers-reduced-motion` global existant dans `index.css` (lignes 155-159) gère automatiquement AC #6.
- **Pattern de données** : TanStack Query hooks dans les composants (PAS de `loader`/`beforeLoad`)
- **Convention** : colonnes DB en `snake_case`, TypeScript en camelCase, composants en PascalCase

### Hook `useSwipe` — Spécification complète

```typescript
// src/lib/utils/useSwipe.ts
interface UseSwipeOptions {
  onSwipe: (direction: 'left' | 'right') => void
  threshold?: number   // px minimum pour déclencher (default: 50)
}

interface SwipeHandlers {
  onPointerDown: (e: React.PointerEvent) => void
  onPointerMove: (e: React.PointerEvent) => void
  onPointerUp: (e: React.PointerEvent) => void
}

export function useSwipe(options: UseSwipeOptions): SwipeHandlers
```

**Algorithme de détection :**
1. `onPointerDown` → stocker `startX`, `startY`, `startTime`
2. `onPointerMove` → calculer `deltaX`, `deltaY`. Si `|deltaY| > |deltaX|` → ignorer (scroll vertical). Optionnel : `setPointerCapture()` pour capturer le geste.
3. `onPointerUp` → calculer `deltaX` final et `velocity = deltaX / (now - startTime)`. Si `|deltaX| >= threshold` OU `|velocity| > 0.5` → déclencher `onSwipe('left')` (deltaX < 0) ou `onSwipe('right')` (deltaX > 0).

**Important — Conflit avec le scroll vertical :**
Le hook ne doit PAS appeler `e.preventDefault()` sur les events pointer (cela bloquerait le scroll). Il se contente de *détecter* le geste et d'appeler le callback. Le scroll vertical continue de fonctionner normalement.

**Important — Conflit avec TapCycleButton :**
Le swipe se déclenche uniquement si `|deltaX| >= 50px`. Un tap sur le TapCycleButton a un deltaX de ~0px. Aucun conflit possible.

### Composant `PaginationDots` — Spécification

```typescript
// src/components/PaginationDots.tsx
interface PaginationDotsProps {
  total: number
  current: number  // 0-indexed
}

export function PaginationDots({ total, current }: PaginationDotsProps)
```

**Rendu :**
```tsx
<div
  className="flex items-center justify-center gap-1.5 py-3"
  role="status"
  aria-label={`Pièce ${current + 1} sur ${total}`}
>
  {Array.from({ length: total }, (_, i) => (
    <div
      key={i}
      className={cn(
        'size-2 rounded-full transition-colors',
        i === current ? 'bg-foreground' : 'bg-muted-foreground/40',
      )}
    />
  ))}
</div>
```

**Design :** Dots discrets, non interactifs. Le dot actif utilise `bg-foreground` (adapté dark/light). Taille 8px (`size-2`). Espacement `gap-1.5` (6px).

### Animation slide — CSS exact

```css
/* Ajout dans @theme inline de index.css */
--animate-slide-in-right: slide-in-from-right 200ms ease-out;
--animate-slide-in-left: slide-in-from-left 200ms ease-out;

/* Ajout après le @keyframes tap-cycle existant */
@keyframes slide-in-from-right {
  from { transform: translateX(30%); opacity: 0.8; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes slide-in-from-left {
  from { transform: translateX(-30%); opacity: 0.8; }
  to { transform: translateX(0); opacity: 1; }
}
```

**Pourquoi 30% et pas 100% :** Un slide complet de 100% est trop dramatique pour naviguer entre pièces du même lot. 30% donne une sensation de glissement subtil, cohérente avec le rythme rapide de Bruno (50+ lots/jour). L'opacité (0.8 → 1) ajoute une profondeur visuelle sans être distrayante.

**Intégration dans le composant :**
```tsx
<div
  key={pieceId}  // Force re-mount = déclenche animation
  className={cn(
    'flex flex-col',
    slideDirection === 'left' && 'motion-safe:animate-slide-in-right',
    slideDirection === 'right' && 'motion-safe:animate-slide-in-left',
  )}
>
  {/* contenu de la pièce */}
</div>
```

**Logique des noms :**
- Swipe LEFT (→ pièce suivante) → contenu arrive de la DROITE → `slide-in-from-right`
- Swipe RIGHT (→ pièce précédente) → contenu arrive de la GAUCHE → `slide-in-from-left`

### Modification de `$pieceId.tsx` — Plan détaillé

Le fichier actuel fait 159 lignes. Les modifications sont chirurgicales :

**1. Imports à ajouter :**
```typescript
import { useSwipe } from '@/lib/utils/useSwipe'
import { PaginationDots } from '@/components/PaginationDots'
```

**2. Variables de navigation à ajouter dans `PiecePage()` :**
```typescript
const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null)

const currentIndex = pieces?.findIndex((p) => p.id === pieceId) ?? -1
const hasPrev = currentIndex > 0
const hasNext = pieces ? currentIndex < pieces.length - 1 : false

const swipeHandlers = useSwipe({
  onSwipe: (direction) => {
    if (direction === 'left' && hasNext) {
      setSlideDirection('left')
      navigate({
        to: '/chantiers/$chantierId/plots/$plotId/$etageId/$lotId/$pieceId',
        params: { chantierId, plotId, etageId, lotId, pieceId: pieces![currentIndex + 1].id },
      })
    } else if (direction === 'right' && hasPrev) {
      setSlideDirection('right')
      navigate({
        to: '/chantiers/$chantierId/plots/$plotId/$etageId/$lotId/$pieceId',
        params: { chantierId, plotId, etageId, lotId, pieceId: pieces![currentIndex - 1].id },
      })
    }
  },
})
```

**3. Conteneur principal (return) — ajouter key, animation, handlers, dots :**
```tsx
return (
  <div
    key={pieceId}
    className={cn(
      'flex flex-col',
      slideDirection === 'left' && 'motion-safe:animate-slide-in-right',
      slideDirection === 'right' && 'motion-safe:animate-slide-in-left',
    )}
    {...swipeHandlers}
  >
    {/* header inchangé */}
    {/* BreadcrumbNav inchangé */}
    {/* contenu tâches inchangé */}

    {/* Pagination dots — après le contenu */}
    {pieces && pieces.length > 1 && (
      <PaginationDots total={pieces.length} current={currentIndex} />
    )}
  </div>
)
```

**4. Ce qui NE change PAS :**
- Le skeleton loading (pas de données pour swiper pendant le chargement)
- L'état "pièce introuvable" (pas de données pour swiper)
- Le header avec bouton retour (continue de naviguer vers le lot)
- Le BreadcrumbNav (se met à jour automatiquement via les params de route)
- Le `formatCounter()` et les TapCycleButtons

### Tests — Pattern et mocks

**Mocks multi-pièces pour les tests swipe :**
```typescript
const mockMultiplePieces = [
  {
    id: 'piece-1', lot_id: 'lot-1', nom: 'Séjour',
    progress_done: 1, progress_total: 3,
    created_at: '2026-01-01T00:00:00Z',
    taches: [
      { id: 't1', piece_id: 'piece-1', nom: 'Ragréage', status: 'done', created_at: '2026-01-01T00:00:00Z' },
      { id: 't2', piece_id: 'piece-1', nom: 'Pose', status: 'in_progress', created_at: '2026-01-01T00:00:00Z' },
      { id: 't3', piece_id: 'piece-1', nom: 'Plinthes', status: 'not_started', created_at: '2026-01-01T00:00:00Z' },
    ],
  },
  {
    id: 'piece-2', lot_id: 'lot-1', nom: 'Chambre',
    progress_done: 0, progress_total: 2,
    created_at: '2026-01-01T01:00:00Z',
    taches: [
      { id: 't4', piece_id: 'piece-2', nom: 'Ragréage', status: 'not_started', created_at: '2026-01-01T00:00:00Z' },
      { id: 't5', piece_id: 'piece-2', nom: 'Pose', status: 'not_started', created_at: '2026-01-01T00:00:00Z' },
    ],
  },
  {
    id: 'piece-3', lot_id: 'lot-1', nom: 'SDB',
    progress_done: 2, progress_total: 2,
    created_at: '2026-01-01T02:00:00Z',
    taches: [
      { id: 't6', piece_id: 'piece-3', nom: 'Ragréage', status: 'done', created_at: '2026-01-01T00:00:00Z' },
      { id: 't7', piece_id: 'piece-3', nom: 'Pose', status: 'done', created_at: '2026-01-01T00:00:00Z' },
    ],
  },
]
```

**Simulation de swipe dans les tests :**
```typescript
// Helper pour simuler un swipe via PointerEvents
async function simulateSwipe(element: HTMLElement, direction: 'left' | 'right') {
  const deltaX = direction === 'left' ? -100 : 100
  await fireEvent.pointerDown(element, { clientX: 200, clientY: 300 })
  await fireEvent.pointerMove(element, { clientX: 200 + deltaX, clientY: 300 })
  await fireEvent.pointerUp(element, { clientX: 200 + deltaX, clientY: 300 })
}
```

**Note testing-library :** `userEvent` ne supporte pas directement les séquences pointer complexes. Utiliser `fireEvent` de `@testing-library/react` pour les PointerEvents de swipe.

### Prérequis et dépendances

- **Aucune dépendance npm à ajouter** — tout en natif (PointerEvents, CSS keyframes)
- **Aucune migration SQL** — pas de changement de données
- **Aucune modification de `database.ts`** — pas de nouvelles colonnes
- **Aucune modification de queries/mutations** — `usePieces(lotId)` fournit déjà tout

### Impact sur les composants existants

| Composant | Modifié ? | Raison |
|-----------|-----------|--------|
| `$pieceId.tsx` | **OUI** | Ajout swipe + dots + animation |
| `$pieceId.test.tsx` | **OUI** | Nouveaux tests swipe + dots |
| `index.css` | **OUI** | 2 keyframes + 2 variables d'animation |
| `PaginationDots.tsx` | **NOUVEAU** | Composant dots |
| `PaginationDots.test.tsx` | **NOUVEAU** | Tests du composant |
| `useSwipe.ts` | **NOUVEAU** | Hook de détection de gestes |
| `useSwipe.test.ts` | **NOUVEAU** | Tests du hook |
| BreadcrumbNav | Non | Se met à jour via les params de route |
| TapCycleButton | Non | Aucun conflit (threshold 50px vs tap ~0px) |
| StatusCard | Non | Pas dans la page pièce |
| usePieces | Non | Fournit déjà toutes les pièces |
| useUpdateTaskStatus | Non | Continue de fonctionner identiquement |

### Learnings des stories précédentes (3.1, 3.2, 3.3)

- **`usePieces(lotId)`** retourne les pièces ordonnées par `created_at ASC` — utiliser cet ordre pour le swipe (cohérent avec l'affichage dans le lot)
- **`motion-safe:` prefix** : utilisé par TapCycleButton (ligne 79 de TapCycleButton.tsx) — même convention pour l'animation slide
- **Haptic feedback** : `navigator.vibrate(10)` dans TapCycleButton — ne PAS ajouter pour le swipe (réservé au changement de statut, pas à la navigation)
- **`cn()` utility** : import depuis `@/lib/utils` pour les classes conditionnelles
- **Mock Supabase** dans les tests : chaînable `from().select().eq().order()` — pattern établi
- **Realtime** : `useRealtimePieces(lotId)` est déjà intégré dans la page lot — mais PAS dans `$pieceId.tsx`. **Ne PAS l'ajouter** dans `$pieceId.tsx` (les pièces ne changent pas de la page pièce, et les tâches sont déjà gérées par l'optimistic update de `useUpdateTaskStatus`).
- **`Relationships: []`** obligatoire dans database.ts — mais pas de modification de types dans cette story
- **Lint** : erreur préexistante `ThemeProvider.tsx:64` (react-refresh) — ne pas corriger

### Risques et points d'attention

1. **Conflit swipe / scroll vertical** : Le hook `useSwipe` doit ignorer les gestes à dominance verticale (`|deltaY| > |deltaX|`). Ne PAS appeler `preventDefault()` pour ne pas bloquer le scroll natif.
2. **Performance** : L'animation CSS est GPU-accelerated (`transform` + `opacity`). Pas de JavaScript dans la boucle d'animation. Le `key={pieceId}` force un re-mount propre (pas de stale state).
3. **Bundle size** : Zéro dépendance ajoutée. Le hook `useSwipe` fait ~30 lignes. `PaginationDots` fait ~15 lignes.
4. **Lot avec 1 seule pièce** : Les dots ne s'affichent pas (`pieces.length > 1`), le swipe ne fait rien (ni `hasPrev` ni `hasNext`). Pas de régression.
5. **URL directe vers une pièce** : L'animation ne se joue pas au premier chargement (`slideDirection` est `null`). C'est le comportement souhaité.

### Project Structure Notes

- Nouveau hook dans `src/lib/utils/` (même emplacement que `computeStatus.ts`)
- Nouveau composant dans `src/components/` (même emplacement que `TapCycleButton.tsx`, `StatusCard.tsx`)
- Tests dans le même dossier que le fichier source (convention projet)
- Pas de nouvelle route — modification de route existante uniquement
- Pas de conflit avec le routeTree.gen.ts

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 3.4, Epic 3]
- [Source: _bmad-output/planning-artifacts/architecture.md — Frontend Structure, Communication Patterns, Naming Conventions]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Navigation Gestures (swipe), Experience Principles, RoomScreen spec, Pagination dots]
- [Source: _bmad-output/planning-artifacts/prd.md — FR24 (navigation pièces), NFR2 (navigation <1s), NFR3 (feedback <300ms)]
- [Source: _bmad-output/planning-artifacts/product-brief-posePilot-2026-02-05.md — Journey 1 Bruno (swipe to next room)]
- [Source: src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/$pieceId.tsx — Page pièce actuelle]
- [Source: src/components/TapCycleButton.tsx — Pattern animation motion-safe, haptic feedback]
- [Source: src/lib/queries/usePieces.ts — Query hook retourne toutes les pièces + taches]
- [Source: src/index.css — @keyframes tap-cycle, prefers-reduced-motion, @theme inline]
- [Source: _bmad-output/implementation-artifacts/3-3-grilles-de-cartes-colorees-et-agregation.md — Learnings, patterns, tests]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Lint fix: `useSwipe.ts` — supprimé paramètre `_e` inutilisé dans `onPointerMove` (no-unused-vars)
- Build TS errors: tous pré-existants (pwa-config.test.ts, navigation-hierarchy.test.tsx, useCreatePlot.ts, $chantierId/index.test.tsx) — aucun introduit par cette story

### Completion Notes List

- ✅ Hook `useSwipe` — 8 tests (left, right, threshold, velocity, vertical ignore, no-down, custom threshold, multi-gesture)
- ✅ Composant `PaginationDots` — 4 tests (count, active dot, aria-label, first active)
- ✅ Animation CSS — 2 keyframes `slide-in-from-right`/`slide-in-from-left` (200ms ease-out, 30% translateX + opacity) + 2 variables `@theme inline`
- ✅ `$pieceId.tsx` refactoré — swipe navigation via `useSwipe`, animation via `key={pieceId}` + `slideDirection`, dots conditionels (`length > 1`)
- ✅ 7 nouveaux tests page pièce (swipe left/right, boundary first/last, dots count/active, single piece no dots)
- ✅ 403/403 tests passent — 0 régression
- ✅ 0 nouvelle erreur lint (seule erreur = ThemeProvider.tsx:64 pré-existante)
- ✅ 0 dépendance npm ajoutée — PointerEvents natifs + CSS keyframes

### Change Log

- 2026-02-10: Implémentation story 3.4 — swipe entre pièces avec hook useSwipe, composant PaginationDots, animations CSS slide, 19 nouveaux tests
- 2026-02-10: Code review (AI) — 6 issues corrigées (H1: latest-ref pattern pour onSwipe, H2: reset slideDirection via onAnimationEnd, H3: distance minimale pour velocity swipe, M1: tests découplés du CSS, M2: PaginationDots edge cases, M3: vérification claim tests). 30/30 tests, 0 erreur lint.

### File List

- `src/lib/utils/useSwipe.ts` — NOUVEAU — Hook détection gestes swipe (PointerEvents)
- `src/lib/utils/useSwipe.test.ts` — NOUVEAU — 8 tests unitaires du hook
- `src/components/PaginationDots.tsx` — NOUVEAU — Composant dots de pagination
- `src/components/PaginationDots.test.tsx` — NOUVEAU — 4 tests du composant
- `src/index.css` — MODIFIÉ — 2 keyframes + 2 variables d'animation ajoutées
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/$pieceId.tsx` — MODIFIÉ — Swipe + dots + animation
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/$pieceId.test.tsx` — MODIFIÉ — 7 nouveaux tests swipe/dots
