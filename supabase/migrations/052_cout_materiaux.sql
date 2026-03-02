-- Story 11.1 : Coût matériaux par lot avec agrégation hiérarchique
-- Cascade : lots.cout_materiaux → etages → plots → chantiers (.cout_materiaux_total)

-- =====================
-- COLONNES
-- =====================

-- lots : saisie directe par l'utilisateur
ALTER TABLE public.lots ADD COLUMN cout_materiaux NUMERIC(10,2) NOT NULL DEFAULT 0;

-- etages, plots, chantiers : somme agrégée
ALTER TABLE public.etages ADD COLUMN cout_materiaux_total NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.plots ADD COLUMN cout_materiaux_total NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.chantiers ADD COLUMN cout_materiaux_total NUMERIC(10,2) NOT NULL DEFAULT 0;

-- =====================
-- TRIGGER FUNCTION Level 1 : lots → etages
-- =====================
CREATE OR REPLACE FUNCTION public.update_etage_cout_materiaux()
RETURNS TRIGGER AS $$
DECLARE
  target_etage_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_etage_id := OLD.etage_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.etage_id IS DISTINCT FROM NEW.etage_id THEN
    UPDATE public.etages SET
      cout_materiaux_total = COALESCE((SELECT SUM(COALESCE(cout_materiaux, 0)) FROM public.lots WHERE etage_id = OLD.etage_id), 0)
    WHERE id = OLD.etage_id;
    target_etage_id := NEW.etage_id;
  ELSE
    target_etage_id := COALESCE(NEW.etage_id, OLD.etage_id);
  END IF;

  UPDATE public.etages SET
    cout_materiaux_total = COALESCE((SELECT SUM(COALESCE(cout_materiaux, 0)) FROM public.lots WHERE etage_id = target_etage_id), 0)
  WHERE id = target_etage_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lots_cout_materiaux
  AFTER INSERT OR UPDATE OF cout_materiaux OR DELETE
  ON public.lots
  FOR EACH ROW EXECUTE FUNCTION public.update_etage_cout_materiaux();

-- =====================
-- TRIGGER FUNCTION Level 2 : etages → plots
-- =====================
CREATE OR REPLACE FUNCTION public.update_plot_cout_materiaux()
RETURNS TRIGGER AS $$
DECLARE
  target_plot_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_plot_id := OLD.plot_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.plot_id IS DISTINCT FROM NEW.plot_id THEN
    UPDATE public.plots SET
      cout_materiaux_total = COALESCE((SELECT SUM(COALESCE(cout_materiaux_total, 0)) FROM public.etages WHERE plot_id = OLD.plot_id), 0)
    WHERE id = OLD.plot_id;
    target_plot_id := NEW.plot_id;
  ELSE
    target_plot_id := COALESCE(NEW.plot_id, OLD.plot_id);
  END IF;

  UPDATE public.plots SET
    cout_materiaux_total = COALESCE((SELECT SUM(COALESCE(cout_materiaux_total, 0)) FROM public.etages WHERE plot_id = target_plot_id), 0)
  WHERE id = target_plot_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_etages_cout_materiaux
  AFTER INSERT OR UPDATE OF cout_materiaux_total OR DELETE
  ON public.etages
  FOR EACH ROW EXECUTE FUNCTION public.update_plot_cout_materiaux();

-- =====================
-- TRIGGER FUNCTION Level 3 : plots → chantiers
-- =====================
CREATE OR REPLACE FUNCTION public.update_chantier_cout_materiaux()
RETURNS TRIGGER AS $$
DECLARE
  target_chantier_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_chantier_id := OLD.chantier_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.chantier_id IS DISTINCT FROM NEW.chantier_id THEN
    UPDATE public.chantiers SET
      cout_materiaux_total = COALESCE((SELECT SUM(COALESCE(cout_materiaux_total, 0)) FROM public.plots WHERE chantier_id = OLD.chantier_id), 0)
    WHERE id = OLD.chantier_id;
    target_chantier_id := NEW.chantier_id;
  ELSE
    target_chantier_id := COALESCE(NEW.chantier_id, OLD.chantier_id);
  END IF;

  UPDATE public.chantiers SET
    cout_materiaux_total = COALESCE((SELECT SUM(COALESCE(cout_materiaux_total, 0)) FROM public.plots WHERE chantier_id = target_chantier_id), 0)
  WHERE id = target_chantier_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_plots_cout_materiaux
  AFTER INSERT OR UPDATE OF cout_materiaux_total OR DELETE
  ON public.plots
  FOR EACH ROW EXECUTE FUNCTION public.update_chantier_cout_materiaux();
