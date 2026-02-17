-- Backfill : recalculer les positions des tâches existantes
-- Corrige les tâches ajoutées sans position explicite (position = 0 par défaut)
-- L'ordre est préservé : d'abord par position actuelle, puis par date de création

WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY piece_id ORDER BY position, created_at) - 1 AS pos
  FROM public.taches
)
UPDATE public.taches t
SET position = r.pos
FROM ranked r
WHERE t.id = r.id AND t.position != r.pos;
