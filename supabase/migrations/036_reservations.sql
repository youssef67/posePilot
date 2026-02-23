-- Story 9.1 : Réserves SAV — Création, gestion et suivi
-- Table reservations + triggers cascade has_open_reservation (lots → etages → plots → chantiers)
-- Activity log events : reservation_created, reservation_resolved

-- =====================
-- ENUM reservation_status
-- =====================
CREATE TYPE reservation_status AS ENUM ('ouvert', 'resolu');

-- =====================
-- TABLE RESERVATIONS
-- =====================
CREATE TABLE public.reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id uuid NOT NULL REFERENCES public.lots(id) ON DELETE CASCADE,
  piece_id uuid NOT NULL REFERENCES public.pieces(id) ON DELETE CASCADE,
  description text NOT NULL,
  photo_url text,
  status reservation_status NOT NULL DEFAULT 'ouvert',
  resolved_at timestamptz,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_by_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reservations_lot_id ON public.reservations(lot_id);
CREATE INDEX idx_reservations_piece_id ON public.reservations(piece_id);
CREATE INDEX idx_reservations_status ON public.reservations(status);
SELECT public.apply_rls_policy('reservations');

-- =====================
-- COLONNES has_open_reservation
-- =====================
ALTER TABLE public.lots ADD COLUMN has_open_reservation boolean NOT NULL DEFAULT false;
ALTER TABLE public.etages ADD COLUMN has_open_reservation boolean NOT NULL DEFAULT false;
ALTER TABLE public.plots ADD COLUMN has_open_reservation boolean NOT NULL DEFAULT false;
ALTER TABLE public.chantiers ADD COLUMN has_open_reservation boolean NOT NULL DEFAULT false;

-- =====================
-- TRIGGER FUNCTIONS — Propagation has_open_reservation
-- =====================

-- Niveau 1 : reservations → lots
-- Recalcule lots.has_open_reservation quand une réserve est insérée/modifiée/supprimée
CREATE OR REPLACE FUNCTION update_lot_reservation_status()
RETURNS TRIGGER AS $$
DECLARE
  target_lot_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_lot_id := OLD.lot_id;
  ELSE
    target_lot_id := NEW.lot_id;
  END IF;

  -- Gérer le changement de lot (UPDATE)
  IF TG_OP = 'UPDATE' AND OLD.lot_id IS DISTINCT FROM NEW.lot_id THEN
    UPDATE public.lots SET
      has_open_reservation = EXISTS(
        SELECT 1 FROM public.reservations
        WHERE lot_id = OLD.lot_id AND status = 'ouvert'
      )
    WHERE id = OLD.lot_id;
  END IF;

  -- Recalculer le lot cible
  IF target_lot_id IS NOT NULL THEN
    UPDATE public.lots SET
      has_open_reservation = EXISTS(
        SELECT 1 FROM public.reservations
        WHERE lot_id = target_lot_id AND status = 'ouvert'
      )
    WHERE id = target_lot_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Niveau 2 : lots → etages
CREATE OR REPLACE FUNCTION update_etage_reservation_status()
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
      has_open_reservation = EXISTS(
        SELECT 1 FROM public.lots WHERE etage_id = OLD.etage_id AND has_open_reservation = true
      )
    WHERE id = OLD.etage_id;
  END IF;

  UPDATE public.etages SET
    has_open_reservation = EXISTS(
      SELECT 1 FROM public.lots WHERE etage_id = target_etage_id AND has_open_reservation = true
    )
  WHERE id = target_etage_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Niveau 3 : etages → plots
CREATE OR REPLACE FUNCTION update_plot_reservation_status()
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
      has_open_reservation = EXISTS(
        SELECT 1 FROM public.etages WHERE plot_id = OLD.plot_id AND has_open_reservation = true
      )
    WHERE id = OLD.plot_id;
  END IF;

  UPDATE public.plots SET
    has_open_reservation = EXISTS(
      SELECT 1 FROM public.etages WHERE plot_id = target_plot_id AND has_open_reservation = true
    )
  WHERE id = target_plot_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Niveau 4 : plots → chantiers
CREATE OR REPLACE FUNCTION update_chantier_reservation_status()
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
      has_open_reservation = EXISTS(
        SELECT 1 FROM public.plots WHERE chantier_id = OLD.chantier_id AND has_open_reservation = true
      )
    WHERE id = OLD.chantier_id;
  END IF;

  UPDATE public.chantiers SET
    has_open_reservation = EXISTS(
      SELECT 1 FROM public.plots WHERE chantier_id = target_chantier_id AND has_open_reservation = true
    )
  WHERE id = target_chantier_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =====================
-- TRIGGERS — Propagation cascade
-- =====================

