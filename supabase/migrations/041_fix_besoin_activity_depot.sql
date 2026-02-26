-- Fix: les triggers log_besoin_activity et log_livraison_activity échouent
-- pour les enregistrements dépôt car activity_logs.chantier_id est NOT NULL
-- et NEW.chantier_id est null pour le dépôt.
-- Solution: ne pas logger quand chantier_id est null.

CREATE OR REPLACE FUNCTION public.log_besoin_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip activity log for depot besoins (no chantier_id)
  IF NEW.chantier_id IS NULL THEN
    RETURN NEW;
  END IF;

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
  END IF;

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
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Même fix pour le trigger livraison (chantier_id null pour livraisons dépôt)
CREATE OR REPLACE FUNCTION public.log_livraison_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip activity log for depot livraisons (no chantier_id)
  IF NEW.chantier_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_logs (event_type, actor_id, actor_email, chantier_id, target_type, target_id, metadata)
    VALUES (
      'livraison_created',
      COALESCE(auth.uid(), NEW.created_by),
      (auth.jwt()->>'email')::text,
      NEW.chantier_id,
      'livraison',
      NEW.id,
      jsonb_build_object('description', LEFT(NEW.description, 80))
    );
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.activity_logs (event_type, actor_id, actor_email, chantier_id, target_type, target_id, metadata)
    VALUES (
      'livraison_status_changed',
      COALESCE(auth.uid(), NEW.created_by),
      (auth.jwt()->>'email')::text,
      NEW.chantier_id,
      'livraison',
      NEW.id,
      jsonb_build_object('description', LEFT(NEW.description, 80), 'old_status', OLD.status::text, 'new_status', NEW.status::text)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
