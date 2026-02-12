-- Story 4.1 : Notes texte avec flag bloquant
-- Table notes + triggers cascade has_blocking_note (lots → etages → plots → chantiers)

-- =====================
-- TABLE NOTES
-- =====================
CREATE TABLE public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id uuid REFERENCES public.lots(id) ON DELETE CASCADE,
  piece_id uuid REFERENCES public.pieces(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_blocking boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_by_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- Exactement un parent : lot OU pièce, jamais les deux, jamais aucun
  CONSTRAINT notes_parent_check CHECK (
    (lot_id IS NOT NULL AND piece_id IS NULL) OR
    (lot_id IS NULL AND piece_id IS NOT NULL)
  )
);

CREATE INDEX idx_notes_lot_id ON public.notes(lot_id);
CREATE INDEX idx_notes_piece_id ON public.notes(piece_id);
CREATE INDEX idx_notes_is_blocking ON public.notes(is_blocking);
SELECT public.apply_rls_policy('notes');

-- =====================
-- COLONNES has_blocking_note
-- =====================
ALTER TABLE public.lots ADD COLUMN has_blocking_note boolean NOT NULL DEFAULT false;
ALTER TABLE public.etages ADD COLUMN has_blocking_note boolean NOT NULL DEFAULT false;
ALTER TABLE public.plots ADD COLUMN has_blocking_note boolean NOT NULL DEFAULT false;
ALTER TABLE public.chantiers ADD COLUMN has_blocking_note boolean NOT NULL DEFAULT false;

-- =====================
-- TRIGGER FUNCTIONS — Propagation has_blocking_note
-- =====================

-- Niveau 1 : notes → lots
-- Recalcule lots.has_blocking_note quand une note est insérée/modifiée/supprimée
CREATE OR REPLACE FUNCTION update_lot_blocking_status()
RETURNS TRIGGER AS $$
DECLARE
  target_lot_id UUID;
BEGIN
  -- Résoudre le lot_id cible (direct ou via pièce)
  IF TG_OP = 'DELETE' THEN
    IF OLD.lot_id IS NOT NULL THEN
      target_lot_id := OLD.lot_id;
    ELSE
      SELECT lot_id INTO target_lot_id FROM public.pieces WHERE id = OLD.piece_id;
    END IF;
  ELSE
    IF NEW.lot_id IS NOT NULL THEN
      target_lot_id := NEW.lot_id;
    ELSE
      SELECT lot_id INTO target_lot_id FROM public.pieces WHERE id = NEW.piece_id;
    END IF;
  END IF;

  -- Gérer le changement de parent (UPDATE)
  IF TG_OP = 'UPDATE' THEN
    DECLARE
      old_lot_id UUID;
    BEGIN
      IF OLD.lot_id IS NOT NULL THEN
        old_lot_id := OLD.lot_id;
      ELSE
        SELECT lot_id INTO old_lot_id FROM public.pieces WHERE id = OLD.piece_id;
      END IF;

      IF old_lot_id IS DISTINCT FROM target_lot_id THEN
        UPDATE public.lots SET
          has_blocking_note = EXISTS(
            SELECT 1 FROM public.notes
            WHERE (lot_id = old_lot_id OR piece_id IN (SELECT id FROM public.pieces WHERE lot_id = old_lot_id))
              AND is_blocking = true
          )
        WHERE id = old_lot_id;
      END IF;
    END;
  END IF;

  -- Recalculer le lot cible
  IF target_lot_id IS NOT NULL THEN
    UPDATE public.lots SET
      has_blocking_note = EXISTS(
        SELECT 1 FROM public.notes
        WHERE (lot_id = target_lot_id OR piece_id IN (SELECT id FROM public.pieces WHERE lot_id = target_lot_id))
          AND is_blocking = true
      )
    WHERE id = target_lot_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Niveau 2 : lots → etages
CREATE OR REPLACE FUNCTION update_etage_blocking_status()
RETURNS TRIGGER AS $$
DECLARE
  target_etage_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_etage_id := OLD.etage_id;
  ELSE
    target_etage_id := NEW.etage_id;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.etage_id IS DISTINCT FROM NEW.etage_id THEN
    UPDATE public.etages SET
      has_blocking_note = EXISTS(
        SELECT 1 FROM public.lots WHERE etage_id = OLD.etage_id AND has_blocking_note = true
      )
    WHERE id = OLD.etage_id;
  END IF;

  UPDATE public.etages SET
    has_blocking_note = EXISTS(
      SELECT 1 FROM public.lots WHERE etage_id = target_etage_id AND has_blocking_note = true
    )
  WHERE id = target_etage_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Niveau 3 : etages → plots
CREATE OR REPLACE FUNCTION update_plot_blocking_status()
RETURNS TRIGGER AS $$
DECLARE
  target_plot_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_plot_id := OLD.plot_id;
  ELSE
    target_plot_id := NEW.plot_id;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.plot_id IS DISTINCT FROM NEW.plot_id THEN
    UPDATE public.plots SET
      has_blocking_note = EXISTS(
        SELECT 1 FROM public.etages WHERE plot_id = OLD.plot_id AND has_blocking_note = true
      )
    WHERE id = OLD.plot_id;
  END IF;

  UPDATE public.plots SET
    has_blocking_note = EXISTS(
      SELECT 1 FROM public.etages WHERE plot_id = target_plot_id AND has_blocking_note = true
    )
  WHERE id = target_plot_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Niveau 4 : plots → chantiers
CREATE OR REPLACE FUNCTION update_chantier_blocking_status()
RETURNS TRIGGER AS $$
DECLARE
  target_chantier_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_chantier_id := OLD.chantier_id;
  ELSE
    target_chantier_id := NEW.chantier_id;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.chantier_id IS DISTINCT FROM NEW.chantier_id THEN
    UPDATE public.chantiers SET
      has_blocking_note = EXISTS(
        SELECT 1 FROM public.plots WHERE chantier_id = OLD.chantier_id AND has_blocking_note = true
      )
    WHERE id = OLD.chantier_id;
  END IF;

  UPDATE public.chantiers SET
    has_blocking_note = EXISTS(
      SELECT 1 FROM public.plots WHERE chantier_id = target_chantier_id AND has_blocking_note = true
    )
  WHERE id = target_chantier_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =====================
-- TRIGGERS
-- =====================

-- Niveau 1 : notes → lots
CREATE TRIGGER trg_notes_blocking
  AFTER INSERT OR UPDATE OF is_blocking, lot_id, piece_id OR DELETE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION update_lot_blocking_status();

-- Niveau 2 : lots → etages (déclenché quand has_blocking_note change)
CREATE TRIGGER trg_lots_blocking
  AFTER INSERT OR UPDATE OF has_blocking_note OR DELETE ON public.lots
  FOR EACH ROW EXECUTE FUNCTION update_etage_blocking_status();

-- Niveau 3 : etages → plots
CREATE TRIGGER trg_etages_blocking
  AFTER INSERT OR UPDATE OF has_blocking_note OR DELETE ON public.etages
  FOR EACH ROW EXECUTE FUNCTION update_plot_blocking_status();

-- Niveau 4 : plots → chantiers
CREATE TRIGGER trg_plots_blocking
  AFTER INSERT OR UPDATE OF has_blocking_note OR DELETE ON public.plots
  FOR EACH ROW EXECUTE FUNCTION update_chantier_blocking_status();
