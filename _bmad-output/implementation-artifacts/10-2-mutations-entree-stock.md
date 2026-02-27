# Story 10.2: Dépôt entreprise — Mutations d'entrée en stock et CUMP

Status: done

## Story

En tant qu'utilisateur de posePilot,
Je veux enregistrer des entrées de matériel au dépôt avec recalcul automatique du CUMP,
Afin que le stock et sa valorisation soient toujours à jour.

## Acceptance Criteria

1. **Given** un nouvel article n'existant pas au dépôt **When** l'utilisateur crée une entrée (10 sacs à 10€) **Then** un `depot_article` est créé avec quantite=10, valeur_totale=100 et un `depot_mouvement` de type 'entree' est enregistré

2. **Given** un article existant (quantite=10, valeur_totale=100) **When** une nouvelle entrée de 10 unités à 11€ est enregistrée **Then** quantite=20, valeur_totale=210, CUMP=10,50€ et un nouveau mouvement 'entree' est créé

3. **Given** un article existant au dépôt **When** l'utilisateur incrémente la quantité via le bouton + **Then** un mouvement 'entree' de 1 unité au CUMP actuel est créé et quantite += 1, valeur_totale += CUMP

4. **Given** un article existant au dépôt avec quantite > 1 **When** l'utilisateur décrémente la quantité via le bouton − **Then** un mouvement 'sortie' de 1 unité au CUMP actuel est créé et quantite -= 1, valeur_totale -= CUMP

5. **Given** un article existant au dépôt avec quantite = 1 **When** l'utilisateur clique sur le bouton − **Then** un AlertDialog de confirmation s'affiche : "Supprimer cet article ?" avec le texte "{designation} sera supprimé du dépôt."

6. **Given** l'utilisateur confirme la suppression **When** l'action s'exécute **Then** l'article est supprimé de `depot_articles` (CASCADE supprime les mouvements)

