# Story 8.2: Ordonnancement des tâches avec drag-and-drop

Status: dev-complete

## Story

En tant que utilisateur de posePilot sur un chantier,
Je veux ordonner les tâches par drag-and-drop au niveau du plot (définitions) et au niveau de chaque pièce (tâches réelles),
Afin que les tâches soient présentées dans l'ordre logique d'exécution sur le terrain, tout en pouvant valider n'importe quelle tâche indépendamment.

## Acceptance Criteria

1. **Given** l'utilisateur consulte la section "Tâches disponibles" d'un plot **When** il maintient appuyé l'icône grip d'une tâche et la glisse vers une autre position **Then** l'ordre des task_definitions est mis à jour et persisté

2. **Given** l'utilisateur réordonne les task_definitions d'un plot **When** il relâche l'élément **Then** le nouvel ordre est sauvegardé immédiatement via la mutation existante `useUpdatePlotTasks`

3. **Given** l'utilisateur consulte les tâches d'une pièce **When** il maintient appuyé l'icône grip d'une tâche et la glisse **Then** l'ordre des tâches est mis à jour visuellement et persisté en base

4. **Given** les tâches d'une pièce ont été réordonnées **When** l'utilisateur recharge la page **Then** les tâches apparaissent dans le même ordre (persisté via champ `position`)

5. **Given** un lot est créé via `create_lot_with_inheritance` **When** les tâches sont générées depuis les task_definitions du plot **Then** chaque tâche reçoit une `position` correspondant à l'index de sa task_definition dans le tableau

6. **Given** un plot est dupliqué via `duplicate_plot` **When** les tâches sont copiées **Then** la `position` originale de chaque tâche est préservée

7. **Given** l'utilisateur ajoute une nouvelle tâche manuellement sur une pièce **When** la tâche est créée **Then** elle reçoit une `position` égale à max(position) + 1 (ajoutée en dernier)

8. **Given** les tâches sont affichées au niveau lot (vue `useLotsWithTaches`) **When** l'utilisateur consulte les tâches **Then** elles sont triées par `position` ASC (même ordre que dans la pièce)

9. **Given** les tâches ont un ordre défini **When** l'utilisateur change le statut d'une tâche (tap cycle) **Then** le changement s'applique à la tâche ciblée sans contrainte séquentielle (on peut valider la 3ème sans valider la 1ère)

## Tasks / Subtasks

