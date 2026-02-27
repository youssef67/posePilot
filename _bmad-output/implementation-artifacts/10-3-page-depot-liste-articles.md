# Story 10.3: Dépôt entreprise — Page dépôt et liste des articles

Status: done

## Story

En tant qu'utilisateur de posePilot,
Je veux accéder à une page Dépôt affichant la liste de tous les articles en stock avec leur quantité, CUMP et valeur totale, et pouvoir ajuster les quantités rapidement,
Afin que je puisse consulter et gérer mon stock en temps réel.

## Acceptance Criteria

1. **Given** l'utilisateur est sur l'écran principal **When** il accède à la page Dépôt (via bottom navigation ou route directe) **Then** la liste des articles du dépôt s'affiche avec : designation, quantité, unité, CUMP (valeur_totale/quantite), valeur totale

2. **Given** la liste des articles est affichée **When** chaque article est visible **Then** des boutons +/− (style identique à l'inventaire chantier : h-12 w-12, min-w-[48px]) permettent d'ajuster la quantité rapidement

3. **Given** l'utilisateur clique sur − quand quantite = 1 **When** l'AlertDialog s'affiche **Then** il voit "Supprimer cet article ?" avec "{designation} sera supprimé du dépôt." et les boutons "Annuler" / "Supprimer"

4. **Given** l'utilisateur confirme la suppression **When** l'action s'exécute **Then** l'article est supprimé du dépôt

5. **Given** aucun article n'existe au dépôt **When** la page s'affiche **Then** un état vide apparaît : icône Warehouse + "Aucun article au dépôt" + bouton "Ajouter un article"

6. **Given** la page est en chargement **When** les données ne sont pas encore chargées **Then** 3 skeleton cards s'affichent (animate-pulse)

7. **Given** l'utilisateur clique sur le FAB ou le bouton CTA **When** le sheet s'ouvre **Then** il voit un formulaire : Désignation (text), Quantité (number, min 1), Prix unitaire (number, décimal), Unité (optionnel, placeholder "sac, m², kg...")

8. **Given** l'utilisateur remplit et valide le formulaire d'ajout **When** l'insertion s'exécute **Then** un nouvel article est créé au dépôt (ou la quantité est incrémentée si un article avec la même désignation existe déjà, avec recalcul CUMP)

9. **Given** la page Dépôt **When** un changement realtime survient **Then** la liste se met à jour automatiquement

10. **Given** l'utilisateur est sur la page Dépôt **When** il consulte un article **Then** il voit le CUMP formaté en EUR (€) avec `Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })`

## Tasks / Subtasks

- [x] Task 1 — Composant DepotArticleList (AC: #1, #2, #3, #4, #5, #6, #10)
  - [x] 1.1 Créer `src/components/DepotArticleList.tsx`
  - [x] 1.2 Props : `articles: DepotArticleWithCump[] | undefined`, `isLoading`, `onOpenSheet`, `onIncrement`, `onDecrement`, `onDelete`
  - [x] 1.3 Affichage par article : designation, quantite (+ unité si renseignée), CUMP formaté EUR, valeur totale formatée EUR
  - [x] 1.4 Boutons +/− identiques au pattern `InventaireList` (h-12 w-12 min-w-[48px], variant outline)
  - [x] 1.5 `handleDecrement` : si quantite <= 1 → AlertDialog confirmation. Sinon → onDecrement
  - [x] 1.6 AlertDialog : titre "Supprimer cet article ?", description "{designation} sera supprimé du dépôt."
  - [x] 1.7 État loading : 3 skeleton cards (animate-pulse)
  - [x] 1.8 État vide : icône `Warehouse` (lucide-react) + "Aucun article au dépôt" + bouton CTA
  - [x] 1.9 Formatage EUR via `Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })`
  - [x] 1.10 Créer `src/components/DepotArticleList.test.tsx` — 10 tests

- [x] Task 2 — Route page Dépôt (AC: #1, #7, #8, #9)
  - [x] 2.1 Créer `src/routes/_authenticated/depot.tsx`
  - [x] 2.2 Header : titre "Dépôt entreprise"
  - [x] 2.3 Sous-titre dynamique : "{N} articles en stock" ou "Dépôt"
  - [x] 2.4 DepotArticleList (mode standard, pas agrégé)
  - [x] 2.5 Fab "+" pour ouvrir le sheet de création
  - [x] 2.6 Sheet création : Désignation (Input text), Quantité (Input number, min 1), Prix unitaire (Input number, décimal), Unité (Input text, optionnel, placeholder "sac, m², kg...")
  - [x] 2.7 Validation : designation et quantité requis, quantité > 0, prix unitaire > 0
  - [x] 2.8 Si un article avec la même désignation (case-insensitive trim) existe déjà : appeler `useCreateDepotEntree` en mode article existant (ajout au stock + recalcul CUMP)
  - [x] 2.9 Sinon : appeler `useCreateDepotEntree` en mode nouvel article
  - [x] 2.10 useRealtimeDepotArticles() pour synchronisation
  - [x] 2.11 Créer `src/__tests__/depot-page.test.tsx` — 8 tests

- [x] Task 3 — Ajout dans la bottom navigation (AC: #1)
  - [x] 3.1 Modifier `src/components/BottomNavigation.tsx` : ajouter entrée "Dépôt" avec icône `Warehouse` (lucide-react), route `/depot`
  - [x] 3.2 Mettre à jour les tests de BottomNavigation

- [x] Task 4 — Tests de régression (AC: #1-10)
  - [x] 4.1 `npm run test` — 0 nouvelles erreurs (35 échecs pré-existants, aucun lié à cette story)
  - [x] 4.2 `npx tsc --noEmit` — 0 nouvelles erreurs
  - [x] 4.3 `npm run lint` — 0 nouvelles erreurs

## Dev Notes

### Architecture

Cette story construit l'UI principale du dépôt. S'appuie sur 10.1 (tables/queries) et 10.2 (mutations).

### UI — Wireframe page Dépôt

```
┌─────────────────────────────────────────────────┐
│ Dépôt entreprise                            (h1) │
├─────────────────────────────────────────────────┤
│ 5 articles en stock                         (h2) │
├─────────────────────────────────────────────────┤
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ Sac de colle Mapei                          │ │
│ │ 20 sacs · CUMP: 10,50 €                    │ │
│ │ Valeur: 210,00 €           [-] [20] [+]    │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ Carrelage 30x30 blanc                       │ │
│ │ 45 m² · CUMP: 15,00 €                      │ │
│ │ Valeur: 675,00 €           [-] [45] [+]    │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
├─────────────────────────────────────────────────┤
│                                         [+ FAB] │
└─────────────────────────────────────────────────┘
```

### UI — Wireframe sheet d'ajout

```
┌─────────────────────────────────────────────┐
│ Nouvel article                              │
│ Ajoutez un article au dépôt.                │
├─────────────────────────────────────────────┤
│ Désignation                                 │
│ ┌─────────────────────────────────────────┐ │
│ │ Ex: Sac de colle Mapei                  │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Quantité                                    │
│ ┌─────────────────────────────────────────┐ │
│ │ 1                          (inputmode)  │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Prix unitaire                               │
│ ┌──────────────────────────────────── €  ┐ │
│ │ 0.00                       (decimal)   │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Unité (optionnel)                           │
│ ┌─────────────────────────────────────────┐ │
│ │ sac, m², kg...                          │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [         Ajouter l'article        ]        │
└─────────────────────────────────────────────┘
```

### Détection article existant

Lors de la création, vérifier si un article avec la même `designation` (case-insensitive trim) existe déjà dans le cache `['depot-articles']`. Si oui, rediriger vers une entrée en stock (ajout de quantité + recalcul CUMP) au lieu de créer un doublon.

### Bottom Navigation

L'icône `Warehouse` de lucide-react correspond bien au concept de dépôt/entrepôt. Position dans la nav : après "Livraisons" et avant ou à la place d'un emplacement libre.

### Pattern identique à InventaireList

Le composant `DepotArticleList` reprend le même pattern que `InventaireList` :
- `handleDecrement` avec AlertDialog quand quantite <= 1
- Boutons +/− h-12 w-12 min-w-[48px]
- Quantité en `tabular-nums`
- Skeleton et état vide

Différences :
- Pas de mode agrégé (pas de localisation au dépôt — dépôt unique)
- Affichage CUMP et valeur totale par article
- Icône état vide : `Warehouse` au lieu de `Boxes`

### Prérequis

- Story 10.1 : tables, types, queries
- Story 10.2 : mutations

### References

- Source: `src/components/InventaireList.tsx` — pattern liste +/− et AlertDialog
- Source: `src/routes/_authenticated/chantiers/$chantierId/inventaire.tsx` — pattern page complète
- Source: `src/components/BottomNavigation.tsx` — ajout entrée navigation
- Source: `src/components/Fab.tsx` — bouton flottant

## Dev Agent Record

### Implementation Plan

- Task 1 : Composant `DepotArticleList` calqué sur le pattern `InventaireList` — même structure +/− avec AlertDialog, skeleton, état vide. Différences : pas de mode agrégé, affichage CUMP + valeur totale via `Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })`, icône `Warehouse`.
- Task 2 : Route `/depot` (`_authenticated/depot.tsx`) avec Sheet de création, détection article existant par `designation` (case-insensitive trim) dans le cache, appels aux hooks 10.1/10.2 existants.
- Task 3 : Ajout entrée "Dépôt" dans BottomNavigation entre Livraisons et Activité.
- Task 4 : Validation régression — 0 erreurs nouvelles en tsc/lint, tests story 30/30 passent.

### Debug Log

- BottomNavigation.test.tsx : mock `@tanstack/react-router` manquait `useNavigate` (ajouté suite au bouton Sortir/déconnexion). Corrigé.
- BottomNavigation.test.tsx : 2 tests pré-existants cherchaient "Livraisons, N besoins en attente" mais le badge est sur le tab "Besoins" (pas Livraisons). Corrigé pour matcher la réalité du composant.

### Completion Notes

Story 10.3 complète. 4 nouveaux fichiers créés, 4 fichiers modifiés. 33 tests (21 nouveaux + 12 BottomNavigation mis à jour), tous passent. Tous les AC (#1-#10) satisfaits.

### Limitations connues

- **Race condition CUMP (useCreateDepotEntree, useUpdateDepotArticleQuantite)** : Les opérations SELECT→UPDATE ne sont pas atomiques. En cas d'accès concurrent, le CUMP pourrait être incorrectement calculé. Un appel RPC PostgreSQL serait préférable. Risque faible en usage mono-utilisateur actuel.

## File List

- `src/components/DepotArticleList.tsx` — NEW
- `src/components/DepotArticleList.test.tsx` — NEW
- `src/routes/_authenticated/depot.tsx` — NEW
- `src/__tests__/depot-page.test.tsx` — NEW
- `src/components/BottomNavigation.tsx` — MODIFIED (ajout entrée Dépôt + icône Warehouse)
- `src/components/BottomNavigation.test.tsx` — MODIFIED (ajout useNavigate mock, correction tests badge besoins, mise à jour assertions)
- `src/routeTree.gen.ts` — AUTO-GENERATED (mise à jour par TanStack Router suite à nouveau fichier route)
- `src/types/database.ts` — MODIFIED (ajout types DepotArticle, DepotMouvement)

## Change Log

- 2026-02-25: Story 10.3 implémentée — page Dépôt avec liste articles, sheet création, bottom navigation, 33 tests
- 2026-02-25: Code review — fix `placeholderData` skeleton bug (H1), ajout 3 tests page-level (M2/M3), documentation File List complétée (M1), limitation race condition documentée (H2)
