# Story 11.7: Recherche globale inventaire cross-étages

Status: done
Story ID: 11.7
Story Key: 11-7-recherche-globale-inventaire-cross-etages
Epic: 11 — Gestion des matériaux
Date: 2026-03-19
Dependencies: Story 11.3 (done — inventaire deux niveaux), Story 11.6 (dev-complete — transfert étage vers lot)

## Story

En tant que utilisateur de posePilot,
Je veux pouvoir rechercher un matériau sur la page inventaire chantier et voir tous les résultats à travers l'ensemble du chantier (stockage général, tous les étages et tous les lots),
Afin de localiser rapidement où se trouve un matériau spécifique sans devoir naviguer étage par étage.

## Contexte

- Aujourd'hui, la page inventaire chantier (`/$chantierId/inventaire`) n'affiche que le stockage général (`plot_id IS NULL AND etage_id IS NULL`).
- Pour savoir où se trouve un matériau sur le chantier, l'utilisateur doit naviguer manuellement vers chaque étage et chercher visuellement.
- Avec un chantier de 5+ étages et 50+ matériaux, c'est fastidieux.
- On ajoute une barre de recherche en haut de la page inventaire chantier. Dès que l'utilisateur tape ≥ 2 caractères, la liste bascule en mode recherche globale : query Supabase `ilike` sur `designation` sans filtre de scope, avec résultats agrégés par désignation et localisation complète.
- En effaçant la recherche, on revient à l'affichage stockage général habituel.

## Acceptance Criteria (BDD)

### AC1: Barre de recherche visible sur la page inventaire chantier

**Given** l'utilisateur est sur la page inventaire chantier
**When** la page se charge
**Then** une barre de recherche avec une icône Search et un placeholder "Rechercher un matériau…" est visible au-dessus de la liste

### AC2: Recherche déclenchée à partir de 2 caractères

**Given** l'utilisateur est sur la page inventaire chantier
**When** il tape moins de 2 caractères dans la barre de recherche
**Then** la liste continue d'afficher le stockage général (comportement actuel inchangé)

### AC3: Résultats globaux cross-étages

**Given** l'utilisateur tape 2+ caractères dans la barre de recherche (ex: "tube")
**When** les résultats s'affichent (après debounce de 300ms)
**Then** tous les items du chantier dont la désignation contient le terme sont affichés, y compris ceux en stockage général, sur les étages et dans les lots — agrégés par désignation avec localisation complète (Plot — Étage — Lot)

### AC4: Indicateur de mode recherche

**Given** l'utilisateur a saisi un terme de recherche actif (≥ 2 caractères)
**When** les résultats s'affichent
**Then** le compteur sous la barre de recherche indique le contexte de recherche (ex: "3 résultats sur tout le chantier") au lieu du compteur habituel ("X matériaux enregistrés")

### AC5: Aucun résultat

**Given** l'utilisateur tape un terme qui ne correspond à aucun item
**When** les résultats s'affichent
**Then** un message "Aucun matériau trouvé pour « {terme} »" est affiché avec l'icône vide habituelle (Boxes)

### AC6: Effacement de la recherche — retour au stockage général

**Given** l'utilisateur a un terme de recherche actif
**When** il efface le champ (via le bouton X ou en vidant le texte)
**Then** la liste revient à l'affichage du stockage général (comportement par défaut)

### AC7: Actions sur les items en mode recherche

**Given** l'utilisateur est en mode recherche et voit des résultats cross-étages
**When** il interagit avec les contrôles d'un item (±, éditer, transférer)
**Then** les actions fonctionnent normalement comme en mode non-recherche

### AC8: Bouton clear (X) sur la barre de recherche

**Given** l'utilisateur a saisi du texte dans la barre de recherche
**When** il regarde la barre de recherche
**Then** un bouton X est visible à droite pour effacer rapidement le champ

## Tasks / Subtasks

