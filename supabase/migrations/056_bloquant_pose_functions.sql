-- 056_bloquant_pose_functions.sql
-- Story 11.5: MAJ fonctions SQL pour bloquant_pose + trigger propagation

-- =====================
-- 2.1 MAJ create_lot_with_inheritance : lire task_config et passer bloquant_pose
-- =====================
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
  v_task_config jsonb;
  v_task_position integer;
  v_effective_tasks text[];
  v_next_position integer;
  v_bloquant boolean;
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

  -- 2. Compute next position for this étage
  SELECT COALESCE(MAX(position), -1) + 1 INTO v_next_position
  FROM public.lots WHERE etage_id = v_etage_id;

  -- 3. Create lot with position
  INSERT INTO public.lots (etage_id, variante_id, plot_id, code, position)
  VALUES (v_etage_id, p_variante_id, p_plot_id, p_code, v_next_position)
  RETURNING id INTO v_lot_id;

  -- 4. Get task definitions and task_config from plot
  SELECT task_definitions, task_config INTO v_task_definitions, v_task_config
  FROM public.plots WHERE id = p_plot_id;

  -- 5. Copy variante_pieces → pieces + create taches with position and bloquant_pose
  FOR v_variante_piece IN
    SELECT nom, task_overrides FROM public.variante_pieces
    WHERE variante_id = p_variante_id
    ORDER BY created_at ASC
  LOOP
    INSERT INTO public.pieces (lot_id, nom)
    VALUES (v_lot_id, v_variante_piece.nom)
    RETURNING id INTO v_piece_id;

    v_effective_tasks := COALESCE(v_variante_piece.task_overrides, v_task_definitions, '{}');

    v_task_position := 0;
    FOREACH v_task IN ARRAY v_effective_tasks
    LOOP
      -- Determine bloquant_pose from task_config (default true)
      -- Note: JSON key lookup is case-sensitive. task_config keys and task_definitions
      -- values share the same UI source, so case always matches.
      v_bloquant := COALESCE(
        (v_task_config->v_task->>'bloquant_pose')::boolean,
        true
      );
      INSERT INTO public.taches (piece_id, nom, status, position, bloquant_pose)
      VALUES (v_piece_id, v_task, 'not_started', v_task_position, v_bloquant);
      v_task_position := v_task_position + 1;
    END LOOP;
  END LOOP;

  -- 6. Copy variante_documents → lot_documents (including allow_multiple)
  FOR v_variante_doc IN
    SELECT nom, is_required, allow_multiple FROM public.variante_documents
    WHERE variante_id = p_variante_id
    ORDER BY created_at ASC
  LOOP
    INSERT INTO public.lot_documents (lot_id, nom, is_required, allow_multiple)
    VALUES (v_lot_id, v_variante_doc.nom, v_variante_doc.is_required, v_variante_doc.allow_multiple);
  END LOOP;

  RETURN v_lot_id;
END;
$$;

