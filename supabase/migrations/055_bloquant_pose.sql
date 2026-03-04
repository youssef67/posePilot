-- 055_bloquant_pose.sql
-- Story 11.5: Tâches bloquant/non-bloquant pose & fix pièces sans pose
-- Ajoute bloquant_pose sur taches et task_config sur plots

-- 1.1 Colonne bloquant_pose sur taches
ALTER TABLE public.taches
  ADD COLUMN bloquant_pose boolean NOT NULL DEFAULT true;

-- 1.2 Colonne task_config sur plots
ALTER TABLE public.plots
  ADD COLUMN task_config jsonb NOT NULL DEFAULT '{}';
