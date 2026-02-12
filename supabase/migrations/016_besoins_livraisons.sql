-- Story 6.1 : Besoins, livraisons, et transformation
-- Crée les tables complètes pour l'Epic 6 (seuls les besoins sont exploités dans 6.1)

-- =====================
-- ENUM — Nouveaux types d'activité
-- =====================
ALTER TYPE public.activity_event_type ADD VALUE IF NOT EXISTS 'besoin_added';
ALTER TYPE public.activity_event_type ADD VALUE IF NOT EXISTS 'besoin_ordered';
ALTER TYPE public.activity_event_type ADD VALUE IF NOT EXISTS 'livraison_created';
ALTER TYPE public.activity_event_type ADD VALUE IF NOT EXISTS 'livraison_status_changed';

-- =====================
-- TABLE livraisons (créée AVANT besoins car FK)
-- =====================
CREATE TABLE public.livraisons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chantier_id uuid NOT NULL REFERENCES public.chantiers(id) ON DELETE CASCADE,
  description text NOT NULL,
  status public.delivery_status NOT NULL DEFAULT 'commande',
  date_prevue date,
  bc_file_url text,
  bc_file_name text,
  bl_file_url text,
  bl_file_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE INDEX idx_livraisons_chantier_id ON public.livraisons(chantier_id);
CREATE INDEX idx_livraisons_status ON public.livraisons(status);
SELECT public.apply_rls_policy('livraisons');

-- =====================
-- TABLE besoins
-- =====================
CREATE TABLE public.besoins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chantier_id uuid NOT NULL REFERENCES public.chantiers(id) ON DELETE CASCADE,
  description text NOT NULL,
  livraison_id uuid REFERENCES public.livraisons(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE INDEX idx_besoins_chantier_id ON public.besoins(chantier_id);
CREATE INDEX idx_besoins_livraison_id ON public.besoins(livraison_id);
SELECT public.apply_rls_policy('besoins');

-- =====================
-- TRIGGER FUNCTION — Activity log pour besoins
-- Adapté au schéma réel de activity_logs (013_activity_log.sql)
-- =====================
CREATE OR REPLACE FUNCTION public.log_besoin_activity()
RETURNS TRIGGER AS $$
BEGIN
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

CREATE TRIGGER trg_besoin_activity
  AFTER INSERT OR UPDATE OF livraison_id ON public.besoins
  FOR EACH ROW EXECUTE FUNCTION public.log_besoin_activity();