-- =====================
-- 2.2 MAJ add_piece_to_lot : lire task_config du plot pour bloquant_pose
-- =====================
CREATE OR REPLACE FUNCTION public.add_piece_to_lot(
  p_lot_id uuid,
  p_piece_nom text,
  p_task_overrides text[] DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_piece_id uuid;
  v_plot_id uuid;
  v_task_definitions text[];
  v_task_config jsonb;
  v_effective_tasks text[];
  v_task text;
  v_task_position integer;
  v_bloquant boolean;
BEGIN
  -- 1. Get plot_id from lot
  SELECT plot_id INTO v_plot_id FROM public.lots WHERE id = p_lot_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lot % not found', p_lot_id;
  END IF;

  -- 2. Get task definitions and task_config from plot
  SELECT task_definitions, task_config INTO v_task_definitions, v_task_config
  FROM public.plots WHERE id = v_plot_id;

  -- 3. Use overrides if provided, otherwise plot defaults
  v_effective_tasks := COALESCE(p_task_overrides, v_task_definitions, '{}');

  -- 4. Create piece
  INSERT INTO public.pieces (lot_id, nom)
  VALUES (p_lot_id, p_piece_nom)
  RETURNING id INTO v_piece_id;

  -- 5. Create taches with bloquant_pose from task_config
  -- Note: JSON key lookup is case-sensitive (same convention as create_lot_with_inheritance)
  v_task_position := 0;
  FOREACH v_task IN ARRAY v_effective_tasks
  LOOP
    v_bloquant := COALESCE(
      (v_task_config->v_task->>'bloquant_pose')::boolean,
      true
    );
    INSERT INTO public.taches (piece_id, nom, status, position, bloquant_pose)
    VALUES (v_piece_id, v_task, 'not_started', v_task_position, v_bloquant);
    v_task_position := v_task_position + 1;
  END LOOP;

  RETURN v_piece_id;
END;
$$;

-- =====================
-- 2.3 MAJ duplicate_plot : copier task_config + bloquant_pose des tâches
-- =====================
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

  -- Copy plot with task_config
  INSERT INTO public.plots (chantier_id, nom, task_definitions, task_config)
  VALUES (v_source_plot.chantier_id, p_new_plot_nom, v_source_plot.task_definitions, v_source_plot.task_config)
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
      INSERT INTO public.variante_pieces (variante_id, nom, task_overrides)
      VALUES (v_new_variante_id, v_vp.nom, v_vp.task_overrides);
    END LOOP;

    FOR v_vd IN
      SELECT * FROM public.variante_documents WHERE variante_id = v_variante.id ORDER BY created_at
    LOOP
      INSERT INTO public.variante_documents (variante_id, nom, is_required, allow_multiple)
      VALUES (v_new_variante_id, v_vd.nom, v_vd.is_required, v_vd.allow_multiple);
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
    SELECT * FROM public.lots WHERE plot_id = p_source_plot_id ORDER BY position, created_at
  LOOP
    INSERT INTO public.lots (etage_id, variante_id, plot_id, code, plinth_status, position)
    VALUES (
      (v_etage_map->>v_lot.etage_id::text)::uuid,
      (v_variante_map->>v_lot.variante_id::text)::uuid,
      v_new_plot_id,
      v_lot.code,
      v_lot.plinth_status,
      v_lot.position
    )
    RETURNING id INTO v_new_lot_id;

    -- Copy badge assignments
    INSERT INTO public.lot_badge_assignments (lot_id, badge_id)
    SELECT v_new_lot_id, badge_id
    FROM public.lot_badge_assignments
    WHERE lot_id = v_lot.id;

    FOR v_piece IN
      SELECT * FROM public.pieces WHERE lot_id = v_lot.id ORDER BY created_at
    LOOP
      INSERT INTO public.pieces (lot_id, nom, metrage_m2, metrage_ml)
      VALUES (v_new_lot_id, v_piece.nom, v_piece.metrage_m2, v_piece.metrage_ml)
      RETURNING id INTO v_new_piece_id;

      -- Copy taches with bloquant_pose preserved
      FOR v_tache IN
        SELECT * FROM public.taches WHERE piece_id = v_piece.id ORDER BY position
      LOOP
        INSERT INTO public.taches (piece_id, nom, status, position, bloquant_pose)
        VALUES (v_new_piece_id, v_tache.nom, 'not_started', v_tache.position, v_tache.bloquant_pose);
      END LOOP;
    END LOOP;

    FOR v_lot_doc IN
      SELECT * FROM public.lot_documents WHERE lot_id = v_lot.id ORDER BY created_at
    LOOP
      INSERT INTO public.lot_documents (lot_id, nom, is_required, allow_multiple)
      VALUES (v_new_lot_id, v_lot_doc.nom, v_lot_doc.is_required, v_lot_doc.allow_multiple);
    END LOOP;
  END LOOP;

  RETURN v_new_plot_id;
END;
$$;

-- =====================
-- 2.4 Trigger de propagation : quand plots.task_config est modifié,
-- UPDATE toutes les tâches existantes du plot via lots → pieces → taches
-- =====================
CREATE OR REPLACE FUNCTION public.propagate_task_config()
RETURNS TRIGGER AS $$
DECLARE
  v_task_name text;
  v_bloquant boolean;
BEGIN
  -- Pour chaque clé dans l'union de OLD et NEW task_config
  FOR v_task_name IN
    SELECT DISTINCT k
    FROM (
      SELECT jsonb_object_keys(COALESCE(NEW.task_config, '{}')) AS k
      UNION
      SELECT jsonb_object_keys(COALESCE(OLD.task_config, '{}')) AS k
    ) sub
  LOOP
    v_bloquant := COALESCE(
      (NEW.task_config->v_task_name->>'bloquant_pose')::boolean,
      true  -- défaut si la clé est supprimée
    );

    UPDATE public.taches t
    SET bloquant_pose = v_bloquant
    FROM public.pieces p
    JOIN public.lots l ON l.id = p.lot_id
    WHERE t.piece_id = p.id
      AND l.plot_id = NEW.id
      AND lower(t.nom) = lower(v_task_name);
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_plots_task_config_propagation
  AFTER UPDATE OF task_config ON public.plots
  FOR EACH ROW
  WHEN (OLD.task_config IS DISTINCT FROM NEW.task_config)
  EXECUTE FUNCTION public.propagate_task_config();
