# Story 11.4: Logique "prêt à carreler" basée sur la position des tâches (universelle)

Status: review
Story ID: 11.4
Story Key: 11-4-logique-pret-a-carreler-basee-sur-position
Epic: 11 — Gestion des matériaux
Date: 2026-03-03
Dependencies: Story 7.3 (done — indicateurs intelligents), Story 11.2 (done — réception matériaux)

## Story

En tant que utilisateur de posePilot,
Je veux que la détection des lots "prêts à carreler" fonctionne quel que soit le type de chantier (avec ou sans ragréage, avec ou sans phonique),
Afin que les indicateurs soient fiables sur tous mes chantiers, même ceux où je colle directement sur la chape.

## Contexte

Aujourd'hui, `findLotsPretsACarreler()` cherche **nommément** les tâches "ragréage" et "phonique" comme prérequis de la pose. Sur un chantier sans ragréage ni phonique, le lot n'est jamais détecté comme prêt, même si toutes les conditions réelles sont remplies.

La nouvelle logique se base sur la **position** des tâches (champ `position` dans `TacheInfo`, déjà trié par `useLotsWithTaches`). Convention métier : les tâches sont ordonnées **prérequis → pose → finitions**. On n'a plus besoin de connaître les noms des prérequis.

## Acceptance Criteria (BDD)

### AC1: Lot prêt — prérequis done, pose not_started, matériaux reçus

**Given** un lot avec des pièces dont les tâches sont ordonnées par position (prérequis → pose → finitions)
**When** toutes les tâches avant la première "pose" sont `done`, toutes les tâches "pose" sont `not_started`, et `materiaux_recus === true`
**Then** le lot est identifié comme "prêt à carreler"

### AC2: Lot prêt — aucun prérequis avant la pose (pose directe)

**Given** un lot dont la première tâche (par position) est une tâche "pose"
**When** toutes les tâches "pose" sont `not_started` et `materiaux_recus === true`
**Then** le lot est identifié comme "prêt à carreler" (aucun prérequis → condition vide, automatiquement satisfaite)

### AC3: Lot non prêt — prérequis pas encore terminé

**Given** un lot avec des tâches prérequis avant la pose
**When** au moins une tâche avant la première "pose" n'est pas `done`
**Then** le lot n'est PAS identifié comme "prêt à carreler"

### AC4: Lot non prêt — pose déjà commencée

**Given** un lot avec des tâches "pose"
**When** au moins une tâche "pose" est `in_progress` ou `done`
**Then** le lot n'est PAS identifié comme "prêt à carreler"

### AC5: Lot non prêt — matériaux non reçus

**Given** un lot qui remplit toutes les conditions de tâches
**When** `materiaux_recus === false`
**Then** le lot n'est PAS identifié comme "prêt à carreler"

### AC6: Lot sans tâche "pose" — exclu

**Given** un lot sans aucune tâche dont le nom contient "pose"
**When** la vérification est effectuée
**Then** le lot n'est PAS identifié comme "prêt à carreler"

### AC7: Tâches post-pose ignorées

**Given** un lot avec des tâches après la dernière "pose" (ex: joints, nettoyage)
**When** ces tâches post-pose sont `not_started`
**Then** elles n'affectent PAS le statut "prêt à carreler" — seules les tâches pré-pose et pose comptent

### AC8: Le matching "pose" reste insensible à la casse et aux accents

**Given** une tâche nommée "Pose carrelage", "POSE", "pose faïence", etc.
**When** la vérification est effectuée
**Then** ces tâches sont bien reconnues comme des tâches "pose"

### AC9: "Repose" ne matche pas "pose"

**Given** une tâche nommée "Repose" ou "Dépose"
**When** la vérification est effectuée
**Then** cette tâche n'est PAS considérée comme une tâche "pose" (word boundary respecté)

### AC10: Aucune régression sur l'affichage

**Given** la logique est modifiée dans `findLotsPretsACarreler`
**When** les vues Plot (dropdown), Dashboard (ChantierIndicators) et tous les consommateurs existants appellent la fonction
**Then** l'affichage fonctionne comme avant — même interface `LotPretACarreler`, même signature de fonction

## Tasks / Subtasks

