-- Story 6.12 : Montant TTC et suivi des dépenses par chantier

-- =====================
-- COLONNE — Montant TTC (numérique, optionnel)
-- =====================
ALTER TABLE public.livraisons ADD COLUMN montant_ttc numeric DEFAULT NULL;

-- =====================
-- TRIGGER FUNCTION — Mise à jour pour surveiller montant_ttc
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
      jsonb_build_object(
        'description', LEFT(NEW.description, 80),
        'old_status', OLD.status::text,
        'new_status', NEW.status::text
      ) || CASE WHEN NEW.montant_ttc IS NOT NULL THEN jsonb_build_object('montant_ttc', NEW.montant_ttc) ELSE '{}'::jsonb END
    );
    RETURN NEW;
  END IF;

  -- UPDATE champs éditables (description, fournisseur, date_prevue, montant_ttc) sans changement de status
  IF TG_OP = 'UPDATE' AND OLD.status = NEW.status AND (
    OLD.description IS DISTINCT FROM NEW.description OR
    OLD.fournisseur IS DISTINCT FROM NEW.fournisseur OR
    OLD.date_prevue IS DISTINCT FROM NEW.date_prevue OR
    OLD.montant_ttc IS DISTINCT FROM NEW.montant_ttc
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
        || CASE WHEN OLD.montant_ttc IS DISTINCT FROM NEW.montant_ttc THEN jsonb_build_object('montant_ttc', NEW.montant_ttc) ELSE '{}'::jsonb END
    );
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recréer le trigger avec montant_ttc dans les colonnes surveillées
DROP TRIGGER IF EXISTS trg_livraison_activity ON public.livraisons;
CREATE TRIGGER trg_livraison_activity
  AFTER INSERT OR UPDATE OF status, description, fournisseur, date_prevue, montant_ttc ON public.livraisons
  FOR EACH ROW EXECUTE FUNCTION public.log_livraison_activity();
