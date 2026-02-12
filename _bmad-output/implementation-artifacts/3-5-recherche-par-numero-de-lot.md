# Story 3.5: Recherche par numéro de lot

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant que utilisateur terrain de posePilot,
Je veux rechercher un lot par son numéro depuis n'importe quel écran du chantier,
Afin que j'accède directement au lot voulu en 2 interactions.

## Acceptance Criteria

1. **Given** l'utilisateur est dans un chantier complet (n'importe quel niveau) **When** l'écran s'affiche **Then** la SearchBar est visible en haut avec un clavier numérique par défaut (`inputmode="numeric"`)

2. **Given** l'utilisateur tape un numéro (ex: "203") **When** la saisie commence **Then** les résultats s'affichent en temps réel dès le 1er caractère, filtrant les lots correspondants

3. **Given** des résultats s'affichent **When** l'utilisateur consulte un résultat **Then** chaque résultat montre le numéro de lot + sa localisation complète (ex: "Lot 203 — Plot A › É2")

4. **Given** l'utilisateur tape sur un résultat **When** il sélectionne le lot **Then** la navigation directe vers ce lot s'effectue

5. **Given** la barre de recherche est focusée mais vide **When** les suggestions s'affichent **Then** les 5 dernières recherches sont proposées en accès rapide

6. **Given** aucun lot ne correspond au numéro saisi **When** les résultats s'affichent **Then** un message "Aucun lot trouvé pour « X »" avec suggestion "Vérifiez le numéro" s'affiche

## Tasks / Subtasks

- [x] Task 1 — Créer le hook `useChantierLots` pour charger tous les lots d'un chantier (AC: #2, #3)
  - [x] 1.1 Créer `src/lib/queries/useChantierLots.ts`
  - [x] 1.2 Query Supabase : `lots` avec join `plots!inner(nom)` + `etages(nom)` filtré par `plots.chantier_id = chantierId`
  - [x] 1.3 Retourner `{ id, code, plot_id, etage_id, plots: { nom }, etages: { nom } }` pour chaque lot
  - [x] 1.4 Query key : `['chantier-lots', chantierId]`
  - [x] 1.5 Type exporté : `ChantierLot` avec tous les champs nécessaires à l'affichage et la navigation
  - [x] 1.6 Créer `src/lib/queries/useChantierLots.test.ts` — tests unitaires (mock supabase, type checking)

- [x] Task 2 — Créer le hook utilitaire `useLotSearchHistory` pour l'historique local (AC: #5)
  - [x] 2.1 Créer `src/lib/utils/useLotSearchHistory.ts`
  - [x] 2.2 Clé localStorage : `posepilot-lot-search-${chantierId}`
  - [x] 2.3 API : `{ history: string[], addToHistory(code: string): void, clearHistory(): void }`
  - [x] 2.4 Limiter à 5 entrées (FIFO), dédupliquer (pas de doublon, déplace en tête si déjà présent)
  - [x] 2.5 Créer `src/lib/utils/useLotSearchHistory.test.ts` — tests (add, deduplicate, limit 5, clear, localStorage read/write)

