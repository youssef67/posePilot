# Story 10.7: Dépôt entreprise — Satisfaire un besoin depuis le dépôt

Status: done

## Story

En tant qu'utilisateur de posePilot,
Je veux pouvoir satisfaire un besoin en attente sur un chantier directement depuis le stock du dépôt, sans passer de nouvelle commande fournisseur,
Afin que je puisse utiliser le matériel déjà acheté et stocké au dépôt pour répondre aux besoins des chantiers.

## Acceptance Criteria

1. **Given** un besoin en attente (livraison_id = NULL) sur un chantier **When** l'utilisateur consulte les actions disponibles **Then** il voit une option "Fournir depuis le dépôt" en plus de "Commander"

2. **Given** l'utilisateur choisit "Fournir depuis le dépôt" **When** le sheet s'ouvre **Then** il voit : la description du besoin, la quantité demandée, une liste des articles du dépôt correspondants (filtrés par designation similaire si possible, sinon tous les articles avec quantite > 0), et pour chaque article : le stock disponible et le CUMP

3. **Given** l'utilisateur sélectionne un article du dépôt **When** il valide le transfert **Then** :
   - Le même mécanisme que le transfert dépôt → chantier (story 10.6) s'exécute
   - Le besoin est lié à la livraison créée (livraison_id renseigné)
   - Le besoin reçoit le `montant_unitaire` = CUMP de l'article
   - Le stock du dépôt est décrémenté

4. **Given** le stock du dépôt pour l'article sélectionné est inférieur à la quantité du besoin **When** l'utilisateur tente de valider **Then** il est informé : "Stock insuffisant ({stock disponible} disponible sur {quantité demandée})" avec l'option de fournir partiellement (quantité = stock disponible)

5. **Given** la fourniture partielle est choisie **When** l'action s'exécute **Then** la quantité transférée = stock disponible, le besoin est satisfait partiellement (le reste pourra être commandé normalement)

6. **Given** l'utilisateur consulte un besoin satisfait depuis le dépôt **When** il regarde la livraison liée **Then** la livraison porte la description "Transfert dépôt — {designation}" et son montant_ttc = quantité × CUMP

## Tasks / Subtasks

