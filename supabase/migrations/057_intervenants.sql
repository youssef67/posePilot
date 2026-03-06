-- 057_intervenants.sql
-- Story 12.1: Attribution d'un intervenant de pose par lot

-- 1.1 Table intervenants
CREATE TABLE public.intervenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  created_by uuid REFERENCES auth.users NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 1.3 RLS policies
ALTER TABLE public.intervenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage intervenants"
  ON public.intervenants FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Empêcher les doublons de nom
ALTER TABLE public.intervenants ADD CONSTRAINT intervenants_nom_unique UNIQUE (nom);

-- 1.2 Colonne intervenant_id sur lots
ALTER TABLE public.lots
  ADD COLUMN intervenant_id uuid REFERENCES public.intervenants(id) ON DELETE SET NULL;

-- 1.4 Index
CREATE INDEX idx_lots_intervenant_id ON public.lots (intervenant_id);