- [x] Task 3 — Créer le composant `LotSearchBar` (AC: #1, #2, #3, #4, #5, #6)
  - [x] 3.1 Créer `src/components/LotSearchBar.tsx`
  - [x] 3.2 Props : `chantierId: string`
  - [x] 3.3 Layout : barre fixe avec icône Search (lucide), champ Input (`inputmode="numeric"`, `placeholder="Rechercher un lot..."`), bouton X pour clear
  - [x] 3.4 Attributs d'accessibilité : `role="search"`, `aria-label="Rechercher un lot par numéro"`, résultats dans un `ul` avec `aria-live="polite"`
  - [x] 3.5 Filtrage client-side : `useMemo` sur `useChantierLots` filtrant `lot.code.toLowerCase().includes(query.toLowerCase())`
  - [x] 3.6 Résultats dropdown : liste sous la barre, chaque item affiche `Lot {code} — {plots.nom} › {etages.nom}`
  - [x] 3.7 Navigation sur tap : `navigate({ to: '/chantiers/$chantierId/plots/$plotId/$etageId/$lotId', params: { chantierId, plotId: lot.plot_id, etageId: lot.etage_id, lotId: lot.id } })`
  - [x] 3.8 Après navigation : clear le champ, ajouter la query à l'historique via `addToHistory`
  - [x] 3.9 État vide (focus, pas de query) : afficher les 5 dernières recherches depuis `useLotSearchHistory`
  - [x] 3.10 État "aucun résultat" : afficher "Aucun lot trouvé pour « {query} »" + "Vérifiez le numéro"
  - [x] 3.11 État de chargement : si `useChantierLots` est en cours, afficher l'icône Search en `animate-pulse` (subtil, pas de spinner)
  - [x] 3.12 Fermer les résultats quand le champ perd le focus (avec délai 150ms pour permettre le tap sur un résultat)
  - [x] 3.13 Créer `src/components/LotSearchBar.test.tsx` — tests complets (rendu, filtrage, navigation, historique, état vide, aucun résultat, accessibilité)

- [x] Task 4 — Intégrer `LotSearchBar` dans le layout chantier (AC: #1)
  - [x] 4.1 Modifier `src/routes/_authenticated/chantiers/$chantierId.tsx`
  - [x] 4.2 Importer `useChantier` et `LotSearchBar`
  - [x] 4.3 Afficher `<LotSearchBar chantierId={chantierId} />` UNIQUEMENT si `chantier?.type === 'complet'`
  - [x] 4.4 Position : entre le layout wrapper et `<Outlet />`, en `sticky top-0 z-10` pour rester visible au scroll
  - [x] 4.5 Ne PAS afficher pour les chantiers légers (pas de lots)

- [x] Task 5 — Tests d'intégration et régression (AC: #1-6)
  - [x] 5.1 Tester que la SearchBar est visible sur la page chantier index (complet)
  - [x] 5.2 Tester que la SearchBar n'est PAS visible sur un chantier léger
  - [x] 5.3 Tester le filtrage en temps réel (saisie → résultats filtrés)
  - [x] 5.4 Tester la navigation vers un lot sélectionné
  - [x] 5.5 Tester l'affichage de l'historique quand le champ est vide et focusé
  - [x] 5.6 Tester le message "Aucun lot trouvé"
  - [x] 5.7 Lancer `npm run test` — tous les tests existants (400+) passent
  - [x] 5.8 Lancer `npm run lint` — 0 nouvelles erreurs
  - [x] 5.9 Lancer `npm run build` — build propre (erreurs TS pré-existantes uniquement, aucune dans les fichiers de cette story)

## Dev Notes

### Contexte architectural

- **Recherche cross-plot** : Contrairement à `useLots(plotId)` qui scope par plot, la recherche doit couvrir TOUS les lots de TOUS les plots d'un chantier. Il faut un nouveau hook `useChantierLots(chantierId)` qui utilise un join Supabase via la relation `lots_plot_id_fkey`.
- **Filtrage client-side** : Les chantiers posePilot ont typiquement 2-3 plots et < 200 lots. Le chargement initial de tous les lots est acceptable (< 1s). Le filtrage `useMemo` en client est instantané (< 10ms). Pas besoin de debounce ni de query serveur par frappe.
- **Pattern de données** : TanStack Query hooks dans les composants (PAS de `loader`/`beforeLoad`).
- **Convention** : colonnes DB en `snake_case`, TypeScript en camelCase, composants en PascalCase.
- **Layout chantier** : Actuellement `$chantierId.tsx` est un simple `<Outlet />`. On le modifie pour inclure la SearchBar au-dessus de l'Outlet, visible à TOUS les niveaux de navigation dans le chantier.

### Hook `useChantierLots` — Spécification complète

```typescript
// src/lib/queries/useChantierLots.ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface ChantierLot {
  id: string
  code: string
  plot_id: string
  etage_id: string
  plots: { nom: string }
  etages: { nom: string } | null
}

export function useChantierLots(chantierId: string) {
  return useQuery({
    queryKey: ['chantier-lots', chantierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lots')
        .select('id, code, plot_id, etage_id, plots!inner(nom), etages(nom)')
        .eq('plots.chantier_id', chantierId)
        .order('code')
      if (error) throw error
      return data as unknown as ChantierLot[]
    },
    enabled: !!chantierId,
    staleTime: 5 * 60 * 1000, // 5 min — les lots ne changent pas fréquemment
  })
}
```

**`staleTime` :** Les lots d'un chantier ne changent pas à chaque seconde. 5 minutes de staleTime évite des refetches inutiles quand l'utilisateur navigue entre les niveaux du chantier (chaque remount de la SearchBar dans le layout ne refetch pas).

**Explication du join Supabase :**
- `plots!inner(nom)` : inner join sur la table `plots` via la FK `lots_plot_id_fkey`. Le `!inner` garantit que seuls les lots dont le plot existe sont retournés.
- `.eq('plots.chantier_id', chantierId)` : filtre sur la colonne `chantier_id` de la table jointe `plots`. PostgREST supporte ce pattern pour filtrer via des relations.
- `etages(nom)` : left join sur `etages` pour obtenir le nom de l'étage.
- `order('code')` : tri alphabétique par code de lot.

**Query key :** `['chantier-lots', chantierId]` — séparé de `['lots', plotId]` pour ne pas interférer avec le cache existant.

**Type casting :** `as unknown as ChantierLot[]` nécessaire car le type inféré par Supabase pour les joins embedded ne correspond pas exactement (même pattern que `useLots.ts` ligne 22).

### Hook `useLotSearchHistory` — Spécification complète

```typescript
// src/lib/utils/useLotSearchHistory.ts
import { useState, useCallback } from 'react'

const MAX_HISTORY = 5
const STORAGE_PREFIX = 'posepilot-lot-search-'

export function useLotSearchHistory(chantierId: string) {
  const storageKey = `${STORAGE_PREFIX}${chantierId}`

  const [history, setHistory] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '[]')
    } catch {
      return []
    }
  })

  const addToHistory = useCallback((code: string) => {
    setHistory((prev) => {
      const filtered = prev.filter((c) => c !== code)
      const next = [code, ...filtered].slice(0, MAX_HISTORY)
      localStorage.setItem(storageKey, JSON.stringify(next))
      return next
    })
  }, [storageKey])

  const clearHistory = useCallback(() => {
    localStorage.removeItem(storageKey)
    setHistory([])
  }, [storageKey])

  return { history, addToHistory, clearHistory }
}
```

**Pattern localStorage :** Même pattern que `ThemeProvider.tsx` — initialisation lazy dans `useState`, écriture synchrone. `try/catch` pour les cas où localStorage est indisponible (navigation privée, quota dépassé).

### Composant `LotSearchBar` — Spécification complète

```typescript
// src/components/LotSearchBar.tsx
interface LotSearchBarProps {
  chantierId: string
}
```

**Structure HTML :**
```tsx
<div role="search" className="sticky top-0 z-10 border-b border-border bg-background px-4 py-2">
  <div className="relative">
    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
    <Input
      inputMode="numeric"
      placeholder="Rechercher un lot..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      onFocus={() => setShowResults(true)}
      onBlur={() => setTimeout(() => setShowResults(false), 150)}
      className="pl-8 pr-8"
      aria-label="Rechercher un lot par numéro"
    />
    {query && (
      <button
        type="button"
        onClick={() => { setQuery(''); inputRef.current?.focus() }}
        className="absolute right-2.5 top-1/2 -translate-y-1/2"
        aria-label="Effacer la recherche"
      >
        <X className="size-4 text-muted-foreground" />
      </button>
    )}
  </div>

  {showResults && (
    <ul
      className="absolute left-0 right-0 mx-4 mt-1 max-h-64 overflow-y-auto rounded-md border border-border bg-popover shadow-md"
      aria-live="polite"
    >
      {/* Résultats ou historique ou message vide */}
    </ul>
  )}
</div>
```

**Logique de filtrage :**
```typescript
const { data: allLots } = useChantierLots(chantierId)
const { history, addToHistory } = useLotSearchHistory(chantierId)

const filteredLots = useMemo(() => {
  if (!query.trim() || !allLots) return []
  const q = query.toLowerCase()
  return allLots.filter((lot) => lot.code.toLowerCase().includes(q))
}, [allLots, query])
```

**Logique d'affichage des résultats :**
1. **Si `query` non vide ET résultats trouvés** → afficher les lots filtrés
2. **Si `query` non vide ET aucun résultat** → afficher "Aucun lot trouvé pour « {query} »" + "Vérifiez le numéro"
3. **Si `query` vide ET focusé ET historique non vide** → afficher les 5 dernières recherches
4. **Si `query` vide ET focusé ET historique vide** → ne rien afficher (pas de dropdown)

**Format d'un résultat de recherche :**
```tsx
<li
  key={lot.id}
  className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-accent active:bg-accent"
  onMouseDown={() => handleSelectLot(lot)} // onMouseDown au lieu de onClick pour s'exécuter avant onBlur
>
  <span className="font-medium text-foreground">Lot {lot.code}</span>
  <span className="text-muted-foreground text-sm">
    — {lot.plots.nom} › {lot.etages?.nom ?? '?'}
  </span>
</li>
```

**Navigation :**
```typescript
function handleSelectLot(lot: ChantierLot) {
  addToHistory(query.trim())
  setQuery('')
  setShowResults(false)
  navigate({
    to: '/chantiers/$chantierId/plots/$plotId/$etageId/$lotId',
    params: {
      chantierId,
      plotId: lot.plot_id,
      etageId: lot.etage_id,
      lotId: lot.id,
    },
  })
}
```

**onMouseDown vs onClick :** Utiliser `onMouseDown` sur les items de résultat car `onBlur` du champ se déclenche avant `onClick`. Avec `onMouseDown`, le handler s'exécute avant le `onBlur` → la navigation se fait avant que les résultats ne soient masqués.

**Format d'un item d'historique :**
```tsx
<li
  key={entry}
  className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-accent active:bg-accent"
  onMouseDown={() => setQuery(entry)} // Remplir le champ avec l'ancienne recherche
>
  <Clock className="size-3.5 text-muted-foreground" />
  <span className="text-foreground">{entry}</span>
</li>
```

### Modification de `$chantierId.tsx` — Plan

Le fichier actuel fait 11 lignes. La modification :

```typescript
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useChantier } from '@/lib/queries/useChantier'
import { LotSearchBar } from '@/components/LotSearchBar'

export const Route = createFileRoute('/_authenticated/chantiers/$chantierId')({
  staticData: { breadcrumb: 'Chantier' },
  component: ChantierLayout,
})

function ChantierLayout() {
  const { chantierId } = Route.useParams()
  const { data: chantier } = useChantier(chantierId)

  return (
    <>
      {chantier?.type === 'complet' && <LotSearchBar chantierId={chantierId} />}
      <Outlet />
    </>
  )
}
```

**Pourquoi ici :** Le layout `$chantierId.tsx` wraps TOUTES les pages enfant (index, plots, étages, lots, pièces). En mettant la SearchBar dans ce layout, elle est visible à TOUS les niveaux de navigation — exactement ce que l'AC #1 exige.

**`sticky top-0 z-10`** : La SearchBar reste visible en scrollant, au-dessus du contenu. Le `z-10` la place au-dessus des éléments de page standard.

**Chantier léger** : La condition `chantier?.type === 'complet'` exclut les chantiers légers (pas de lots).

**Chargement** : Pendant le chargement du chantier (`chantier` est `undefined`), la SearchBar ne s'affiche pas. C'est le comportement souhaité — pas de SearchBar avant de savoir le type.

### Tests — Pattern et mocks

**Mock du hook `useChantierLots` :**
```typescript
vi.mock('@/lib/queries/useChantierLots', () => ({
  useChantierLots: vi.fn(),
}))

const mockLots: ChantierLot[] = [
  {
    id: 'lot-1', code: '101', plot_id: 'plot-1', etage_id: 'etage-1',
    plots: { nom: 'Plot A' }, etages: { nom: 'RDC' },
  },
  {
    id: 'lot-2', code: '102', plot_id: 'plot-1', etage_id: 'etage-1',
    plots: { nom: 'Plot A' }, etages: { nom: 'RDC' },
  },
  {
    id: 'lot-3', code: '203', plot_id: 'plot-1', etage_id: 'etage-2',
    plots: { nom: 'Plot A' }, etages: { nom: 'É1' },
  },
  {
    id: 'lot-4', code: '301', plot_id: 'plot-2', etage_id: 'etage-3',
    plots: { nom: 'Plot B' }, etages: { nom: 'RDC' },
  },
]
```

**Mock localStorage pour les tests :**
```typescript
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()
Object.defineProperty(window, 'localStorage', { value: localStorageMock })
```

**Tests du composant LotSearchBar :**
1. Rendu initial : barre de recherche avec placeholder "Rechercher un lot..."
2. `inputMode="numeric"` présent
3. Saisie "20" → affiche Lot 203 dans les résultats
4. Saisie "999" → affiche "Aucun lot trouvé pour « 999 »"
5. Focus sur champ vide avec historique → affiche les entrées d'historique
6. Tap sur résultat → `navigate` appelé avec les bons params
7. Tap sur résultat → historique mis à jour
8. Tap sur bouton X → champ vidé
9. `role="search"` et `aria-label` présents

### Prérequis et dépendances

- **Aucune dépendance npm à ajouter** — lucide-react (Search, X, Clock icons) déjà installé, Input de shadcn/ui existant
- **Aucune migration SQL** — les tables `lots`, `plots`, `etages` existent déjà avec les relations nécessaires
- **Aucune modification de `database.ts`** — pas de nouvelles colonnes
- **Aucune modification de queries/mutations existantes** — `useLots(plotId)` reste inchangé, on ajoute un nouveau hook

### Impact sur les composants existants

| Composant | Modifié ? | Raison |
|-----------|-----------|--------|
| `$chantierId.tsx` | **OUI** | Ajout SearchBar dans le layout |
| `LotSearchBar.tsx` | **NOUVEAU** | Composant barre de recherche |
| `LotSearchBar.test.tsx` | **NOUVEAU** | Tests du composant |
| `useChantierLots.ts` | **NOUVEAU** | Hook query tous les lots d'un chantier |
| `useChantierLots.test.ts` | **NOUVEAU** | Tests du hook |
| `useLotSearchHistory.ts` | **NOUVEAU** | Hook historique localStorage |
| `useLotSearchHistory.test.ts` | **NOUVEAU** | Tests du hook |
| BreadcrumbNav | Non | Pas de modification |
| BottomNavigation | Non | Pas de modification |
| StatusCard | Non | Pas de modification |
| useLots | Non | Query existante inchangée, séparée par queryKey |

### Learnings des stories précédentes (3.1, 3.2, 3.3, 3.4)

- **`motion-safe:` prefix** : utilisé par TapCycleButton et animations slide — pas applicable à cette story (pas d'animation complexe)
- **`cn()` utility** : import depuis `@/lib/utils` pour les classes conditionnelles
- **Mock Supabase** dans les tests : chaînable `from().select().eq().order()` — pattern établi. Pour le `!inner` join, le mock retourne simplement les données formatées.
- **`Relationships: []`** obligatoire dans database.ts — mais pas de modification de types dans cette story
- **Lint** : erreur préexistante `ThemeProvider.tsx:64` (react-refresh) — ne pas corriger
- **Route tests** : `createRouter` + `createMemoryHistory` + `RouterProvider` avec `QueryClientProvider` + `AuthContext.Provider` — pattern établi
- **`onMouseDown` vs `onClick`** : Important pour les dropdowns avec `onBlur`. Pattern utilisé dans les bibliothèques UI (shadcn/combobox). `onMouseDown` s'exécute AVANT `onBlur`.
- **localStorage pattern** : Voir `ThemeProvider.tsx` pour le pattern `useState(() => localStorage.getItem(...))` avec `try/catch`

### Risques et points d'attention

1. **Join Supabase `!inner`** : La syntaxe `plots!inner(nom)` avec filtre `.eq('plots.chantier_id', chantierId)` est le pattern PostgREST standard pour filtrer via une relation. Si le client Supabase ne le supporte pas bien, fallback : deux queries séparées (plots par chantierId → lots par plotIds via `.in()`).
2. **Performance dropdown** : Le `max-h-64 overflow-y-auto` empêche la liste de devenir trop longue. Pour un chantier typique (< 200 lots), le rendu est instantané.
3. **Z-index** : `z-10` pour la SearchBar sticky. Vérifier qu'elle ne conflit pas avec le `z-50` des sheets/dialogs (c'est OK, `z-50 > z-10`).
4. **Safe area** : La SearchBar est positionnée après le safe-area top du layout `_authenticated.tsx` (le `pt-[env(safe-area-inset-top)]` est sur le parent). Pas de conflit.
5. **onBlur timing** : Le `setTimeout(150ms)` dans `onBlur` est un pattern courant mais fragile. Si nécessaire, utiliser `onPointerDown` au lieu de `onMouseDown` pour une meilleure compatibilité mobile.
6. **Historique par chantier** : L'historique est scopé par `chantierId` via la clé localStorage. Si un utilisateur a 10 chantiers, cela crée 10 entrées localStorage (< 1KB total). Pas de nettoyage nécessaire.

### Project Structure Notes

- Nouveau hook query dans `src/lib/queries/` (même emplacement que `useChantier.ts`, `useLots.ts`)
- Nouveau hook utilitaire dans `src/lib/utils/` (même emplacement que `useSwipe.ts`, `computeStatus.ts`)
- Nouveau composant dans `src/components/` (même emplacement que `StatusCard.tsx`, `BreadcrumbNav.tsx`)
- Tests dans le même dossier que le fichier source (convention projet)
- Modification mineure du layout route `$chantierId.tsx`
- Pas de nouvelle route — modification du layout existant uniquement
- Pas de conflit avec le `routeTree.gen.ts`

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 3.5, Epic 3]
- [Source: _bmad-output/planning-artifacts/architecture.md — Data Architecture, API Communication, Frontend Structure]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — SearchBar component spec, Navigation Patterns, Empty States, Loading States]
- [Source: _bmad-output/planning-artifacts/prd.md — FR8 (recherche lot), NFR4 (recherche < 1s)]
- [Source: src/lib/queries/useLots.ts — Pattern query existant avec join Supabase]
- [Source: src/routes/_authenticated/chantiers/$chantierId.tsx — Layout actuel à modifier]
- [Source: src/routes/_authenticated/chantiers/$chantierId/index.tsx — Page chantier index pour référence patterns]
- [Source: src/components/BreadcrumbNav.tsx — Pattern navigation et résolution de params]
- [Source: supabase/migrations/007_lots.sql — Schema lots, FK lots_plot_id_fkey, index]
- [Source: supabase/migrations/004_plots.sql — Schema plots, FK plots.chantier_id]
- [Source: src/components/ThemeProvider.tsx — Pattern localStorage]
- [Source: _bmad-output/implementation-artifacts/3-4-swipe-entre-pieces.md — Learnings et patterns établis]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Test `LotSearchBar > shows full location for each result` failed initially: multiple elements matching `/Plot A › RDC/` because "10" matches lots 101 and 102 (both in Plot A, RDC). Fix: use `getAllByText` + length check instead of `getByText`.

