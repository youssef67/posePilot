-- Story 8.1 : Duplication de plot
-- Fonction RPC qui duplique un plot avec toute sa hiérarchie :
-- variantes → variante_pieces → variante_documents
-- étages → lots → pièces → tâches → lot_documents
-- Notes NON copiées, tâches remises à not_started, documents sans fichier.

CREATE OR REPLACE FUNCTION public.duplicate_plot(
  p_source_plot_id uuid,
  p_new_plot_nom text
) RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_source_plot RECORD;
  v_new_plot_id uuid;
  -- Variante mapping
  v_variante RECORD;
  v_new_variante_id uuid;
  v_variante_map jsonb := '{}';
  -- Variante pieces / documents
  v_vp RECORD;
  v_vd RECORD;
  -- Etage mapping
  v_etage RECORD;
  v_new_etage_id uuid;
  v_etage_map jsonb := '{}';
  -- Lot
  v_lot RECORD;
  v_new_lot_id uuid;
  -- Piece + tache
  v_piece RECORD;
  v_new_piece_id uuid;
  v_tache RECORD;
  -- Lot documents
  v_lot_doc RECORD;
BEGIN
  -- 1. Récupérer le plot source
  SELECT * INTO v_source_plot FROM public.plots WHERE id = p_source_plot_id;
  IF v_source_plot IS NULL THEN
    RAISE EXCEPTION 'Plot source introuvable: %', p_source_plot_id;
  END IF;

  -- 2. Créer le nouveau plot (agrégats à 0 par défaut)
  INSERT INTO public.plots (chantier_id, nom, task_definitions)
  VALUES (v_source_plot.chantier_id, p_new_plot_nom, v_source_plot.task_definitions)
  RETURNING id INTO v_new_plot_id;

  -- 3. Copier les variantes + variante_pieces + variante_documents
  FOR v_variante IN
    SELECT * FROM public.variantes WHERE plot_id = p_source_plot_id ORDER BY created_at
  LOOP
    INSERT INTO public.variantes (plot_id, nom)
    VALUES (v_new_plot_id, v_variante.nom)
    RETURNING id INTO v_new_variante_id;

    v_variante_map := v_variante_map || jsonb_build_object(v_variante.id::text, v_new_variante_id::text);

    -- 3a. Copier les variante_pieces
    FOR v_vp IN
      SELECT * FROM public.variante_pieces WHERE variante_id = v_variante.id ORDER BY created_at
    LOOP
      INSERT INTO public.variante_pieces (variante_id, nom)
      VALUES (v_new_variante_id, v_vp.nom);
    END LOOP;

    -- 3b. Copier les variante_documents
    FOR v_vd IN
      SELECT * FROM public.variante_documents WHERE variante_id = v_variante.id ORDER BY created_at
    LOOP
      INSERT INTO public.variante_documents (variante_id, nom, is_required)
      VALUES (v_new_variante_id, v_vd.nom, v_vd.is_required);
    END LOOP;
  END LOOP;

  -- 4. Copier les étages
  FOR v_etage IN
    SELECT * FROM public.etages WHERE plot_id = p_source_plot_id ORDER BY created_at
  LOOP
    INSERT INTO public.etages (plot_id, nom)
    VALUES (v_new_plot_id, v_etage.nom)
    RETURNING id INTO v_new_etage_id;

    v_etage_map := v_etage_map || jsonb_build_object(v_etage.id::text, v_new_etage_id::text);
  END LOOP;

  -- 5. Copier les lots + pièces + tâches + lot_documents
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

    -- 5a. Copier les pièces (metrage conservé)
    FOR v_piece IN
      SELECT * FROM public.pieces WHERE lot_id = v_lot.id ORDER BY created_at
    LOOP
      INSERT INTO public.pieces (lot_id, nom, metrage_m2, metrage_ml)
      VALUES (v_new_lot_id, v_piece.nom, v_piece.metrage_m2, v_piece.metrage_ml)
      RETURNING id INTO v_new_piece_id;

      -- 5b. Copier les tâches (status reset à not_started)
      FOR v_tache IN
        SELECT * FROM public.taches WHERE piece_id = v_piece.id ORDER BY created_at
      LOOP
        INSERT INTO public.taches (piece_id, nom, status)
        VALUES (v_new_piece_id, v_tache.nom, 'not_started');
      END LOOP;
    END LOOP;

    -- 5c. Copier les lot_documents (structure seule, sans fichier)
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
