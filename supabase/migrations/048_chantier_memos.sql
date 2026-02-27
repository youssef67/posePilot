-- Story 8.5 : Mémos chantier — notes centralisées au niveau chantier
-- Table chantier_memos + champ dénormalisé memo_count + trigger

-- =====================
-- CHAMP DÉNORMALISÉ
-- =====================
ALTER TABLE public.chantiers ADD COLUMN memo_count integer NOT NULL DEFAULT 0;

-- =====================
-- TABLE CHANTIER_MEMOS
-- =====================
CREATE TABLE public.chantier_memos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chantier_id uuid NOT NULL REFERENCES public.chantiers(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_by_email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_chantier_memos_chantier_id ON public.chantier_memos(chantier_id);
SELECT public.apply_rls_policy('chantier_memos');

-- =====================
-- TRIGGER memo_count
-- =====================
CREATE OR REPLACE FUNCTION update_chantier_memo_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.chantiers SET memo_count = (
      SELECT count(*) FROM public.chantier_memos WHERE chantier_id = OLD.chantier_id
    ) WHERE id = OLD.chantier_id;
    RETURN OLD;
  ELSE
    UPDATE public.chantiers SET memo_count = (
      SELECT count(*) FROM public.chantier_memos WHERE chantier_id = NEW.chantier_id
    ) WHERE id = NEW.chantier_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_chantier_memo_count
AFTER INSERT OR DELETE ON public.chantier_memos
FOR EACH ROW EXECUTE FUNCTION update_chantier_memo_count();