7. **Given** une mutation d'entrée ou de sortie **When** elle s'exécute **Then** les mises à jour sont optimistes (UI immédiate, rollback en cas d'erreur)

## Tasks / Subtasks

- [x] Task 1 — Mutation : useCreateDepotEntree (AC: #1, #2)
  - [x] 1.1 Créer `src/lib/mutations/useCreateDepotEntree.ts`
  - [x] 1.2 Accepte : `{ designation, quantite, prixUnitaire, unite? }` pour nouvel article, OU `{ articleId, quantite, prixUnitaire }` pour article existant
  - [x] 1.3 Si nouvel article : INSERT `depot_articles` puis INSERT `depot_mouvements` (type='entree')
  - [x] 1.4 Si article existant : UPDATE `depot_articles` SET quantite += N, valeur_totale += (N × prix_unitaire), puis INSERT `depot_mouvements`
  - [x] 1.5 Invalidation : `['depot-articles']`, `['depot-mouvements', articleId]`
  - [x] 1.6 Créer `src/lib/mutations/useCreateDepotEntree.test.ts` — 4 tests

- [x] Task 2 — Mutation : useUpdateDepotArticleQuantite — increment/decrement rapide (AC: #3, #4)
  - [x] 2.1 Créer `src/lib/mutations/useUpdateDepotArticleQuantite.ts`
  - [x] 2.2 Accepte : `{ articleId, delta: 1 | -1, chantierId }` — delta=+1 pour increment, delta=-1 pour decrement
  - [x] 2.3 Calcule le CUMP courant de l'article, crée un mouvement 'entree' (delta=+1) ou 'sortie' (delta=-1) au CUMP
  - [x] 2.4 UPDATE `depot_articles` : quantite += delta, valeur_totale += delta × CUMP
  - [x] 2.5 Optimistic update sur le cache `['depot-articles']`
  - [x] 2.6 Invalidation : `['depot-articles']`, `['depot-mouvements', articleId]`
  - [x] 2.7 Créer `src/lib/mutations/useUpdateDepotArticleQuantite.test.ts` — 4 tests

- [x] Task 3 — Mutation : useDeleteDepotArticle (AC: #5, #6)
  - [x] 3.1 Créer `src/lib/mutations/useDeleteDepotArticle.ts`
  - [x] 3.2 DELETE `depot_articles` WHERE id = articleId (CASCADE supprime les mouvements)
  - [x] 3.3 Optimistic remove du cache `['depot-articles']`
  - [x] 3.4 Invalidation : `['depot-articles']`
  - [x] 3.5 Créer `src/lib/mutations/useDeleteDepotArticle.test.ts` — 3 tests

- [x] Task 4 — Tests de régression (AC: #1-7)
  - [x] 4.1 `npm run test` — tous les tests passent (échecs pré-existants uniquement: sonner mock + useDeleteLivraison)
  - [x] 4.2 `npx tsc --noEmit` — 0 nouvelles erreurs
  - [x] 4.3 `npm run lint` — 0 nouvelles erreurs

## Dev Notes

### Architecture

Cette story crée les mutations (écriture) du dépôt. La story 10.1 a posé les tables et les queries (lecture). La story 10.3 construira l'UI.

### Logique CUMP dans les mutations

**Entrée (nouvel achat) :**
```typescript
// Article existant
const newQuantite = article.quantite + entreeQuantite
const newValeurTotale = article.valeur_totale + (entreeQuantite * prixUnitaire)
// CUMP se recalcule automatiquement : newValeurTotale / newQuantite
```

**Sortie / Transfert :**
```typescript
const cump = article.valeur_totale / article.quantite
const newQuantite = article.quantite - sortieQuantite
const newValeurTotale = article.valeur_totale - (sortieQuantite * cump)
// Le CUMP reste identique après sortie (c'est la propriété du CUMP)
```

**Increment rapide (+1) :**
```typescript
// Entrée de 1 unité au CUMP courant (pas de changement de CUMP)
const cump = article.valeur_totale / article.quantite
const newQuantite = article.quantite + 1
const newValeurTotale = article.valeur_totale + cump
```

### Pattern AlertDialog — Identique à l'inventaire chantier

Le composant `InventaireList.tsx` montre le pattern exact :
- State `deleteTarget` pour stocker l'article à supprimer
- `handleDecrement` : si quantite <= 1 → `setDeleteTarget(item)` au lieu de décrémenter
- `AlertDialog` avec titre "Supprimer cet article ?", description "sera supprimé du dépôt."
- `confirmDelete()` appelle `onDelete(deleteTarget)` puis reset

### Optimistic updates

Même pattern que `useUpdateInventaire` — mise à jour immédiate du cache `['depot-articles']` dans `onMutate`, rollback dans `onError`, invalidation dans `onSettled`.

### Prérequis

- Story 10.1 : tables et types en place

### Ce qui existe déjà

| Élément | Fichier | Notes |
|---------|---------|-------|
| Pattern mutation optimiste | `src/lib/mutations/useUpdateInventaire.ts` | Même structure |
| Pattern delete optimiste | `src/lib/mutations/useDeleteInventaire.ts` | Même structure |
| AlertDialog pattern | `src/components/InventaireList.tsx:108-123` | Pattern identique |

### References

- Source: `src/lib/mutations/useCreateInventaire.ts` — pattern mutation insert
- Source: `src/lib/mutations/useUpdateInventaire.ts` — pattern mutation update optimiste
- Source: `src/lib/mutations/useDeleteInventaire.ts` — pattern mutation delete optimiste
- Source: `src/components/InventaireList.tsx:68-81` — pattern handleDecrement + AlertDialog

## File List

- `src/lib/mutations/useCreateDepotEntree.ts` — NEW
- `src/lib/mutations/useCreateDepotEntree.test.ts` — NEW (7 tests)
- `src/lib/mutations/useUpdateDepotArticleQuantite.ts` — NEW
- `src/lib/mutations/useUpdateDepotArticleQuantite.test.ts` — NEW (4 tests)
- `src/lib/mutations/useDeleteDepotArticle.ts` — NEW
- `src/lib/mutations/useDeleteDepotArticle.test.ts` — NEW (3 tests)

## Dev Agent Record

### Implementation Plan

- Task 1: Union type discriminée `CreateDepotEntreeNewArticle | CreateDepotEntreeExistingArticle` avec type guard `isExistingArticle`. Nouvel article → INSERT depot_articles + INSERT depot_mouvements. Article existant → fetch current → UPDATE depot_articles + INSERT depot_mouvements. Invalidation onSettled.
- Task 2: Fetch article courant → calcul CUMP → update quantite/valeur_totale → insert mouvement entree/sortie. Optimistic update via onMutate avec rollback onError.
- Task 3: DELETE depot_articles (CASCADE supprime mouvements). Optimistic remove du cache. Pattern identique à useDeleteInventaire.

### Completion Notes

- 14 tests au total : 7 + 4 + 3, tous passent
- `tsc --noEmit` : 0 erreurs
- `eslint` : 0 nouvelles erreurs (3 pré-existantes)
- Échecs test pré-existants non liés : `useDeleteLivraison.test.ts` (1 test), route tests avec mock sonner manquant
- Note: `useUpdateDepotArticleQuantite` accepte `{ articleId, delta }` sans `chantierId` (non nécessaire au niveau mutation — le chantierId sera utile à l'UI pour le transfert dans story 10.6)

## Change Log

- 2026-02-25: Story 10.2 implémentée — 3 mutations dépôt (create entree, update quantite, delete article) avec 11 tests unitaires
- 2026-02-25: Code review — 6 issues corrigées (H2: optimistic update useCreateDepotEntree, H3: guard division par zéro, M1: validation inputs, M2: Math.abs(delta), M3: invalidation cache mouvements). H1 (race condition read-then-write) documentée en TODO (fix complet = RPC PostgreSQL). 3 tests ajoutés (validation + optimistic). Total: 14 tests.