- [x] Task 1 — Hook `useSearchInventaire` (AC: #2, #3)
  - [x] 1.1 Créer `src/lib/queries/useSearchInventaire.ts`
  - [x] 1.2 Signature : `useSearchInventaire(chantierId: string, searchTerm: string)`
  - [x] 1.3 Query Supabase : `select('*, plots(nom), etages(nom), lots(code)').eq('chantier_id', chantierId).ilike('designation', '%${term}%')` — ordonnée par `designation asc, created_at desc`
  - [x] 1.4 `enabled: searchTerm.trim().length >= 2` — désactivé si terme trop court
  - [x] 1.5 QueryKey : `['inventaire', chantierId, 'search', trimmed]`
  - [x] 1.6 Retour type `InventaireWithLocation[]` (réutilise le type existant)

- [x] Task 2 — Hook utilitaire `useDebounce` (AC: #3)
  - [x] 2.1 Créer `src/lib/useDebounce.ts` — hook générique `useDebounce<T>(value: T, delay: number): T`
  - [x] 2.2 Délai par défaut : 300ms

- [x] Task 3 — Page inventaire chantier : intégrer la recherche (AC: #1, #2, #4, #5, #6, #8)
  - [x] 3.1 Ajouter un state `searchTerm` dans `InventairePage`
  - [x] 3.2 Ajouter `debouncedSearch = useDebounce(searchTerm, 300)`
  - [x] 3.3 Appeler `useSearchInventaire(chantierId, debouncedSearch)` en parallèle du `useInventaire` existant
  - [x] 3.4 Déterminer `isSearchMode = debouncedSearch.trim().length >= 2`
  - [x] 3.5 Ajouter l'input de recherche au-dessus de la liste : icône `Search` à gauche, placeholder "Rechercher un matériau…", bouton `X` visible quand `searchTerm` n'est pas vide
  - [x] 3.6 En mode recherche : passer les résultats de `useSearchInventaire` à `InventaireList` au lieu de ceux de `useInventaire`
  - [x] 3.7 Adapter le compteur : `isSearchMode ? "${count} résultats sur tout le chantier" : "${uniqueDesignations} matériaux enregistrés"`
  - [x] 3.8 En mode recherche avec 0 résultats : afficher le message "Aucun matériau trouvé pour « {terme} »"
  - [x] 3.9 FAB conservé en mode recherche (permet d'ajouter du matériel sans quitter la recherche)

- [x] Task 4 — Tests hook `useSearchInventaire` (AC: #2, #3)
  - [x] 4.1 Créer `src/lib/queries/useSearchInventaire.test.ts`
  - [x] 4.2 Test : query désactivée quand terme < 2 caractères (3 cas : 1 char, empty, spaces)
  - [x] 4.3 Test : query envoyée avec `ilike` quand terme >= 2 caractères
  - [x] 4.4 Test : retourne `InventaireWithLocation[]`

- [x] Task 5 — Tests hook `useDebounce` (AC: #3)
  - [x] 5.1 Créer `src/lib/useDebounce.test.ts`
  - [x] 5.2 Test : retourne la valeur initiale immédiatement
  - [x] 5.3 Test : retourne la valeur mise à jour après le délai
  - [x] 5.4 Test : annule le timer précédent si la valeur change avant le délai

- [x] Task 6 — Tests page inventaire chantier (AC: #1, #4, #5, #6, #8)
  - [x] 6.1 Mettre à jour `src/__tests__/inventaire-page.test.tsx`
  - [x] 6.2 Test : la barre de recherche est visible au chargement
  - [x] 6.3 Test : la saisie de 1 caractère ne déclenche pas la recherche globale (stockage général affiché)
  - [x] 6.4 Test : la saisie de 2+ caractères affiche les résultats cross-étages
  - [x] 6.5 Test : le compteur affiche "X résultats sur tout le chantier" en mode recherche
  - [x] 6.6 Test : message "Aucun matériau trouvé" quand 0 résultats
  - [x] 6.7 Test : le bouton X efface la recherche et revient au stockage général

- [x] Task 7 — Validation finale (AC: #1-8)
  - [x] 7.1 `npx tsc --noEmit` — 0 erreurs
  - [x] 7.2 `npx eslint src/` — 0 nouvelles erreurs
  - [x] 7.3 `npm run build` — build propre
  - [x] 7.4 Tous les 45 tests impactés passent (5 fichiers de tests inventaire)

## Dev Notes

### Architecture : recherche server-side via `ilike`

On choisit la recherche côté serveur (Supabase `ilike`) plutôt que côté client car :
- Le stockage général est déjà chargé, mais les items des étages ne le sont pas (scope `general` sur la page chantier)
- Une recherche client-side nécessiterait de charger TOUS les items du chantier à chaque visite — trop lourd
- `ilike` avec `%terme%` est suffisant en performance pour des inventaires de chantier (< 1000 items)

### Debounce

300ms de debounce sur l'input pour éviter une requête Supabase par frappe clavier. Le `useDebounce` est un hook générique réutilisable.

### Coexistence des deux queries

La page aura deux hooks actifs simultanément :
- `useInventaire(chantierId, { type: 'general' })` — toujours actif, affiche le stockage général par défaut
- `useSearchInventaire(chantierId, debouncedSearch)` — actif uniquement quand `debouncedSearch.length >= 2`

On bascule entre les deux jeux de données dans le rendu selon `isSearchMode`. Pas de conflit de cache car les queryKeys sont distinctes.

### Sécurité de l'input `ilike`

Le `%` dans le pattern `ilike` est injecté côté code, pas côté utilisateur. Supabase paramétrise les valeurs, donc pas de risque d'injection SQL. Les métacaractères LIKE (`%` et `_`) sont échappés manuellement via `replace(/[%_]/g, '\\$&')` avant passage à `ilike`, afin qu'ils soient traités littéralement dans la recherche.

### Réutilisation de `InventaireList`

Aucune modification de `InventaireList` n'est nécessaire. Le composant reçoit déjà des `InventaireWithLocation[]` et sait les agréger par désignation avec localisation. On lui passe simplement les résultats de la recherche au lieu de ceux du stockage général.

### UX — Barre de recherche

```
+---------------------------------------------------+
| 🔍 Rechercher un matériau…              [X]       |
+---------------------------------------------------+
| 3 résultats sur tout le chantier                   |
|                                                     |
| ━━ Tubes PER 16mm ━━━━━━━━━━━━━━ Total: 85        |
|    Stockage général           → 20                  |
|    Bât. A — RDC — Lot 101    → 30                  |
|    Bât. A — Étage 1          → 15                  |
|    Bât. B — RDC — Lot 203    → 20                  |
|                                                     |
| ━━ Tubes PER 20mm ━━━━━━━━━━━━━━ Total: 40        |
|    Bât. A — Étage 1 — Lot 102 → 40                 |
+---------------------------------------------------+
```

### References

- [Source: src/routes/_authenticated/chantiers/$chantierId/inventaire.tsx — Page inventaire chantier actuelle]
- [Source: src/components/InventaireList.tsx — Composant liste avec agrégation]
- [Source: src/lib/queries/useInventaire.ts — Hook query existant + type InventaireWithLocation]
- [Source: src/lib/subscriptions/useRealtimeInventaire.ts — Realtime subscription]

## Senior Developer Review (AI)

**Reviewer:** Youssef — 2026-03-19
**Outcome:** Approved with fixes applied

### Findings & Fixes

| # | Severity | Issue | Fix Applied |
|---|---|---|---|
| 1 | HIGH | Flash "Aucun matériau trouvé" avant arrivée des résultats (`placeholderData: []` + `isLoading=false` en TQ v5) | Ajout check `isFetching` dans la condition empty state (`inventaire.tsx`) |
| 2 | MEDIUM | Wildcards LIKE `%` et `_` non échappés dans le terme de recherche | Échappement via `replace(/[%_]/g, '\\$&')` dans `useSearchInventaire.ts` + test ajouté |
| 3 | MEDIUM | Aucun test pour AC7 (actions fonctionnelles en mode recherche) | Test ajouté : click edit sur item en mode recherche vérifie ouverture du sheet |
| 4 | MEDIUM | Optimistic update `onMutate` de create pollue les search results avec des items non-matchants | Skip des queries search dans `onMutate` de `useCreateInventaire.ts` |
| 5 | LOW | Délai 300ms au clearing via X (debounce) | Non corrigé — acceptable (300ms imperceptible) |
| 6 | LOW | Input sans `type="search"` pour clavier mobile | Non corrigé — amélioration future |
| 7 | LOW | Métrique compteur différente entre modes (items bruts vs désignations uniques) | Non corrigé — comportement acceptable pour le contexte recherche |

### Verification

- `tsc --noEmit` — 0 erreurs
- `eslint` — 0 erreurs sur fichiers modifiés
- 68/68 tests inventaire passent (10 fichiers)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- useSearchInventaire.test.ts : 1 test failed initially (placeholderData `[]` satisfied `isSuccess` before real data arrived) — fixed by asserting on `data.length` instead of `isSuccess`
- inventaire-page.test.tsx : 6 tests timed out with `vi.useFakeTimers()` (fake timers block async route rendering) — fixed by switching to real timers, debounce 300ms is fast enough for integration tests
- inventaire-page.test.tsx : 1 test failed with synchronous `getByText` after async search render — fixed by using `findByText` for search result items

### Completion Notes List

- **Task 1**: Created `useSearchInventaire` hook — server-side `ilike` search scoped to `chantier_id`, enabled only when `searchTerm.trim().length >= 2`. QueryKey includes trimmed search term for proper cache separation.
- **Task 2**: Created `useDebounce` hook — generic utility with 300ms default delay, timer cleanup on unmount.
- **Task 3**: Integrated search into chantier inventory page — search input with Search/X icons above the list, conditional rendering switches between general storage (default) and cross-étage search results. Counter adapts to show "{n} résultats sur tout le chantier" in search mode. Empty search state shows "Aucun matériau trouvé pour « {terme} »" with Search icon. FAB kept visible in search mode.
- **Task 4**: 5 tests for `useSearchInventaire` — covers disabled states (empty, 1 char, spaces-only), ilike query chain, and return type validation.
- **Task 5**: 4 tests for `useDebounce` — covers initial value, delayed update, timer cancellation, and default delay.
- **Task 6**: 6 new tests added to inventaire-page — covers search input visibility, no-search on 1 char, cross-étage results, result count, no-results message, and X button clear.
- **Task 7**: `tsc --noEmit` 0 errors, `eslint` 0 errors on changed files, `npm run build` clean, 45/45 inventaire-related tests pass. Pre-existing failures in unrelated test files (pieceId, navigation-hierarchy, deleteLivraison, besoins-page) not caused by this story.

### File List

#### New Files
- `src/lib/queries/useSearchInventaire.ts` — Hook de recherche globale inventaire via Supabase `ilike`
- `src/lib/queries/useSearchInventaire.test.ts` — 5 tests unitaires
- `src/lib/useDebounce.ts` — Hook utilitaire debounce générique
- `src/lib/useDebounce.test.ts` — 4 tests unitaires

#### Modified Files
- `src/routes/_authenticated/chantiers/$chantierId/inventaire.tsx` — Ajout barre de recherche, intégration `useSearchInventaire` + `useDebounce`, basculement entre mode stockage général et mode recherche globale. Review fix: ajout check `isFetching` pour éviter flash empty state.
- `src/__tests__/inventaire-page.test.tsx` — 7 tests ajoutés pour la recherche globale + mock `searchResults` + support `ilike` dans `setupMocks`. Review fix: test AC7 (actions en mode recherche).
- `src/lib/mutations/useCreateInventaire.ts` — Review fix: skip search queries dans `onMutate` optimiste pour éviter pollution des résultats de recherche.
