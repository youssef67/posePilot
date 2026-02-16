-- Story 6.7 : Fournisseur et édition des livraisons

-- =====================
-- COLONNE — Fournisseur (texte libre, optionnel)
-- =====================
ALTER TABLE public.livraisons ADD COLUMN fournisseur text;

-- =====================
-- ENUM — Nouveau type d'activité
-- =====================
ALTER TYPE public.activity_event_type ADD VALUE IF NOT EXISTS 'livraison_updated';

-- =====================
-- TRIGGER FUNCTION — Mise à jour pour gérer UPDATE champs éditables
-- =====================
CREATE OR REPLACE FUNCTION public.log_livraison_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- INSERT : livraison créée
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_logs (event_type, actor_id, actor_email, chantier_id, target_type, target_id, metadata)
    VALUES (
      'livraison_created',
      COALESCE(auth.uid(), NEW.created_by),
      COALESCE((auth.jwt()->>'email')::text, NULL),
      NEW.chantier_id,
      'livraison',
      NEW.id,
      jsonb_build_object('description', LEFT(NEW.description, 80))
    );
    RETURN NEW;
  END IF;

  -- UPDATE status : changement de statut (prioritaire sur les autres updates)
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.activity_logs (event_type, actor_id, actor_email, chantier_id, target_type, target_id, metadata)
    VALUES (
      'livraison_status_changed',
      COALESCE(auth.uid(), NEW.created_by),
      COALESCE((auth.jwt()->>'email')::text, NULL),
      NEW.chantier_id,
      'livraison',
      NEW.id,
      jsonb_build_object('description', LEFT(NEW.description, 80), 'old_status', OLD.status::text, 'new_status', NEW.status::text)
    );
    RETURN NEW;
  END IF;

  -- UPDATE champs éditables (description, fournisseur, date_prevue) sans changement de status
  IF TG_OP = 'UPDATE' AND OLD.status = NEW.status AND (
    OLD.description IS DISTINCT FROM NEW.description OR
    OLD.fournisseur IS DISTINCT FROM NEW.fournisseur OR
    OLD.date_prevue IS DISTINCT FROM NEW.date_prevue
  ) THEN
    INSERT INTO public.activity_logs (event_type, actor_id, actor_email, chantier_id, target_type, target_id, metadata)
    VALUES (
      'livraison_updated',
      COALESCE(auth.uid(), NEW.created_by),
      COALESCE((auth.jwt()->>'email')::text, NULL),
      NEW.chantier_id,
      'livraison',
      NEW.id,
      jsonb_build_object('description', LEFT(NEW.description, 80))
    );
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer l'ancien trigger et recréer avec les bons events
DROP TRIGGER IF EXISTS trg_livraison_activity ON public.livraisons;
CREATE TRIGGER trg_livraison_activity
  AFTER INSERT OR UPDATE OF status, description, fournisseur, date_prevue ON public.livraisons
  FOR EACH ROW EXECUTE FUNCTION public.log_livraison_activity();
