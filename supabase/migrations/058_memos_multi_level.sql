-- Story 8.6 : Memos multi-niveaux (plot, etage) + photos
-- Rename chantier_memos -> memos, add plot/etage support, photo_url, triggers

-- =====================
-- RENAME TABLE
-- =====================
ALTER TABLE public.chantier_memos RENAME TO memos;
ALTER INDEX idx_chantier_memos_chantier_id RENAME TO idx_memos_chantier_id;

-- =====================
-- NEW COLUMNS + NULLABLE chantier_id
-- =====================
ALTER TABLE public.memos
  ALTER COLUMN chantier_id DROP NOT NULL,
  ADD COLUMN plot_id uuid REFERENCES public.plots(id) ON DELETE CASCADE,
  ADD COLUMN etage_id uuid REFERENCES public.etages(id) ON DELETE CASCADE,
  ADD COLUMN photo_url text;

-- =====================
-- CHECK: exactly one parent
-- =====================
ALTER TABLE public.memos ADD CONSTRAINT memos_parent_check CHECK (
  (chantier_id IS NOT NULL AND plot_id IS NULL AND etage_id IS NULL) OR
  (chantier_id IS NULL AND plot_id IS NOT NULL AND etage_id IS NULL) OR
  (chantier_id IS NULL AND plot_id IS NULL AND etage_id IS NOT NULL)
);

-- =====================
-- INDEXES
-- =====================
CREATE INDEX idx_memos_plot_id ON public.memos(plot_id);
CREATE INDEX idx_memos_etage_id ON public.memos(etage_id);

-- =====================
-- DENORMALIZED memo_count on plots & etages
-- =====================
ALTER TABLE public.plots ADD COLUMN memo_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.etages ADD COLUMN memo_count integer NOT NULL DEFAULT 0;

-- =====================
-- UPDATE EXISTING TRIGGER: reference 'memos' instead of 'chantier_memos'
-- =====================
CREATE OR REPLACE FUNCTION update_chantier_memo_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.chantiers SET memo_count = (
      SELECT count(*) FROM public.memos WHERE chantier_id = OLD.chantier_id
    ) WHERE id = OLD.chantier_id;
    RETURN OLD;
  ELSE
    UPDATE public.chantiers SET memo_count = (
      SELECT count(*) FROM public.memos WHERE chantier_id = NEW.chantier_id
    ) WHERE id = NEW.chantier_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Re-attach trigger on renamed table
DROP TRIGGER IF EXISTS trg_chantier_memo_count ON public.memos;
CREATE TRIGGER trg_chantier_memo_count
AFTER INSERT OR DELETE ON public.memos
FOR EACH ROW
WHEN (NEW.chantier_id IS NOT NULL OR OLD.chantier_id IS NOT NULL)
EXECUTE FUNCTION update_chantier_memo_count();

-- =====================
-- TRIGGER: plot memo_count
-- =====================
CREATE OR REPLACE FUNCTION update_plot_memo_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.plots SET memo_count = (
      SELECT count(*) FROM public.memos WHERE plot_id = OLD.plot_id
    ) WHERE id = OLD.plot_id;
    RETURN OLD;
  ELSE
    UPDATE public.plots SET memo_count = (
      SELECT count(*) FROM public.memos WHERE plot_id = NEW.plot_id
    ) WHERE id = NEW.plot_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_plot_memo_count
AFTER INSERT OR DELETE ON public.memos
FOR EACH ROW
WHEN (NEW.plot_id IS NOT NULL OR OLD.plot_id IS NOT NULL)
EXECUTE FUNCTION update_plot_memo_count();

-- =====================
-- TRIGGER: etage memo_count
-- =====================
CREATE OR REPLACE FUNCTION update_etage_memo_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.etages SET memo_count = (
      SELECT count(*) FROM public.memos WHERE etage_id = OLD.etage_id
    ) WHERE id = OLD.etage_id;
    RETURN OLD;
  ELSE
    UPDATE public.etages SET memo_count = (
      SELECT count(*) FROM public.memos WHERE etage_id = NEW.etage_id
    ) WHERE id = NEW.etage_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_etage_memo_count
AFTER INSERT OR DELETE ON public.memos
FOR EACH ROW
WHEN (NEW.etage_id IS NOT NULL OR OLD.etage_id IS NOT NULL)
EXECUTE FUNCTION update_etage_memo_count();

-- =====================
-- RLS: apply_rls_policy on renamed table
-- =====================
SELECT public.apply_rls_policy('memos');