### Completion Notes List

- **Task 1**: Created `useChantierLots` hook — Supabase query with `plots!inner(nom)` join + `etages(nom)` left join, filtered by `plots.chantier_id`. Query key `['chantier-lots', chantierId]`, `staleTime: 5min`. 5 unit tests passing.
- **Task 2**: Created `useLotSearchHistory` hook — localStorage-backed with FIFO limit of 5, deduplication (move to front), scoped by chantierId. 8 unit tests passing.
- **Task 3**: Created `LotSearchBar` component — `role="search"`, `inputmode="numeric"`, client-side `useMemo` filtering, dropdown with lot results (location format: `Lot {code} — {plot} › {étage}`), history display on empty focus, "Aucun lot trouvé" empty state, `onMouseDown` for result tap (before `onBlur`), `animate-pulse` loading indicator. 13 unit tests passing.
- **Task 4**: Modified `$chantierId.tsx` layout — conditionally renders `<LotSearchBar>` when `chantier.type === 'complet'`, sticky positioning above `<Outlet>`.
- **Task 5**: Added 2 integration tests to `$chantierId.test.tsx` (SearchBar visible/hidden by type). Full suite: 434 tests pass, 0 new lint errors, TS build errors all pre-existing.

### Change Log

- 2026-02-10: Story 3.5 implemented — lot search by number with real-time filtering, navigation, history, and integration into chantier layout.
- 2026-02-10: Code review (AI) — 4 issues fixed (H1: sticky safe-area, H2: history selection focus, M1: loading test, M2: keyboard a11y + ARIA combobox). 3 LOW issues noted. Status → done.

### File List

**New files:**
- `src/lib/queries/useChantierLots.ts`
- `src/lib/queries/useChantierLots.test.ts`
- `src/lib/utils/useLotSearchHistory.ts`
- `src/lib/utils/useLotSearchHistory.test.ts`
- `src/components/LotSearchBar.tsx`
- `src/components/LotSearchBar.test.tsx`

**Modified files:**
- `src/routes/_authenticated/chantiers/$chantierId.tsx` — Added SearchBar to layout
- `src/routes/_authenticated/chantiers/$chantierId.test.tsx` — Added 2 integration tests
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — Status update
- `_bmad-output/implementation-artifacts/3-5-recherche-par-numero-de-lot.md` — Story file updates
