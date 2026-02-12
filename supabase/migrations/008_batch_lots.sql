-- Story 2.5 : Ajout de lots en batch
-- Fonction BATCH avec héritage

-- Crée N lots (max imposé côté client) pour la même variante et le même étage.
-- Appelle create_lot_with_inheritance() en boucle dans une seule transaction.
-- Si un code est en doublon (contrainte unique), TOUT le batch est rollback.
-- Retourne le tableau des UUIDs des lots créés.

CREATE OR REPLACE FUNCTION public.create_batch_lots_with_inheritance(
  p_codes text[],
  p_variante_id uuid,
  p_etage_nom text,
  p_plot_id uuid
) RETURNS uuid[]
LANGUAGE plpgsql
AS $$
DECLARE
  v_lot_ids uuid[] := '{}';
  v_lot_id uuid;
  v_code text;
BEGIN
  FOREACH v_code IN ARRAY p_codes
  LOOP
    v_lot_id := public.create_lot_with_inheritance(
      v_code, p_variante_id, p_etage_nom, p_plot_id
    );
    v_lot_ids := v_lot_ids || v_lot_id;
  END LOOP;

  RETURN v_lot_ids;
END;
$$;
