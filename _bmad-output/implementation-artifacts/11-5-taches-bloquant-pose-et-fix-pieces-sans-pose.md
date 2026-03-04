# Story 11.5: Tâches bloquant/non-bloquant pose & fix pièces sans pose

Status: done
Story ID: 11.5
Story Key: 11-5-taches-bloquant-pose-et-fix-pieces-sans-pose
Epic: 11 — Indicateurs & aide à la décision
Date: 2026-03-04
Dependencies: Story 11.4 (done — logique prêt à carreler basée sur position)

## Story

En tant que chef de chantier utilisant posePilot,
Je veux pouvoir marquer certaines tâches pré-pose comme non-bloquantes pour la pose (ex: "Étanchéité salle de bain"),
Afin que la logique "prêt à carreler" ne soit pas faussée par des tâches qui n'empêchent pas réellement de poser le carrelage.

## Contexte

Actuellement, `findLotsPretsACarreler` exige que **toutes** les tâches positionnées avant "Pose" soient `done` pour qu'un lot soit considéré prêt. Or certaines tâches pré-pose (ex: étanchéité des murs en salle de bain) n'empêchent pas la pose du carrelage au sol. L'utilisateur n'a aucun moyen de distinguer les tâches bloquantes des non-bloquantes.

De plus, un **bug** existe : les pièces sans tâche "pose" sont ignorées (via `continue`), ce qui fait qu'un lot avec 3 pièces peut être marqué "prêt" alors qu'une seule pièce a été vérifiée.

### Approche technique retenue

- **Conserver `task_definitions` en `text[]`** (pas de changement de type) pour minimiser l'impact sur le code existant et sur `task_overrides` (`text[]` sur `variante_pieces`).
- **Ajouter une colonne `task_config jsonb DEFAULT '{}'`** sur `plots` pour stocker la configuration par nom de tâche. Format : `{"Étanchéité salle de bain": {"bloquant_pose": false}}`. Les tâches absentes de `task_config` sont considérées `bloquant_pose: true` par défaut.
- **Ajouter une colonne `bloquant_pose boolean NOT NULL DEFAULT true`** sur `taches` — valeur héritée de `task_config` du plot à la création du lot.
- **Propagation automatique** : quand `task_config` est modifié sur un plot, toutes les tâches existantes de ce plot sont mises à jour (UPDATE taches via jointure lots → pieces → taches).

## Acceptance Criteria (BDD)

### AC1: Toggle bloquant_pose dans la configuration des tâches du plot

**Given** un plot avec des tâches définies dans `task_definitions`
**When** l'utilisateur toggle le switch "bloquant" sur une tâche dans la section "Tâches disponibles"
**Then** `task_config` du plot est mis à jour avec `{nomTâche: {bloquant_pose: false/true}}`
**And** un indicateur visuel distingue les tâches bloquantes des non-bloquantes

### AC2: Héritage de bloquant_pose à la création d'un lot

**Given** un plot avec `task_config` contenant `{"Étanchéité SDB": {"bloquant_pose": false}}`
**When** un nouveau lot est créé via `create_lot_with_inheritance`
**Then** la tâche "Étanchéité SDB" est créée avec `bloquant_pose = false`
**And** les autres tâches sont créées avec `bloquant_pose = true`

### AC3: Propagation automatique aux lots existants

**Given** un plot avec des lots existants contenant la tâche "Étanchéité SDB" avec `bloquant_pose = true`
**When** l'utilisateur modifie `task_config` pour passer "Étanchéité SDB" à `bloquant_pose: false`
**Then** toutes les tâches "Étanchéité SDB" des lots existants de ce plot passent à `bloquant_pose = false`
**And** les tâches dont le status n'est pas concerné ne sont pas modifiées

### AC4: Logique prêt à carreler — tâches non-bloquantes ignorées

**Given** un lot dont une pièce a les tâches : Ragréage (done), Étanchéité SDB (not_started, bloquant_pose=false), Pose (not_started)
**When** la logique `findLotsPretsACarreler` évalue ce lot
**Then** le lot est considéré "prêt à carreler" car la tâche non-bloquante est ignorée

### AC5: Fix bug — toutes les pièces doivent avoir une tâche "pose"

**Given** un lot avec 3 pièces dont seulement 1 a une tâche "pose"
**When** la logique `findLotsPretsACarreler` évalue ce lot
**Then** le lot n'est **pas** considéré prêt à carreler
**And** seuls les lots où **chaque pièce** a au moins une tâche "pose" et satisfait les conditions sont retenus

