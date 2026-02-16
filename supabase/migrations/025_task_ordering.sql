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
