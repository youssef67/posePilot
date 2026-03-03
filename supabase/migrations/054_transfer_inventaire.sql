-- Migration 054: Fonction RPC transfer_inventaire
-- Transfert atomique de matériaux entre stockage général et stockage étage (bidirectionnel)

CREATE OR REPLACE FUNCTION transfer_inventaire(
  p_source_id UUID,
  p_quantity INTEGER,
  p_target_plot_id UUID DEFAULT NULL,
  p_target_etage_id UUID DEFAULT NULL
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

  -- Chercher un item existant à la destination (même désignation, même chantier, même emplacement cible, sans lot)
  SELECT id INTO v_target_id FROM inventaire
    WHERE chantier_id = v_source.chantier_id
    AND LOWER(TRIM(designation)) = LOWER(TRIM(v_source.designation))
    AND plot_id IS NOT DISTINCT FROM p_target_plot_id
    AND etage_id IS NOT DISTINCT FROM p_target_etage_id
    AND lot_id IS NULL
    FOR UPDATE
    LIMIT 1;

  IF v_target_id IS NOT NULL THEN
    -- Incrémenter l'item existant
    UPDATE inventaire SET quantite = quantite + p_quantity WHERE id = v_target_id;
  ELSE
    -- Créer un nouvel item
    INSERT INTO inventaire (chantier_id, plot_id, etage_id, designation, quantite, created_by)
    VALUES (v_source.chantier_id, p_target_plot_id, p_target_etage_id, v_source.designation, p_quantity, auth.uid());
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissions
GRANT EXECUTE ON FUNCTION transfer_inventaire TO authenticated;
