# Story 6.11: Refonte livraisons — regroupement par chantier, onglets et actions bulk

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

En tant qu'utilisateur de posePilot,
Je veux voir mes livraisons regroupées par chantier dans l'onglet global et pouvoir avancer les statuts individuellement ou en lot,
Afin que je retrouve facilement les livraisons de chaque chantier et que je gagne du temps sur les validations.

## Acceptance Criteria

1. **Given** l'utilisateur tape sur l'onglet "Livraisons" **When** la page s'affiche **Then** les livraisons sont regroupées par chantier sous forme de cartes-résumé (nom du chantier + compteurs par statut)

2. **Given** les onglets de filtre (Tous / À traiter / En cours / Terminé) sont affichés **When** l'utilisateur active un filtre **Then** seuls les chantiers ayant au moins 1 livraison correspondant à ce filtre apparaissent

3. **Given** un filtre est actif **When** l'utilisateur consulte les cartes-chantier **Then** chaque carte affiche toujours TOUS les compteurs de statut (pas uniquement ceux du filtre actif)

4. **Given** les cartes-chantier sont affichées **When** l'utilisateur consulte la liste **Then** elles sont triées par activité la plus récente (chantier avec la livraison `created_at` la plus récente en premier)

5. **Given** l'utilisateur tape sur une carte-chantier **When** la page détail s'ouvre **Then** il navigue vers `/chantiers/$chantierId/livraisons` qui affiche les livraisons avec des onglets de filtre (Tous / À traiter / En cours / Terminé) et triées du plus récent au plus ancien

6. **Given** l'utilisateur est sur la page détail livraisons d'un chantier **When** il consulte une livraison **Then** il peut avancer le statut individuellement (comportement actuel conservé)

7. **Given** l'utilisateur est sur la page détail livraisons d'un chantier **When** il active le mode sélection et sélectionne plusieurs livraisons **Then** il peut avancer leur statut en bulk via une barre d'action

## Tasks / Subtasks