- [x] Task 1 — Réécrire `findLotsPretsACarreler` dans `computeChantierIndicators.ts` (AC: #1, #2, #3, #4, #5, #6, #7, #8, #9)
  - [x] 1.1 Supprimer les regex `ragreage` et `phonique` de `TASK_PATTERNS` — ne garder que `pose`
  - [x] 1.2 Supprimer le paramètre `keyword` de type union dans `matchTaskName` — la fonction ne matche plus que "pose"
  - [x] 1.3 Pour chaque pièce, les tâches étant déjà triées par `position` (via `useLotsWithTaches`), trouver l'index de la première tâche "pose" dans le tableau
  - [x] 1.4 Nouvelle logique par pièce : toutes les tâches avant cet index → `done` ; toutes les tâches "pose" → `not_started` ; tâches après la dernière "pose" → ignorées
  - [x] 1.5 Un lot est prêt si TOUTES ses pièces satisfont cette condition ET `materiaux_recus === true` ET au moins une tâche "pose" existe dans le lot
  - [x] 1.6 La signature de la fonction et le type de retour `LotPretACarreler[]` restent inchangés — aucun impact sur les consommateurs
  - [x] 1.7 Mettre à jour le JSDoc de la fonction pour refléter la nouvelle logique

- [x] Task 2 — Mettre à jour les tests dans `computeChantierIndicators.test.ts` (AC: #1-#9)
  - [x] 2.1 Modifier `makeLot` : ajouter le champ `position` aux tâches dans le helper (position croissante reflétant l'ordre prérequis → pose → finitions)
  - [x] 2.2 Adapter le test "identifies lot with all ragréage+phonique done and pose not_started" → devient "identifies lot with all pre-pose tasks done and pose not_started"
  - [x] 2.3 Adapter le test "excludes lot where pose is in_progress" — ajouter positions
  - [x] 2.4 Supprimer les tests "excludes lot without ragréage tasks" et "excludes lot without phonique tasks" — plus pertinents
  - [x] 2.5 Conserver le test "excludes lot without pose tasks" — ajouter positions
  - [x] 2.6 Ajouter test : lot prêt SANS prérequis (pose en première position) — AC2
  - [x] 2.7 Ajouter test : prérequis pas terminé bloque le statut — AC3
  - [x] 2.8 Ajouter test : tâches post-pose (joints, nettoyage) sont ignorées — AC7
  - [x] 2.9 Adapter le test accents — ajouter positions
  - [x] 2.10 Conserver le test "Repose" faux positif — ajouter positions
  - [x] 2.11 Conserver les tests : lot vide, pas de pièces, etages null, materiaux_recus — ajouter positions
  - [x] 2.12 Ajouter test : pièces multiples dont une ne satisfait pas la condition → lot exclu

- [x] Task 3 — Vérification bout en bout et régression (AC: #10)
  - [x] 3.1 `npx tsc --noEmit` — 0 erreurs
  - [x] 3.2 `npx vitest run src/lib/utils/computeChantierIndicators.test.ts` — 17 tests passent
  - [x] 3.3 `npx vitest run` — 0 régressions introduites (échecs pré-existants non liés)
  - [x] 3.4 `npx eslint src/lib/utils/computeChantierIndicators.ts` — 0 erreurs

## Dev Notes

### Algorithme par pièce (pseudo-code)

```typescript
// taches déjà triées par position (ascendant) via useLotsWithTaches
function pieceIsReady(taches: TacheInfo[]): boolean {
  const firstPoseIdx = taches.findIndex(t => isPose(t.nom))
  if (firstPoseIdx === -1) return false // pas de tâche pose

  // Toutes les tâches AVANT la première pose → done
  const prePose = taches.slice(0, firstPoseIdx)
  if (!prePose.every(t => t.status === 'done')) return false

  // Toutes les tâches "pose" → not_started
  const poseTaches = taches.filter(t => isPose(t.nom))
  if (!poseTaches.every(t => t.status === 'not_started')) return false

  // Tâches post-pose → ignorées
  return true
}
```

### Points clés

- **Aucun changement de schéma DB** — on exploite le `position` déjà existant
- **Aucun changement de signature** — `findLotsPretsACarreler(lots: LotWithTaches[]): LotPretACarreler[]` reste identique
- **Aucun changement UI** — les composants `ChantierIndicators`, vue Plot dropdown, etc. consomment le même type
- **Suppression de code** — on enlève 2 regex sur 3 et on simplifie `matchTaskName`
- Le seul nom de tâche encore hardcodé est **"pose"**, qui est le concept métier central de l'application

### Risques

1. **Tâches mal ordonnées** : Si un utilisateur crée les tâches dans le désordre (ex: pose avant ragréage), la détection sera faussée. Mitigé par le fait que Youssef confirme que l'ordre est toujours respecté à la création, et que les tâches sont réordonnables via drag & drop (`useReorderTaches`).
2. **Tâche "pose" au milieu d'autres tâches non-pose** : L'algorithme ignore tout ce qui est après la dernière pose. Si une tâche non-pose est intercalée entre deux tâches pose, elle sera correctement traitée comme pré-pose (avant la première pose).

### References

- [Source: src/lib/utils/computeChantierIndicators.ts — Logique actuelle à modifier]
- [Source: src/lib/utils/computeChantierIndicators.test.ts — Tests à adapter]
- [Source: src/lib/queries/useLotsWithTaches.ts — Hook fournissant les données avec tri par position]
- [Source: src/components/ChantierIndicators.tsx — Consommateur principal]
- [Source: src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.tsx — Vue Plot dropdown]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Completion Notes List
- **Task 1**: Réécrit `findLotsPretsACarreler` — supprimé regex ragréage/phonique, gardé uniquement `isPose()`. Logique basée sur position: pré-pose → done, pose → not_started, post-pose → ignoré. Signature `LotPretACarreler[]` inchangée.
- **Task 2**: 17 tests (14 adaptés + 3 nouveaux): pose directe sans prérequis, tâches post-pose ignorées, pièces multiples avec condition non satisfaite.
- **Task 3**: tsc 0 erreurs, eslint 0 erreurs, 17/17 tests passent. Mock data corrigés dans 2 fichiers consommateurs (position + materiaux_recus).

### Change Log
| Date | Change | Reason |
|------|--------|--------|
| 2026-03-03 | Story implemented — all 3 tasks complete | Story 11.4 implementation |

### File List

**Modified:**
- `src/lib/utils/computeChantierIndicators.ts` — Réécriture de `findLotsPretsACarreler` + `isPose()` remplace `matchTaskName` + `TASK_PATTERNS`
- `src/lib/utils/computeChantierIndicators.test.ts` — 17 tests adaptés/ajoutés avec position
- `src/routes/_authenticated/chantiers/$chantierId/index.test.tsx` — Ajout position + materiaux_recus aux mock lotsWithTaches
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.test.tsx` — Ajout position + materiaux_recus aux mock lotsWithTaches
