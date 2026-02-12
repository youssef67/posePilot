-- Story 2.6 : Personnalisation de lot individuel

-- =====================
-- Fonction AJOUT DE PIÈCE avec héritage des tâches
-- =====================
-- Crée une pièce dans un lot + toutes les tâches depuis task_definitions du plot.
-- Retourne l'ID de la pièce créée.
-- SECURITY INVOKER (défaut) : s'exécute avec les droits de l'appelant.
-- Compatible avec la policy RLS "authenticated = accès total".

CREATE OR REPLACE FUNCTION public.add_piece_to_lot(
  p_lot_id uuid,
  p_piece_nom text
) RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_piece_id uuid;
  v_plot_id uuid;
  v_task_definitions text[];
  v_task text;
BEGIN
  -- 1. Get plot_id from lot
  SELECT plot_id INTO v_plot_id FROM public.lots WHERE id = p_lot_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lot % not found', p_lot_id;
  END IF;

  -- 2. Get task definitions from plot
  SELECT task_definitions INTO v_task_definitions FROM public.plots WHERE id = v_plot_id;

  -- 3. Create piece
  INSERT INTO public.pieces (lot_id, nom)
  VALUES (p_lot_id, p_piece_nom)
  RETURNING id INTO v_piece_id;

  -- 4. Create taches from task_definitions
  FOREACH v_task IN ARRAY COALESCE(v_task_definitions, '{}')
  LOOP
    INSERT INTO public.taches (piece_id, nom, status)
    VALUES (v_piece_id, v_task, 'not_started');
  END LOOP;

  RETURN v_piece_id;
END;
$$;

-- =====================
-- Contraintes UNIQUE pour prévention doublons côté serveur
-- =====================
-- Complètent la validation client (case-insensitive)

CREATE UNIQUE INDEX IF NOT EXISTS idx_pieces_lot_nom_unique
  ON public.pieces (lot_id, lower(nom));

CREATE UNIQUE INDEX IF NOT EXISTS idx_lot_documents_lot_nom_unique
  ON public.lot_documents (lot_id, lower(nom));

CREATE UNIQUE INDEX IF NOT EXISTS idx_taches_piece_nom_unique
  ON public.taches (piece_id, lower(nom));