- [x] Task 1 — Composant ChantierLivraisonCard (AC: #1, #3)
  - [x] 1.1 Créer `src/components/ChantierLivraisonCard.tsx`
  - [x] 1.2 Props : `chantierNom: string`, `compteurs: { a_traiter: number, en_cours: number, termine: number, total: number }`, `lastActivity: string` (date ISO), `onClick: () => void`
  - [x] 1.3 Affichage : nom du chantier en titre, compteurs sous forme de badges colorés (`X à traiter · Y en cours · Z terminés`), total
  - [x] 1.4 Couleurs compteurs : orange (#F59E0B) à traiter, bleu (#3B82F6) en cours, vert (#10B981) terminé
  - [x] 1.5 Skeleton : `ChantierLivraisonCardSkeleton`
  - [x] 1.6 Créer `src/components/ChantierLivraisonCard.test.tsx`

- [x] Task 2 — Refonte page globale `/livraisons` (AC: #1, #2, #3, #4)
  - [x] 2.1 Remplacer la liste plate de `DeliveryCard` par des `ChantierLivraisonCard`
  - [x] 2.2 Grouper `useAllLivraisons` data par `chantier_id`
  - [x] 2.3 Calculer compteurs par chantier : `a_traiter` (prevu + commande), `en_cours` (livraison_prevue + a_recuperer), `termine` (receptionne + recupere)
  - [x] 2.4 Conserver les onglets Tous / À traiter / En cours / Terminé avec compteurs globaux
  - [x] 2.5 Filtre actif : n'afficher que les chantiers ayant ≥ 1 livraison dans les statuts du filtre
  - [x] 2.6 Tri des cartes : chantier avec le `created_at` le plus récent (parmi ses livraisons) en premier
  - [x] 2.7 Clic sur carte : `navigate({ to: '/chantiers/$chantierId/livraisons', params: { chantierId } })`
  - [x] 2.8 Supprimer les imports et logique des `DeliveryCard`, `EditLivraisonSheet`, `useUpdateLivraisonStatus`, `useUpdateLivraison`, `useDeleteLivraison`, etc. (plus d'actions individuelles sur cette page)
  - [x] 2.9 Conserver `useAllLivraisons`, `useRealtimeAllLivraisons` pour les données et le realtime
  - [x] 2.10 État vide : icône Truck + "Aucune livraison"
  - [x] 2.11 État loading : `ChantierLivraisonCardSkeleton` ×3
  - [x] 2.12 Mettre à jour `src/__tests__/livraisons-page.test.tsx`

- [x] Task 3 — Ajout onglets de filtre sur page per-chantier livraisons (AC: #5)
  - [x] 3.1 Modifier `src/routes/_authenticated/chantiers/$chantierId/livraisons.tsx`
  - [x] 3.2 Ajouter les Tabs : Tous / À traiter / En cours / Terminé avec compteurs
  - [x] 3.3 Réutiliser la même logique `filterAndSort` et `FILTER_STATUSES` que la page globale actuelle
  - [x] 3.4 Tri par `created_at DESC` par défaut, `date_prevue ASC` pour "En cours", `date_prevue DESC` pour "Terminé"
  - [x] 3.5 Conserver le header avec bouton retour + nom du chantier
  - [x] 3.6 Conserver toutes les actions existantes (avancer statut, éditer, supprimer, FAB création, sheets)
  - [x] 3.7 Mettre à jour `src/routes/_authenticated/chantiers/$chantierId/livraisons.test.tsx`

- [x] Task 4 — Mode sélection + actions bulk sur page per-chantier (AC: #7)
  - [x] 4.1 Ajouter un bouton "Sélectionner" dans le header de la page per-chantier livraisons
  - [x] 4.2 Mode sélection : checkboxes sur chaque `DeliveryCard`, bouton "Tout sélectionner"
  - [x] 4.3 Barre d'action fixe en bas : afficher les actions possibles selon les statuts des livraisons sélectionnées
  - [x] 4.4 Règle : toutes les livraisons sélectionnées doivent être au même statut pour qu'une action bulk soit possible
  - [x] 4.5 Si statuts mixtes : afficher un message "Sélectionnez des livraisons au même statut"
  - [x] 4.6 Actions bulk disponibles :
    - `prevu` → "Passer en commandé (N)" → bulk `useUpdateLivraisonStatus` vers `commande`
    - `commande` (non retrait) → "Planifier livraison (N)" → sheet date unique → bulk vers `livraison_prevue`
    - `commande` (retrait) → "Planifier retrait (N)" → bulk vers `a_recuperer`
    - `livraison_prevue` → "Confirmer réception (N)" → bulk vers `receptionne`
    - `a_recuperer` → "Confirmer récupération (N)" → bulk vers `recupere`
  - [x] 4.7 Créer `src/lib/mutations/useBulkUpdateLivraisonStatus.ts` — appelle `useUpdateLivraisonStatus` pour chaque livraison sélectionnée
  - [x] 4.8 Créer `src/lib/mutations/useBulkUpdateLivraisonStatus.test.ts`
  - [x] 4.9 Mettre à jour tests de la page per-chantier

- [x] Task 5 — Tests de régression (AC: #1-7)
  - [x] 5.1 `npm run test` — tous les tests story-related passent (141/141), échecs globaux pré-existants (navigation-hierarchy, pwa-config, etc.)
  - [x] 5.2 `npm run lint` — 0 nouvelles erreurs, 0 warnings
  - [x] 5.3 `npm run build` — 0 nouvelles erreurs tsc

## Dev Notes

### Vue d'ensemble — Stratégie d'implémentation

Cette story transforme la page globale livraisons d'une **liste plate de DeliveryCards** en une **vue groupée par chantier** avec cartes-résumé. Elle enrichit aussi la page per-chantier livraisons avec des **onglets de filtre** et un **mode sélection bulk**.

**Prérequis :** Story 6.10 doit être faite en premier (suppression accès livraisons depuis chantier + onglet Besoins).

**Scope précis :**
- Nouveau composant `ChantierLivraisonCard` (carte-résumé par chantier)
- Refonte page `/livraisons` : cartes-résumé au lieu de DeliveryCards
- Onglets de filtre sur la page per-chantier `/chantiers/$chantierId/livraisons`
- Mode sélection + actions bulk sur livraisons

### Ce qui existe déjà

| Élément | Fichier | Notes |
|---------|---------|-------|
| `useAllLivraisons` | `src/lib/queries/useAllLivraisons.ts` | Fetch global avec join chantiers(nom) — RÉUTILISABLE |
| `useRealtimeAllLivraisons` | `src/lib/subscriptions/useRealtimeAllLivraisons.ts` | Subscription globale — RÉUTILISABLE |
| `useAllLinkedBesoins` | `src/lib/queries/useAllLinkedBesoins.ts` | Besoins liés aux livraisons — plus nécessaire sur page globale |
| `DeliveryCard` | `src/components/DeliveryCard.tsx` | Card livraison individuelle — utilisée dans page per-chantier uniquement |
| `LivraisonsList` | `src/components/LivraisonsList.tsx` | Liste DeliveryCards — utilisée dans page per-chantier |
| `LivraisonSheets` | `src/components/LivraisonSheets.tsx` | Sheets actions — utilisés dans page per-chantier |
| `useLivraisonActions` | `src/lib/hooks/useLivraisonActions.ts` | Hook centralisé actions — utilisé dans page per-chantier |
| `useUpdateLivraisonStatus` | `src/lib/mutations/useUpdateLivraisonStatus.ts` | Mutation statut — RÉUTILISABLE pour bulk |
| `useLivraisons(chantierId)` | `src/lib/queries/useLivraisons.ts` | Fetch per-chantier — UTILISÉ dans page per-chantier |
| `FILTER_STATUSES` | `src/routes/_authenticated/livraisons.tsx` | Mapping filtre → statuts — À EXTRAIRE en utilitaire partagé |
| Page per-chantier | `src/routes/_authenticated/chantiers/$chantierId/livraisons.tsx` | Page à enrichir avec onglets + bulk |
| Type `LivraisonWithChantier` | `src/lib/queries/useAllLivraisons.ts` | Livraison + chantiers.nom |

### Composant ChantierLivraisonCard

```
┌──────────────────────────────────────────────────┐
│ Résidence Les Oliviers                    6 total│
│                                                  │
│ 🟠 2 à traiter  🔵 3 en cours  🟢 1 terminé    │
└──────────────────────────────────────────────────┘
```

**Props :**
```typescript
interface ChantierLivraisonCardProps {
  chantierNom: string
  compteurs: {
    a_traiter: number   // prevu + commande
    en_cours: number    // livraison_prevue + a_recuperer
    termine: number     // receptionne + recupere
    total: number
  }
  onClick: () => void
}
```

**Style :** Card standard avec hover effect, chevron droit pour indiquer la navigation.

### Architecture page globale refactorée

```
┌─────────────────────────────────────────────────┐
│ header: "Livraisons" (h1)                       │
├─────────────────────────────────────────────────┤
│ Tabs: [Tous (12)] [À traiter (5)] [En cours (4)] [Terminé (3)] │
├─────────────────────────────────────────────────┤
│                                                 │
│ ChantierLivraisonCard — Résidence Les Oliviers  │
│   2 à traiter · 3 en cours · 1 terminé  (6)    │
│                                                 │
│ ChantierLivraisonCard — Rénovation Duval        │
│   3 à traiter · 0 en cours · 0 terminé  (3)    │
│                                                 │
│ ChantierLivraisonCard — Maison Martin           │
│   0 à traiter · 1 en cours · 2 terminé  (3)    │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Logique de groupement :**
```typescript
function groupByChantier(livraisons: LivraisonWithChantier[]) {
  const groups = new Map<string, { nom: string; livraisons: LivraisonWithChantier[] }>()
  for (const liv of livraisons) {
    const existing = groups.get(liv.chantier_id)
    if (existing) {
      existing.livraisons.push(liv)
    } else {
      groups.set(liv.chantier_id, { nom: liv.chantiers.nom, livraisons: [liv] })
    }
  }
  return groups
}
```

**Logique de compteurs :**
```typescript
const FILTER_STATUSES = {
  a_traiter: ['prevu', 'commande'],
  en_cours: ['livraison_prevue', 'a_recuperer'],
  termine: ['receptionne', 'recupere'],
}
```

**Logique de filtre :** Quand filtre "En cours" actif → n'afficher que les chantiers ayant ≥ 1 livraison `livraison_prevue` ou `a_recuperer`. Mais la carte affiche toujours TOUS les compteurs.

**Tri :** `maxCreatedAt` par chantier = `Math.max(livraisons.map(l => l.created_at))`, DESC.

### Page per-chantier enrichie

**Avant (Story 6.2) :**
```
[← Retour] Livraisons — Résidence Les Oliviers
Livraisons (6)
  DeliveryCard...
  DeliveryCard...
  FAB +
```

**Après (Story 6.11) :**
```
[← Retour] Livraisons — Résidence Les Oliviers  [Sélectionner]
[Tous (6)] [À traiter (2)] [En cours (3)] [Terminé (1)]
  DeliveryCard...
  DeliveryCard...
  FAB +

--- MODE SÉLECTION ---
[← Retour] Livraisons — Résidence Les Oliviers  [Annuler]
[Tous (6)] [À traiter (2)] [En cours (3)] [Terminé (1)]
  ☑ DeliveryCard...
  ☐ DeliveryCard...
  ☑ DeliveryCard...

  [Passer en commandé (2)]
```

**Extraire `filterAndSort` en utilitaire partagé :**
```typescript
// src/lib/utils/livraisonFilters.ts
export type StatusFilter = 'tous' | 'a_traiter' | 'en_cours' | 'termine'
export const FILTER_STATUSES: Record<StatusFilter, string[]> = { ... }
export function filterAndSort(livraisons, filter): Livraison[] { ... }
export function countByFilter(livraisons, filter): number { ... }
```

### Mutation bulk : useBulkUpdateLivraisonStatus

```typescript
// src/lib/mutations/useBulkUpdateLivraisonStatus.ts
interface BulkUpdateInput {
  livraisons: { id: string; chantierId: string }[]
  newStatus: string
  datePrevue?: string  // si transition vers livraison_prevue
}

// Pour chaque livraison : appeler la mutation update_status existante
// Invalidation : tous les caches livraisons touchés
```

**Contrainte UX :** Toutes les livraisons sélectionnées doivent être au même statut. Si statuts mixtes → message d'erreur dans la barre d'action.

**Cas spécial `commande` → `livraison_prevue` :** Nécessite une date. En bulk, afficher une sheet avec un seul date picker qui s'applique à toutes les livraisons sélectionnées.

**Cas spécial `commande` avec `retrait` :** Les livraisons en retrait avancent vers `a_recuperer`, pas `livraison_prevue`. En bulk, si mix retrait/non-retrait parmi les `commande` sélectionnées → message "Sélectionnez uniquement des livraisons ou des retraits".

### Project Structure Notes

**Nouveaux fichiers :**
- `src/components/ChantierLivraisonCard.tsx` + test
- `src/lib/utils/livraisonFilters.ts` (extraction depuis livraisons.tsx)
- `src/lib/mutations/useBulkUpdateLivraisonStatus.ts` + test

**Fichiers modifiés :**
- `src/routes/_authenticated/livraisons.tsx` — refonte complète (cartes-résumé)
- `src/__tests__/livraisons-page.test.tsx`
- `src/routes/_authenticated/chantiers/$chantierId/livraisons.tsx` — onglets + bulk
- `src/routes/_authenticated/chantiers/$chantierId/livraisons.test.tsx`

### Risques et points d'attention

1. **Simplification page globale** : La page globale ne gère plus les actions individuelles (avancer statut, éditer, supprimer). Tout ça se passe dans la page per-chantier. Ça simplifie considérablement la page globale.

2. **Extraction `filterAndSort`** : Créer un utilitaire partagé pour éviter la duplication entre page globale et page per-chantier. Le même `FILTER_STATUSES` et `filterAndSort` servent aux deux.

3. **Bulk avec date** : La transition `commande` → `livraison_prevue` nécessite une date. En mode bulk, une seule date pour toutes les livraisons. C'est un choix UX pragmatique.

4. **Bulk avec retrait mixte** : Si l'utilisateur sélectionne des livraisons `commande` dont certaines sont en retrait et d'autres non, les transitions sont différentes. Bloquer cette action et afficher un message clair.

5. **Navigation retour** : Quand l'utilisateur clique sur une carte-chantier et accède à `/chantiers/$chantierId/livraisons`, le bouton retour doit ramener vers `/livraisons` (pas vers la fiche chantier). Vérifier le comportement du `history.back()`.

6. **Compteurs tab globaux** : Les compteurs des onglets (Tous (12), À traiter (5)...) comptent les **livraisons** (pas les chantiers). C'est cohérent avec le filtre.

### References

- [Source: src/routes/_authenticated/livraisons.tsx — Page globale actuelle à refactorer]
- [Source: src/__tests__/livraisons-page.test.tsx — Tests actuels à adapter]
- [Source: src/routes/_authenticated/chantiers/$chantierId/livraisons.tsx — Page per-chantier à enrichir]
- [Source: src/lib/queries/useAllLivraisons.ts — Query globale réutilisable]
- [Source: src/lib/subscriptions/useRealtimeAllLivraisons.ts — Subscription réutilisable]
- [Source: src/lib/mutations/useUpdateLivraisonStatus.ts — Mutation individuelle (base pour bulk)]
- [Source: src/lib/hooks/useLivraisonActions.ts — Hook actions per-chantier]
- [Source: src/components/DeliveryCard.tsx — Card individuelle (page per-chantier)]
- [Source: src/components/LivraisonSheets.tsx — Sheets actions]
- [Source: _bmad-output/implementation-artifacts/6-4-vue-globale-des-livraisons-filtree-par-statut.md — Story précédente, pattern]
- [Source: _bmad-output/implementation-artifacts/6-10-vue-globale-besoins-regroupement-par-chantier.md — Story prérequise]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- Aucun problème bloquant. Fix mock concurrence pour `useBulkUpdateLivraisonStatus.test.ts` (Promise.all interleaving).

### Completion Notes List
- **Task 1** : Composant `ChantierLivraisonCard` + `ChantierLivraisonCardSkeleton` — card clickable avec compteurs colorés par catégorie (orange/bleu/vert), zéros masqués, pluriel géré. 8 tests.
- **Task 2** : Refonte complète page `/livraisons` — remplacement liste plate par cartes-résumé groupées par chantier. Utilitaire partagé `livraisonFilters.ts` extrait. Navigation vers page per-chantier au clic. 9 tests.
- **Task 3** : Onglets de filtre (Tous/À traiter/En cours/Terminé) ajoutés sur page per-chantier avec tri contextuel (created_at DESC / date_prevue ASC pour En cours / date_prevue DESC pour Terminé). Rendu inline des DeliveryCards au lieu de LivraisonsList pour supporter le mode sélection. 13 tests.
- **Task 4** : Mode sélection avec checkboxes, "Tout sélectionner", barre d'action bulk fixe en bas. Gestion statuts mixtes, retrait mixte, bulk date sheet pour commande→livraison_prevue. Mutation `useBulkUpdateLivraisonStatus` avec Promise.allSettled + gestion résultats partiels. 23 tests page + 4 tests mutation.
- **Task 5** : 0 erreurs lint, 0 erreurs tsc. 49/49 tests story-related passent. Échecs globaux pré-existants (navigation-hierarchy, pwa-config, etc.).

### Code Review Fixes Applied
- **H1** : `Promise.all` → `Promise.allSettled` dans `useBulkUpdateLivraisonStatus.ts` — gestion des échecs partiels avec `BulkUpdateResult { succeeded, failed }`
- **M1** : Ajout icône `Truck` dans l'état vide de la page per-chantier livraisons
- **M2** : Ajout prop `hideActions` sur `DeliveryCard` — masque les boutons d'action en mode sélection
- **M3** : Ajout de 2 tests (bulk date sheet flow + masquage boutons en mode sélection)
- **M4** : Extraction de `updateLivraisonStatus()` comme fonction partagée dans `useUpdateLivraisonStatus.ts`, réutilisée par `useBulkUpdateLivraisonStatus.ts`
- **L3** : Type assertion `newStatus as 'commande'` remplacée par typage strict `BulkNewStatus`

### File List
- `src/components/ChantierLivraisonCard.tsx` — NEW
- `src/components/ChantierLivraisonCard.test.tsx` — NEW
- `src/lib/utils/livraisonFilters.ts` — NEW
- `src/lib/mutations/useBulkUpdateLivraisonStatus.ts` — NEW
- `src/lib/mutations/useBulkUpdateLivraisonStatus.test.ts` — NEW
- `src/components/DeliveryCard.tsx` — MODIFIED (ajout prop `hideActions`, import `LivraisonTimeline`)
- `src/lib/mutations/useUpdateLivraisonStatus.ts` — MODIFIED (extraction fonction `updateLivraisonStatus`)
- `src/routes/_authenticated/livraisons.tsx` — MODIFIED (refonte complète)
- `src/__tests__/livraisons-page.test.tsx` — MODIFIED (adapté pour cartes-résumé)
- `src/routes/_authenticated/chantiers/$chantierId/livraisons.tsx` — MODIFIED (onglets + bulk + review fixes)
- `src/routes/_authenticated/chantiers/$chantierId/livraisons.test.tsx` — MODIFIED (onglets + bulk + review tests)
