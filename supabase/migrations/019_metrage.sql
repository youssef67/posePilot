-- Story 7.1 : Saisie et agrégation des métrés (m² et ML plinthes)

-- =====================
-- COLONNES MÉTRÉS — pieces (source)
-- =====================
ALTER TABLE public.pieces ADD COLUMN metrage_m2 NUMERIC(10,2);
ALTER TABLE public.pieces ADD COLUMN metrage_ml NUMERIC(10,2);

-- =====================
-- COLONNES AGRÉGÉES — lots, etages, plots
-- =====================
ALTER TABLE public.lots ADD COLUMN metrage_m2_total NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.lots ADD COLUMN metrage_ml_total NUMERIC(10,2) NOT NULL DEFAULT 0;

ALTER TABLE public.etages ADD COLUMN metrage_m2_total NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.etages ADD COLUMN metrage_ml_total NUMERIC(10,2) NOT NULL DEFAULT 0;

ALTER TABLE public.plots ADD COLUMN metrage_m2_total NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.plots ADD COLUMN metrage_ml_total NUMERIC(10,2) NOT NULL DEFAULT 0;

-- =====================
-- TRIGGER FUNCTION Level 1 : pieces → lots
-- =====================
CREATE OR REPLACE FUNCTION public.update_lot_metrage()
RETURNS TRIGGER AS $$
DECLARE
  target_lot_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_lot_id := OLD.lot_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.lot_id IS DISTINCT FROM NEW.lot_id THEN
    -- If lot_id changed, update both old and new parent
    UPDATE public.lots SET
      metrage_m2_total = COALESCE((SELECT SUM(COALESCE(metrage_m2, 0)) FROM public.pieces WHERE lot_id = OLD.lot_id), 0),
      metrage_ml_total = COALESCE((SELECT SUM(COALESCE(metrage_ml, 0)) FROM public.pieces WHERE lot_id = OLD.lot_id), 0)
    WHERE id = OLD.lot_id;
    target_lot_id := NEW.lot_id;
  ELSE
    target_lot_id := COALESCE(NEW.lot_id, OLD.lot_id);
  END IF;

  UPDATE public.lots SET
    metrage_m2_total = COALESCE((SELECT SUM(COALESCE(metrage_m2, 0)) FROM public.pieces WHERE lot_id = target_lot_id), 0),
    metrage_ml_total = COALESCE((SELECT SUM(COALESCE(metrage_ml, 0)) FROM public.pieces WHERE lot_id = target_lot_id), 0)
  WHERE id = target_lot_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_lot_metrage
  AFTER INSERT OR UPDATE OF metrage_m2, metrage_ml OR DELETE
  ON public.pieces
  FOR EACH ROW EXECUTE FUNCTION public.update_lot_metrage();

-- =====================
-- TRIGGER FUNCTION Level 2 : lots → etages
-- =====================
CREATE OR REPLACE FUNCTION public.update_etage_metrage()
RETURNS TRIGGER AS $$
DECLARE
  target_etage_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_etage_id := OLD.etage_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.etage_id IS DISTINCT FROM NEW.etage_id THEN
    UPDATE public.etages SET
      metrage_m2_total = COALESCE((SELECT SUM(COALESCE(metrage_m2_total, 0)) FROM public.lots WHERE etage_id = OLD.etage_id), 0),
      metrage_ml_total = COALESCE((SELECT SUM(COALESCE(metrage_ml_total, 0)) FROM public.lots WHERE etage_id = OLD.etage_id), 0)
    WHERE id = OLD.etage_id;
    target_etage_id := NEW.etage_id;
  ELSE
    target_etage_id := COALESCE(NEW.etage_id, OLD.etage_id);
  END IF;

  UPDATE public.etages SET
    metrage_m2_total = COALESCE((SELECT SUM(COALESCE(metrage_m2_total, 0)) FROM public.lots WHERE etage_id = target_etage_id), 0),
    metrage_ml_total = COALESCE((SELECT SUM(COALESCE(metrage_ml_total, 0)) FROM public.lots WHERE etage_id = target_etage_id), 0)
  WHERE id = target_etage_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_etage_metrage
  AFTER INSERT OR UPDATE OF metrage_m2_total, metrage_ml_total OR DELETE
  ON public.lots
  FOR EACH ROW EXECUTE FUNCTION public.update_etage_metrage();

-- =====================
-- TRIGGER FUNCTION Level 3 : etages → plots
-- =====================
CREATE OR REPLACE FUNCTION public.update_plot_metrage()
RETURNS TRIGGER AS $$
DECLARE
  target_plot_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_plot_id := OLD.plot_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.plot_id IS DISTINCT FROM NEW.plot_id THEN
    UPDATE public.plots SET
      metrage_m2_total = COALESCE((SELECT SUM(COALESCE(metrage_m2_total, 0)) FROM public.etages WHERE plot_id = OLD.plot_id), 0),
      metrage_ml_total = COALESCE((SELECT SUM(COALESCE(metrage_ml_total, 0)) FROM public.etages WHERE plot_id = OLD.plot_id), 0)
    WHERE id = OLD.plot_id;
    target_plot_id := NEW.plot_id;
  ELSE
    target_plot_id := COALESCE(NEW.plot_id, OLD.plot_id);
  END IF;

  UPDATE public.plots SET
    metrage_m2_total = COALESCE((SELECT SUM(COALESCE(metrage_m2_total, 0)) FROM public.etages WHERE plot_id = target_plot_id), 0),
    metrage_ml_total = COALESCE((SELECT SUM(COALESCE(metrage_ml_total, 0)) FROM public.etages WHERE plot_id = target_plot_id), 0)
  WHERE id = target_plot_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_plot_metrage
  AFTER INSERT OR UPDATE OF metrage_m2_total, metrage_ml_total OR DELETE
  ON public.etages
  FOR EACH ROW EXECUTE FUNCTION public.update_plot_metrage();

-- =====================
-- BACKFILL bottom-up
-- =====================
UPDATE public.lots l SET
  metrage_m2_total = COALESCE((SELECT SUM(COALESCE(metrage_m2, 0)) FROM public.pieces WHERE lot_id = l.id), 0),
  metrage_ml_total = COALESCE((SELECT SUM(COALESCE(metrage_ml, 0)) FROM public.pieces WHERE lot_id = l.id), 0);

UPDATE public.etages e SET
  metrage_m2_total = COALESCE((SELECT SUM(COALESCE(metrage_m2_total, 0)) FROM public.lots WHERE etage_id = e.id), 0),
  metrage_ml_total = COALESCE((SELECT SUM(COALESCE(metrage_ml_total, 0)) FROM public.lots WHERE etage_id = e.id), 0);

UPDATE public.plots p SET
  metrage_m2_total = COALESCE((SELECT SUM(COALESCE(metrage_m2_total, 0)) FROM public.etages WHERE plot_id = p.id), 0),
  metrage_ml_total = COALESCE((SELECT SUM(COALESCE(metrage_ml_total, 0)) FROM public.etages WHERE plot_id = p.id), 0);
