# Story 10.6: Dépôt entreprise — Transfert du dépôt vers un chantier

Status: done

## Story

En tant qu'utilisateur de posePilot,
Je veux pouvoir transférer du matériel du dépôt vers un chantier en spécifiant la quantité, et que cela crée automatiquement une dépense côté chantier au CUMP de l'article,
Afin que le matériel passe du stock dépôt au chantier avec traçabilité complète.

## Acceptance Criteria

1. **Given** l'utilisateur est sur la page Dépôt et consulte un article en stock (quantite > 0) **When** il tape sur l'article **Then** un sheet de détail s'ouvre avec les informations de l'article et un bouton "Transférer vers un chantier"

2. **Given** l'utilisateur clique sur "Transférer vers un chantier" **When** le sheet de transfert s'ouvre **Then** il voit : la désignation de l'article (non modifiable), le stock disponible, un champ quantité (input numérique, max = stock disponible), un select chantier (chantiers actifs uniquement), et le montant calculé (quantité × CUMP) en temps réel

3. **Given** l'utilisateur renseigne quantité et chantier **When** il valide le transfert **Then** :
   - `depot_articles.quantite` -= N
   - `depot_articles.valeur_totale` -= N × CUMP
   - Un `depot_mouvement` type='transfert_chantier' est créé avec `chantier_id` renseigné
   - Une livraison est créée côté chantier (status='livre', `montant_ttc` = N × CUMP, description = designation de l'article) avec un besoin implicite lié

4. **Given** l'utilisateur tente de transférer plus que le stock disponible **When** il saisit une quantité > stock **Then** la validation bloque avec "Quantité supérieure au stock disponible (max: {N})"

5. **Given** le transfert réduit le stock à 0 **When** le transfert s'exécute **Then** l'article reste en base avec quantite=0 et valeur_totale=0 (pas de suppression automatique)

6. **Given** le transfert est exécuté **When** l'utilisateur consulte les livraisons du chantier cible **Then** il voit une livraison "Transfert dépôt — {designation}" avec le montant TTC correspondant

## Tasks / Subtasks

- [x] Task 1 — Mutation : useTransfertDepotVersChantier (AC: #3, #5)
  - [x] 1.1 Créer `src/lib/mutations/useTransfertDepotVersChantier.ts`
  - [x] 1.2 Accepte : `{ articleId, quantite, chantierId }`
  - [x] 1.3 Calcule CUMP de l'article, puis :
    - UPDATE `depot_articles` : quantite -= N, valeur_totale -= N × CUMP
    - INSERT `depot_mouvements` : type='transfert_chantier', quantite=N, prix_unitaire=CUMP, montant_total=N×CUMP, chantier_id
    - INSERT `livraisons` : chantier_id, description="Transfert dépôt — {designation}", status='livre', montant_ttc=N×CUMP, destination='chantier'
    - INSERT `besoins` : lié à la livraison créée, description=designation, quantite=N, montant_unitaire=CUMP, chantier_id
  - [x] 1.4 Invalidation : `['depot-articles']`, `['depot-mouvements', articleId]`, `['livraisons', chantierId]`, `['all-livraisons']`
  - [x] 1.5 Toast succès : "Transfert effectué"
  - [x] 1.6 Créer `src/lib/mutations/useTransfertDepotVersChantier.test.ts` — 5 tests

- [x] Task 2 — Sheet détail article + bouton transfert (AC: #1)
  - [x] 2.1 Modifier `src/routes/_authenticated/depot.tsx` : ajouter un Sheet "Détail article" qui s'ouvre au tap sur un article
  - [x] 2.2 Afficher : designation, quantité (+ unité), CUMP, valeur totale
  - [x] 2.3 Bouton "Transférer vers un chantier" en bas du sheet
  - [x] 2.4 Mettre à jour les tests de depot-page

- [x] Task 3 — Sheet transfert dépôt → chantier (AC: #2, #4)
  - [x] 3.1 Ajouter un second Sheet dans `depot.tsx` pour le formulaire de transfert
  - [x] 3.2 Champs : quantité (Input number, min 1, max stock disponible), chantier (Select — chantiers actifs via `useChantiers('active')`)
  - [x] 3.3 Affichage en temps réel : "Montant : {quantite × CUMP}" formaté EUR
  - [x] 3.4 Validation : quantité requise, > 0, <= stock disponible ; chantier requis
  - [x] 3.5 Message d'erreur si quantité > stock : "Quantité supérieure au stock disponible (max: {N})"
  - [x] 3.6 Créer tests du sheet transfert — 4 tests

- [x] Task 4 — Tests de régression (AC: #1-6)
  - [x] 4.1 `npm run test` — tous les tests passent (0 régressions nouvelles, échecs préexistants inchangés)
  - [x] 4.2 `npx tsc --noEmit` — 0 nouvelles erreurs
  - [x] 4.3 `npm run lint` — 0 nouvelles erreurs (3 préexistantes)

## Dev Notes

### Architecture

Le transfert est l'opération la plus complexe du dépôt car elle affecte 4 tables en une transaction :
1. `depot_articles` — décrémentation stock
2. `depot_mouvements` — journal de sortie
3. `livraisons` — création côté chantier
4. `besoins` — besoin implicite lié à la livraison

### Atomicité

Idéalement, les 4 opérations seraient dans une transaction SQL. Côté client avec supabase-js, on exécute les opérations séquentiellement. En cas d'erreur, le rollback optimiste côté cache est géré via `onError` (restauration du cache `depot-articles`), et l'invalidation `onSettled` resynchronise tous les caches concernés avec le serveur.

Si la robustesse est critique, on pourra migrer vers une RPC Supabase (`rpc('transfert_depot_vers_chantier', { ... })`) dans une story future. Pour le MVP, l'approche côté client est acceptable.

### UI — Wireframe sheet transfert

```
┌─────────────────────────────────────────────┐
│ Transférer vers un chantier                 │
│ Sac de colle Mapei                          │
├─────────────────────────────────────────────┤
│ Stock disponible : 20 sacs                  │
│ CUMP : 10,50 €                              │
│                                             │
│ Quantité                                    │
│ ┌─────────────────────────────────────────┐ │
│ │ 10                     (max: 20)        │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Chantier                                    │
│ ┌─────────────────────────────────────────┐ │
│ │ [▼ Résidence Les Oliviers]              │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ────────────────────────────────────────    │
│ Montant : 105,00 €                          │
│                                             │
│ [         Transférer        ]               │
└─────────────────────────────────────────────┘
```

### Livraison créée côté chantier

La livraison créée est directement au statut 'livre' car le matériel est déjà disponible (il vient du dépôt, pas d'un fournisseur externe). Elle porte la description "Transfert dépôt — {designation}" pour être identifiable dans la liste des livraisons du chantier.

### Prérequis

- Story 10.1 : tables dépôt
- Story 10.2 : mutations dépôt
- Story 10.3 : page dépôt avec liste articles

### References

- Source: `src/routes/_authenticated/chantiers/$chantierId/inventaire.tsx` — pattern page avec sheet
- Source: `src/lib/mutations/useCreateLivraison.ts` — création livraison avec besoins implicites
- Source: `src/lib/queries/useChantiers.ts` — liste chantiers actifs pour le select

## Dev Agent Record

### Implementation Plan

- Mutation `useTransfertDepotVersChantier` : fetch article → calcul CUMP → UPDATE depot_articles → INSERT depot_mouvements → INSERT livraisons (status='livre') → INSERT besoins (lié à la livraison). Invalidation des 4 query keys. Toast succès.
- UI : article cliquable via bouton dans `DepotArticleList` → Sheet détail → bouton "Transférer vers un chantier" → Sheet transfert avec champs quantité/chantier + montant en temps réel.
- Validation côté client : quantité > 0, <= stock, chantier requis.

### Completion Notes

- Mutation implémentée avec 4 opérations séquentielles côté client (pas de RPC atomique, comme prévu dans Dev Notes).
- Sheet détail affiche designation, quantité+unité, CUMP, valeur totale.
- Sheet transfert conforme au wireframe : stock disponible, CUMP, input quantité, select chantier actifs, montant calculé en temps réel.
- 5 tests unitaires pour la mutation couvrant les 4 inserts/updates + cas stock=0.
- 5 tests d'intégration pour les sheets (détail + transfert + validation + montant).
- 0 régressions introduites, 0 nouvelles erreurs tsc/lint.

## File List

- `src/lib/mutations/useTransfertDepotVersChantier.ts` — nouveau
- `src/lib/mutations/useTransfertDepotVersChantier.test.ts` — nouveau
- `src/routes/_authenticated/depot.tsx` — modifié (sheets détail + transfert)
- `src/components/DepotArticleList.tsx` — modifié (onArticleClick prop + bouton cliquable)
- `src/__tests__/depot-page.test.tsx` — modifié (5 tests ajoutés)

## Change Log

- 2026-02-25 : Implémentation complète de la story 10.6 — transfert dépôt vers chantier avec mutation, UI (2 sheets), validation et tests.
- 2026-02-25 : Code review — 5 corrections appliquées : validation server-side quantité > stock (H1), mise à jour optimiste onMutate/onError (M1), données fraîches via dérivation query cache (M3), correction Dev Notes atomicité (M4), formatEUR hissé au niveau module (L1).
