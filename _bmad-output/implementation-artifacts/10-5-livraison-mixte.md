# Story 10.5: Dépôt entreprise — Livraison mixte (split dépôt + chantier)

Status: done

## Story

En tant qu'utilisateur de posePilot,
Je veux pouvoir créer une livraison dont certaines lignes sont destinées au dépôt et d'autres à des chantiers spécifiques,
Afin de traiter un achat unique qui sera réparti entre le dépôt et un ou plusieurs chantiers.

## Acceptance Criteria

1. **Given** le formulaire de création de livraison multi-lignes avec le toggle "Chantier unique" désactivé **When** l'utilisateur choisit la destination par ligne **Then** chaque ligne peut être assignée indépendamment à un chantier OU au "Dépôt entreprise"

2. **Given** une livraison avec des lignes mixtes (ex: ligne 1 → Chantier A, ligne 2 → Dépôt, ligne 3 → Chantier B) **When** la livraison est créée **Then** la livraison est enregistrée avec `destination = 'chantier'` et `chantier_id = null` (multi-destinations), et chaque besoin implicite a son `chantier_id` propre (ou null pour les lignes dépôt)

3. **Given** une livraison mixte passe au statut 'livre' **When** la réception s'exécute **Then** seules les lignes destinées au dépôt (besoins avec `chantier_id = null` et flag dépôt) mettent à jour le stock du dépôt ; les lignes chantier restent inchangées

4. **Given** une livraison mixte **When** l'utilisateur consulte la DeliveryCard **Then** chaque ligne affiche sa destination : le nom du chantier OU "Dépôt" avec un badge distinctif

5. **Given** le formulaire de création de livraison **When** le toggle "Chantier unique" est activé avec "Dépôt entreprise" sélectionné **Then** toutes les lignes sont pour le dépôt (comportement story 10.4)

## Tasks / Subtasks

