-- Story 2.1 : Table des plots avec définition des tâches par plot

CREATE TABLE public.plots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chantier_id uuid NOT NULL REFERENCES public.chantiers(id) ON DELETE CASCADE,
  nom text NOT NULL,
  task_definitions text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_plots_chantier_id ON public.plots(chantier_id);

SELECT public.apply_rls_policy('plots');
