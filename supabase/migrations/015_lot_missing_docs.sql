-- Story 5.3 : Récapitulatif et indicateurs de documents manquants
-- Colonne has_missing_docs sur lots + trigger sur lot_documents

-- =====================
-- COLONNE has_missing_docs
-- =====================
ALTER TABLE public.lots ADD COLUMN has_missing_docs boolean NOT NULL DEFAULT false;

-- =====================
-- TRIGGER FUNCTION — lot_documents → lots
-- =====================
-- Recalcule lots.has_missing_docs quand un lot_document est inséré/modifié/supprimé
-- Un lot a des documents manquants si au moins un lot_document a is_required=true ET file_url IS NULL

CREATE OR REPLACE FUNCTION update_lot_missing_docs()
RETURNS TRIGGER AS $$
DECLARE
  target_lot_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_lot_id := OLD.lot_id;
  ELSE
    target_lot_id := NEW.lot_id;
  END IF;

  -- Gérer le changement de lot_id (UPDATE)
  IF TG_OP = 'UPDATE' AND OLD.lot_id IS DISTINCT FROM NEW.lot_id THEN
    UPDATE public.lots SET
      has_missing_docs = EXISTS(
        SELECT 1 FROM public.lot_documents
        WHERE lot_id = OLD.lot_id AND is_required = true AND file_url IS NULL
      )
    WHERE id = OLD.lot_id;
  END IF;

  -- Recalculer le lot cible
  IF target_lot_id IS NOT NULL THEN
    UPDATE public.lots SET
      has_missing_docs = EXISTS(
        SELECT 1 FROM public.lot_documents
        WHERE lot_id = target_lot_id AND is_required = true AND file_url IS NULL
      )
    WHERE id = target_lot_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =====================
-- TRIGGER
-- =====================
-- Déclenché quand is_required OU file_url change (les 2 colonnes qui affectent has_missing_docs)
CREATE TRIGGER trg_lot_documents_missing
  AFTER INSERT OR UPDATE OF is_required, file_url OR DELETE ON public.lot_documents
  FOR EACH ROW EXECUTE FUNCTION update_lot_missing_docs();

-- =====================
-- BACKFILL lots existants
-- =====================
UPDATE public.lots SET
  has_missing_docs = EXISTS(
    SELECT 1 FROM public.lot_documents
    WHERE lot_documents.lot_id = lots.id AND is_required = true AND file_url IS NULL
  );
