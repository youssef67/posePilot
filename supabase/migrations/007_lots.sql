-- Story 2.4 : Lots avec héritage automatique depuis les variantes
-- Tables : etages, lots, pieces, taches, lot_documents
-- Fonction : create_lot_with_inheritance

-- =====================
-- Table ÉTAGES
-- =====================
CREATE TABLE public.etages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plot_id uuid NOT NULL REFERENCES public.plots(id) ON DELETE CASCADE,
  nom text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_etages_unique_nom ON public.etages(plot_id, lower(nom));
CREATE INDEX idx_etages_plot_id ON public.etages(plot_id);
SELECT public.apply_rls_policy('etages');

-- =====================
-- Table LOTS
-- =====================
CREATE TABLE public.lots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  etage_id uuid NOT NULL REFERENCES public.etages(id) ON DELETE CASCADE,
  variante_id uuid NOT NULL REFERENCES public.variantes(id),
  plot_id uuid NOT NULL REFERENCES public.plots(id) ON DELETE CASCADE,
  code text NOT NULL,
  is_tma boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_lots_unique_code ON public.lots(plot_id, lower(code));
CREATE INDEX idx_lots_etage_id ON public.lots(etage_id);
CREATE INDEX idx_lots_plot_id ON public.lots(plot_id);
CREATE INDEX idx_lots_variante_id ON public.lots(variante_id);
SELECT public.apply_rls_policy('lots');

-- =====================
-- Table PIÈCES (héritées de variante_pieces)
-- =====================
CREATE TABLE public.pieces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id uuid NOT NULL REFERENCES public.lots(id) ON DELETE CASCADE,
  nom text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pieces_lot_id ON public.pieces(lot_id);
SELECT public.apply_rls_policy('pieces');

-- =====================
-- Table TÂCHES (une par pièce × task_definition du plot)
-- =====================
CREATE TABLE public.taches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  piece_id uuid NOT NULL REFERENCES public.pieces(id) ON DELETE CASCADE,
  nom text NOT NULL,
  status task_status NOT NULL DEFAULT 'not_started',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_taches_piece_id ON public.taches(piece_id);
SELECT public.apply_rls_policy('taches');

-- =====================
-- Table LOT_DOCUMENTS (hérités de variante_documents)
-- =====================
CREATE TABLE public.lot_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id uuid NOT NULL REFERENCES public.lots(id) ON DELETE CASCADE,
  nom text NOT NULL,
  is_required boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_lot_documents_lot_id ON public.lot_documents(lot_id);
SELECT public.apply_rls_policy('lot_documents');

-- =====================
-- Fonction HÉRITAGE AUTOMATIQUE
-- =====================
-- Crée un lot avec héritage transactionnel : étage (get or create),
-- lot, pièces copiées depuis variante_pieces, tâches créées depuis
-- plot.task_definitions, documents copiés depuis variante_documents.
-- Retourne l'id du lot créé.
-- Note : pas de SECURITY DEFINER — la RLS standard suffit (auth.uid() IS NOT NULL)

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

  -- 4. Copy variante_pieces → pieces + create taches
  FOR v_variante_piece IN
    SELECT nom FROM public.variante_pieces
    WHERE variante_id = p_variante_id
    ORDER BY created_at ASC
  LOOP
    INSERT INTO public.pieces (lot_id, nom)
    VALUES (v_lot_id, v_variante_piece.nom)
    RETURNING id INTO v_piece_id;

    -- Create a tache for each task_definition
    FOREACH v_task IN ARRAY COALESCE(v_task_definitions, '{}')
    LOOP
      INSERT INTO public.taches (piece_id, nom, status)
      VALUES (v_piece_id, v_task, 'not_started');
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
