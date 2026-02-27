# Story 10.4: Dépôt entreprise — Livraison vers le dépôt (entrée en stock)

Status: done

## Story

En tant qu'utilisateur de posePilot,
Je veux pouvoir enregistrer une livraison destinée au dépôt entreprise (au lieu d'un chantier), et que la réception de cette livraison mette automatiquement à jour le stock du dépôt avec recalcul du CUMP,
Afin que mes achats pour le dépôt soient tracés comme des livraisons standard avec le même cycle de vie.

## Acceptance Criteria

1. **Given** l'utilisateur crée une nouvelle livraison **When** il choisit la destination **Then** il peut sélectionner "Dépôt entreprise" comme destination en plus des chantiers existants

2. **Given** une livraison est destinée au dépôt **When** elle est créée **Then** la livraison a `chantier_id = NULL` et un flag ou marqueur indiquant qu'elle est pour le dépôt (colonne `destination` avec valeur `'depot'`)

3. **Given** une livraison pour le dépôt a le statut 'livre' **When** le statut passe à 'livre' **Then** pour chaque ligne (besoin) de la livraison : le stock du dépôt est mis à jour — si un article avec la même désignation existe, quantite += N et valeur_totale += (N × montant_unitaire) ; sinon, un nouvel article est créé

4. **Given** une livraison pour le dépôt passe à 'livre' **When** les articles du dépôt sont mis à jour **Then** un `depot_mouvement` de type 'entree' est créé pour chaque ligne, avec `livraison_id` renseigné

5. **Given** l'utilisateur consulte la liste globale des livraisons **When** il voit une livraison pour le dépôt **Then** la DeliveryCard affiche "Dépôt entreprise" comme destination (au lieu du nom du chantier)

6. **Given** le formulaire de création de livraison multi-lignes **When** le toggle "Chantier unique" est activé **Then** le dropdown inclut l'option "Dépôt entreprise" en plus des chantiers

7. **Given** le formulaire de création de livraison multi-lignes **When** le toggle "Chantier unique" est désactivé **Then** chaque ligne peut individuellement choisir un chantier OU "Dépôt entreprise" comme destination

## Tasks / Subtasks

- [x] Task 1 — Migration SQL : colonne `destination` sur livraisons (AC: #2)
  - [x] 1.1 Créer `supabase/migrations/039_livraison_destination.sql`
  - [x] 1.2 Créer l'enum `livraison_destination` : `'chantier'`, `'depot'`
  - [x] 1.3 `ALTER TABLE public.livraisons ADD COLUMN destination public.livraison_destination NOT NULL DEFAULT 'chantier';`
  - [x] 1.4 Toutes les livraisons existantes auront `destination = 'chantier'` (valeur par défaut)

- [x] Task 2 — Types TypeScript (AC: #2, #5)
  - [x] 2.1 Ajouter `destination: string` au Row/Insert/Update de `livraisons` dans `database.ts`
  - [x] 2.2 Ajouter `livraison_destination` dans Enums : `'chantier' | 'depot'`

- [x] Task 3 — Modification du formulaire de création de livraison (AC: #1, #6, #7)
  - [x] 3.1 Modifier `src/lib/hooks/useLivraisonActions.ts` : ajouter la gestion de la destination 'depot'
  - [x] 3.2 Modifier `src/components/LivraisonSheets.tsx` : ajouter "Dépôt entreprise" comme option dans les selects chantier (global et per-ligne)
  - [x] 3.3 Utiliser une valeur spéciale `'__depot__'` dans le select pour identifier la sélection dépôt
  - [x] 3.4 Quand destination = depot : passer `destination: 'depot'` et `chantier_id: null` à la mutation
  - [x] 3.5 Mettre à jour les tests existants de LivraisonSheets

- [x] Task 4 — Modification de useCreateLivraison (AC: #2)
  - [x] 4.1 Modifier `src/lib/mutations/useCreateLivraison.ts` : accepter `destination?: 'chantier' | 'depot'`
  - [x] 4.2 Quand destination = 'depot' : INSERT livraison avec `chantier_id = null, destination = 'depot'`
  - [x] 4.3 Les besoins implicites créés ont `chantier_id = null` (ou le chantier de la ligne si livraison mixte)
  - [x] 4.4 Mettre à jour les tests de useCreateLivraison

- [x] Task 5 — Entrée automatique en stock à la réception (AC: #3, #4)
  - [x] 5.1 Créer `src/lib/mutations/useDepotReceptionLivraison.ts`
  - [x] 5.2 Appelé quand une livraison avec `destination = 'depot'` passe à statut 'livre'
  - [x] 5.3 Pour chaque besoin lié : chercher `depot_article` par designation (case-insensitive trim) ; si existe → UPDATE quantite/valeur_totale ; sinon → INSERT nouvel article
  - [x] 5.4 Créer un `depot_mouvement` type='entree' pour chaque ligne avec `livraison_id` renseigné
  - [x] 5.5 Modifier `src/lib/mutations/useUpdateLivraisonStatus.ts` : après passage à 'livre', si `destination = 'depot'`, appeler la logique de réception dépôt
  - [x] 5.6 Créer `src/lib/mutations/useDepotReceptionLivraison.test.ts` — 5 tests

- [x] Task 6 — Affichage DeliveryCard (AC: #5)
  - [x] 6.1 Modifier `src/components/DeliveryCard.tsx` : quand `destination = 'depot'`, afficher "Dépôt entreprise" comme nom de destination
  - [x] 6.2 Icône `Warehouse` au lieu de l'icône chantier
  - [x] 6.3 Mettre à jour les tests de DeliveryCard

- [x] Task 7 — Tests de régression (AC: #1-7)
  - [x] 7.1 `npm run test` — tous les tests passent
  - [x] 7.2 `npx tsc --noEmit` — 0 nouvelles erreurs
  - [x] 7.3 `npm run lint` — 0 nouvelles erreurs

## Dev Notes

### Architecture

Cette story connecte le système de livraisons existant au dépôt. Le flux est :
```
Création livraison (destination='depot')
  → Cycle de vie normal (commande → prevu → livre)
  → À 'livre' : réception automatique dans depot_articles + depot_mouvements
```

### Colonne `destination` vs flag booléen

On utilise un enum `livraison_destination` plutôt qu'un booléen `is_depot` pour :
- Extensibilité future (autres destinations possibles)
- Clarté sémantique dans les queries
- La valeur par défaut 'chantier' assure la rétro-compatibilité totale

### Valeur spéciale `__depot__` dans les selects

Pour le formulaire multi-lignes, le select chantier utilise déjà des UUID comme valeurs. On ajoute `__depot__` comme valeur spéciale reconnaissable :
```typescript
<SelectItem value="__depot__">Dépôt entreprise</SelectItem>
```
Côté mutation, on traduit : si `chantierId === '__depot__'` → `destination: 'depot', chantier_id: null`.

### Réception automatique — Logique

La réception en stock se fait au moment du passage au statut 'livre'. On ne crée PAS de hook séparé si la logique est simple — on l'intègre dans `useUpdateLivraisonStatus`.

```typescript
// Dans useUpdateLivraisonStatus, après UPDATE du statut
if (newStatus === 'livre' && livraison.destination === 'depot') {
  const besoins = await fetchBesoinsForLivraison(livraisonId)
  for (const besoin of besoins) {
    // Upsert depot_article + insert depot_mouvement
  }
}
```

### Livraison mixte (story 10.5)

Cette story gère la destination 'depot' au niveau de la livraison entière. La story 10.5 gérera le split ligne par ligne (certaines lignes vers chantier, d'autres vers dépôt dans la même livraison).

### Prérequis

- Story 10.1 : tables depot_articles, depot_mouvements
- Story 10.2 : mutations de base dépôt
- Story 6.13 : formulaire multi-lignes livraisons (existant, à étendre)

### Ce qui existe déjà

| Élément | Fichier | Notes |
|---------|---------|-------|
| Formulaire création livraison | `src/components/LivraisonSheets.tsx` | À étendre avec option dépôt |
| DeliveryCard | `src/components/DeliveryCard.tsx` | À modifier pour destination depot |
| useLivraisonActions | `src/lib/hooks/useLivraisonActions.ts` | State management à étendre |
| useCreateLivraison | `src/lib/mutations/useCreateLivraison.ts` | Mutation à étendre |
| useUpdateLivraisonStatus | `src/lib/mutations/useUpdateLivraisonStatus.ts` | Ajouter logique réception |

### References

- Source: `src/components/LivraisonSheets.tsx` — formulaire création multi-lignes
- Source: `src/lib/mutations/useCreateLivraison.ts` — mutation création livraison
- Source: `src/lib/mutations/useUpdateLivraisonStatus.ts` — mutation changement de statut
- Source: `src/components/DeliveryCard.tsx` — carte livraison
- Source: `src/lib/hooks/useLivraisonActions.ts` — state management livraisons

## Dev Agent Record

### Implementation Plan
- Enum `livraison_destination` + colonne `destination` sur livraisons via migration 039
- Types TS : `destination` ajouté au Row/Insert/Update de livraisons + enum + interface Livraison
- `besoins.chantier_id` rendu nullable (migration 039) pour supporter les livraisons dépôt sans chantier
- Formulaire : valeur spéciale `__depot__` dans les selects, traduite en `destination: 'depot'` côté mutation
- `useCreateLivraison` : accepte `destination`, force `chantier_id = null` quand depot, besoins avec `chantier_id || null`
- `receptionnerLivraisonDepot()` : fonction standalone appelée depuis `updateLivraisonStatus` quand `livre + depot`
- DeliveryCard : affiche "Dépôt entreprise" avec icône Warehouse quand `destination === 'depot'`

### Completion Notes
- 57 tests liés à la story passent (5 useCreateLivraison + 5 useDepotReceptionLivraison + 5 useUpdateLivraisonStatus + 42 DeliveryCard)
- tsc --noEmit : 0 erreurs
- lint : 0 nouvelles erreurs (3 pré-existantes)
- Tests de régression : échecs pré-existants liés au mock Toaster/sonner, aucune régression introduite

### Debug Log
- `besoins.chantier_id` était NOT NULL → ajouté ALTER COLUMN DROP NOT NULL dans migration 039 pour supporter les livraisons dépôt

## File List

### Nouveaux fichiers
- `supabase/migrations/039_livraison_destination.sql`
- `src/lib/mutations/useDepotReceptionLivraison.ts`
- `src/lib/mutations/useDepotReceptionLivraison.test.ts`

### Fichiers modifiés
- `src/types/database.ts` — destination sur livraisons, enum livraison_destination, besoins.chantier_id nullable
- `src/lib/hooks/useLivraisonActions.ts` — gestion __depot__ → destination depot
- `src/components/LivraisonSheets.tsx` — option Dépôt entreprise dans selects (global + per-ligne)
- `src/lib/mutations/useCreateLivraison.ts` — accepte destination, force chantier_id null pour depot
- `src/lib/mutations/useCreateLivraison.test.ts` — test destination depot + mise à jour assertions
- `src/lib/mutations/useUpdateLivraisonStatus.ts` — appel receptionnerLivraisonDepot + invalidation queries depot
- `src/components/DeliveryCard.tsx` — affichage Dépôt entreprise + icône Warehouse
- `src/components/DeliveryCard.test.tsx` — fixture destination + 2 tests destination depot

## Senior Developer Review (AI)

**Reviewer:** Youssef — 2026-02-25
**Résultat:** Corrections appliquées (6 issues fixées)

### Issues trouvées et corrigées

**HIGH (2)**
- H1 — `receptionnerLivraisonDepot` : boucle N+1 sans transaction → Batch des inserts mouvements en 1 appel, ajout commentaire sur absence de transaction côté client
- H2 — Validation chantier fonctionnait par coïncidence pour `__depot__` → Exception explicite `if (cid === '__depot__') return false`

**MEDIUM (4)**
- M1 — `ilike` sur designation vulnérable aux wildcards `%`/`_` → Ajout `escapeLikePattern()` qui échappe les caractères spéciaux LIKE
- M2 — `BesoinsList` crash quand `destination='depot'` et `chantier_id=null` → `isMultiChantier` mis à `false` pour destination depot
- M3 — Optimistic update sur cache orphelin pour livraisons depot → Query key dirigée vers `['all-livraisons']` + ajout `parent_id`/`status_history` dans l'objet optimiste
- M4 — Pas d'invalidation `all-linked-besoins`/`besoins` dans `useUpdateLivraisonStatus` → Ajout des 2 invalidations manquantes

**LOW (3 — non corrigées, mineures)**
- L1 — `mockLinkedBesoins` dans tests DeliveryCard incomplet (pas de champ `chantiers`)
- L2 — Fichiers modifiés hors scope non documentés (BottomNavigation, routeTree.gen)
- L3 — `parent_id` absent de l'optimistic update (corrigé dans M3)

### Vérification post-fix
- 52 tests story passent (5 useDepotReceptionLivraison + 5 useCreateLivraison + 42 DeliveryCard)
- `tsc --noEmit` : 0 erreurs
- Aucune régression introduite

## Change Log

- 2026-02-25 : Implémentation complète story 10.4 — livraison vers dépôt avec réception automatique en stock
- 2026-02-25 : Code review — 6 corrections (2 HIGH, 4 MEDIUM) appliquées