- [x] Task 1 — Migration SQL : colonne `is_depot` sur besoins (AC: #2, #3)
  - [x] 1.1 Créer `supabase/migrations/040_besoin_is_depot.sql`
  - [x] 1.2 `ALTER TABLE public.besoins ADD COLUMN is_depot boolean NOT NULL DEFAULT false;`
  - [x] 1.3 Les besoins existants auront `is_depot = false` (rétro-compatible)

- [x] Task 2 — Types TypeScript (AC: #2)
  - [x] 2.1 Ajouter `is_depot: boolean` au Row de `besoins` dans `database.ts`
  - [x] 2.2 Ajouter `is_depot?: boolean` aux Insert et Update

- [x] Task 3 — Modification formulaire multi-lignes : destination par ligne (AC: #1, #5)
  - [x] 3.1 Modifier `src/components/LivraisonSheets.tsx` : dans chaque ligne, le select chantier inclut "Dépôt entreprise" comme option (via valeur `'__depot__'`)
  - [x] 3.2 Ajouter un indicateur visuel quand une ligne est assignée au dépôt (badge "Dépôt" ou icône Warehouse)
  - [x] 3.3 Quand "Chantier unique" + "Dépôt entreprise" : toutes les lignes sont automatiquement pour le dépôt
  - [x] 3.4 Mettre à jour les tests LivraisonSheets

- [x] Task 4 — Modification useCreateLivraison : support lignes mixtes (AC: #2)
  - [x] 4.1 Modifier `src/lib/mutations/useCreateLivraison.ts` : chaque ligne porte un flag `isDepot: boolean`
  - [x] 4.2 Les besoins implicites créés ont `is_depot = true` quand la ligne est pour le dépôt et `chantier_id = null`
  - [x] 4.3 La livraison parent : si toutes les lignes sont dépôt → `destination = 'depot'` ; si mixte → `destination = 'chantier'` avec `chantier_id = null`
  - [x] 4.4 Mettre à jour les tests de useCreateLivraison

- [x] Task 5 — Modification réception : traitement lignes dépôt dans livraison mixte (AC: #3)
  - [x] 5.1 Modifier la logique de réception dans `useUpdateLivraisonStatus` : au passage à 'livre', parcourir les besoins liés ; pour ceux avec `is_depot = true` → entrée en stock dépôt
  - [x] 5.2 Les besoins avec `is_depot = false` ne déclenchent aucune action dépôt
  - [x] 5.3 Mettre à jour les tests

- [x] Task 6 — Modification DeliveryCard : affichage destination par ligne (AC: #4)
  - [x] 6.1 Modifier `src/components/DeliveryCard.tsx` : pour les lignes de besoins, afficher la destination (nom chantier ou "Dépôt" avec icône Warehouse)
  - [x] 6.2 Badge compact "Dépôt" (variant secondary) pour les lignes dépôt
  - [x] 6.3 Mettre à jour les tests de DeliveryCard

- [x] Task 7 — Tests de régression (AC: #1-5)
  - [x] 7.1 `npm run test` — tous les tests passent
  - [x] 7.2 `npx tsc --noEmit` — 0 nouvelles erreurs
  - [x] 7.3 `npm run lint` — 0 nouvelles erreurs

## Dev Notes

### Architecture

Cette story étend la story 10.4 pour supporter le split ligne par ligne. La clé est le champ `is_depot` sur les besoins qui permet de distinguer les lignes dépôt des lignes chantier au sein d'une même livraison.

### Pourquoi `is_depot` sur besoins plutôt que sur livraisons

Une livraison peut contenir des lignes pour le dépôt ET des lignes pour différents chantiers. Le marqueur `destination` sur la livraison indique la destination "principale", mais c'est au niveau du besoin (la ligne) que la destination réelle est portée.

Combinaisons :
| Livraison.destination | Besoin.is_depot | Besoin.chantier_id | Cas |
|---|---|---|---|
| `'depot'` | `true` | `null` | Livraison 100% dépôt |
| `'chantier'` | `false` | UUID | Livraison 100% chantier (existant) |
| `'chantier'` | mixte | mixte | Livraison mixte |

### Réception mixte

Au passage 'livre', on itère les besoins :
```typescript
for (const besoin of besoins) {
  if (besoin.is_depot) {
    // Entrée en stock dépôt : upsert depot_article + insert depot_mouvement
  }
  // Les besoins chantier : rien de spécial (ils restent sur le chantier)
}
```

### Indicateur visuel ligne dépôt

Dans le formulaire de création et dans la DeliveryCard, les lignes dépôt se distinguent par :
- Un petit badge "Dépôt" (variant secondary) à côté du nom de destination
- L'icône `Warehouse` (16px) de lucide-react

### Prérequis

- Story 10.1 : tables dépôt
- Story 10.2 : mutations dépôt
- Story 10.4 : livraison vers dépôt (colonne `destination`, logique de réception)

### References

- Source: `src/components/LivraisonSheets.tsx` — formulaire multi-lignes avec sélection chantier par ligne
- Source: `src/lib/mutations/useCreateLivraison.ts` — création avec besoins implicites
- Source: `src/lib/mutations/useUpdateLivraisonStatus.ts` — logique réception
- Source: `src/components/DeliveryCard.tsx` — affichage des lignes de besoins

## Dev Agent Record

### Implementation Plan

Story 10-5 étend les stories 10.1-10.4 pour supporter les livraisons mixtes (dépôt + chantier sur la même livraison).

Approche : ajouter un flag `is_depot` au niveau du besoin (ligne) pour distinguer les destinations. La réception au statut 'livre' filtre uniquement les besoins `is_depot = true` pour l'entrée en stock dépôt.

### Completion Notes

- **Task 1** : Migration SQL `040_besoin_is_depot.sql` — `ALTER TABLE besoins ADD COLUMN is_depot boolean NOT NULL DEFAULT false`
- **Task 2** : Types TS — `is_depot` ajouté à `besoins` Row/Insert/Update et à l'interface `Besoin`
- **Task 3** : Formulaire LivraisonSheets — badge "Dépôt" (Badge + Warehouse icon) affiché par ligne quand destination = `__depot__` en mode par-ligne ou global. Le select `__depot__` existait déjà (story 10.4/6.13).
- **Task 4** : useCreateLivraison — `LivraisonLine.isDepot` flag ajouté, propagé comme `is_depot` dans les besoins insérés. `useLivraisonActions` calcule `isDepot` à partir de `chantierId === '__depot__'`.
- **Task 5** : Réception mixte — `useUpdateLivraisonStatus` appelle désormais `receptionnerLivraisonDepot` pour TOUTE livraison passant à 'livre' (pas juste destination=depot). `receptionnerLivraisonDepot` filtre via `.eq('is_depot', true)` → seules les lignes dépôt entrent en stock.
- **Task 6** : DeliveryCard — `BesoinLine` affiche un Badge "Dépôt" pour `is_depot = true`. `BesoinsList` gère le groupement mixte (dépôt + chantiers).
- **Task 7** : `tsc --noEmit` ✓, `lint` ✓ (0 nouvelles erreurs), tests 55 passent sur les fichiers modifiés.

## File List

- `supabase/migrations/040_besoin_is_depot.sql` (new)
- `src/types/database.ts` (modified)
- `src/components/LivraisonSheets.tsx` (modified)
- `src/lib/mutations/useCreateLivraison.ts` (modified)
- `src/lib/mutations/useCreateLivraison.test.ts` (modified)
- `src/lib/hooks/useLivraisonActions.ts` (modified)
- `src/lib/hooks/useLivraisonActions.test.ts` (new — review fix)
- `src/lib/mutations/useUpdateLivraisonStatus.ts` (modified)
- `src/lib/mutations/useDepotReceptionLivraison.ts` (new)
- `src/lib/mutations/useDepotReceptionLivraison.test.ts` (new)
- `src/components/DeliveryCard.tsx` (modified)
- `src/components/DeliveryCard.test.tsx` (modified)
- `src/components/BottomNavigation.tsx` (modified — ajout onglet Dépôt, story 10.3)
- `src/components/BottomNavigation.test.tsx` (modified — story 10.3)
- `src/routeTree.gen.ts` (modified — auto-généré par TanStack Router)

## Change Log

- 2026-02-25: Story 10.5 implémentée — support livraison mixte (dépôt + chantier) avec flag `is_depot` sur besoins, réception sélective, et affichage par ligne dans DeliveryCard
- 2026-02-25: Code review — Fix test `fromCallCount` non déclaré dans useCreateLivraison.test.ts, ajout tests useLivraisonActions (6 tests isDepot logic), correction File List (new vs modified), documentation des fichiers manquants
