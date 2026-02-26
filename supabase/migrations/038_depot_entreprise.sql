-- Story 10.1 : Dépôt entreprise — tables de base

-- =====================
-- ENUM — Type de mouvement dépôt
-- =====================
CREATE TYPE public.depot_mouvement_type AS ENUM ('entree', 'sortie', 'transfert_chantier');

-- =====================
-- ENUM — Nouveaux types d'activité
-- =====================
ALTER TYPE public.activity_event_type ADD VALUE IF NOT EXISTS 'depot_entree';
ALTER TYPE public.activity_event_type ADD VALUE IF NOT EXISTS 'depot_sortie';
ALTER TYPE public.activity_event_type ADD VALUE IF NOT EXISTS 'depot_transfert';

-- =====================
-- TABLE depot_articles
-- =====================
CREATE TABLE public.depot_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  designation text NOT NULL,
  quantite integer NOT NULL DEFAULT 0 CHECK (quantite >= 0),
  valeur_totale numeric NOT NULL DEFAULT 0 CHECK (valeur_totale >= 0),
  unite text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE INDEX idx_depot_articles_designation ON public.depot_articles(designation);
SELECT public.apply_rls_policy('depot_articles');

-- =====================
-- TABLE depot_mouvements
-- =====================
CREATE TABLE public.depot_mouvements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.depot_articles(id) ON DELETE CASCADE,
  type public.depot_mouvement_type NOT NULL,
  quantite integer NOT NULL CHECK (quantite > 0),
  prix_unitaire numeric NOT NULL CHECK (prix_unitaire >= 0),
  montant_total numeric NOT NULL CHECK (montant_total >= 0),
  livraison_id uuid REFERENCES public.livraisons(id),
  chantier_id uuid REFERENCES public.chantiers(id),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE INDEX idx_depot_mouvements_article_id ON public.depot_mouvements(article_id);
CREATE INDEX idx_depot_mouvements_type ON public.depot_mouvements(type);
CREATE INDEX idx_depot_mouvements_livraison_id ON public.depot_mouvements(livraison_id);
SELECT public.apply_rls_policy('depot_mouvements');

-- =====================
-- TRIGGER — Activity log pour mouvements dépôt
-- =====================
CREATE OR REPLACE FUNCTION public.log_depot_mouvement_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_event_type public.activity_event_type;
  v_article_designation text;
BEGIN
  -- activity_logs.chantier_id est NOT NULL — on ne log que si chantier_id est renseigné
  -- Les entrées stock au dépôt (sans chantier) ne génèrent pas d'activity log
  IF NEW.chantier_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT designation INTO v_article_designation FROM public.depot_articles WHERE id = NEW.article_id;

  IF NEW.type = 'entree' THEN
    v_event_type := 'depot_entree';
  ELSIF NEW.type = 'sortie' THEN
    v_event_type := 'depot_sortie';
  ELSE
    v_event_type := 'depot_transfert';
  END IF;

  INSERT INTO public.activity_logs (event_type, actor_id, actor_email, chantier_id, target_type, target_id, metadata)
  VALUES (
    v_event_type,
    COALESCE(auth.uid(), NEW.created_by),
    COALESCE((auth.jwt()->>'email')::text, NULL),
    NEW.chantier_id,
    'depot_mouvement',
    NEW.id,
    jsonb_build_object(
      'designation', LEFT(v_article_designation, 80),
      'quantite', NEW.quantite,
      'prix_unitaire', NEW.prix_unitaire,
      'montant_total', NEW.montant_total,
      'mouvement_type', NEW.type::text
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_depot_mouvement_activity
  AFTER INSERT ON public.depot_mouvements
  FOR EACH ROW EXECUTE FUNCTION public.log_depot_mouvement_activity();
