-- Story 4.4 : Fil d'activité "quoi de neuf"
-- Table activity_logs + triggers automatiques sur taches, notes, photos

-- =====================
-- ENUM activity_event_type
-- =====================
CREATE TYPE activity_event_type AS ENUM (
  'task_status_changed',
  'note_added',
  'photo_added',
  'blocking_noted'
);

-- =====================
-- TABLE activity_logs
-- =====================
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type activity_event_type NOT NULL,
  actor_id uuid NOT NULL,
  actor_email text,
  chantier_id uuid NOT NULL REFERENCES public.chantiers(id) ON DELETE CASCADE,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index pour le fil chronologique (query principale)
CREATE INDEX idx_activity_logs_created ON public.activity_logs(created_at DESC);
-- Index pour filtrage par chantier
CREATE INDEX idx_activity_logs_chantier ON public.activity_logs(chantier_id, created_at DESC);

-- =====================
-- RLS POLICIES
-- =====================
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_select" ON public.activity_logs
  FOR SELECT TO authenticated USING (true);

-- INSERT policy omitted: all inserts come from SECURITY DEFINER triggers (bypass RLS)
-- This prevents direct client-side insertion of fake activity entries

-- =====================
-- HELPER : resolve_chantier_id_from_piece
-- =====================
CREATE OR REPLACE FUNCTION public.resolve_chantier_id_from_piece(p_piece_id uuid)
RETURNS uuid AS $$
  SELECT p.chantier_id
  FROM pieces pc
    JOIN lots l ON pc.lot_id = l.id
    JOIN etages e ON l.etage_id = e.id
    JOIN plots p ON e.plot_id = p.id
  WHERE pc.id = p_piece_id;
$$ LANGUAGE sql STABLE;

-- =====================
-- TRIGGER : log_task_status_change
-- Sur taches AFTER UPDATE OF status
-- =====================
CREATE OR REPLACE FUNCTION public.log_task_status_change()
RETURNS trigger AS $$
DECLARE
  v_piece RECORD;
  v_lot RECORD;
  v_chantier_id uuid;
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;

  SELECT nom, lot_id INTO v_piece FROM pieces WHERE id = NEW.piece_id;
  SELECT code INTO v_lot FROM lots WHERE id = v_piece.lot_id;
  v_chantier_id := public.resolve_chantier_id_from_piece(NEW.piece_id);
  IF v_chantier_id IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.activity_logs (event_type, actor_id, actor_email, chantier_id, target_type, target_id, metadata)
  VALUES (
    'task_status_changed',
    auth.uid(),
    (auth.jwt()->>'email')::text,
    v_chantier_id,
    'piece',
    NEW.piece_id,
    jsonb_build_object(
      'piece_nom', v_piece.nom,
      'lot_code', v_lot.code,
      'old_status', OLD.status::text,
      'new_status', NEW.status::text
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_task_status
  AFTER UPDATE OF status ON public.taches
  FOR EACH ROW
  EXECUTE FUNCTION public.log_task_status_change();

-- =====================
-- TRIGGER : log_note_event
-- Sur notes AFTER INSERT
-- =====================
CREATE OR REPLACE FUNCTION public.log_note_event()
RETURNS trigger AS $$
DECLARE
  v_lot RECORD;
  v_piece RECORD;
  v_chantier_id uuid;
  v_lot_code text;
  v_piece_nom text;
  v_event activity_event_type;
BEGIN
  -- Résoudre le contexte
  IF NEW.piece_id IS NOT NULL THEN
    SELECT nom, lot_id INTO v_piece FROM pieces WHERE id = NEW.piece_id;
    SELECT code INTO v_lot FROM lots WHERE id = v_piece.lot_id;
    v_chantier_id := public.resolve_chantier_id_from_piece(NEW.piece_id);
    v_lot_code := v_lot.code;
    v_piece_nom := v_piece.nom;
  ELSIF NEW.lot_id IS NOT NULL THEN
    SELECT code INTO v_lot FROM lots WHERE id = NEW.lot_id;
    SELECT p.chantier_id INTO v_chantier_id
    FROM lots l JOIN etages e ON l.etage_id = e.id JOIN plots p ON e.plot_id = p.id
    WHERE l.id = NEW.lot_id;
    v_lot_code := v_lot.code;
    v_piece_nom := NULL;
  ELSE
    RETURN NEW;
  END IF;

  IF v_chantier_id IS NULL THEN RETURN NEW; END IF;

  v_event := CASE WHEN NEW.is_blocking THEN 'blocking_noted' ELSE 'note_added' END;

  INSERT INTO public.activity_logs (event_type, actor_id, actor_email, chantier_id, target_type, target_id, metadata)
  VALUES (
    v_event,
    COALESCE(auth.uid(), NEW.created_by),
    COALESCE((auth.jwt()->>'email')::text, NEW.created_by_email),
    v_chantier_id,
    CASE WHEN NEW.piece_id IS NOT NULL THEN 'piece' ELSE 'lot' END,
    COALESCE(NEW.piece_id, NEW.lot_id),
    jsonb_build_object(
      'content_preview', LEFT(NEW.content, 50),
      'lot_code', v_lot_code,
      'piece_nom', v_piece_nom
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_note_event
  AFTER INSERT ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.log_note_event();

-- =====================
-- TRIGGER : log_photo_added
-- Sur notes AFTER UPDATE OF photo_url
-- =====================
CREATE OR REPLACE FUNCTION public.log_photo_added()
RETURNS trigger AS $$
DECLARE
  v_lot RECORD;
  v_piece RECORD;
  v_chantier_id uuid;
  v_lot_code text;
  v_piece_nom text;
BEGIN
  IF OLD.photo_url IS NOT NULL OR NEW.photo_url IS NULL THEN RETURN NEW; END IF;

  IF NEW.piece_id IS NOT NULL THEN
    SELECT nom, lot_id INTO v_piece FROM pieces WHERE id = NEW.piece_id;
    SELECT code INTO v_lot FROM lots WHERE id = v_piece.lot_id;
    v_chantier_id := public.resolve_chantier_id_from_piece(NEW.piece_id);
    v_lot_code := v_lot.code;
    v_piece_nom := v_piece.nom;
  ELSIF NEW.lot_id IS NOT NULL THEN
    SELECT code INTO v_lot FROM lots WHERE id = NEW.lot_id;
    SELECT p.chantier_id INTO v_chantier_id
    FROM lots l JOIN etages e ON l.etage_id = e.id JOIN plots p ON e.plot_id = p.id
    WHERE l.id = NEW.lot_id;
    v_lot_code := v_lot.code;
    v_piece_nom := NULL;
  ELSE
    RETURN NEW;
  END IF;

  IF v_chantier_id IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.activity_logs (event_type, actor_id, actor_email, chantier_id, target_type, target_id, metadata)
  VALUES (
    'photo_added',
    COALESCE(auth.uid(), NEW.created_by),
    COALESCE((auth.jwt()->>'email')::text, NEW.created_by_email),
    v_chantier_id,
    CASE WHEN NEW.piece_id IS NOT NULL THEN 'piece' ELSE 'lot' END,
    COALESCE(NEW.piece_id, NEW.lot_id),
    jsonb_build_object(
      'lot_code', v_lot_code,
      'piece_nom', v_piece_nom
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_log_photo_added
  AFTER UPDATE OF photo_url ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.log_photo_added();
