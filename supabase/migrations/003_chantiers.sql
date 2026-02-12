-- Story 1.4 : Table principale des chantiers
-- Contient les projets de pose suivis par l'utilisateur

-- Enum pour le statut du chantier (cycle de vie)
CREATE TYPE chantier_status AS ENUM ('active', 'termine', 'supprime');

CREATE TABLE public.chantiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  type chantier_type NOT NULL,
  status chantier_status NOT NULL DEFAULT 'active',
  progress_done integer NOT NULL DEFAULT 0,
  progress_total integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_chantiers_status ON public.chantiers(status);
CREATE INDEX idx_chantiers_created_by ON public.chantiers(created_by);

-- Appliquer RLS (fonction créée dans 002_rls_base.sql)
SELECT public.apply_rls_policy('chantiers');
