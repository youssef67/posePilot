-- Permettre les commandes multi-chantiers (chantier_id nullable)

-- 1. Rendre chantier_id nullable
ALTER TABLE public.livraisons ALTER COLUMN chantier_id DROP NOT NULL;

-- 2. Mettre à jour le trigger d'activité pour gérer chantier_id NULL
CREATE OR REPLACE FUNCTION public.log_livraison_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- INSERT : livraison créée
  IF TG_OP = 'INSERT' THEN
    IF NEW.chantier_id IS NOT NULL THEN
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
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE status : changement de statut
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.chantier_id IS NOT NULL THEN
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
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE champs éditables sans changement de status
  IF TG_OP = 'UPDATE' AND OLD.status = NEW.status AND (
    OLD.description IS DISTINCT FROM NEW.description OR
    OLD.fournisseur IS DISTINCT FROM NEW.fournisseur OR
    OLD.date_prevue IS DISTINCT FROM NEW.date_prevue
  ) THEN
    IF NEW.chantier_id IS NOT NULL THEN
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
    END IF;
    RETURN NEW;
  END IF;

  -- DELETE : livraison supprimée
  IF TG_OP = 'DELETE' THEN
    IF OLD.chantier_id IS NOT NULL THEN
      INSERT INTO public.activity_logs (event_type, actor_id, actor_email, chantier_id, target_type, target_id, metadata)
      VALUES (
        'livraison_deleted',
        COALESCE(auth.uid(), OLD.created_by),
        COALESCE((auth.jwt()->>'email')::text, NULL),
        OLD.chantier_id,
        'livraison',
        OLD.id,
        jsonb_build_object('description', LEFT(OLD.description, 80))
      );
    END IF;
    RETURN OLD;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recréer le trigger
DROP TRIGGER IF EXISTS trg_livraison_activity ON public.livraisons;
CREATE TRIGGER trg_livraison_activity
  AFTER INSERT OR UPDATE OF status, description, fournisseur, date_prevue OR DELETE ON public.livraisons
  FOR EACH ROW EXECUTE FUNCTION public.log_livraison_activity();
