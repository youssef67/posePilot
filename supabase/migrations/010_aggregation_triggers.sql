-- Story 3.3 : Colonnes progress et triggers d'agrégation en cascade
-- Cascade : taches → pieces → lots → etages → plots → chantiers
-- Chaque UPDATE d'un niveau déclenche le recalcul du parent

-- =====================
-- COLONNES PROGRESS
-- =====================

-- pieces : agrège depuis taches
ALTER TABLE pieces ADD COLUMN progress_done INTEGER NOT NULL DEFAULT 0;
ALTER TABLE pieces ADD COLUMN progress_total INTEGER NOT NULL DEFAULT 0;

-- lots : agrège depuis pieces
ALTER TABLE lots ADD COLUMN progress_done INTEGER NOT NULL DEFAULT 0;
ALTER TABLE lots ADD COLUMN progress_total INTEGER NOT NULL DEFAULT 0;

-- etages : agrège depuis lots
ALTER TABLE etages ADD COLUMN progress_done INTEGER NOT NULL DEFAULT 0;
ALTER TABLE etages ADD COLUMN progress_total INTEGER NOT NULL DEFAULT 0;

-- plots : agrège depuis etages
ALTER TABLE plots ADD COLUMN progress_done INTEGER NOT NULL DEFAULT 0;
ALTER TABLE plots ADD COLUMN progress_total INTEGER NOT NULL DEFAULT 0;

-- chantiers : colonnes DÉJÀ EXISTANTES (progress_done, progress_total) — ne PAS re-créer

-- =====================
-- TRIGGER FUNCTIONS
-- =====================

-- Niveau 1 : taches → pieces
CREATE OR REPLACE FUNCTION update_piece_progress()
RETURNS TRIGGER AS $$
DECLARE
  target_piece_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_piece_id := OLD.piece_id;
  ELSE
    target_piece_id := NEW.piece_id;
  END IF;

  -- Recalculer l'ancien parent si piece_id a changé (UPDATE)
  IF TG_OP = 'UPDATE' AND OLD.piece_id IS DISTINCT FROM NEW.piece_id THEN
    UPDATE pieces SET
      progress_done = (SELECT COUNT(*) FROM taches WHERE piece_id = OLD.piece_id AND status = 'done'),
      progress_total = (SELECT COUNT(*) FROM taches WHERE piece_id = OLD.piece_id)
    WHERE id = OLD.piece_id;
  END IF;

  UPDATE pieces SET
    progress_done = (SELECT COUNT(*) FROM taches WHERE piece_id = target_piece_id AND status = 'done'),
    progress_total = (SELECT COUNT(*) FROM taches WHERE piece_id = target_piece_id)
  WHERE id = target_piece_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Niveau 2 : pieces → lots
CREATE OR REPLACE FUNCTION update_lot_progress()
RETURNS TRIGGER AS $$
DECLARE
  target_lot_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_lot_id := OLD.lot_id;
  ELSE
    target_lot_id := NEW.lot_id;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.lot_id IS DISTINCT FROM NEW.lot_id THEN
    UPDATE lots SET
      progress_done = COALESCE((SELECT SUM(progress_done) FROM pieces WHERE lot_id = OLD.lot_id), 0),
      progress_total = COALESCE((SELECT SUM(progress_total) FROM pieces WHERE lot_id = OLD.lot_id), 0)
    WHERE id = OLD.lot_id;
  END IF;

  UPDATE lots SET
    progress_done = COALESCE((SELECT SUM(progress_done) FROM pieces WHERE lot_id = target_lot_id), 0),
    progress_total = COALESCE((SELECT SUM(progress_total) FROM pieces WHERE lot_id = target_lot_id), 0)
  WHERE id = target_lot_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Niveau 3 : lots → etages
CREATE OR REPLACE FUNCTION update_etage_progress()
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
    UPDATE etages SET
      progress_done = COALESCE((SELECT SUM(progress_done) FROM lots WHERE etage_id = OLD.etage_id), 0),
      progress_total = COALESCE((SELECT SUM(progress_total) FROM lots WHERE etage_id = OLD.etage_id), 0)
    WHERE id = OLD.etage_id;
  END IF;

  UPDATE etages SET
    progress_done = COALESCE((SELECT SUM(progress_done) FROM lots WHERE etage_id = target_etage_id), 0),
    progress_total = COALESCE((SELECT SUM(progress_total) FROM lots WHERE etage_id = target_etage_id), 0)
  WHERE id = target_etage_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Niveau 4 : etages → plots
