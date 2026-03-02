-- Multi-fichiers pour les documents de lot
-- Ajoute allow_multiple + table lot_document_files + triggers

-- =====================
-- 1a. Colonnes allow_multiple
-- =====================
ALTER TABLE public.variante_documents ADD COLUMN allow_multiple boolean NOT NULL DEFAULT false;
ALTER TABLE public.lot_documents ADD COLUMN allow_multiple boolean NOT NULL DEFAULT false;

-- =====================
-- 1b. Table lot_document_files
-- =====================
CREATE TABLE public.lot_document_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_document_id uuid NOT NULL REFERENCES public.lot_documents(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_lot_document_files_doc ON public.lot_document_files(lot_document_id);

SELECT public.apply_rls_policy('lot_document_files');

-- =====================
-- 1c. MAJ create_lot_with_inheritance : copier allow_multiple
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

    v_effective_tasks := COALESCE(v_variante_piece.task_overrides, v_task_definitions, '{}');

    v_task_position := 0;
    FOREACH v_task IN ARRAY v_effective_tasks
    LOOP
      INSERT INTO public.taches (piece_id, nom, status, position)
      VALUES (v_piece_id, v_task, 'not_started', v_task_position);
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
-- 1d. MAJ duplicate_plot : copier allow_multiple
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
      INSERT INTO public.lot_documents (lot_id, nom, is_required, allow_multiple)
      VALUES (v_new_lot_id, v_lot_doc.nom, v_lot_doc.is_required, v_lot_doc.allow_multiple);
    END LOOP;
  END LOOP;

  RETURN v_new_plot_id;
END;
$$;

-- =====================
-- 1e. Trigger propagation variante → lots existants
-- =====================
CREATE OR REPLACE FUNCTION propagate_allow_multiple()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.allow_multiple IS DISTINCT FROM NEW.allow_multiple THEN
    UPDATE public.lot_documents ld
    SET allow_multiple = NEW.allow_multiple
    FROM public.lots l
    WHERE ld.lot_id = l.id
      AND l.variante_id = NEW.variante_id
      AND lower(ld.nom) = lower(NEW.nom);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_variante_documents_allow_multiple
  AFTER UPDATE OF allow_multiple ON public.variante_documents
  FOR EACH ROW EXECUTE FUNCTION propagate_allow_multiple();

-- =====================
-- 1f. MAJ trigger has_missing_docs
-- =====================
-- Un document required est "manquant" si :
--   allow_multiple = false AND file_url IS NULL, OU
--   allow_multiple = true AND aucune ligne dans lot_document_files
CREATE OR REPLACE FUNCTION update_lot_missing_docs()
RETURNS TRIGGER AS $$
DECLARE
  target_lot_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_lot_id := OLD.lot_id;
  ELSE
    target_lot_id := NEW.lot_id;
  END IF;

  -- Gérer le changement de lot_id (UPDATE)
  IF TG_OP = 'UPDATE' AND OLD.lot_id IS DISTINCT FROM NEW.lot_id THEN
    UPDATE public.lots SET
      has_missing_docs = EXISTS(
        SELECT 1 FROM public.lot_documents d
        WHERE d.lot_id = OLD.lot_id AND d.is_required = true
          AND (
            (d.allow_multiple = false AND d.file_url IS NULL)
            OR (d.allow_multiple = true AND NOT EXISTS(
              SELECT 1 FROM public.lot_document_files f WHERE f.lot_document_id = d.id
            ))
          )
      )
    WHERE id = OLD.lot_id;
  END IF;

  -- Recalculer le lot cible
  IF target_lot_id IS NOT NULL THEN
    UPDATE public.lots SET
      has_missing_docs = EXISTS(
        SELECT 1 FROM public.lot_documents d
        WHERE d.lot_id = target_lot_id AND d.is_required = true
          AND (
            (d.allow_multiple = false AND d.file_url IS NULL)
            OR (d.allow_multiple = true AND NOT EXISTS(
              SELECT 1 FROM public.lot_document_files f WHERE f.lot_document_id = d.id
            ))
          )
      )
    WHERE id = target_lot_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Re-create trigger to also fire on allow_multiple changes
DROP TRIGGER IF EXISTS trg_lot_documents_missing ON public.lot_documents;
CREATE TRIGGER trg_lot_documents_missing
  AFTER INSERT OR UPDATE OF is_required, file_url, allow_multiple OR DELETE ON public.lot_documents
  FOR EACH ROW EXECUTE FUNCTION update_lot_missing_docs();

-- =====================
-- 1g. Trigger sur lot_document_files → recalcule has_missing_docs
-- =====================
CREATE OR REPLACE FUNCTION update_lot_missing_docs_from_files()
RETURNS TRIGGER AS $$
DECLARE
  v_lot_id UUID;
  v_doc_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_doc_id := OLD.lot_document_id;
  ELSE
    v_doc_id := NEW.lot_document_id;
  END IF;

  SELECT lot_id INTO v_lot_id FROM public.lot_documents WHERE id = v_doc_id;

  IF v_lot_id IS NOT NULL THEN
    UPDATE public.lots SET
      has_missing_docs = EXISTS(
        SELECT 1 FROM public.lot_documents d
        WHERE d.lot_id = v_lot_id AND d.is_required = true
          AND (
            (d.allow_multiple = false AND d.file_url IS NULL)
            OR (d.allow_multiple = true AND NOT EXISTS(
              SELECT 1 FROM public.lot_document_files f WHERE f.lot_document_id = d.id
            ))
          )
      )
    WHERE id = v_lot_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lot_document_files_missing
  AFTER INSERT OR DELETE ON public.lot_document_files
  FOR EACH ROW EXECUTE FUNCTION update_lot_missing_docs_from_files();

-- =====================
-- 1h. Backfill (recalcule has_missing_docs pour tous les lots)
-- =====================
UPDATE public.lots SET
  has_missing_docs = EXISTS(
    SELECT 1 FROM public.lot_documents d
    WHERE d.lot_id = lots.id AND d.is_required = true
      AND (
        (d.allow_multiple = false AND d.file_url IS NULL)
        OR (d.allow_multiple = true AND NOT EXISTS(
          SELECT 1 FROM public.lot_document_files f WHERE f.lot_document_id = d.id
        ))
      )
  );
