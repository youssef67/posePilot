-- Ajout colonne position sur lots pour tri stable
-- Position = ordre d'affichage par étage (0-based)

-- 1. Ajouter la colonne
ALTER TABLE public.lots ADD COLUMN position integer NOT NULL DEFAULT 0;

-- 2. Initialiser les positions existantes par ordre de created_at, par étage
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY etage_id ORDER BY created_at, id) - 1 AS pos
  FROM public.lots
)
UPDATE public.lots SET position = ranked.pos
FROM ranked WHERE public.lots.id = ranked.id;

-- 3. Index pour tri efficace
CREATE INDEX idx_lots_etage_position ON public.lots(etage_id, position);

-- 4. MAJ create_lot_with_inheritance : assigner position = max + 1 par étage
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
  v_effective_tasks text[];
  v_next_position integer;
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

  -- 4. Get task definitions from plot
  SELECT task_definitions INTO v_task_definitions
  FROM public.plots WHERE id = p_plot_id;

  -- 5. Copy variante_pieces → pieces + create taches with position
  FOR v_variante_piece IN
    SELECT nom, task_overrides FROM public.variante_pieces
    WHERE variante_id = p_variante_id
    ORDER BY created_at ASC
  LOOP
    INSERT INTO public.pieces (lot_id, nom)
    VALUES (v_lot_id, v_variante_piece.nom)
    RETURNING id INTO v_piece_id;

    -- Use task_overrides if set, otherwise fall back to plot task_definitions
    v_effective_tasks := COALESCE(v_variante_piece.task_overrides, v_task_definitions, '{}');

    v_task_position := 0;
    FOREACH v_task IN ARRAY v_effective_tasks
    LOOP
      INSERT INTO public.taches (piece_id, nom, status, position)
      VALUES (v_piece_id, v_task, 'not_started', v_task_position);
      v_task_position := v_task_position + 1;
    END LOOP;
  END LOOP;

  -- 6. Copy variante_documents → lot_documents
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

-- 5. MAJ duplicate_plot : copier la position des lots
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
      INSERT INTO public.variante_pieces (variante_id, nom, task_overrides)
      VALUES (v_new_variante_id, v_vp.nom, v_vp.task_overrides);
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
    SELECT * FROM public.lots WHERE plot_id = p_source_plot_id ORDER BY position, created_at
  LOOP
    INSERT INTO public.lots (etage_id, variante_id, plot_id, code, is_tma, plinth_status, position)
    VALUES (
      (v_etage_map->>v_lot.etage_id::text)::uuid,
      (v_variante_map->>v_lot.variante_id::text)::uuid,
      v_new_plot_id,
      v_lot.code,
      v_lot.is_tma,
      v_lot.plinth_status,
      v_lot.position
    )
    RETURNING id INTO v_new_lot_id;

    FOR v_piece IN
      SELECT * FROM public.pieces WHERE lot_id = v_lot.id ORDER BY created_at
    LOOP
      INSERT INTO public.pieces (lot_id, nom, metrage_m2, metrage_ml)
      VALUES (v_new_lot_id, v_piece.nom, v_piece.metrage_m2, v_piece.metrage_ml)
      RETURNING id INTO v_new_piece_id;

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