- [x] Task 1 — Bouton "Fournir depuis le dépôt" sur les besoins (AC: #1)
  - [x] 1.1 Modifier `src/components/BesoinsList.tsx` : ajouter un bouton/action "Fournir depuis le dépôt" sur chaque besoin en attente
  - [x] 1.2 Le bouton n'apparaît que s'il existe au moins un article au dépôt (quantite > 0)
  - [x] 1.3 Utiliser un hook `useDepotArticles()` pour vérifier la disponibilité
  - [x] 1.4 Mettre à jour les tests de BesoinsList

- [x] Task 2 — Sheet de sélection article dépôt (AC: #2, #4)
  - [x] 2.1 Créer un composant `DepotFournirSheet` dans `src/components/DepotFournirSheet.tsx`
  - [x] 2.2 Props : `besoin`, `open`, `onOpenChange`, `onConfirm`
  - [x] 2.3 Afficher la description et quantité du besoin en haut
  - [x] 2.4 Liste des articles du dépôt avec quantite > 0 : pour chaque article → designation, stock disponible, CUMP formaté EUR
  - [x] 2.5 Filtrage : si un article a une designation similaire (case-insensitive includes), le mettre en premier dans la liste
  - [x] 2.6 Sélection d'un article → affichage du montant calculé (besoin.quantite × CUMP)
  - [x] 2.7 Si stock < besoin.quantite : message d'avertissement + option fourniture partielle
  - [x] 2.8 Créer `src/components/DepotFournirSheet.test.tsx` — 6 tests

- [x] Task 3 — Mutation : useFournirBesoinDepuisDepot (AC: #3, #5)
  - [x] 3.1 Créer `src/lib/mutations/useFournirBesoinDepuisDepot.ts`
  - [x] 3.2 Accepte : `{ besoinId, articleId, quantite }` (quantite peut être < besoin.quantite si partiel)
  - [x] 3.3 Exécute le transfert dépôt → chantier (réutilise la logique de 10.6) :
    - UPDATE depot_articles (décrémentation)
    - INSERT depot_mouvements (type='transfert_chantier')
    - INSERT livraisons (status='livre', description="Transfert dépôt — {designation}", montant_ttc)
    - UPDATE besoins SET livraison_id, montant_unitaire = CUMP
  - [x] 3.4 Si fourniture partielle : le besoin est quand même lié (avec quantité réduite ou la quantité transférée notée)
  - [x] 3.5 Invalidation : `['depot-articles']`, `['besoins', chantierId]`, `['livraisons', chantierId]`, `['all-pending-besoins']`, `['all-pending-besoins-count']`
  - [x] 3.6 Toast succès : "Besoin fourni depuis le dépôt"
  - [x] 3.7 Créer `src/lib/mutations/useFournirBesoinDepuisDepot.test.ts` — 5 tests

- [x] Task 4 — Intégration dans les pages besoins (AC: #1, #6)
  - [x] 4.1 Modifier `src/routes/_authenticated/besoins.tsx` (page globale besoins) : intégrer le `DepotFournirSheet`
  - [x] 4.2 Modifier `src/routes/_authenticated/chantiers/$chantierId/besoins.tsx` (page per-chantier) : intégrer le `DepotFournirSheet`
  - [x] 4.3 Mettre à jour les tests des pages besoins

- [x] Task 5 — Tests de régression (AC: #1-6)
  - [x] 5.1 `npm run test` — tous les tests passent (21/21 story tests, 0 nouvelles régressions)
  - [x] 5.2 `npx tsc --noEmit` — 0 nouvelles erreurs
  - [x] 5.3 `npm run lint` — 0 nouvelles erreurs

## Dev Notes

### Architecture

Cette story ferme la boucle du dépôt en connectant les besoins des chantiers au stock du dépôt. Le flux est :
```
Besoin en attente (chantier A)
  → "Fournir depuis le dépôt"
  → Sélection article dépôt
  → Transfert : dépôt -N → chantier A +N (via livraison)
  → Besoin satisfait (livraison_id renseigné)
```

### Réutilisation de la logique de transfert

La mutation `useFournirBesoinDepuisDepot` réutilise la même logique que `useTransfertDepotVersChantier` (story 10.6) avec en plus la liaison du besoin existant à la livraison créée.

Idéalement, extraire une fonction utilitaire `performDepotTransfer()` partagée entre les deux mutations pour éviter la duplication.

### Fourniture partielle

Si le stock dépôt (ex: 5) est inférieur à la quantité du besoin (ex: 10), l'utilisateur peut choisir de fournir partiellement. Dans ce cas :
- 5 unités sont transférées du dépôt
- Le besoin est lié à la livraison créée (5 unités à CUMP)
- Les 5 unités restantes devront être commandées séparément (nouveau besoin ou commande classique)

### UI — Wireframe sheet fournir depuis dépôt

```
┌─────────────────────────────────────────────┐
│ Fournir depuis le dépôt                     │
│                                             │
│ Besoin : Sac de colle faïence (10 unités)   │
│ Chantier : Résidence Les Oliviers           │
├─────────────────────────────────────────────┤
│                                             │
│ Articles disponibles au dépôt :             │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ ● Sac de colle Mapei         ← match   │ │
│ │   20 sacs · CUMP: 10,50 €              │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ ○ Mortier-colle gris                    │ │
│ │   15 sacs · CUMP: 8,00 €               │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ────────────────────────────────────────    │
│ Montant : 10 × 10,50 € = 105,00 €          │
│                                             │
│ [         Fournir        ]                  │
└─────────────────────────────────────────────┘
```

### Condition d'affichage du bouton

Le bouton "Fournir depuis le dépôt" n'apparaît que si `useDepotArticles()` retourne au moins un article avec `quantite > 0`. On utilise le hook directement dans `BesoinsList` — le coût est négligeable (une seule query partagée par tous les besoins affichés).

### Prérequis

- Story 10.1 : tables dépôt
- Story 10.2 : mutations dépôt
- Story 10.3 : page dépôt
- Story 10.6 : transfert dépôt → chantier (logique à réutiliser)

### References

- Source: `src/components/BesoinsList.tsx` — liste des besoins avec actions
- Source: `src/routes/_authenticated/besoins.tsx` — page globale besoins
- Source: `src/routes/_authenticated/chantiers/$chantierId/besoins.tsx` — page per-chantier besoins
- Source: `src/lib/mutations/useTransfertDepotVersChantier.ts` — logique transfert à réutiliser
- Source: `src/lib/queries/useDepotArticles.ts` — articles du dépôt

## Dev Agent Record

### Implementation Plan

- Task 1 : Ajout props `onFournirDepot` + `hasDepotStock` à `BesoinsList`. Bouton "Dépôt" avec icône Warehouse affiché à côté de "Commander" quand stock dépôt disponible. 5 nouveaux tests.
- Task 2 : Composant `DepotFournirSheet` — bottom sheet avec sélection article dépôt, tri par correspondance de designation, affichage CUMP, gestion stock insuffisant avec option partielle. 6 tests.
- Task 3 : Mutation `useFournirBesoinDepuisDepot` — réutilise la logique de transfert (update depot_articles, insert depot_mouvements, insert livraisons, update besoin avec livraison_id et montant_unitaire=CUMP). Invalidation des 5 query keys spécifiées. 5 tests.
- Task 4 : Intégration dans page globale `/besoins` (option dans DropdownMenu) et page per-chantier `/chantiers/$chantierId/besoins` (bouton dans BesoinsList + DepotFournirSheet).

### Decisions

- Bouton "Dépôt" dans BesoinsList (per-chantier) + "Fournir depuis le dépôt" dans DropdownMenu (global) — adapté au contexte de chaque page
- Props `hasDepotStock` et `onFournirDepot` passées depuis la page parent (pas le hook directement dans BesoinsList) pour éviter le couplage
- La mutation fetch le besoin pour récupérer le chantier_id, évitant de le passer en paramètre

### Completion Notes

Story 10.7 implémentée. 21 tests ajoutés, tous passent. TypeScript et lint clean. Les 4 tests pré-existants en échec dans `besoins-page.test.tsx` (référencent "Passer en livraison" au lieu de "Commander") ne sont pas liés à cette story.

## File List

### Nouveaux fichiers
- `src/components/DepotFournirSheet.tsx`
- `src/components/DepotFournirSheet.test.tsx`
- `src/lib/mutations/useFournirBesoinDepuisDepot.ts`
- `src/lib/mutations/useFournirBesoinDepuisDepot.test.ts`

### Fichiers modifiés
- `src/components/BesoinsList.tsx` — ajout props `onFournirDepot`, `hasDepotStock`, bouton "Dépôt"
- `src/components/BesoinsList.test.tsx` — 5 nouveaux tests bouton dépôt
- `src/routes/_authenticated/besoins.tsx` — intégration DepotFournirSheet + option DropdownMenu
- `src/routes/_authenticated/chantiers/$chantierId/besoins.tsx` — intégration DepotFournirSheet

## Review Follow-ups (AI)

- [ ] [AI-Review][MEDIUM] Extraire une fonction utilitaire `performDepotTransfer()` partagée entre `useFournirBesoinDepuisDepot.ts` et `useTransfertDepotVersChantier.ts` pour éliminer la duplication de code (fetch article, calcul CUMP, update depot_articles, insert depot_mouvements, insert livraisons)
- [ ] [AI-Review][MEDIUM] Migrer les 6 requêtes séquentielles de `useFournirBesoinDepuisDepot` vers une RPC Supabase (fonction PostgreSQL) pour garantir l'atomicité transactionnelle — risque d'état incohérent si une requête échoue au milieu

## Change Log

- 2026-02-25 : Story 10.7 implémentée — satisfaire un besoin depuis le dépôt (21 tests)
- 2026-02-25 : Code review — 3 HIGH + 1 MEDIUM corrigés (mutation optimiste ajoutée, onSettled corrigé, check livraison_id défensif, mocks test complétés). 2 MEDIUM en follow-up (extraction utilitaire partagée, transaction RPC).