### AC6: Héritage via add_piece_to_lot

**Given** un plot avec `task_config` configuré
**When** une nouvelle pièce est ajoutée à un lot existant via `add_piece_to_lot`
**Then** les tâches créées héritent correctement de `bloquant_pose` depuis `task_config`

### AC7: Duplication de plot — copie de task_config

**Given** un plot source avec `task_config` configuré
**When** le plot est dupliqué via `duplicate_plot`
**Then** le nouveau plot hérite de `task_config` du plot source
**And** les tâches dupliquées conservent leur valeur `bloquant_pose`

## Tasks / Subtasks

- [x] Task 1 — Migration SQL : colonnes et backfill (AC: #2, #3, #5, #6, #7)
  - [x] 1.1 Ajouter colonne `bloquant_pose boolean NOT NULL DEFAULT true` sur `taches`
  - [x] 1.2 Ajouter colonne `task_config jsonb NOT NULL DEFAULT '{}'` sur `plots`
  - [x] 1.3 Backfill : toutes les tâches existantes → `bloquant_pose = true` (déjà le défaut, rien à faire)
  - [x] 1.4 Mettre à jour `database.ts` : ajouter `task_config` à `plots` Row/Insert/Update et `bloquant_pose` à `taches` si nécessaire

- [x] Task 2 — Migration SQL : MAJ fonctions SQL (AC: #2, #3, #6, #7)
  - [x] 2.1 MAJ `create_lot_with_inheritance` : lire `task_config` et passer `bloquant_pose` lors de l'INSERT des tâches
  - [x] 2.2 MAJ `add_piece_to_lot` : idem, lire `task_config` du plot pour déterminer `bloquant_pose`
  - [x] 2.3 MAJ `duplicate_plot` : copier `task_config` vers le nouveau plot + copier `bloquant_pose` des tâches
  - [x] 2.4 Créer fonction/trigger de propagation : quand `plots.task_config` est modifié, UPDATE toutes les tâches existantes du plot via `lots → pieces → taches` par correspondance de nom

- [x] Task 3 — Frontend : mutation et query (AC: #1, #3, #4)
  - [x] 3.1 Créer mutation `useUpdatePlotTaskConfig` pour mettre à jour `task_config` sur un plot
  - [x] 3.2 Mettre à jour `useLotsWithTaches` : ajouter `bloquant_pose` dans le select des tâches
  - [x] 3.3 Mettre à jour `TacheInfo` interface pour inclure `bloquant_pose: boolean`
  - [x] 3.4 Mettre à jour `usePlots` / `PlotRow` si nécessaire pour exposer `task_config`

- [x] Task 4 — Frontend : fix logique `findLotsPretsACarreler` (AC: #4, #5)
  - [x] 4.1 Fix bug : ne plus `continue` les pièces sans tâche "pose" — exiger que **toutes les pièces** aient au moins une tâche "pose"
  - [x] 4.2 Modifier la vérification pré-pose : ne vérifier `done` que pour les tâches où `bloquant_pose === true`
  - [x] 4.3 Mettre à jour les tests unitaires existants + ajouter cas pour `bloquant_pose` et pièces sans pose

- [x] Task 5 — Frontend : UI toggle bloquant dans la config du plot (AC: #1)
  - [x] 5.1 Ajouter un switch/toggle à côté de chaque tâche dans la section "Tâches disponibles" du plot
  - [x] 5.2 Indicateur visuel : tâches non-bloquantes affichées en style atténué ou avec un badge
  - [x] 5.3 Appeler `useUpdatePlotTaskConfig` au toggle + invalidation du cache `lotsWithTaches`

## Dev Notes

### Structure de `task_config` (jsonb sur plots)

```json
{
  "Étanchéité salle de bain": { "bloquant_pose": false },
  "Nettoyage préalable": { "bloquant_pose": false }
}
```

Les tâches **absentes** de `task_config` sont considérées comme `bloquant_pose: true` (défaut). Cela permet d'avoir un objet minimal : on ne stocke que les exceptions.

### Trigger de propagation

```sql
-- Pseudo-code du trigger AFTER UPDATE sur plots.task_config
FOR each task_name IN (keys of NEW.task_config UNION keys of OLD.task_config):
  UPDATE taches t
  SET bloquant_pose = COALESCE(
    (NEW.task_config->task_name->>'bloquant_pose')::boolean,
    true  -- défaut si la clé est supprimée
  )
  FROM pieces p
  JOIN lots l ON l.id = p.lot_id
  WHERE t.piece_id = p.id
    AND l.plot_id = NEW.id
    AND lower(t.nom) = lower(task_name);
```

### Pourquoi garder `task_definitions` en `text[]`

Changer `task_definitions` de `text[]` vers `jsonb` impacterait :
- `task_overrides` sur `variante_pieces` (aussi `text[]`)
- Tous les SQL qui itèrent avec `FOREACH v_task IN ARRAY`
- Le frontend (SortableTaskList, add/remove task, variante checkboxes)

Ajouter une colonne séparée `task_config` est **additif** et ne casse rien.

### Points clés

- Le backfill est trivial : `DEFAULT true` suffit, pas de migration de données nécessaire
- La propagation est rétroactive : modifier la config du plot met à jour les lots existants immédiatement
- `task_overrides` sur `variante_pieces` continue de fonctionner — il détermine **quelles** tâches existent, `task_config` détermine **si elles bloquent**

### Risques

1. Performance de la propagation : un plot avec beaucoup de lots pourrait engendrer un UPDATE volumineux. Acceptable vu la taille réelle des chantiers (dizaines/centaines de lots, pas des milliers).
2. Correspondance par nom (`lower(t.nom) = lower(task_name)`) : si un utilisateur renomme une tâche dans `task_definitions`, les tâches existantes avec l'ancien nom ne seront plus affectées par la propagation. Acceptable — le renommage de tâche est rare et déjà hors scope.

### Références

- [Source: `src/lib/utils/computeChantierIndicators.ts` — Logique actuelle `findLotsPretsACarreler`]
- [Source: `supabase/migrations/051_multi_file_documents.sql` — Dernière version de `create_lot_with_inheritance`]
- [Source: `supabase/migrations/043_variante_piece_task_overrides.sql` — `task_overrides` et `add_piece_to_lot`]
- [Source: `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.tsx` — UI "Tâches disponibles"]
- [Source: `src/lib/mutations/useUpdatePlotTasks.ts` — Mutation existante pour task_definitions]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Completion Notes List
- Task 1: Migration 055 — colonnes `bloquant_pose` (taches) et `task_config` (plots) ajoutées. Types `database.ts` mis à jour.
- Task 2: Migration 056 — `create_lot_with_inheritance`, `add_piece_to_lot`, `duplicate_plot` mis à jour pour lire `task_config` et propager `bloquant_pose`. Trigger `propagate_task_config` créé.
- Task 3: Nouvelle mutation `useUpdatePlotTaskConfig`. `TacheInfo` et `PlotRow` mis à jour avec `bloquant_pose` et `task_config`. Select query `useLotsWithTaches` étendu.
- Task 4: Bug fix AC5 — `continue` remplacé par `return false` pour les pièces sans pose. AC4 — filtre `bloquant_pose` ajouté dans la vérification pré-pose. 3 nouveaux tests ajoutés (20 total).
- Task 5: Switch toggle ajouté dans "Tâches disponibles" du plot. Tâches non-bloquantes affichées en style atténué avec badge "(non-bloquant)". Mutation + invalidation cache intégrées.
- Tests pré-existants du plot page (29 failures) non liés à cette story — confirmé identique avant/après changements.

### Change Log
| Date | Change | Reason |
|------|--------|--------|
| 2026-03-04 | Story créée | Discussion avec Youssef — 2 problèmes identifiés (tâches non-bloquantes + bug pièces sans pose) |
| 2026-03-04 | Implémentation complète — toutes tâches | Dev Agent Opus 4.6 |
| 2026-03-04 | Code review — 1 HIGH + 3 MEDIUM + 3 LOW trouvés, 4 fixés | Review Opus 4.6 |

### File List
- `supabase/migrations/055_bloquant_pose.sql` (new)
- `supabase/migrations/056_bloquant_pose_functions.sql` (new)
- `src/types/database.ts` (modified)
- `src/lib/mutations/useUpdatePlotTaskConfig.ts` (new)
- `src/lib/queries/useLotsWithTaches.ts` (modified)
- `src/lib/queries/useLotsWithTaches.test.ts` (modified)
- `src/lib/queries/usePlots.ts` (modified)
- `src/lib/queries/usePlots.test.ts` (modified)
- `src/lib/utils/computeChantierIndicators.ts` (modified)
- `src/lib/utils/computeChantierIndicators.test.ts` (modified)
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.tsx` (modified)
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.test.tsx` (modified)
