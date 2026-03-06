-- Story 11.6 : Transfert inventaire étage → lot avec traçabilité
-- Ajoute colonne source + étend la RPC transfer_inventaire pour supporter p_target_lot_id

-- =====================
-- ALTER inventaire — colonne source
-- =====================
ALTER TABLE public.inventaire
  ADD COLUMN IF NOT EXISTS source text DEFAULT NULL;

-- =====================
-- DROP ancienne signature (4 params) avant recréation avec 5 params
-- =====================
DROP FUNCTION IF EXISTS transfer_inventaire(UUID, INTEGER, UUID, UUID);

-- =====================
-- CREATE RPC transfer_inventaire — avec p_target_lot_id
-- =====================
CREATE OR REPLACE FUNCTION transfer_inventaire(
  p_source_id UUID,
  p_quantity INTEGER,
  p_target_plot_id UUID DEFAULT NULL,
  p_target_etage_id UUID DEFAULT NULL,
  p_target_lot_id UUID DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_source RECORD;
  v_target_id UUID;
BEGIN
  -- Verrouiller et lire l'item source
  SELECT * INTO v_source FROM inventaire WHERE id = p_source_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item source introuvable';
  END IF;

  -- Valider la quantité
  IF p_quantity <= 0 OR p_quantity > v_source.quantite THEN
    RAISE EXCEPTION 'Quantité invalide : % (disponible : %)', p_quantity, v_source.quantite;
  END IF;

  -- Décrémenter ou supprimer le source
  IF p_quantity = v_source.quantite THEN
    DELETE FROM inventaire WHERE id = p_source_id;
  ELSE
    UPDATE inventaire SET quantite = quantite - p_quantity WHERE id = p_source_id;
  END IF;

  -- Chercher un item existant à la destination (même désignation, même chantier, même emplacement cible)
  SELECT id INTO v_target_id FROM inventaire
    WHERE chantier_id = v_source.chantier_id
    AND LOWER(TRIM(designation)) = LOWER(TRIM(v_source.designation))
    AND plot_id IS NOT DISTINCT FROM p_target_plot_id
    AND etage_id IS NOT DISTINCT FROM p_target_etage_id
    AND lot_id IS NOT DISTINCT FROM p_target_lot_id
    FOR UPDATE
    LIMIT 1;

  IF v_target_id IS NOT NULL THEN
    -- Incrémenter l'item existant (source reste inchangé)
    UPDATE inventaire SET quantite = quantite + p_quantity WHERE id = v_target_id;
  ELSE
    -- Créer un nouvel item
    INSERT INTO inventaire (chantier_id, plot_id, etage_id, lot_id, designation, quantite, source, created_by)
    VALUES (
      v_source.chantier_id,
      p_target_plot_id,
      p_target_etage_id,
      p_target_lot_id,
      v_source.designation,
      p_quantity,
      CASE WHEN p_target_lot_id IS NOT NULL THEN 'transfer' ELSE NULL END,
      auth.uid()
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissions
GRANT EXECUTE ON FUNCTION transfer_inventaire(UUID, INTEGER, UUID, UUID, UUID) TO authenticated;