-- Niveau 1 : reservations → lots
CREATE TRIGGER trg_reservations_status
  AFTER INSERT OR UPDATE OF status, lot_id OR DELETE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION update_lot_reservation_status();

-- Niveau 2 : lots → etages (déclenché quand has_open_reservation change)
CREATE TRIGGER trg_lots_reservation
  AFTER INSERT OR UPDATE OF has_open_reservation OR DELETE ON public.lots
  FOR EACH ROW EXECUTE FUNCTION update_etage_reservation_status();

-- Niveau 3 : etages → plots
CREATE TRIGGER trg_etages_reservation
  AFTER INSERT OR UPDATE OF has_open_reservation OR DELETE ON public.etages
  FOR EACH ROW EXECUTE FUNCTION update_plot_reservation_status();

-- Niveau 4 : plots → chantiers
CREATE TRIGGER trg_plots_reservation
  AFTER INSERT OR UPDATE OF has_open_reservation OR DELETE ON public.plots
  FOR EACH ROW EXECUTE FUNCTION update_chantier_reservation_status();

-- =====================
-- ACTIVITY LOG — Nouveaux event types
-- =====================
ALTER TYPE activity_event_type ADD VALUE 'reservation_created';
ALTER TYPE activity_event_type ADD VALUE 'reservation_resolved';

-- =====================
-- TRIGGER : log_reservation_created
-- Sur reservations AFTER INSERT
-- =====================
CREATE OR REPLACE FUNCTION public.log_reservation_created()
RETURNS trigger AS $$
DECLARE
  v_lot RECORD;
  v_piece RECORD;
  v_chantier_id uuid;
BEGIN
  SELECT nom, lot_id INTO v_piece FROM pieces WHERE id = NEW.piece_id;
  SELECT code INTO v_lot FROM lots WHERE id = NEW.lot_id;

  SELECT p.chantier_id INTO v_chantier_id
  FROM lots l JOIN etages e ON l.etage_id = e.id JOIN plots p ON e.plot_id = p.id
  WHERE l.id = NEW.lot_id;

  IF v_chantier_id IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.activity_logs (event_type, actor_id, actor_email, chantier_id, target_type, target_id, metadata)
  VALUES (
    'reservation_created',
    COALESCE(auth.uid(), NEW.created_by),
    COALESCE((auth.jwt()->>'email')::text, NEW.created_by_email),
    v_chantier_id,
    'lot',
    NEW.lot_id,
    jsonb_build_object(
      'description_preview', LEFT(NEW.description, 50),
      'lot_code', v_lot.code,
      'piece_nom', v_piece.nom,
      'reservation_id', NEW.id
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_reservation_created
  AFTER INSERT ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.log_reservation_created();

-- =====================
-- TRIGGER : log_reservation_resolved
-- Sur reservations AFTER UPDATE OF status (quand status passe à 'resolu')
-- =====================
CREATE OR REPLACE FUNCTION public.log_reservation_resolved()
RETURNS trigger AS $$
DECLARE
  v_lot RECORD;
  v_piece RECORD;
  v_chantier_id uuid;
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  IF NEW.status != 'resolu' THEN RETURN NEW; END IF;

  SELECT nom, lot_id INTO v_piece FROM pieces WHERE id = NEW.piece_id;
  SELECT code INTO v_lot FROM lots WHERE id = NEW.lot_id;

  SELECT p.chantier_id INTO v_chantier_id
  FROM lots l JOIN etages e ON l.etage_id = e.id JOIN plots p ON e.plot_id = p.id
  WHERE l.id = NEW.lot_id;

  IF v_chantier_id IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.activity_logs (event_type, actor_id, actor_email, chantier_id, target_type, target_id, metadata)
  VALUES (
    'reservation_resolved',
    auth.uid(),
    (auth.jwt()->>'email')::text,
    v_chantier_id,
    'lot',
    NEW.lot_id,
    jsonb_build_object(
      'description_preview', LEFT(NEW.description, 50),
      'lot_code', v_lot.code,
      'piece_nom', v_piece.nom,
      'reservation_id', NEW.id
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_reservation_resolved
  AFTER UPDATE OF status ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.log_reservation_resolved();

-- =====================
-- TRIGGER : set_resolved_at
-- Renseigne resolved_at côté serveur quand status passe à 'resolu'
-- =====================
CREATE OR REPLACE FUNCTION public.set_reservation_resolved_at()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'resolu' AND OLD.status != 'resolu' THEN
    NEW.resolved_at := now();
  END IF;
  IF NEW.status = 'ouvert' AND OLD.status = 'resolu' THEN
    NEW.resolved_at := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_resolved_at
  BEFORE UPDATE OF status ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_reservation_resolved_at();
