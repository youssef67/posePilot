-- Story 6.5 : Gestion d'inventaire avec localisation

-- =====================
-- ENUM — Nouveaux types d'activité
-- =====================
ALTER TYPE public.activity_event_type ADD VALUE IF NOT EXISTS 'inventaire_added';
ALTER TYPE public.activity_event_type ADD VALUE IF NOT EXISTS 'inventaire_updated';

-- =====================
-- TABLE inventaire
-- =====================
CREATE TABLE public.inventaire (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chantier_id uuid NOT NULL REFERENCES public.chantiers(id) ON DELETE CASCADE,
  plot_id uuid NOT NULL REFERENCES public.plots(id) ON DELETE CASCADE,
  etage_id uuid NOT NULL REFERENCES public.etages(id) ON DELETE CASCADE,
  designation text NOT NULL,
  quantite integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE INDEX idx_inventaire_chantier_id ON public.inventaire(chantier_id);
CREATE INDEX idx_inventaire_plot_id ON public.inventaire(plot_id);
CREATE INDEX idx_inventaire_etage_id ON public.inventaire(etage_id);
SELECT public.apply_rls_policy('inventaire');

-- =====================
-- TRIGGER FUNCTION — Activity log pour inventaire
-- =====================
CREATE OR REPLACE FUNCTION public.log_inventaire_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_logs (event_type, actor_id, actor_email, chantier_id, target_type, target_id, metadata)
    VALUES (
      'inventaire_added',
      COALESCE(auth.uid(), NEW.created_by),
      COALESCE((auth.jwt()->>'email')::text, NULL),
      NEW.chantier_id,
      'inventaire',
      NEW.id,
      jsonb_build_object('designation', LEFT(NEW.designation, 80), 'quantite', NEW.quantite)
    );
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.quantite IS DISTINCT FROM NEW.quantite THEN
    INSERT INTO public.activity_logs (event_type, actor_id, actor_email, chantier_id, target_type, target_id, metadata)
    VALUES (
      'inventaire_updated',
      COALESCE(auth.uid(), NEW.created_by),
      COALESCE((auth.jwt()->>'email')::text, NULL),
      NEW.chantier_id,
      'inventaire',
      NEW.id,
      jsonb_build_object('designation', LEFT(NEW.designation, 80), 'quantite', NEW.quantite, 'old_quantite', OLD.quantite)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_inventaire_activity
  AFTER INSERT OR UPDATE OF quantite ON public.inventaire
  FOR EACH ROW EXECUTE FUNCTION public.log_inventaire_activity();
