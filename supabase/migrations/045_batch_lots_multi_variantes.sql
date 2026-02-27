-- Modifier create_batch_lots_with_inheritance pour accepter un variante_id par lot
-- p_variante_ids remplace p_variante_id (tableau parallèle à p_codes)

CREATE OR REPLACE FUNCTION public.create_batch_lots_with_inheritance(
  p_codes text[],
  p_variante_ids uuid[],
  p_etage_nom text,
  p_plot_id uuid
) RETURNS uuid[]
LANGUAGE plpgsql
AS $$
DECLARE
  v_lot_ids uuid[] := '{}';
  v_lot_id uuid;
  v_i int;
BEGIN
  IF array_length(p_codes, 1) != array_length(p_variante_ids, 1) THEN
    RAISE EXCEPTION 'p_codes et p_variante_ids doivent avoir la même taille';
  END IF;

  FOR v_i IN 1..array_length(p_codes, 1)
  LOOP
    v_lot_id := public.create_lot_with_inheritance(
      p_codes[v_i], p_variante_ids[v_i], p_etage_nom, p_plot_id
    );
    v_lot_ids := v_lot_ids || v_lot_id;
  END LOOP;

  RETURN v_lot_ids;
END;
$$;

-- Supprimer l'ancienne signature (single variante_id) pour éviter l'ambiguïté
DROP FUNCTION IF EXISTS public.create_batch_lots_with_inheritance(text[], uuid, text, uuid);
