-- Story 6.6 : Édition et suppression des besoins

-- =====================
-- ENUM — Nouveaux types d'activité
-- =====================
ALTER TYPE public.activity_event_type ADD VALUE IF NOT EXISTS 'besoin_updated';
ALTER TYPE public.activity_event_type ADD VALUE IF NOT EXISTS 'besoin_deleted';

-- =====================
-- TRIGGER FUNCTION — Mise à jour pour gérer UPDATE description et DELETE
-- =====================
CREATE OR REPLACE FUNCTION public.log_besoin_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- INSERT : besoin créé
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_logs (event_type, actor_id, actor_email, chantier_id, target_type, target_id, metadata)
    VALUES (
      'besoin_added',
      COALESCE(auth.uid(), NEW.created_by),
      COALESCE((auth.jwt()->>'email')::text, NULL),
      NEW.chantier_id,
      'besoin',
      NEW.id,
      jsonb_build_object('description', LEFT(NEW.description, 80))
    );
    RETURN NEW;
  END IF;

  -- UPDATE livraison_id : besoin commandé
  IF TG_OP = 'UPDATE' AND OLD.livraison_id IS NULL AND NEW.livraison_id IS NOT NULL THEN
    INSERT INTO public.activity_logs (event_type, actor_id, actor_email, chantier_id, target_type, target_id, metadata)
    VALUES (
      'besoin_ordered',
      COALESCE(auth.uid(), NEW.created_by),
      COALESCE((auth.jwt()->>'email')::text, NULL),
      NEW.chantier_id,
      'besoin',
      NEW.id,
      jsonb_build_object('description', LEFT(NEW.description, 80))
    );
    RETURN NEW;
  END IF;

  -- UPDATE description : besoin modifié
  IF TG_OP = 'UPDATE' AND OLD.description IS DISTINCT FROM NEW.description THEN
    INSERT INTO public.activity_logs (event_type, actor_id, actor_email, chantier_id, target_type, target_id, metadata)
    VALUES (
      'besoin_updated',
      COALESCE(auth.uid(), NEW.created_by),
      COALESCE((auth.jwt()->>'email')::text, NULL),
      NEW.chantier_id,
      'besoin',
      NEW.id,
      jsonb_build_object('description', LEFT(NEW.description, 80))
    );
    RETURN NEW;
  END IF;

  -- DELETE : besoin supprimé
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.activity_logs (event_type, actor_id, actor_email, chantier_id, target_type, target_id, metadata)
    VALUES (
      'besoin_deleted',
      COALESCE(auth.uid(), OLD.created_by),
      COALESCE((auth.jwt()->>'email')::text, NULL),
      OLD.chantier_id,
      'besoin',
      OLD.id,
      jsonb_build_object('description', LEFT(OLD.description, 80))
    );
    RETURN OLD;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer l'ancien trigger et recréer avec les bons events
DROP TRIGGER IF EXISTS trg_besoin_activity ON public.besoins;
CREATE TRIGGER trg_besoin_activity
  AFTER INSERT OR UPDATE OF livraison_id, description OR DELETE ON public.besoins
  FOR EACH ROW EXECUTE FUNCTION public.log_besoin_activity();