CREATE OR REPLACE FUNCTION update_plot_progress()
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
    UPDATE plots SET
      progress_done = COALESCE((SELECT SUM(progress_done) FROM etages WHERE plot_id = OLD.plot_id), 0),
      progress_total = COALESCE((SELECT SUM(progress_total) FROM etages WHERE plot_id = OLD.plot_id), 0)
    WHERE id = OLD.plot_id;
  END IF;

  UPDATE plots SET
    progress_done = COALESCE((SELECT SUM(progress_done) FROM etages WHERE plot_id = target_plot_id), 0),
    progress_total = COALESCE((SELECT SUM(progress_total) FROM etages WHERE plot_id = target_plot_id), 0)
  WHERE id = target_plot_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Niveau 5 : plots → chantiers
CREATE OR REPLACE FUNCTION update_chantier_progress()
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
    UPDATE chantiers SET
      progress_done = COALESCE((SELECT SUM(progress_done) FROM plots WHERE chantier_id = OLD.chantier_id), 0),
      progress_total = COALESCE((SELECT SUM(progress_total) FROM plots WHERE chantier_id = OLD.chantier_id), 0)
    WHERE id = OLD.chantier_id;
  END IF;

  UPDATE chantiers SET
    progress_done = COALESCE((SELECT SUM(progress_done) FROM plots WHERE chantier_id = target_chantier_id), 0),
    progress_total = COALESCE((SELECT SUM(progress_total) FROM plots WHERE chantier_id = target_chantier_id), 0)
  WHERE id = target_chantier_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =====================
-- TRIGGERS
-- =====================

-- Niveau 1 : taches → pieces
CREATE TRIGGER trg_taches_progress
  AFTER INSERT OR UPDATE OF status OR DELETE ON taches
  FOR EACH ROW EXECUTE FUNCTION update_piece_progress();

-- Niveau 2 : pieces → lots (déclenché quand progress change)
CREATE TRIGGER trg_pieces_progress
  AFTER INSERT OR UPDATE OF progress_done, progress_total OR DELETE ON pieces
  FOR EACH ROW EXECUTE FUNCTION update_lot_progress();

-- Niveau 3 : lots → etages
CREATE TRIGGER trg_lots_progress
  AFTER INSERT OR UPDATE OF progress_done, progress_total OR DELETE ON lots
  FOR EACH ROW EXECUTE FUNCTION update_etage_progress();

-- Niveau 4 : etages → plots
CREATE TRIGGER trg_etages_progress
  AFTER INSERT OR UPDATE OF progress_done, progress_total OR DELETE ON etages
  FOR EACH ROW EXECUTE FUNCTION update_plot_progress();

-- Niveau 5 : plots → chantiers
CREATE TRIGGER trg_plots_progress
  AFTER INSERT OR UPDATE OF progress_done, progress_total OR DELETE ON plots
  FOR EACH ROW EXECUTE FUNCTION update_chantier_progress();

-- =====================
-- BACKFILL DONNÉES EXISTANTES
-- =====================

-- Bottom-up : pieces d'abord, puis lots, etages, plots, chantiers
UPDATE pieces p SET
  progress_done = (SELECT COUNT(*) FROM taches t WHERE t.piece_id = p.id AND t.status = 'done'),
  progress_total = (SELECT COUNT(*) FROM taches t WHERE t.piece_id = p.id);

UPDATE lots l SET
  progress_done = COALESCE((SELECT SUM(progress_done) FROM pieces p WHERE p.lot_id = l.id), 0),
  progress_total = COALESCE((SELECT SUM(progress_total) FROM pieces p WHERE p.lot_id = l.id), 0);

UPDATE etages e SET
  progress_done = COALESCE((SELECT SUM(progress_done) FROM lots l WHERE l.etage_id = e.id), 0),
  progress_total = COALESCE((SELECT SUM(progress_total) FROM lots l WHERE l.etage_id = e.id), 0);

UPDATE plots pl SET
  progress_done = COALESCE((SELECT SUM(progress_done) FROM etages e WHERE e.plot_id = pl.id), 0),
  progress_total = COALESCE((SELECT SUM(progress_total) FROM etages e WHERE e.plot_id = pl.id), 0);

UPDATE chantiers c SET
  progress_done = COALESCE((SELECT SUM(progress_done) FROM plots pl WHERE pl.chantier_id = c.id), 0),
  progress_total = COALESCE((SELECT SUM(progress_total) FROM plots pl WHERE pl.chantier_id = c.id), 0);