- [x] Task 1 — Migration SQL : ajout colonne `position` sur `taches` + mise à jour fonctions (AC: #4, #5, #6, #7)
  - [x] 1.1 Créer `supabase/migrations/025_task_ordering.sql`
  - [x] 1.2 Ajouter colonne `position integer NOT NULL DEFAULT 0` sur `taches`
  - [x] 1.3 Remplir `position` pour les tâches existantes : `ROW_NUMBER() OVER (PARTITION BY piece_id ORDER BY created_at) - 1`
  - [x] 1.4 Mettre à jour `create_lot_with_inheritance` : ajouter un compteur `v_task_position` incrémenté dans la boucle FOREACH, inséré comme `position`
  - [x] 1.5 Mettre à jour `duplicate_plot` : copier la `position` de la tâche source au lieu de la réinitialiser
  - [x] 1.6 Créer fonction RPC `reorder_taches(p_tache_ids uuid[])` : met à jour la position de chaque tâche selon son index dans le tableau

- [x] Task 2 — Type TypeScript : colonne `position` + RPC `reorder_taches` (AC: #3, #4)
  - [x] 2.1 Ajouter `position: number` dans le type `taches` Row/Insert/Update de `database.ts`
  - [x] 2.2 Ajouter la signature RPC `reorder_taches` dans Functions

- [x] Task 3 — Installer @dnd-kit (AC: #1, #3)
  - [x] 3.1 `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities` (+ `@dnd-kit/modifiers` — package séparé requis)

- [x] Task 4 — Mutation hook : useReorderTaches (AC: #3, #4)
  - [x] 4.1 Créer `src/lib/mutations/useReorderTaches.ts`
  - [x] 4.2 Input : `{ tacheIds: string[], lotId: string, pieceId: string }` — pieceId ajouté pour cibler la bonne pièce dans le cache
  - [x] 4.3 mutationFn : `supabase.rpc('reorder_taches', { p_tache_ids: tacheIds })`
  - [x] 4.4 Optimistic update : réordonner les tâches dans le cache `['pieces', lotId]`
  - [x] 4.5 onSettled : invalider `['pieces', lotId]`
  - [x] 4.6 Créer `src/lib/mutations/useReorderTaches.test.ts` (3 tests : params RPC, optimistic update, rollback erreur)

- [x] Task 5 — Mise à jour queries : tri par `position` (AC: #4, #8)
  - [x] 5.1 `usePieces.ts` : ajouter `.order('position', { ascending: true, referencedTable: 'taches' })` sur la relation
  - [x] 5.2 `useLotsWithTaches.ts` : tri côté client `piece.taches.sort((a, b) => a.position - b.position)` (PostgREST ne supporte pas `.order()` sur relations 2ème niveau)
  - [x] 5.3 `useAddLotTask.ts` : dans l'optimistic update, assigner `position: piece.taches.length` à la nouvelle tâche

- [x] Task 6 — Composant SortableTaskList : drag-and-drop réutilisable (AC: #1, #3, #9)
  - [x] 6.1 Créer `src/components/SortableTaskList.tsx`
  - [x] 6.2 Props génériques : `items: T[]`, `onReorder: (items: T[]) => void`, `renderItem: (item: T, dragAttributes, dragListeners) => ReactNode`, `keyExtractor: (item: T) => string`
  - [x] 6.3 Utiliser `DndContext` + `SortableContext` + `verticalListSortingStrategy`
  - [x] 6.4 Sensors : `useSensor(PointerSensor, { activationConstraint: { distance: 8 } })` + `useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })`
  - [x] 6.5 Sortable items via `useSortable` hook

- [x] Task 7 — UI plot : drag-and-drop sur task_definitions (AC: #1, #2)
  - [x] 7.1 Modifier `plots.$plotId/index.tsx` — section "Tâches disponibles"
  - [x] 7.2 Remplacer la liste statique par `SortableTaskList`
  - [x] 7.3 L'icône `GripVertical` devient le vrai drag handle (via `...attributes`, `...listeners`)
  - [x] 7.4 onReorder : appeler `useUpdatePlotTasks.mutate({ plotId, chantierId, taskDefinitions: newOrder })`
  - [x] 7.5 Chaque item garde son bouton de suppression (X)

- [x] Task 8 — UI pièce : drag-and-drop sur tâches réelles (AC: #3, #9)
  - [x] 8.1 Modifier `$pieceId.tsx` — section "Tâches"
  - [x] 8.2 Ajouter `GripVertical` comme drag handle devant chaque tâche
  - [x] 8.3 Wrapper la liste avec `SortableTaskList`
  - [x] 8.4 onReorder : appeler `useReorderTaches.mutate({ tacheIds: newOrder.map(t => t.id), lotId, pieceId })`
  - [x] 8.5 Le `TapCycleButton` reste fonctionnel (pas de conflit avec le drag)

- [x] Task 9 — Tests de régression (AC: #1-9)
  - [x] 9.1 `npm run test` — 0 nouvelles régressions (1 échec pré-existant : useDeleteLivraison)
  - [x] 9.2 `npm run lint` — 0 nouvelles erreurs
  - [x] 9.3 `tsc --noEmit` — 0 erreurs ; `tsc -b` — 0 nouvelles erreurs (155 pré-existantes, aucune dans les fichiers story 8.2)

## Dev Notes

### Vue d'ensemble — Stratégie d'implémentation

Cette story est la **2ème de l'Epic 8** (Améliorations de productivité) et ajoute le **drag-and-drop pour ordonner les tâches** à deux niveaux :
- **Plot** : réordonner les `task_definitions` (tableau `text[]` — l'ordre est implicite par l'index)
- **Pièce** : réordonner les `taches` réelles (nouvelle colonne `position integer`)

**Scope précis :**
- Migration : colonne `position` + backfill + mise à jour des 2 fonctions RPC existantes + nouvelle RPC `reorder_taches`
- Lib DnD : `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`
- Composant réutilisable `SortableTaskList`
- Intégration dans la page plot (task_definitions) et la page pièce (taches)
- Mutation `useReorderTaches` avec optimistic update

**Hors scope :**
- Contrainte d'ordre de validation (les tâches restent validables dans n'importe quel ordre)
- Drag-and-drop au niveau lot (les tâches s'affichent en lecture seule dans `useLotsWithTaches`)
- Réordonnancement des pièces (hors demande)

**Complexité : MOYENNE** — Le gros du travail est dans la mise en place de @dnd-kit + sensors tactiles. La migration est simple (une colonne + backfill).

### Ce qui existe déjà (à réutiliser, NE PAS recréer)

| Élément | Fichier | Notes |
|---------|---------|-------|
| `useUpdatePlotTasks` | `src/lib/mutations/useUpdatePlotTasks.ts` | Mutation existante qui prend `taskDefinitions: string[]` — réutiliser tel quel pour le reorder au niveau plot |
| `useUpdateTaskStatus` | `src/lib/mutations/useUpdateTaskStatus.ts` | Mutation statut tâche — ne pas modifier, doit coexister avec le drag |
| `useAddLotTask` | `src/lib/mutations/useAddLotTask.ts` | Ajout tâche — doit assigner `position` dans l'optimistic update |
| `usePieces` | `src/lib/queries/usePieces.ts` | Query pièces+tâches — ajouter tri par `position` |
| `useLotsWithTaches` | `src/lib/queries/useLotsWithTaches.ts` | Query lots — ajouter tri par `position` (lecture seule, pas de drag ici) |
| `GripVertical` | `lucide-react` | Icône déjà utilisée (décorative) dans la page plot — la rendre fonctionnelle |
| `TapCycleButton` | `src/components/TapCycleButton.tsx` | Bouton cycle statut — doit rester cliquable sans déclencher le drag |
| `create_lot_with_inheritance` | `supabase/migrations/007_lots.sql` | Fonction RPC — à modifier pour insérer `position` |
| `duplicate_plot` | `supabase/migrations/024_duplicate_plot.sql` | Fonction RPC — à modifier pour copier `position` |
| Page plot détail | `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.tsx` | Section "Tâches disponibles" ligne ~541 |
| Page pièce | `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/$pieceId.tsx` | Section "Tâches" ligne ~340 |

### Migration SQL : 025_task_ordering.sql

```sql
-- Story 8.2 : Ordonnancement des tâches avec drag-and-drop
-- Ajout colonne position + backfill + RPC reorder + MAJ fonctions existantes

-- 1. Ajout colonne position
ALTER TABLE public.taches ADD COLUMN position integer NOT NULL DEFAULT 0;

-- 2. Backfill : position basée sur l'ordre de création
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY piece_id ORDER BY created_at) - 1 AS pos
  FROM public.taches
)
UPDATE public.taches t
SET position = r.pos
FROM ranked r
WHERE t.id = r.id;

-- 3. Index pour le tri par position
CREATE INDEX idx_taches_position ON public.taches(piece_id, position);

-- 4. RPC : réordonner les tâches d'une pièce
-- Reçoit un tableau d'IDs dans le nouvel ordre, met à jour position = index
CREATE OR REPLACE FUNCTION public.reorder_taches(p_tache_ids uuid[])
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_id uuid;
  v_pos integer := 0;
BEGIN
  FOREACH v_id IN ARRAY p_tache_ids
  LOOP
    UPDATE public.taches SET position = v_pos WHERE id = v_id;
    v_pos := v_pos + 1;
  END LOOP;
END;
$$;

-- 5. MAJ create_lot_with_inheritance : ajouter position aux tâches
CREATE OR REPLACE FUNCTION public.create_lot_with_inheritance(
  p_code text,
  p_variante_id uuid,
  p_etage_nom text,
  p_plot_id uuid
) RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_etage_id uuid;
  v_lot_id uuid;
  v_piece_id uuid;
  v_variante_piece RECORD;
  v_task text;
  v_variante_doc RECORD;
  v_task_definitions text[];
  v_task_position integer;
BEGIN
  -- 1. Get or create étage
  SELECT id INTO v_etage_id
  FROM public.etages
  WHERE plot_id = p_plot_id AND lower(nom) = lower(p_etage_nom);

  IF v_etage_id IS NULL THEN
    INSERT INTO public.etages (plot_id, nom)
    VALUES (p_plot_id, p_etage_nom)
    RETURNING id INTO v_etage_id;
  END IF;

  -- 2. Create lot
  INSERT INTO public.lots (etage_id, variante_id, plot_id, code)
  VALUES (v_etage_id, p_variante_id, p_plot_id, p_code)
  RETURNING id INTO v_lot_id;

  -- 3. Get task definitions from plot
  SELECT task_definitions INTO v_task_definitions
  FROM public.plots WHERE id = p_plot_id;

  -- 4. Copy variante_pieces → pieces + create taches with position
  FOR v_variante_piece IN
    SELECT nom FROM public.variante_pieces
    WHERE variante_id = p_variante_id
    ORDER BY created_at ASC
  LOOP
    INSERT INTO public.pieces (lot_id, nom)
    VALUES (v_lot_id, v_variante_piece.nom)
    RETURNING id INTO v_piece_id;

    v_task_position := 0;
    FOREACH v_task IN ARRAY COALESCE(v_task_definitions, '{}')
    LOOP
      INSERT INTO public.taches (piece_id, nom, status, position)
      VALUES (v_piece_id, v_task, 'not_started', v_task_position);
      v_task_position := v_task_position + 1;
    END LOOP;
  END LOOP;

  -- 5. Copy variante_documents → lot_documents
  FOR v_variante_doc IN
    SELECT nom, is_required FROM public.variante_documents
    WHERE variante_id = p_variante_id
    ORDER BY created_at ASC
  LOOP
    INSERT INTO public.lot_documents (lot_id, nom, is_required)
    VALUES (v_lot_id, v_variante_doc.nom, v_variante_doc.is_required);
  END LOOP;

  RETURN v_lot_id;
END;
$$;

-- 6. MAJ duplicate_plot : copier la position des tâches
CREATE OR REPLACE FUNCTION public.duplicate_plot(
  p_source_plot_id uuid,
  p_new_plot_nom text
) RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_source_plot RECORD;
  v_new_plot_id uuid;
  v_variante RECORD;
  v_new_variante_id uuid;
  v_variante_map jsonb := '{}';
  v_vp RECORD;
  v_vd RECORD;
  v_etage RECORD;
  v_new_etage_id uuid;
  v_etage_map jsonb := '{}';
  v_lot RECORD;
  v_new_lot_id uuid;
  v_piece RECORD;
  v_new_piece_id uuid;
  v_tache RECORD;
  v_lot_doc RECORD;
BEGIN
  SELECT * INTO v_source_plot FROM public.plots WHERE id = p_source_plot_id;
  IF v_source_plot IS NULL THEN
    RAISE EXCEPTION 'Plot source introuvable: %', p_source_plot_id;
  END IF;

  INSERT INTO public.plots (chantier_id, nom, task_definitions)
  VALUES (v_source_plot.chantier_id, p_new_plot_nom, v_source_plot.task_definitions)
  RETURNING id INTO v_new_plot_id;

  FOR v_variante IN
    SELECT * FROM public.variantes WHERE plot_id = p_source_plot_id ORDER BY created_at
  LOOP
    INSERT INTO public.variantes (plot_id, nom)
    VALUES (v_new_plot_id, v_variante.nom)
    RETURNING id INTO v_new_variante_id;

    v_variante_map := v_variante_map || jsonb_build_object(v_variante.id::text, v_new_variante_id::text);

    FOR v_vp IN
      SELECT * FROM public.variante_pieces WHERE variante_id = v_variante.id ORDER BY created_at
    LOOP
      INSERT INTO public.variante_pieces (variante_id, nom)
      VALUES (v_new_variante_id, v_vp.nom);
    END LOOP;

    FOR v_vd IN
      SELECT * FROM public.variante_documents WHERE variante_id = v_variante.id ORDER BY created_at
    LOOP
      INSERT INTO public.variante_documents (variante_id, nom, is_required)
      VALUES (v_new_variante_id, v_vd.nom, v_vd.is_required);
    END LOOP;
  END LOOP;

  FOR v_etage IN
    SELECT * FROM public.etages WHERE plot_id = p_source_plot_id ORDER BY created_at
  LOOP
    INSERT INTO public.etages (plot_id, nom)
    VALUES (v_new_plot_id, v_etage.nom)
    RETURNING id INTO v_new_etage_id;

    v_etage_map := v_etage_map || jsonb_build_object(v_etage.id::text, v_new_etage_id::text);
  END LOOP;

  FOR v_lot IN
    SELECT * FROM public.lots WHERE plot_id = p_source_plot_id ORDER BY created_at
  LOOP
    INSERT INTO public.lots (etage_id, variante_id, plot_id, code, is_tma, plinth_status)
    VALUES (
      (v_etage_map->>v_lot.etage_id::text)::uuid,
      (v_variante_map->>v_lot.variante_id::text)::uuid,
      v_new_plot_id,
      v_lot.code,
      v_lot.is_tma,
      v_lot.plinth_status
    )
    RETURNING id INTO v_new_lot_id;

    FOR v_piece IN
      SELECT * FROM public.pieces WHERE lot_id = v_lot.id ORDER BY created_at
    LOOP
      INSERT INTO public.pieces (lot_id, nom, metrage_m2, metrage_ml)
      VALUES (v_new_lot_id, v_piece.nom, v_piece.metrage_m2, v_piece.metrage_ml)
      RETURNING id INTO v_new_piece_id;

      -- Copier les tâches AVEC la position
      FOR v_tache IN
        SELECT * FROM public.taches WHERE piece_id = v_piece.id ORDER BY position
      LOOP
        INSERT INTO public.taches (piece_id, nom, status, position)
        VALUES (v_new_piece_id, v_tache.nom, 'not_started', v_tache.position);
      END LOOP;
    END LOOP;

    FOR v_lot_doc IN
      SELECT * FROM public.lot_documents WHERE lot_id = v_lot.id ORDER BY created_at
    LOOP
      INSERT INTO public.lot_documents (lot_id, nom, is_required)
      VALUES (v_new_lot_id, v_lot_doc.nom, v_lot_doc.is_required);
    END LOOP;
  END LOOP;

  RETURN v_new_plot_id;
END;
$$;
```

**Points clés migration :**
- `position` est `NOT NULL DEFAULT 0` — backward-compatible pour les tâches existantes
- Backfill via `ROW_NUMBER() OVER (PARTITION BY piece_id ORDER BY created_at)` — préserve l'ordre actuel
- Index `(piece_id, position)` pour des tris efficaces
- `reorder_taches` prend un `uuid[]` — l'index dans le tableau = nouvelle position (simple et atomique)
- `create_lot_with_inheritance` : compteur `v_task_position` incrémenté dans la boucle FOREACH (position = index dans task_definitions)
- `duplicate_plot` : copie `v_tache.position` au lieu d'ignorer — préserve l'ordre personnalisé

### Type TypeScript : colonne position + RPC

```typescript
// Dans database.ts → Tables → taches
// Row — ajouter :
position: number

// Insert — ajouter :
position?: number  // DEFAULT 0 côté DB

// Update — ajouter :
position?: number

// Dans database.ts → Functions — ajouter :
reorder_taches: {
  Args: {
    p_tache_ids: string[]
  }
  Returns: undefined
}
```

### Mutation : useReorderTaches

```typescript
// src/lib/mutations/useReorderTaches.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { PieceWithTaches } from '@/lib/queries/usePieces'

export function useReorderTaches() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ tacheIds }: { tacheIds: string[]; lotId: string; pieceId: string }) => {
      const { error } = await supabase.rpc('reorder_taches', {
        p_tache_ids: tacheIds,
      })
      if (error) throw error
    },
    onMutate: async ({ tacheIds, lotId, pieceId }) => {
      await queryClient.cancelQueries({ queryKey: ['pieces', lotId] })
      const previous = queryClient.getQueryData<PieceWithTaches[]>(['pieces', lotId])
      queryClient.setQueryData<PieceWithTaches[]>(
        ['pieces', lotId],
        (old) =>
          (old ?? []).map((piece) => {
            if (piece.id !== pieceId) return piece
            // Réordonner les tâches selon tacheIds
            const tacheMap = new Map(piece.taches.map((t) => [t.id, t]))
            const reordered = tacheIds
              .map((id, index) => {
                const tache = tacheMap.get(id)
                return tache ? { ...tache, position: index } : null
              })
              .filter(Boolean)
            return { ...piece, taches: reordered }
          }),
      )
      return { previous }
    },
    onError: (_err, { lotId }, context) => {
      queryClient.setQueryData(['pieces', lotId], context?.previous)
    },
    onSettled: (_data, _err, { lotId }) => {
      queryClient.invalidateQueries({ queryKey: ['pieces', lotId] })
    },
  })
}
```

**Points clés mutation :**
- Optimistic update : réordonne les tâches dans le cache en place, assigne `position: index`
- `pieceId` permet de cibler la bonne pièce dans le cache `['pieces', lotId]`
- Rollback via `previous` snapshot en cas d'erreur

### Mise à jour usePieces : tri par position

```typescript
// src/lib/queries/usePieces.ts — modifier la query
queryFn: async () => {
  const { data, error } = await supabase
    .from('pieces')
    .select('*, taches(*)')
    .eq('lot_id', lotId)
    .order('created_at', { ascending: true })
    .order('position', { ascending: true, referencedTable: 'taches' })  // ← AJOUTER
  if (error) throw error
  return data as unknown as PieceWithTaches[]
},
```

### Mise à jour useAddLotTask : position dans l'optimistic update

```typescript
// Dans l'optimistic update de useAddLotTask, ajouter position :
{
  id: crypto.randomUUID(),
  piece_id: pieceId,
  nom,
  status: 'not_started' as const,
  position: piece.taches.length,  // ← AJOUTER (dernière position)
  created_at: new Date().toISOString(),
}
```

### Composant SortableTaskList

```tsx
// src/components/SortableTaskList.tsx
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core'
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers'

interface SortableTaskListProps<T> {
  items: T[]
  keyExtractor: (item: T) => string
  onReorder: (reorderedItems: T[]) => void
  renderItem: (
    item: T,
    dragHandleProps: { attributes: Record<string, unknown>; listeners: Record<string, unknown> },
  ) => React.ReactNode
}

// SortableItem wrapper interne
function SortableItem<T>({ id, item, renderItem }: { ... }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  return (
    <div ref={setNodeRef} style={style}>
      {renderItem(item, { attributes, listeners })}
    </div>
  )
}

export function SortableTaskList<T>({ items, keyExtractor, onReorder, renderItem }: SortableTaskListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((item) => keyExtractor(item) === active.id)
    const newIndex = items.findIndex((item) => keyExtractor(item) === over.id)
    const reordered = arrayMove(items, oldIndex, newIndex)
    onReorder(reordered)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
    >
      <SortableContext items={items.map(keyExtractor)} strategy={verticalListSortingStrategy}>
        {items.map((item) => (
          <SortableItem
            key={keyExtractor(item)}
            id={keyExtractor(item)}
            item={item}
            renderItem={renderItem}
          />
        ))}
      </SortableContext>
    </DndContext>
  )
}
```

**Points clés composant :**
- `PointerSensor` avec `distance: 8` — empêche les faux déclenchements lors d'un tap/clic normal
- `TouchSensor` avec `delay: 200ms` — le long-press distingue le drag du scroll sur mobile
- `restrictToVerticalAxis` + `restrictToParentElement` — empêche le drag horizontal et hors zone
- Composant générique `<T>` : réutilisé au niveau plot (string[]) et pièce (TacheRow[])

### UI plot — Intégration drag-and-drop

**Remplacement dans `plots.$plotId/index.tsx` :**

```tsx
// AVANT (statique)
{plot.task_definitions.map((task, index) => (
  <div key={`${task}-${index}`} className="flex items-center gap-3 px-3 py-2.5">
    <GripVertical className="size-4 text-muted-foreground shrink-0" />
    <span className="flex-1 text-sm text-foreground">{task}</span>
    <Button variant="ghost" size="icon" ... onClick={() => handleRemoveTask(index)}>
      <X className="size-4" />
    </Button>
  </div>
))}

// APRÈS (drag-and-drop)
<SortableTaskList
  items={plot.task_definitions.map((task, index) => ({ task, index }))}
  keyExtractor={(item) => `${item.task}-${item.index}`}
  onReorder={(reordered) => {
    updatePlotTasks.mutate({
      plotId, chantierId,
      taskDefinitions: reordered.map((item) => item.task),
    })
  }}
  renderItem={(item, { attributes, listeners }) => (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <button type="button" {...attributes} {...listeners} className="touch-none">
        <GripVertical className="size-4 text-muted-foreground shrink-0 cursor-grab" />
      </button>
      <span className="flex-1 text-sm text-foreground">{item.task}</span>
      <Button variant="ghost" size="icon" className="size-7"
        onClick={() => handleRemoveTask(
          plot.task_definitions.indexOf(item.task)
        )}
        aria-label={`Supprimer ${item.task}`}
      >
        <X className="size-4" />
      </Button>
    </div>
  )}
/>
```

### UI pièce — Intégration drag-and-drop

**Remplacement dans `$pieceId.tsx` :**

```tsx
// AVANT (statique)
{piece.taches.map((tache) => (
  <div key={tache.id} className="flex items-center justify-between px-3 py-2.5">
    <span className="text-sm text-foreground">{tache.nom}</span>
    <TapCycleButton status={tache.status} onCycle={(newStatus) => ...} />
  </div>
))}

// APRÈS (drag-and-drop)
<SortableTaskList
  items={piece.taches}
  keyExtractor={(t) => t.id}
  onReorder={(reordered) => {
    reorderTaches.mutate({
      tacheIds: reordered.map((t) => t.id),
      lotId,
      pieceId,
    })
  }}
  renderItem={(tache, { attributes, listeners }) => (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <button type="button" {...attributes} {...listeners} className="touch-none">
        <GripVertical className="size-4 text-muted-foreground shrink-0 cursor-grab" />
      </button>
      <span className="flex-1 text-sm text-foreground">{tache.nom}</span>
      <TapCycleButton
        status={tache.status as TaskStatus}
        onCycle={(newStatus) =>
          updateTaskStatus.mutate({ tacheId: tache.id, status: newStatus, lotId })
        }
      />
    </div>
  )}
/>
```

**Points clés UI :**
- Le `GripVertical` est wrappé dans un `<button>` avec `touch-none` (empêche le scroll pendant le drag sur mobile)
- `cursor-grab` pour le feedback visuel
- Le `TapCycleButton` n'est PAS dans la zone de drag (pas de conflit touch)

### Composants shadcn/ui à installer

Aucun — tout est déjà installé. Seul ajout externe : `@dnd-kit`.

### Conventions de nommage

| Type | Convention | Exemple |
|------|-----------|---------|
| Colonne DB | snake_case | `position` |
| Migration | `NNN_description.sql` | `025_task_ordering.sql` |
| Composant | PascalCase | `SortableTaskList` |
| Mutation hook | `use` + PascalCase | `useReorderTaches` |
| RPC | snake_case | `reorder_taches` |
| Query key | `['entity', filterId]` | `['pieces', lotId]` |

### Project Structure Notes

**Nouveaux fichiers (3) :**
- `supabase/migrations/025_task_ordering.sql`
- `src/lib/mutations/useReorderTaches.ts`
- `src/lib/mutations/useReorderTaches.test.ts`
- `src/components/SortableTaskList.tsx`

**Fichiers modifiés (5) :**
- `src/types/database.ts` — colonne `position` + RPC `reorder_taches`
- `src/lib/queries/usePieces.ts` — tri par `position`
- `src/lib/queries/useLotsWithTaches.ts` — tri par `position`
- `src/lib/mutations/useAddLotTask.ts` — `position` dans l'optimistic update
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.tsx` — SortableTaskList pour task_definitions
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/$pieceId.tsx` — SortableTaskList pour tâches
- `package.json` — ajout `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`

**Fichiers NON touchés :**
- `useUpdatePlotTasks.ts` — réutilisé tel quel (prend déjà `taskDefinitions: string[]`)
- `useUpdateTaskStatus.ts` — inchangé
- `TapCycleButton.tsx` — inchangé
- Triggers d'agrégation — `position` n'affecte pas le calcul de progress

### Attention — Pièges courants

1. **Touch vs drag sur mobile** : Sans `TouchSensor` avec delay, le drag intercepte le scroll. Le `delay: 200ms` oblige un long-press avant de drag, laissant le scroll fonctionner normalement.

2. **`touch-none` sur le handle** : Le CSS `touch-action: none` DOIT être sur le drag handle, pas sur tout l'item, sinon le scroll de la page sera bloqué quand le doigt est sur un item de la liste.

3. **Conflit TapCycleButton / drag** : Le `TapCycleButton` est un tap simple. Le drag nécessite un maintien (200ms) OU un déplacement de 8px. Pas de conflit car les actions sont spatialement et temporellement différenciées.

4. **`arrayMove` vs splice** : Utiliser `arrayMove` de `@dnd-kit/sortable` et non un splice manuel — il retourne un nouveau tableau (immutabilité).

5. **Key stability pour task_definitions** : Les task_definitions sont des strings (pas d'ID). Utiliser `${task}-${index}` comme key. Attention : deux tâches avec le même nom créeront un conflit de key — le `index` résout ça.

6. **`position` DEFAULT 0 en DB** : Toutes les tâches existantes auront `position = 0` après la migration si le backfill rate. Le `WITH ranked AS` doit couvrir TOUTES les tâches. Vérifier que le backfill est exécuté APRÈS l'`ALTER TABLE`.

7. **Ordre dans `useLotsWithTaches`** : Supabase PostgREST ne supporte pas facilement `.order()` sur des relations imbriquées au 2ème niveau (lots → pieces → taches). Solution : trier côté client `pieces.forEach(p => p.taches.sort((a, b) => a.position - b.position))` après le fetch.

8. **`@dnd-kit/modifiers`** : Le package `@dnd-kit/modifiers` est un peer dependency optionnel. Vérifier s'il est inclus dans `@dnd-kit/core` ou s'il faut l'installer séparément. Si non disponible, implémenter le restrict manuellement ou l'omettre (le drag vertical est garanti par `verticalListSortingStrategy`).

9. **Optimistic update useReorderTaches** : Le `filter(Boolean)` après le `map` peut faire disparaître une tâche si elle n'est pas dans le `tacheIds` array. S'assurer que TOUS les IDs de la pièce sont passés, pas seulement ceux qui ont bougé.

10. **`position` dans l'insert de `useAddLotTask`** : Côté DB, le `DEFAULT 0` sera utilisé. Mais côté optimistic update, il faut assigner `position: piece.taches.length` pour que la tâche apparaisse en dernier dans la liste triée.

### Testing Patterns

**useReorderTaches.test.ts (3 tests) :**
```typescript
// 1. Appelle supabase.rpc('reorder_taches') avec les bons paramètres
// Mock : supabase.rpc.mockResolvedValue({ data: undefined, error: null })
// Vérifier : rpc('reorder_taches', { p_tache_ids: ['id-1', 'id-2', 'id-3'] })

// 2. Optimistic update réordonne les tâches dans le cache
// Setup : queryClient avec données pré-existantes ['pieces', lotId]
// Mutate : { tacheIds: ['id-3', 'id-1', 'id-2'], lotId, pieceId }
// Vérifier : cache mis à jour avec tâches dans le nouvel ordre

// 3. Rollback en cas d'erreur
// Mock : supabase.rpc.mockResolvedValue({ data: null, error: { message: 'fail' } })
// Vérifier : cache restauré à l'état précédent
```

**Mock patterns :**
```typescript
vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}))
```

### Learnings des stories précédentes

- **Story 2.1** : `useUpdatePlotTasks` pattern — prend `taskDefinitions: string[]`, optimistic update sur `['plots', chantierId]`. Réutiliser tel quel pour le reorder au niveau plot.
- **Story 3.2** : `TapCycleButton` — tap cycle indépendant du contexte. Le composant n'a aucune notion d'ordre — compatible avec le drag.
- **Story 8.1** : `duplicate_plot` — boucle `FOR v_tache IN SELECT * FROM public.taches WHERE piece_id = v_piece.id ORDER BY created_at`. Changer le ORDER BY en `position` et copier la valeur.
- **Story 2.4** : `create_lot_with_inheritance` — boucle `FOREACH v_task IN ARRAY`. L'index de la boucle = position naturelle des task_definitions.

### References

- [Source: src/lib/mutations/useUpdatePlotTasks.ts — Mutation existante pour task_definitions]
- [Source: src/lib/mutations/useAddLotTask.ts — Pattern ajout tâche avec optimistic update]
- [Source: src/lib/mutations/useUpdateTaskStatus.ts — Pattern update statut avec optimistic update]
- [Source: src/lib/queries/usePieces.ts — Query pièces + tâches, tri par created_at]
- [Source: src/lib/queries/useLotsWithTaches.ts — Query lots avec tâches imbriquées]
- [Source: supabase/migrations/007_lots.sql — Tables taches + create_lot_with_inheritance]
- [Source: supabase/migrations/024_duplicate_plot.sql — Fonction duplicate_plot]
- [Source: src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.tsx:541-571 — Section "Tâches disponibles" avec GripVertical décoratif]
- [Source: src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/$pieceId.tsx:340-369 — Section "Tâches" avec TapCycleButton]
- [Source: @dnd-kit docs — DndContext, SortableContext, useSortable, sensors]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- `SortableTaskList.tsx:51` — `DraggableAttributes` cast error. Fix: changed `Record<string, unknown>` to `Record<string, any>` with eslint-disable for the type alias.
- `useReorderTaches.ts:10` — `supabase.rpc()` args type resolved as `undefined` due to `Returns: undefined` in Functions type. Fix: `as never` cast on args (same pattern as other pre-existing RPC workarounds).
- `@dnd-kit/modifiers` — Not bundled with `@dnd-kit/core`. Required separate `npm install`.

### Completion Notes List

- 9 tasks, 9 completed. 3 new tests (useReorderTaches), all passing.
- `useLotsWithTaches` : tri par position fait côté client car PostgREST ne supporte pas `.order()` sur relations imbriquées 2ème niveau.
- `useReorderTaches` prend `pieceId` en plus de `lotId` pour cibler la bonne pièce dans l'optimistic update du cache.
- `@dnd-kit/modifiers` installé en plus des 3 packages prévus (`restrictToVerticalAxis`, `restrictToParentElement`).

### File List

**Nouveaux fichiers (4) :**
- `supabase/migrations/025_task_ordering.sql`
- `src/lib/mutations/useReorderTaches.ts`
- `src/lib/mutations/useReorderTaches.test.ts`
- `src/components/SortableTaskList.tsx`

**Fichiers modifiés (6) :**
- `src/types/database.ts` — taches table + reorder_taches RPC
- `src/lib/queries/usePieces.ts` — `.order('position')` sur taches
- `src/lib/queries/useLotsWithTaches.ts` — `position` dans TacheInfo + tri client-side
- `src/lib/mutations/useAddLotTask.ts` — `position: piece.taches.length` dans optimistic update
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/index.tsx` — SortableTaskList pour task_definitions
- `src/routes/_authenticated/chantiers/$chantierId/plots.$plotId/$etageId/$lotId/$pieceId.tsx` — SortableTaskList pour tâches + GripVertical + useReorderTaches

**Dépendances ajoutées (4) :**
- `@dnd-kit/core`
- `@dnd-kit/sortable`
- `@dnd-kit/utilities`
- `@dnd-kit/modifiers`

### Change Log

- Task 1: Migration SQL créée — colonne `position`, backfill, index, RPC `reorder_taches`, MAJ `create_lot_with_inheritance` + `duplicate_plot`
- Task 2: Types database.ts — table `taches` explicite avec `position`, RPC `reorder_taches` dans Functions
- Task 3: Installé `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` + `@dnd-kit/modifiers`
- Task 4: Mutation `useReorderTaches` avec optimistic update + 3 tests (params, optimistic, rollback)
- Task 5: `usePieces` tri par position, `useLotsWithTaches` tri client-side, `useAddLotTask` position dans optimistic
- Task 6: Composant générique `SortableTaskList<T>` avec PointerSensor + TouchSensor + modifiers
- Task 7: Intégration DnD dans page plot — `GripVertical` fonctionnel + `SortableTaskList` pour task_definitions
- Task 8: Intégration DnD dans page pièce — `GripVertical` + `SortableTaskList` + `TapCycleButton` coexistent sans conflit
- Task 9: Tests 3/3, lint 0, tsc --noEmit 0 erreurs. Aucune nouvelle régression.
