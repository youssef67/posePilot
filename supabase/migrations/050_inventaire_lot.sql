-- Story 8.6 : Affectation d'inventaire à un lot
-- Ajoute lot_id nullable sur inventaire + has_inventaire computed sur lots + trigger

-- =====================
-- ALTER inventaire — lot_id nullable
-- =====================
ALTER TABLE public.inventaire
  ADD COLUMN lot_id UUID REFERENCES public.lots(id) ON DELETE SET NULL;

CREATE INDEX idx_inventaire_lot_id ON public.inventaire(lot_id);

-- Contrainte : lot_id non null implique plot_id + etage_id non null
ALTER TABLE public.inventaire
  ADD CONSTRAINT chk_inventaire_lot_requires_location
  CHECK (lot_id IS NULL OR (plot_id IS NOT NULL AND etage_id IS NOT NULL));

-- =====================
-- ALTER lots — has_inventaire computed
-- =====================
ALTER TABLE public.lots
  ADD COLUMN has_inventaire BOOLEAN NOT NULL DEFAULT false;

-- =====================
-- TRIGGER FUNCTION — Recalcule has_inventaire sur lots
-- =====================
CREATE OR REPLACE FUNCTION update_lot_has_inventaire()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculer pour le nouveau lot_id (INSERT ou UPDATE)
  IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.lot_id IS NOT NULL THEN
    UPDATE public.lots SET has_inventaire = EXISTS(
      SELECT 1 FROM public.inventaire WHERE lot_id = NEW.lot_id
    ) WHERE id = NEW.lot_id;
  END IF;

  -- Recalculer pour l'ancien lot_id (DELETE ou UPDATE avec changement de lot)
  IF TG_OP = 'DELETE' AND OLD.lot_id IS NOT NULL THEN
    UPDATE public.lots SET has_inventaire = EXISTS(
      SELECT 1 FROM public.inventaire WHERE lot_id = OLD.lot_id
    ) WHERE id = OLD.lot_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.lot_id IS DISTINCT FROM NEW.lot_id AND OLD.lot_id IS NOT NULL THEN
    UPDATE public.lots SET has_inventaire = EXISTS(
      SELECT 1 FROM public.inventaire WHERE lot_id = OLD.lot_id
    ) WHERE id = OLD.lot_id;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_inventaire_lot_has_inventaire
  AFTER INSERT OR UPDATE OF lot_id OR DELETE ON public.inventaire
  FOR EACH ROW EXECUTE FUNCTION update_lot_has_inventaire();
